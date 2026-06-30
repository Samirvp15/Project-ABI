"""Helpers to build chart widgets for AI chat responses."""

from typing import Any

from app.schemas.ai import ChartHint


def match_widgets_by_message(
    message: str, widgets: list[dict[str, Any]], limit: int = 3
) -> list[dict[str, Any]]:
    msg = message.lower()
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
    widget_ids: list[str], widgets: list[dict[str, Any]], limit: int = 3
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


def pick_overview_widgets(widgets: list[dict[str, Any]], limit: int = 4) -> list[dict[str, Any]]:
    priority = {"kpi": 0, "line": 1, "bar": 2, "pie": 3, "donut": 4, "area": 5}
    sorted_widgets = sorted(
        widgets,
        key=lambda w: (priority.get(str(w.get("type")), 99), str(w.get("title", ""))),
    )
    return sorted_widgets[:limit]
