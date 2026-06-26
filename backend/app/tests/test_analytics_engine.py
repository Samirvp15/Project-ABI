from app.data_engine.analytics_engine import compute_analytics_profile


def test_compute_numeric_metrics():
    columns = [
        {"name": "ventas", "inferred_type": "numeric", "null_count": 0},
        {"name": "fecha", "inferred_type": "date", "null_count": 0},
    ]
    rows = [
        {"ventas": 100, "fecha": "2025-01"},
        {"ventas": 200, "fecha": "2025-02"},
    ]

    profile = compute_analytics_profile(columns, rows)

    assert profile["summary"]["row_count"] == 2
    assert profile["summary"]["column_count"] == 2

    ventas = next(c for c in profile["columns"] if c["name"] == "ventas")
    assert ventas["type"] == "numeric"
    assert ventas["metrics"]["sum"] == 300
    assert ventas["metrics"]["avg"] == 150
    assert ventas["metrics"]["min"] == 100
    assert ventas["metrics"]["max"] == 200


def test_compute_categorical_top_values():
    columns = [{"name": "producto", "inferred_type": "categorical", "null_count": 0}]
    rows = [
        {"producto": "A"},
        {"producto": "B"},
        {"producto": "A"},
        {"producto": "A"},
    ]

    profile = compute_analytics_profile(columns, rows)
    producto = profile["columns"][0]

    assert producto["metrics"]["unique_count"] == 2
    assert producto["metrics"]["top_values"][0]["value"] == "A"
    assert producto["metrics"]["top_values"][0]["count"] == 3


def test_compute_null_percent():
    columns = [{"name": "valor", "inferred_type": "numeric", "null_count": 1}]
    rows = [{"valor": 10}, {"valor": None}]

    profile = compute_analytics_profile(columns, rows)
    col = profile["columns"][0]

    assert col["null_count"] == 1
    assert col["null_percent"] == 50.0
