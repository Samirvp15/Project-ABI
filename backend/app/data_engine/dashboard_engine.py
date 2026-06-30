from typing import Any

import pandas as pd

MAX_KPIS = 6
MAX_BAR_CATEGORIES = 15
MAX_PIE_SLICES = 8
MAX_LINE_POINTS = 365
MAX_HISTOGRAM_BINS = 12
MAX_SCATTER_POINTS = 400
MAX_CATEGORICAL_COLUMNS = 3


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


def _filter_by_column_values(
    df: pd.DataFrame,
    column_filters: dict[str, list[str]] | None,
) -> pd.DataFrame:
    if df.empty or not column_filters:
        return df

    filtered = df
    for column, values in column_filters.items():
        if column not in filtered.columns or not values:
            continue
        allowed = {str(value) for value in values}
        mask = filtered[column].astype(str).isin(allowed)
        filtered = filtered.loc[mask]
    return filtered.copy()


def _humanize_column(name: str | None) -> str:
    if not name:
        return ""
    return str(name).replace("_", " ").strip().title()


def _metric_axis_label(y_column: str | None, aggregation: str) -> str:
    if not y_column:
        return "Cantidad de registros"
    label = _humanize_column(y_column)
    if aggregation == "avg":
        return f"Promedio de {label}"
    if aggregation == "sum":
        return f"Suma de {label}"
    if aggregation == "count":
        return f"Conteo de {label}"
    return label


def _format_filter_summary(column_filters: dict[str, list[str]] | None) -> str | None:
    if not column_filters:
        return None
    parts: list[str] = []
    for column, values in column_filters.items():
        if not values:
            continue
        label = _humanize_column(column)
        if len(values) == 1:
            parts.append(f"{label} = {values[0]}")
        else:
            parts.append(f"{label} ∈ [{', '.join(values)}]")
    return " · ".join(parts) if parts else None


def _apply_chart_context(
    widget: dict[str, Any],
    *,
    column_filters: dict[str, list[str]] | None,
    date_from: str | None,
    date_to: str | None,
) -> None:
    config = widget.setdefault("config", {})
    if column_filters:
        config["filter_summary"] = _format_filter_summary(column_filters)

        dimension_col = (
            config.get("x_column") or config.get("label_column") or config.get("column")
        )
        if dimension_col and dimension_col in column_filters:
            selected = column_filters[dimension_col]
            if selected and config.get("x_label"):
                config["x_label"] = (
                    f"{config['x_label']} — {', '.join(selected)}"
                )

    date_parts: list[str] = []
    if date_from:
        date_parts.append(f"desde {date_from}")
    if date_to:
        date_parts.append(f"hasta {date_to}")
    if date_parts:
        config["date_filter_summary"] = " ".join(date_parts)


def _apply_axis_labels(widget: dict[str, Any]) -> None:
    chart_type = widget.get("type")
    config = widget.setdefault("config", {})
    aggregation = str(config.get("aggregation") or "sum")

    if chart_type in {"pie", "donut", "kpi"}:
        return

    x_col = config.get("x_column") or config.get("label_column") or config.get("column")
    y_col = config.get("y_column") or config.get("value_column")

    if chart_type == "histogram":
        config["x_label"] = _humanize_column(str(x_col or ""))
        config["y_label"] = "Frecuencia"
    elif chart_type == "scatter":
        config["x_label"] = _humanize_column(str(x_col or ""))
        config["y_label"] = _humanize_column(str(y_col or ""))
    elif chart_type == "horizontal_bar":
        config["x_label"] = _metric_axis_label(str(y_col) if y_col else None, aggregation)
        config["y_label"] = _humanize_column(str(x_col or ""))
    elif chart_type in {"line", "area"}:
        config["x_label"] = _humanize_column(str(x_col or "Fecha"))
        config["y_label"] = _metric_axis_label(str(y_col) if y_col else None, aggregation)
    elif chart_type == "bar":
        config["x_label"] = _humanize_column(str(x_col or ""))
        config["y_label"] = _metric_axis_label(str(y_col) if y_col else None, aggregation)


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


def _pick_categoricals(columns: list[str], df: pd.DataFrame, limit: int = MAX_CATEGORICAL_COLUMNS) -> list[str]:
    candidates: list[tuple[int, str]] = []
    for col in columns:
        if col not in df.columns:
            continue
        unique = int(df[col].dropna().nunique())
        if 2 <= unique <= 50:
            candidates.append((unique, col))
    candidates.sort(key=lambda item: item[0])
    return [col for _, col in candidates[:limit]]


def _pick_categorical(columns: list[str], df: pd.DataFrame) -> str | None:
    picked = _pick_categoricals(columns, df, limit=1)
    return picked[0] if picked else None


def _histogram_data(df: pd.DataFrame, col: str) -> list[dict[str, Any]]:
    if col not in df.columns:
        return []
    series = pd.to_numeric(df[col], errors="coerce").dropna()
    if len(series) < 3:
        return []

    unique_count = int(series.nunique())
    bin_count = min(MAX_HISTOGRAM_BINS, max(5, unique_count // 2 or 5))
    try:
        buckets = pd.cut(series, bins=bin_count, duplicates="drop")
    except ValueError:
        return []

    counts = buckets.value_counts().sort_index()
    return [{"x": str(interval), "y": int(count)} for interval, count in counts.items()]


def _scatter_data(df: pd.DataFrame, x_col: str, y_col: str) -> list[dict[str, Any]]:
    if x_col not in df.columns or y_col not in df.columns:
        return []

    temp = df[[x_col, y_col]].copy()
    temp["_x"] = pd.to_numeric(temp[x_col], errors="coerce")
    temp["_y"] = pd.to_numeric(temp[y_col], errors="coerce")
    temp = temp.dropna(subset=["_x", "_y"])
    if len(temp) < 3:
        return []

    if len(temp) > MAX_SCATTER_POINTS:
        temp = temp.sample(n=MAX_SCATTER_POINTS, random_state=42)

    return [
        {"x": round(float(row["_x"]), 2), "y": round(float(row["_y"]), 2)}
        for _, row in temp.iterrows()
    ]


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

    for col in numeric_cols[:3]:
        if col not in filtered.columns:
            continue
        for agg, label in (("sum", "Total"), ("avg", "Promedio")):
            value = _aggregate_series(filtered[col], agg)
            widgets.append(
                {
                    "id": f"kpi-{col}-{agg}",
                    "type": "kpi",
                    "title": f"{label} {col}",
                    "config": {"column": col, "aggregation": agg},
                    "data": {"value": round(value, 2), "label": col},
                }
            )

    primary_numeric = numeric_cols[0] if numeric_cols else None
    secondary_numeric = numeric_cols[1] if len(numeric_cols) > 1 else None
    categorical_list = _pick_categoricals(categorical_cols, filtered)
    primary_categorical = categorical_list[0] if categorical_list else None

    if date_column and primary_numeric:
        line_points = _line_data(filtered, date_column, primary_numeric, "sum")
        if line_points:
            widgets.append(
                {
                    "id": f"line-{date_column}-{primary_numeric}",
                    "type": "line",
                    "title": f"{primary_numeric} en el tiempo (suma)",
                    "config": {
                        "x_column": date_column,
                        "y_column": primary_numeric,
                        "aggregation": "sum",
                    },
                    "data": line_points,
                }
            )

        area_points = _line_data(filtered, date_column, primary_numeric, "avg")
        if area_points:
            widgets.append(
                {
                    "id": f"area-{date_column}-{primary_numeric}",
                    "type": "area",
                    "title": f"Promedio de {primary_numeric} en el tiempo",
                    "config": {
                        "x_column": date_column,
                        "y_column": primary_numeric,
                        "aggregation": "avg",
                    },
                    "data": area_points,
                }
            )

        if secondary_numeric:
            line2 = _line_data(filtered, date_column, secondary_numeric, "sum")
            if line2:
                widgets.append(
                    {
                        "id": f"line-{date_column}-{secondary_numeric}",
                        "type": "line",
                        "title": f"{secondary_numeric} en el tiempo (suma)",
                        "config": {
                            "x_column": date_column,
                            "y_column": secondary_numeric,
                            "aggregation": "sum",
                        },
                        "data": line2,
                    }
                )

    for col in numeric_cols[:2]:
        hist_points = _histogram_data(filtered, col)
        if hist_points:
            widgets.append(
                {
                    "id": f"histogram-{col}",
                    "type": "histogram",
                    "title": f"Distribución de {col}",
                    "config": {"column": col},
                    "data": hist_points,
                }
            )

    if primary_numeric and secondary_numeric:
        scatter_points = _scatter_data(filtered, primary_numeric, secondary_numeric)
        if scatter_points:
            widgets.append(
                {
                    "id": f"scatter-{primary_numeric}-{secondary_numeric}",
                    "type": "scatter",
                    "title": f"{secondary_numeric} vs {primary_numeric}",
                    "config": {"x_column": primary_numeric, "y_column": secondary_numeric},
                    "data": scatter_points,
                }
            )

    for cat_col in categorical_list:
        value_col = primary_numeric
        agg = "sum" if value_col else "count"
        bar_points = _group_aggregate(filtered, cat_col, value_col, agg, MAX_BAR_CATEGORIES)
        if bar_points:
            suffix = f"{value_col} por {cat_col}" if value_col else f"Conteo por {cat_col}"
            widgets.append(
                {
                    "id": f"bar-{cat_col}-{value_col or 'count'}",
                    "type": "bar",
                    "title": suffix,
                    "config": {
                        "x_column": cat_col,
                        "y_column": value_col,
                        "aggregation": agg,
                    },
                    "data": bar_points,
                }
            )

            hbar_points = _group_aggregate(filtered, cat_col, value_col, agg, 10)
            if hbar_points:
                widgets.append(
                    {
                        "id": f"hbar-{cat_col}-{value_col or 'count'}",
                        "type": "horizontal_bar",
                        "title": f"Top 10 — {suffix}",
                        "config": {
                            "x_column": cat_col,
                            "y_column": value_col,
                            "aggregation": agg,
                        },
                        "data": hbar_points,
                    }
                )

        pie_col = primary_numeric if primary_numeric else None
        pie_points = _pie_data(filtered, cat_col, pie_col, agg)
        if pie_points:
            chart_type = "donut" if cat_col != primary_categorical else "pie"
            widgets.append(
                {
                    "id": f"{chart_type}-{cat_col}",
                    "type": chart_type,
                    "title": f"Participación por {cat_col}",
                    "config": {
                        "label_column": cat_col,
                        "value_column": pie_col,
                        "aggregation": agg,
                    },
                    "data": pie_points,
                }
            )

    for widget in widgets:
        _apply_axis_labels(widget)

    return {
        "date_column": date_column,
        "date_range": full_range,
        "widgets": widgets,
        "summary": {
            "row_count": len(df),
            "filtered_row_count": len(filtered),
        },
    }


ALLOWED_CHART_TYPES = {
    "kpi",
    "line",
    "area",
    "bar",
    "horizontal_bar",
    "histogram",
    "scatter",
    "pie",
    "donut",
}


def _column_types(columns_meta: list[dict[str, Any]]) -> dict[str, str]:
    return {col["name"]: col.get("inferred_type", "text") for col in columns_meta}


def _resolve_date_filter_column(
    columns_meta: list[dict[str, Any]],
    x_column: str | None,
    by_type: dict[str, list[str]],
) -> str | None:
    types = _column_types(columns_meta)
    if x_column and types.get(x_column) == "date":
        return x_column
    return by_type["date"][0] if by_type["date"] else None


def build_custom_chart(
    columns_meta: list[dict[str, Any]],
    rows: list[dict[str, Any]],
    chart_type: str,
    x_column: str | None = None,
    y_column: str | None = None,
    aggregation: str = "sum",
    date_from: str | None = None,
    date_to: str | None = None,
    column_filters: dict[str, list[str]] | None = None,
) -> dict[str, Any]:
    if chart_type not in ALLOWED_CHART_TYPES:
        raise ValueError(f"Tipo de gráfico no soportado: {chart_type}")

    if not columns_meta:
        raise ValueError("El dataset no tiene columnas")

    df = pd.DataFrame(rows) if rows else pd.DataFrame(columns=[c["name"] for c in columns_meta])
    by_type = _columns_by_type(columns_meta)
    types = _column_types(columns_meta)
    date_filter_col = _resolve_date_filter_column(columns_meta, x_column, by_type)
    filtered = _filter_rows(df, date_filter_col, date_from, date_to)
    filtered = _filter_by_column_values(filtered, column_filters)
    if column_filters and filtered.empty:
        raise ValueError("No hay datos después de aplicar los filtros por valor seleccionados")

    agg = aggregation if aggregation in {"sum", "avg", "count"} else "sum"
    widget: dict[str, Any] | None = None

    if chart_type == "kpi":
        if not y_column or types.get(y_column) != "numeric":
            raise ValueError("KPI requiere una columna numérica (Y)")
        value = _aggregate_series(filtered[y_column], agg if agg != "count" else "sum")
        widget = {
            "id": f"custom-kpi-{y_column}-{agg}",
            "type": "kpi",
            "title": f"{'Promedio' if agg == 'avg' else 'Total'} {y_column}",
            "config": {"column": y_column, "aggregation": agg, "x_column": x_column, "y_column": y_column},
            "data": {"value": round(value, 2), "label": y_column},
        }

    elif chart_type in {"line", "area"}:
        if not x_column or types.get(x_column) != "date":
            raise ValueError("Línea/área requiere columna X de tipo fecha")
        if not y_column or types.get(y_column) != "numeric":
            raise ValueError("Línea/área requiere columna Y numérica")
        line_agg = "avg" if chart_type == "area" or agg == "avg" else "sum"
        points = _line_data(filtered, x_column, y_column, line_agg)
        if not points:
            raise ValueError("No hay datos suficientes para el gráfico temporal")
        widget = {
            "id": f"custom-{chart_type}-{x_column}-{y_column}",
            "type": chart_type,
            "title": f"{y_column} por {x_column} ({line_agg})",
            "config": {
                "x_column": x_column,
                "y_column": y_column,
                "aggregation": line_agg,
            },
            "data": points,
        }

    elif chart_type in {"bar", "horizontal_bar"}:
        if not x_column or x_column not in filtered.columns:
            raise ValueError("Barras requiere columna X (categoría o fecha)")
        value_col = y_column if y_column and types.get(y_column) == "numeric" else None
        bar_agg = agg if value_col else "count"
        limit = 10 if chart_type == "horizontal_bar" else MAX_BAR_CATEGORIES
        points = _group_aggregate(filtered, x_column, value_col, bar_agg, limit)
        if not points:
            raise ValueError("No hay datos suficientes para el gráfico de barras")
        label = f"{value_col or 'conteo'} por {x_column}"
        widget = {
            "id": f"custom-{chart_type}-{x_column}-{value_col or 'count'}",
            "type": chart_type,
            "title": label if chart_type == "bar" else f"Top 10 — {label}",
            "config": {
                "x_column": x_column,
                "y_column": value_col,
                "aggregation": bar_agg,
            },
            "data": points,
        }

    elif chart_type in {"pie", "donut"}:
        if not x_column or x_column not in filtered.columns:
            raise ValueError("Pastel/dona requiere columna X (categoría)")
        value_col = y_column if y_column and types.get(y_column) == "numeric" else None
        pie_agg = agg if value_col else "count"
        points = _pie_data(filtered, x_column, value_col, pie_agg)
        if not points:
            raise ValueError("No hay datos suficientes para el gráfico circular")
        widget = {
            "id": f"custom-{chart_type}-{x_column}-{value_col or 'count'}",
            "type": chart_type,
            "title": f"Participación por {x_column}",
            "config": {
                "label_column": x_column,
                "value_column": value_col,
                "aggregation": pie_agg,
            },
            "data": points,
        }

    elif chart_type == "histogram":
        col = x_column or y_column
        if not col or types.get(col) != "numeric":
            raise ValueError("Histograma requiere columna numérica")
        points = _histogram_data(filtered, col)
        if not points:
            raise ValueError("No hay datos suficientes para el histograma")
        widget = {
            "id": f"custom-histogram-{col}",
            "type": "histogram",
            "title": f"Distribución de {col}",
            "config": {"column": col, "x_column": col},
            "data": points,
        }

    elif chart_type == "scatter":
        if not x_column or types.get(x_column) != "numeric":
            raise ValueError("Scatter requiere columna X numérica")
        if not y_column or types.get(y_column) != "numeric":
            raise ValueError("Scatter requiere columna Y numérica")
        points = _scatter_data(filtered, x_column, y_column)
        if not points:
            raise ValueError("No hay datos suficientes para el scatter")
        widget = {
            "id": f"custom-scatter-{x_column}-{y_column}",
            "type": "scatter",
            "title": f"{y_column} vs {x_column}",
            "config": {"x_column": x_column, "y_column": y_column},
            "data": points,
        }

    if not widget:
        raise ValueError("No se pudo generar el gráfico")

    _apply_axis_labels(widget)
    _apply_chart_context(
        widget,
        column_filters=column_filters,
        date_from=date_from,
        date_to=date_to,
    )
    return widget
