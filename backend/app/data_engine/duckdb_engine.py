import re
from typing import Any

import duckdb
import pandas as pd

FORBIDDEN_KEYWORDS = re.compile(
    r"\b("
    r"insert|update|delete|drop|alter|create|truncate|grant|revoke|"
    r"attach|detach|copy|export|import|install|load|pragma|call|"
    r"merge|replace|vacuum"
    r")\b",
    re.IGNORECASE,
)


class SQLValidationError(ValueError):
    pass


class SQLExecutionError(ValueError):
    pass


def validate_readonly_sql(sql: str) -> str:
    cleaned = sql.strip().rstrip(";").strip()
    if not cleaned:
        raise SQLValidationError("La consulta SQL está vacía")

    if ";" in cleaned:
        raise SQLValidationError("Solo se permite una sentencia SQL")

    if FORBIDDEN_KEYWORDS.search(cleaned):
        raise SQLValidationError("Solo se permiten consultas SELECT de lectura")

    if not re.match(r"^select\b", cleaned, re.IGNORECASE):
        raise SQLValidationError("Solo se permiten consultas SELECT")

    return cleaned


def rows_to_dataframe(rows: list[dict[str, Any]]) -> pd.DataFrame:
    if not rows:
        return pd.DataFrame()
    return pd.DataFrame(rows)


def execute_select(df: pd.DataFrame, sql: str, limit: int = 100) -> list[dict[str, Any]]:
    validated = validate_readonly_sql(sql)
    con = duckdb.connect(database=":memory:")
    try:
        if df.empty:
            con.register("data", pd.DataFrame())
        else:
            con.register("data", df)

        wrapped = f"SELECT * FROM ({validated}) AS _q LIMIT {limit}"
        result = con.execute(wrapped).fetchdf()
        records: list[dict[str, Any]] = result.to_dict(orient="records")
        for row in records:
            for key, value in row.items():
                if pd.isna(value):
                    row[key] = None
                elif hasattr(value, "item"):
                    try:
                        row[key] = value.item()
                    except (ValueError, AttributeError):
                        row[key] = value
                elif not isinstance(value, (str, int, float, bool, type(None))):
                    row[key] = str(value)
        return records
    except SQLValidationError:
        raise
    except Exception as exc:
        raise SQLExecutionError(f"Error al ejecutar SQL: {exc}") from exc
    finally:
        con.close()
