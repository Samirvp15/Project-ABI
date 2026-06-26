from typing import Any

import pandas as pd

MAX_KPIS = 4
MAX_BAR_CATEGORIES = 15
MAX_PIE_SLICES = 8
MAX_LINE_POINTS = 365


def _columns_by_type(columns_meta: list[dict[str, Any]]) -> dict[str, list[str]]:
    grouped: dict[str, list[str]] = {
        "date": [],
        "numeric": [],
        "categorical": [],
        "boolean": [],
        "text": [],
    }
    for col in columns_meta:
        col_type = col.get("inferred_type", "text")
        bucket = col_type if col_type in grouped else "text"
        grouped[bucket].append(col["name"])
    return grouped


def _filter_rows(
    df: pd.DataFrame,
    date_column: str | None,
    date_from: str | None,
    date_to: str | None,
) -> pd.DataFrame:
    if df.empty or not date_column or date_column not in df.columns:
        return df

    parsed = pd.to_datetime(df[date_column], errors="coerce", format="mixed")
    mask = parsed.notna()
    if date_from:
        mask &= parsed >= pd.to_datetime(date_from, errors="coerce")
    if date_to:
        mask &= parsed <= pd.to_datetime(date_to, errors="coerce")
    return df.loc[mask].copy()


def _date_range(df: pd.DataFrame, date_column: str | None) -> dict[str, str] | None:
    if not date_column or date_column not in df.columns or df.empty:
        return None
    parsed = pd.to_datetime(df[date_column], errors="coerce", format="mixed").dropna()
    if parsed.empty:
        return None
    return {"min": parsed.min().date().isoformat(), "max": parsed.max().date().isoformat()}


def _aggregate_series(series: pd.Series, aggregation: str) -> float:
    numeric = pd.to_numeric(series, errors="coerce").dropna()
    if numeric.empty:
        return 0.0
    if aggregation == "avg":
        return float(numeric.mean())
    if aggregation == "count":
        return float(numeric.count())
    return float(numeric.sum())


def _group_aggregate(
    df: pd.DataFrame,
    group_col: str,
    value_col: str | None,
    aggregation: str,
    limit: int,
) -> list[dict[str, Any]]:
    if group_col not in df.columns:
        return []

    grouped = df.groupby(group_col, dropna=True)
    if value_col and value_col in df.columns:
        numeric = pd.to_numeric(df[value_col], errors="coerce")
        temp = df.assign(__value=numeric).dropna(subset=["__value"])
        if temp.empty:
            return []
        agg = temp.groupby(group_col)["__value"].agg("sum" if aggregation != "avg" else "mean")
    else:
        agg = grouped.size()

    agg = agg.sort_values(ascending=False).head(limit)
    return [{"x": str(idx), "y": round(float(val), 2)} for idx, val in agg.items()]


def _line_data(
    df: pd.DataFrame,
    date_col: str,
    value_col: str,
    aggregation: str,
) -> list[dict[str, Any]]:
    if date_col not in df.columns or value_col not in df.columns:
        return []

    temp = df[[date_col, value_col]].copy()
    temp["_date"] = pd.to_datetime(temp[date_col], errors="coerce", format="mixed")
    temp["_value"] = pd.to_numeric(temp[value_col], errors="coerce")
    temp = temp.dropna(subset=["_date", "_value"])
    if temp.empty:
        return []

    temp["_bucket"] = temp["_date"].dt.date.astype(str)
    if aggregation == "avg":
        series = temp.groupby("_bucket")["_value"].mean()
    else:
        series = temp.groupby("_bucket")["_value"].sum()

    series = series.sort_index().tail(MAX_LINE_POINTS)
    return [{"x": str(idx), "y": round(float(val), 2)} for idx, val in series.items()]


def _pie_data(
    df: pd.DataFrame,
    label_col: str,
    value_col: str | None,
    aggregation: str,
) -> list[dict[str, Any]]:
    bars = _group_aggregate(df, label_col, value_col, aggregation, MAX_PIE_SLICES + 1)
    if not bars:
        return []

    top = bars[:MAX_PIE_SLICES]
    rest = bars[MAX_PIE_SLICES:]
    if rest:
        others = sum(item["y"] for item in rest)
        top.append({"x": "Otros", "y": round(others, 2)})

    return [{"name": item["x"], "value": item["y"]} for item in top]


def _pick_categorical(columns: list[str], df: pd.DataFrame) -> str | None:
    best: tuple[int, str] | None = None
    for col in columns:
        if col not in df.columns:
            continue
        unique = int(df[col].dropna().nunique())
        if unique < 2 or unique > 50:
            continue
        if best is None or unique < best[0]:
            best = (unique, col)
    return best[1] if best else None


def build_dashboard(
    columns_meta: list[dict[str, Any]],
    rows: list[dict[str, Any]],
    date_from: str | None = None,
    date_to: str | None = None,
) -> dict[str, Any]:
    if not columns_meta:
        return {
            "date_column": None,
            "date_range": None,
            "widgets": [],
            "summary": {"row_count": 0, "filtered_row_count": 0},
        }

    df = pd.DataFrame(rows) if rows else pd.DataFrame(columns=[c["name"] for c in columns_meta])
    by_type = _columns_by_type(columns_meta)
    date_column = by_type["date"][0] if by_type["date"] else None
    numeric_cols = by_type["numeric"]
    categorical_cols = by_type["categorical"] + by_type["boolean"]

    full_range = _date_range(df, date_column)
    filtered = _filter_rows(df, date_column, date_from, date_to)
    widgets: list[dict[str, Any]] = []

    for idx, col in enumerate(numeric_cols[:MAX_KPIS]):
        value = _aggregate_series(filtered[col], "sum") if col in filtered.columns else 0.0
        widgets.append(
            {
                "id": f"kpi-{col}",
                "type": "kpi",
                "title": f"Total {col}",
                "config": {"column": col, "aggregation": "sum"},
                "data": {"value": round(value, 2), "label": col},
            }
        )

    primary_numeric = numeric_cols[0] if numeric_cols else None
    primary_categorical = _pick_categorical(categorical_cols, filtered)

    if date_column and primary_numeric:
        line_points = _line_data(filtered, date_column, primary_numeric, "sum")
        if line_points:
            widgets.append(
                {
                    "id": f"line-{date_column}-{primary_numeric}",
                    "type": "line",
                    "title": f"{primary_numeric} en el tiempo",
                    "config": {
                        "x_column": date_column,
                        "y_column": primary_numeric,
                        "aggregation": "sum",
                    },
                    "data": line_points,
                }
            )

    if primary_categorical and primary_numeric:
        bar_points = _group_aggregate(
            filtered, primary_categorical, primary_numeric, "sum", MAX_BAR_CATEGORIES
        )
        if bar_points:
            widgets.append(
                {
                    "id": f"bar-{primary_categorical}-{primary_numeric}",
                    "type": "bar",
                    "title": f"{primary_numeric} por {primary_categorical}",
                    "config": {
                        "x_column": primary_categorical,
                        "y_column": primary_numeric,
                        "aggregation": "sum",
                    },
                    "data": bar_points,
                }
            )

    pie_label = primary_categorical
    if pie_label:
        pie_col = primary_numeric if primary_numeric else None
        pie_points = _pie_data(filtered, pie_label, pie_col, "sum")
        if pie_points:
            widgets.append(
                {
                    "id": f"pie-{pie_label}",
                    "type": "pie",
                    "title": f"Distribución por {pie_label}",
                    "config": {
                        "label_column": pie_label,
                        "value_column": pie_col,
                        "aggregation": "count" if not pie_col else "sum",
                    },
                    "data": pie_points,
                }
            )

    return {
        "date_column": date_column,
        "date_range": full_range,
        "widgets": widgets,
        "summary": {
            "row_count": len(df),
            "filtered_row_count": len(filtered),
        },
    }
