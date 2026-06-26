import pytest

from app.data_engine.pandas_engine import get_extension, parse_file


def test_get_extension_csv():
    assert get_extension("ventas.csv") == ".csv"


def test_get_extension_xlsx():
    assert get_extension("data.xlsx") == ".xlsx"


def test_get_extension_invalid():
    with pytest.raises(ValueError, match="Unsupported"):
        get_extension("file.txt")


def test_parse_csv_basic():
    content = b"fecha,ventas\n2025-01,100\n2025-02,200"
    parsed = parse_file(content, "ventas.csv")

    assert parsed.file_type == "csv"
    assert len(parsed.rows) == 2
    assert len(parsed.columns) == 2
    assert parsed.columns[0].name == "fecha"
    assert parsed.columns[1].name == "ventas"
    assert parsed.columns[1].inferred_type == "numeric"


def test_parse_json_array():
    content = b'[{"producto":"A","cantidad":10},{"producto":"B","cantidad":20}]'
    parsed = parse_file(content, "data.json")

    assert parsed.file_type == "json"
    assert len(parsed.rows) == 2
    assert parsed.columns[0].name == "producto"


def test_parse_empty_csv_raises():
    content = b"fecha,ventas\n"
    with pytest.raises(ValueError, match="no data"):
        parse_file(content, "empty.csv")
