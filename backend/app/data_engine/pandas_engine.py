import hashlib
import io
import json
from dataclasses import dataclass

import pandas as pd

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".json"}
MAX_ROWS = 1_000_000


@dataclass
class ParsedColumn:
    name: str
    position: int
    inferred_type: str
    null_count: int
    sample_values: list


@dataclass
class ParsedDataset:
    columns: list[ParsedColumn]
    rows: list[dict]
    file_type: str
    file_hash: str


def _infer_column_type(series: pd.Series) -> str:
    non_null = series.dropna()
    if non_null.empty:
        return "text"

    if pd.api.types.is_bool_dtype(series):
        return "boolean"

    if pd.api.types.is_numeric_dtype(series):
        return "numeric"

    if pd.api.types.is_datetime64_any_dtype(series):
        return "date"

    sample = non_null.head(100)
    parsed_dates = pd.to_datetime(sample, errors="coerce", format="mixed")
    if parsed_dates.notna().mean() > 0.8:
        return "date"

    if non_null.dtype == object:
        unique_ratio = non_null.nunique() / len(non_null)
        if unique_ratio <= 0.5 and non_null.nunique() <= 50:
            return "categorical"
        return "text"

    return "text"


def _normalize_value(value: object) -> object:
    if pd.isna(value):
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    if isinstance(value, (int, float, bool, str)):
        return value
    return str(value)


def _parse_dataframe(df: pd.DataFrame, file_type: str, file_hash: str) -> ParsedDataset:
    df = df.where(pd.notna(df), None)
    columns: list[ParsedColumn] = []

    for position, col_name in enumerate(df.columns):
        series = df[col_name]
        inferred = _infer_column_type(series)
        null_count = int(series.isna().sum())
        samples = [
            _normalize_value(v)
            for v in series.dropna().head(5).tolist()
            if _normalize_value(v) is not None
        ]
        columns.append(
            ParsedColumn(
                name=str(col_name),
                position=position,
                inferred_type=inferred,
                null_count=null_count,
                sample_values=samples,
            )
        )

    rows = [
        {str(k): _normalize_value(v) for k, v in record.items()}
        for record in df.to_dict(orient="records")
    ]

    return ParsedDataset(columns=columns, rows=rows, file_type=file_type, file_hash=file_hash)


def compute_file_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def get_extension(filename: str) -> str:
    lower = filename.lower()
    for ext in ALLOWED_EXTENSIONS:
        if lower.endswith(ext):
            return ext
    raise ValueError(f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")


def parse_file(content: bytes, filename: str) -> ParsedDataset:
    ext = get_extension(filename)
    file_hash = compute_file_hash(content)

    if ext == ".csv":
        df = pd.read_csv(io.BytesIO(content))
        file_type = "csv"
    elif ext in {".xlsx", ".xls"}:
        df = pd.read_excel(io.BytesIO(content))
        file_type = "xlsx"
    elif ext == ".json":
        raw = json.loads(content.decode("utf-8"))
        if isinstance(raw, list):
            df = pd.json_normalize(raw)
        elif isinstance(raw, dict):
            df = pd.json_normalize(raw)
        else:
            raise ValueError("JSON must be an array or object of records")
        file_type = "json"
    else:
        raise ValueError(f"Unsupported extension: {ext}")

    if len(df) > MAX_ROWS:
        raise ValueError(f"File exceeds maximum of {MAX_ROWS:,} rows")

    if df.empty:
        raise ValueError("File contains no data rows")

    return _parse_dataframe(df, file_type, file_hash)
