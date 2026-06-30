from app.ai.chart_helpers import (
    build_widget_from_sql_result,
    match_widgets_by_message,
    normalize_chart_builds,
    pick_overview_widgets,
    resolve_widgets_by_ids,
)
from app.schemas.ai import ChartHint


def test_resolve_widgets_by_ids():
    widgets = [
        {"id": "bar-a", "type": "bar", "title": "A"},
        {"id": "line-b", "type": "line", "title": "B"},
    ]
    resolved = resolve_widgets_by_ids(["line-b", "missing"], widgets)
    assert len(resolved) == 1
    assert resolved[0]["id"] == "line-b"


def test_match_widgets_by_message():
    widgets = [
        {"id": "bar-cat", "type": "bar", "title": "ventas por categoría"},
        {"id": "line-date", "type": "line", "title": "tendencia temporal"},
    ]
    matched = match_widgets_by_message("muéstrame el gráfico de ventas por categoría", widgets)
    assert matched
    assert matched[0]["id"] == "bar-cat"


def test_build_widget_from_sql_result_bar():
    result = [{"categoria": "A", "total": 100}, {"categoria": "B", "total": 200}]
    hint = ChartHint(type="bar", x_column="categoria", y_column="total")
    widget = build_widget_from_sql_result(result, hint)
    assert widget is not None
    assert widget["type"] == "bar"
    assert len(widget["data"]) == 2


def test_normalize_chart_builds_prefers_array():
    plan = {
        "chart_builds": [{"chart_type": "bar", "x_column": "a", "y_column": "b"}],
        "chart_build": {"chart_type": "pie", "x_column": "c"},
    }
    builds = normalize_chart_builds(plan)
    assert len(builds) == 1
    assert builds[0]["chart_type"] == "bar"


def test_normalize_chart_builds_fallback_single():
    plan = {"chart_build": {"chart_type": "line", "x_column": "date", "y_column": "sales"}}
    builds = normalize_chart_builds(plan)
    assert len(builds) == 1
    assert builds[0]["chart_type"] == "line"


def test_pick_overview_widgets_prioritizes_kpi():
    widgets = [
        {"id": "line-1", "type": "line", "title": "Line"},
        {"id": "kpi-1", "type": "kpi", "title": "KPI"},
        {"id": "bar-1", "type": "bar", "title": "Bar"},
    ]
    picked = pick_overview_widgets(widgets, limit=2)
    assert picked[0]["type"] == "kpi"
