from app.data_engine.dashboard_engine import build_dashboard


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
    assert result["date_column"] == "fecha"
    assert result["summary"]["row_count"] == 4


def test_date_filter_reduces_rows():
    result = build_dashboard(
        _sales_columns(),
        _sales_rows(),
        date_from="2024-02-01",
        date_to="2024-02-28",
    )

    assert result["summary"]["filtered_row_count"] == 2
    kpi = next(w for w in result["widgets"] if w["type"] == "kpi")
    assert kpi["data"]["value"] == 230


def test_empty_dataset_returns_no_widgets():
    result = build_dashboard([], [])

    assert result["widgets"] == []
    assert result["summary"]["row_count"] == 0
