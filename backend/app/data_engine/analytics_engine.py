from typing import Any

import pandas as pd

TOP_CATEGORIES = 10


def _safe_float(value: Any) -> float | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    return float(value)


def compute_analytics_profile(
    columns_meta: list[dict[str, Any]],
    rows: list[dict[str, Any]],
) -> dict[str, Any]:
    if not columns_meta:
        return {"summary": {"row_count": 0, "column_count": 0}, "columns": []}

    df = pd.DataFrame(rows) if rows else pd.DataFrame(columns=[c["name"] for c in columns_meta])
    result_columns: list[dict[str, Any]] = []
    row_count = len(df)

    for col_meta in columns_meta:
        name = col_meta["name"]
        col_type = col_meta["inferred_type"]
        series = df[name] if name in df.columns else pd.Series(dtype=object)
        null_count = int(series.isna().sum()) if len(series) else int(col_meta.get("null_count", 0))
        null_percent = round((null_count / row_count * 100) if row_count else 0, 2)

        entry: dict[str, Any] = {
            "name": name,
            "type": col_type,
            "null_count": null_count,
            "null_percent": null_percent,
            "metrics": {},
        }

        if col_type == "numeric":
            numeric = pd.to_numeric(series, errors="coerce")
            valid = numeric.dropna()
            if not valid.empty:
                entry["metrics"] = {
                    "sum": _safe_float(valid.sum()),
                    "avg": _safe_float(valid.mean()),
                    "min": _safe_float(valid.min()),
                    "max": _safe_float(valid.max()),
                    "count": int(valid.count()),
                    "std_dev": _safe_float(valid.std()) if len(valid) > 1 else 0.0,
                }

        elif col_type == "date":
            parsed = pd.to_datetime(series, errors="coerce", format="mixed")
            valid = parsed.dropna()
            if not valid.empty:
                entry["metrics"] = {
                    "min": valid.min().isoformat(),
                    "max": valid.max().isoformat(),
                    "count": int(valid.count()),
                }

        elif col_type in {"categorical", "text", "boolean"}:
            non_null = series.dropna().astype(str)
            unique_count = int(non_null.nunique()) if not non_null.empty else 0
            top_values: list[dict[str, Any]] = []
            if not non_null.empty:
                counts = non_null.value_counts().head(TOP_CATEGORIES)
                top_values = [
                    {"value": str(idx), "count": int(count)} for idx, count in counts.items()
                ]
            entry["metrics"] = {
                "unique_count": unique_count,
                "top_values": top_values,
            }

        result_columns.append(entry)

    return {
        "summary": {
            "row_count": row_count,
            "column_count": len(columns_meta),
        },
        "columns": result_columns,
    }
