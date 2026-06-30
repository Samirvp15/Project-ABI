import pandas as pd
import pytest

from app.data_engine.duckdb_engine import (
    SQLExecutionError,
    SQLValidationError,
    execute_select,
    validate_readonly_sql,
)


def test_validate_accepts_select():
    sql = validate_readonly_sql("SELECT fecha, ventas FROM data ORDER BY ventas DESC LIMIT 1")
    assert sql.lower().startswith("select")


def test_validate_rejects_insert():
    with pytest.raises(SQLValidationError):
        validate_readonly_sql("INSERT INTO data VALUES (1)")


def test_validate_rejects_multiple_statements():
    with pytest.raises(SQLValidationError):
        validate_readonly_sql("SELECT 1; DROP TABLE data")


def test_execute_select_returns_rows():
    df = pd.DataFrame(
        [
            {"fecha": "2025-01", "ventas": 100},
            {"fecha": "2025-02", "ventas": 200},
        ]
    )
    rows = execute_select(
        df,
        "SELECT fecha, ventas FROM data ORDER BY ventas DESC LIMIT 1",
    )
    assert len(rows) == 1
    assert rows[0]["ventas"] == 200


def test_execute_select_best_month_query():
    df = pd.DataFrame(
        [
            {"fecha": "2025-01", "ventas": 100},
            {"fecha": "2025-02", "ventas": 200},
        ]
    )
    rows = execute_select(
        df,
        "SELECT fecha, ventas FROM data ORDER BY ventas DESC LIMIT 1",
    )
    assert rows[0]["fecha"] == "2025-02"


def test_execute_select_invalid_column_raises():
    df = pd.DataFrame([{"ventas": 100}])
    with pytest.raises(SQLExecutionError):
        execute_select(df, "SELECT no_existe FROM data")
