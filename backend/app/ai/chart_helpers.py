"""Helpers to build chart widgets for AI chat responses."""

from typing import Any

from app.data_engine.dashboard_engine import build_custom_chart
from app.schemas.ai import ChartHint

MAX_CHAT_CHARTS = 8


def normalize_chart_builds(plan: dict[str, Any]) -> list[dict[str, Any]]:
    builds = plan.get("chart_builds")
    if isinstance(builds, list):
        return [item for item in builds if isinstance(item, dict)][:MAX_CHAT_CHARTS]
    single = plan.get("chart_build")
    if isinstance(single, dict) and single:
        return [single]
    return []


def _parse_build_spec(cfg: dict[str, Any]) -> dict[str, Any]:
    column_filters = cfg.get("column_filters")
    if isinstance(column_filters, dict):
        cleaned = {
            str(column): [str(value) for value in values if value is not None]
            for column, values in column_filters.items()
            if isinstance(values, list) and values
        }
        column_filters = cleaned or None
    else:
        column_filters = None

    date_from = cfg.get("date_from")
    date_to = cfg.get("date_to")

    return {
        "chart_type": str(cfg.get("chart_type") or "bar"),
        "x_column": cfg.get("x_column"),
        "y_column": cfg.get("y_column"),
        "aggregation": str(cfg.get("aggregation") or "sum"),
        "date_from": str(date_from).strip() if date_from else None,
        "date_to": str(date_to).strip() if date_to else None,
        "column_filters": column_filters,
    }


def build_widgets_from_specs(
    columns_meta: list[dict[str, Any]],
    rows: list[dict[str, Any]],
    builds: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[str]]:
    widgets: list[dict[str, Any]] = []
    errors: list[str] = []
    for cfg in builds[:MAX_CHAT_CHARTS]:
        spec = _parse_build_spec(cfg)
        try:
            widgets.append(
                build_custom_chart(
                    columns_meta,
                    rows,
                    chart_type=spec["chart_type"],
                    x_column=spec["x_column"],
                    y_column=spec["y_column"],
                    aggregation=spec["aggregation"],
                    date_from=spec["date_from"],
                    date_to=spec["date_to"],
                    column_filters=spec["column_filters"],
                )
            )
        except ValueError as exc:
            errors.append(str(exc))
    return widgets, errors


def match_widgets_by_message(
    message: str, widgets: list[dict[str, Any]], limit: int = MAX_CHAT_CHARTS
) -> list[dict[str, Any]]:
    msg = message.lower()
    wants_all = any(
        phrase in msg
        for phrase in ("todos los gráficos", "todos los graficos", "todos gráficos", "all charts")
    )
    if wants_all:
        chart_widgets = [w for w in widgets if w.get("type") != "kpi"]
        return chart_widgets[:limit]

    scored: list[tuple[int, dict[str, Any]]] = []
    for widget in widgets:
        title = str(widget.get("title", "")).lower()
        widget_type = str(widget.get("type", "")).lower()
        score = 0
        for word in msg.split():
            if len(word) > 3 and word in title:
                score += 2
            if len(word) > 3 and word in widget_type:
                score += 1
        if "gráfico" in msg or "grafico" in msg or "chart" in msg:
            if widget_type in {"line", "bar", "pie", "donut", "area", "histogram", "scatter"}:
                score += 1
        if score > 0:
            scored.append((score, widget))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [widget for _, widget in scored[:limit]]


def resolve_widgets_by_ids(
    widget_ids: list[str], widgets: list[dict[str, Any]], limit: int = MAX_CHAT_CHARTS
) -> list[dict[str, Any]]:
    by_id = {widget["id"]: widget for widget in widgets}
    resolved = [by_id[wid] for wid in widget_ids if wid in by_id]
    return resolved[:limit]


def build_widget_from_sql_result(
    result: list[dict[str, Any]], hint: ChartHint
) -> dict[str, Any] | None:
    if not result or hint.type == "none":
        return None

    keys = list(result[0].keys())
    x_col = hint.x_column or keys[0]
    y_col = hint.y_column
    if not y_col and len(keys) >= 2:
        y_col = keys[1] if keys[1] != x_col else keys[0]

    if hint.type in {"line", "bar"}:
        data: list[dict[str, Any]] = []
        for row in result[:50]:
            x_val = row.get(x_col)
            y_val = row.get(y_col) if y_col else None
            if y_val is None:
                continue
            try:
                y_num = round(float(y_val), 2)
            except (TypeError, ValueError):
                continue
            data.append({"x": str(x_val), "y": y_num})
        if not data:
            return None
        return {
            "id": f"chat-query-{hint.type}-{x_col}",
            "type": hint.type,
            "title": f"{y_col or 'valor'} por {x_col}",
            "config": {"x_column": x_col, "y_column": y_col, "aggregation": "sum"},
            "data": data,
        }

    if hint.type == "pie":
        label_col = x_col
        value_col = y_col
        data = []
        for row in result[:20]:
            name = row.get(label_col)
            if name is None:
                continue
            if value_col:
                try:
                    value = round(float(row.get(value_col, 0)), 2)
                except (TypeError, ValueError):
                    value = 0
            else:
                value = 1
            data.append({"name": str(name), "value": value})
        if not data:
            return None
        return {
            "id": f"chat-query-pie-{label_col}",
            "type": "pie",
            "title": f"Participación por {label_col}",
            "config": {"label_column": label_col, "value_column": value_col, "aggregation": "sum"},
            "data": data,
        }

    return None


def pick_overview_widgets(
    widgets: list[dict[str, Any]], limit: int = MAX_CHAT_CHARTS
) -> list[dict[str, Any]]:
    priority = {"kpi": 0, "line": 1, "bar": 2, "pie": 3, "donut": 4, "area": 5}
    sorted_widgets = sorted(
        widgets,
        key=lambda w: (priority.get(str(w.get("type")), 99), str(w.get("title", ""))),
    )
    return sorted_widgets[:limit]
