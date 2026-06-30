from app.ai.openai_client import normalize_suggestions, parse_answer_payload


def test_normalize_suggestions_limits_count_and_length():
    raw = ["a" * 130, "  válida  ", "", "otra", "cuarta", "quinta"]
    result = normalize_suggestions(raw)
    assert result == ["válida", "otra", "cuarta"]


def test_parse_answer_payload_json():
    content = (
        '{"answer": "Hola, el total es 100.", '
        '"follow_up_suggestions": ["¿Y por país?", "Muéstrame un gráfico"]}'
    )
    answer, suggestions = parse_answer_payload(content)
    assert "100" in answer
    assert len(suggestions) == 2


def test_parse_answer_payload_plain_text_fallback():
    answer, suggestions = parse_answer_payload("Respuesta simple sin JSON")
    assert answer == "Respuesta simple sin JSON"
    assert suggestions == []
