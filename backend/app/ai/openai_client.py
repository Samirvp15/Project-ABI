import json
import logging
import re
from typing import Any

from openai import OpenAI

from app.ai.prompts import (
    ENRICH_ANSWER_PROMPT,
    EXPLAIN_RESULTS_PROMPT,
    SYSTEM_PROMPT,
    build_charts_catalog,
    build_schema_context,
)
from app.core.config import settings

logger = logging.getLogger(__name__)

MAX_SUGGESTIONS = 3


class AIServiceError(Exception):
    pass


def _extract_json(text: str) -> dict[str, Any]:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            return json.loads(match.group())
        raise AIServiceError("La IA no devolvió JSON válido") from None


def normalize_suggestions(raw: Any) -> list[str]:
    if not isinstance(raw, list):
        return []
    suggestions: list[str] = []
    for item in raw:
        text = str(item).strip()
        if text and len(text) <= 120:
            suggestions.append(text)
        if len(suggestions) >= MAX_SUGGESTIONS:
            break
    return suggestions


def parse_answer_payload(content: str) -> tuple[str, list[str]]:
    try:
        data = _extract_json(content)
        answer = str(data.get("answer") or data.get("explanation") or "").strip()
        suggestions = normalize_suggestions(data.get("follow_up_suggestions"))
        if answer:
            return answer, suggestions
    except (AIServiceError, json.JSONDecodeError):
        pass
    return content.strip(), []


class OpenAIClient:
    def __init__(self) -> None:
        if not settings.openai_api_key:
            raise AIServiceError("OPENAI_API_KEY no configurada")
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model

    def generate_chat_plan(
        self,
        schema_context: str,
        charts_catalog: str,
        user_message: str,
        history: list[dict[str, str]],
    ) -> tuple[dict[str, Any], int]:
        messages: list[dict[str, str]] = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "system", "content": schema_context},
            {"role": "system", "content": charts_catalog},
        ]
        for item in history[-6:]:
            messages.append({"role": item["role"], "content": item["content"]})
        messages.append({"role": "user", "content": user_message})

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.15,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content or "{}"
        tokens = response.usage.total_tokens if response.usage else 0
        return _extract_json(content), tokens

    def explain_results(
        self,
        user_message: str,
        sql: str,
        result: list[dict[str, Any]],
        has_chart: bool = False,
        dataset_name: str = "",
    ) -> tuple[str, list[str], int]:
        preview = json.dumps(result[:10], ensure_ascii=False, default=str)
        chart_note = (
            "\nSe incluirá un gráfico visual con el resultado." if has_chart else ""
        )
        prompt = (
            f"Dataset: {dataset_name}\n"
            f"Pregunta del usuario: {user_message}\n\n"
            f"SQL ejecutado:\n{sql}\n\n"
            f"Resultado (JSON, máx. 10 filas):\n{preview}{chart_note}"
        )
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": EXPLAIN_RESULTS_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.45,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content or "{}"
        tokens = response.usage.total_tokens if response.usage else 0
        answer, suggestions = parse_answer_payload(content)
        return answer, suggestions, tokens

    def enrich_answer(
        self,
        user_message: str,
        intent: str,
        draft_answer: str,
        dataset_name: str,
        chart_titles: list[str],
        plan_suggestions: list[str] | None = None,
    ) -> tuple[str, list[str], int]:
        charts_text = ", ".join(chart_titles) if chart_titles else "ninguno"
        plan_suggestions_text = (
            json.dumps(plan_suggestions or [], ensure_ascii=False)
        )
        prompt = (
            f"Dataset: {dataset_name}\n"
            f"Intent: {intent}\n"
            f"Pregunta del usuario: {user_message}\n"
            f"Gráficos incluidos: {charts_text}\n"
            f"Sugerencias del plan (puedes mejorarlas): {plan_suggestions_text}\n\n"
            f"Borrador de respuesta:\n{draft_answer}"
        )
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": ENRICH_ANSWER_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.45,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content or "{}"
        tokens = response.usage.total_tokens if response.usage else 0
        answer, suggestions = parse_answer_payload(content)
        if not suggestions and plan_suggestions:
            suggestions = plan_suggestions[:MAX_SUGGESTIONS]
        return answer, suggestions, tokens


def build_schema_context_from_dataset(
    dataset_name: str,
    columns: list,
    sample_rows: list[dict],
    analytics_profile: dict | None,
    row_count: int | None = None,
    date_column: str | None = None,
    date_range: dict | None = None,
) -> str:
    columns_meta = [
        {
            "name": col.name,
            "inferred_type": col.inferred_type,
            "null_count": col.null_count,
            "sample_values": col.sample_values,
        }
        for col in sorted(columns, key=lambda c: c.position)
    ]
    return build_schema_context(
        dataset_name,
        columns_meta,
        sample_rows,
        analytics_profile,
        row_count=row_count,
        date_column=date_column,
        date_range=date_range,
    )


def build_charts_catalog_from_widgets(widgets: list[dict[str, Any]]) -> str:
    return build_charts_catalog(widgets)
