from app.data_engine.dashboard_engine import build_custom_chart, build_dashboard


def _sales_columns():
    return [
        {"name": "fecha", "inferred_type": "date", "null_count": 0},
        {"name": "producto", "inferred_type": "categorical", "null_count": 0},
        {"name": "region", "inferred_type": "categorical", "null_count": 0},
        {"name": "ventas", "inferred_type": "numeric", "null_count": 0},
    ]


def _sales_rows():
    return [
        {"fecha": "2024-01-15", "producto": "A", "region": "Lima", "ventas": 100},
        {"fecha": "2024-01-16", "producto": "B", "region": "Lima", "ventas": 200},
        {"fecha": "2024-02-01", "producto": "A", "region": "Cusco", "ventas": 150},
        {"fecha": "2024-02-02", "producto": "C", "region": "Arequipa", "ventas": 80},
    ]


def test_build_dashboard_includes_kpi_line_bar_pie():
    result = build_dashboard(_sales_columns(), _sales_rows())

    types = {w["type"] for w in result["widgets"]}
    assert "kpi" in types
    assert "line" in types
    assert "bar" in types
    assert "pie" in types
    assert "histogram" in types
    assert "horizontal_bar" in types
    assert result["date_column"] == "fecha"
    assert result["summary"]["row_count"] == 4
    assert len(result["widgets"]) >= 8


def test_build_dashboard_with_two_numeric_includes_scatter():
    columns = _sales_columns() + [{"name": "cantidad", "inferred_type": "numeric", "null_count": 0}]
    rows = [{**row, "cantidad": 10 * (i + 1)} for i, row in enumerate(_sales_rows())]
    result = build_dashboard(columns, rows)

    types = {w["type"] for w in result["widgets"]}
    assert "scatter" in types
    assert "area" in types


def test_date_filter_reduces_rows():
    result = build_dashboard(
        _sales_columns(),
        _sales_rows(),
        date_from="2024-02-01",
        date_to="2024-02-28",
    )

    assert result["summary"]["filtered_row_count"] == 2
    kpi = next(w for w in result["widgets"] if w["type"] == "kpi" and w["config"].get("aggregation") == "sum")
    assert kpi["data"]["value"] == 230


def test_build_custom_chart_bar():
    result = build_custom_chart(
        _sales_columns(),
        _sales_rows(),
        chart_type="bar",
        x_column="region",
        y_column="ventas",
        aggregation="sum",
    )
    assert result["type"] == "bar"
    assert len(result["data"]) >= 2


def test_build_custom_chart_pie():
    result = build_custom_chart(
        _sales_columns(),
        _sales_rows(),
        chart_type="pie",
        x_column="producto",
        y_column="ventas",
        aggregation="sum",
    )
    assert result["type"] == "pie"
    assert all("name" in item and "value" in item for item in result["data"])


def test_empty_dataset_returns_no_widgets():
    result = build_dashboard([], [])

    assert result["widgets"] == []
    assert result["summary"]["row_count"] == 0
