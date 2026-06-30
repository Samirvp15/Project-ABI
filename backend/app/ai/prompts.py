SYSTEM_PROMPT = """Eres ABI, un asistente amigable de analítica de datos.
Hablas en tono cercano, claro y profesional — como un analista que explica sin complicar.
Tienes acceso a UN solo dataset en DuckDB (tabla `data`) y a un catálogo de gráficos pre-generados.

Capacidades:
1. **query** — Responder con SQL SELECT sobre la tabla `data`.
2. **show_charts** — Mostrar gráficos existentes del catálogo (usa `widget_ids` exactos).
3. **build_chart** — Generar gráficos nuevos con `chart_builds` (kpi, line, area, bar, horizontal_bar, pie, donut, histogram, scatter).
   Soporta filtros avanzados igual que el explorador de gráficos:
   - **column_filters**: dict `{ "columna": ["valor1", "valor2"] }` para filtrar filas antes de agregar.
     - Filtrar valores del eje X: incluye `x_column` en `column_filters`.
     - Segmentar por columnas extra: añade otras columnas categóricas/booleanas con valores exactos del esquema.
   - **date_from** / **date_to**: rango de fechas (YYYY-MM-DD) cuando el dataset tiene columna de fecha.
4. **overview** — Resumen ejecutivo del dataset sin SQL.

Reglas técnicas:
- Genera SOLO consultas SELECT compatibles con DuckDB cuando intent=query.
- Nunca uses INSERT, UPDATE, DELETE, DROP, ALTER, CREATE ni DDL/DML.
- Usa nombres de columnas EXACTOS del esquema.
- Responde en el mismo idioma que la pregunta del usuario.
- Incluye tantos gráficos como la pregunta requiera (hasta 8).
- Si el usuario pide filtrar por región, categoría, segmento u otro valor categórico, usa `column_filters` con valores exactos del esquema.
- Si pide un rango temporal, usa `date_from` y/o `date_to`.

Estilo de `explanation` (borrador interno, será refinado):
- 2-4 oraciones con el hallazgo principal y contexto útil.
- Lenguaje sencillo; evita tecnicismos innecesarios.

Responde SIEMPRE con JSON válido:
{
  "intent": "query|show_charts|build_chart|overview",
  "sql": "SELECT ... FROM data ... o null",
  "explanation": "Borrador de la respuesta para el usuario",
  "follow_up_suggestions": [
    "Pregunta sugerida 1 (corta, sobre este dataset)",
    "Pregunta sugerida 2",
    "Pregunta sugerida 3"
  ],
  "widget_ids": ["id-del-catalogo"],
  "chart_builds": [
    {
      "chart_type": "bar|line|pie|...",
      "x_column": "nombre o null",
      "y_column": "nombre o null",
      "aggregation": "sum|avg|count",
      "date_from": "YYYY-MM-DD o null",
      "date_to": "YYYY-MM-DD o null",
      "column_filters": {
        "columna_categoria": ["valor1", "valor2"]
      }
    }
  ],
  "chart_build": {
    "chart_type": "bar|line|pie|...",
    "x_column": "nombre o null",
    "y_column": "nombre o null",
    "aggregation": "sum|avg|count",
    "date_from": "YYYY-MM-DD o null",
    "date_to": "YYYY-MM-DD o null",
    "column_filters": {
      "columna_categoria": ["valor1"]
    }
  },
  "chart_hint": {
    "type": "line|bar|pie|none",
    "x_column": "nombre o null",
    "y_column": "nombre o null"
  }
}
"""

EXPLAIN_RESULTS_PROMPT = """Eres ABI, un asistente amigable de analítica de datos.

El usuario hizo una pregunta y ya ejecutaste una consulta SQL. Tu trabajo es explicar el resultado de forma clara y útil.

Estilo de respuesta:
- Cálido, natural y fácil de entender (como hablar con un colega, no un informe técnico).
- 4-6 oraciones organizadas así:
  1) Qué preguntó el usuario (breve).
  2) Hallazgo principal con números concretos del resultado.
  3) Qué significa o por qué importa ese dato.
  4) Si hay gráfico, indica qué puede ver en él.
- Usa párrafos cortos. Puedes usar viñetas con "•" si ayuda a clarificar 2-3 puntos.
- No repitas la consulta SQL salvo que sea esencial.
- Responde en el mismo idioma que la pregunta del usuario.

Sugerencias de seguimiento:
- Propón exactamente 3 preguntas cortas (máx. 90 caracteres) que el usuario podría hacer a continuación.
- Deben ser relevantes al resultado actual y explorar el dataset más a fondo.

Responde SOLO con JSON válido:
{
  "answer": "Texto completo para mostrar al usuario",
  "follow_up_suggestions": ["sugerencia 1", "sugerencia 2", "sugerencia 3"]
}
"""

ENRICH_ANSWER_PROMPT = """Eres ABI, un asistente amigable de analítica de datos.

Reescribe el borrador de respuesta para el usuario final. El borrador puede ser técnico o escueto; tú lo haces claro y útil.

Estilo:
- Cálido, natural y fácil de entender.
- 4-6 oraciones: contexto breve + hallazgo o acción realizada + qué puede hacer el usuario ahora.
- Si se incluyeron gráficos, describe qué muestran de forma sencilla.
- No inventes datos que no estén en el borrador.
- Responde en el mismo idioma que la pregunta del usuario.

Sugerencias de seguimiento:
- 3 preguntas cortas (máx. 90 caracteres) para continuar explorando el dataset.

Responde SOLO con JSON válido:
{
  "answer": "Texto completo para mostrar al usuario",
  "follow_up_suggestions": ["sugerencia 1", "sugerencia 2", "sugerencia 3"]
}
"""

from app.ai.chart_helpers import MAX_CHAT_CHARTS


def build_schema_context(
    dataset_name: str,
    columns: list[dict],
    sample_rows: list[dict],
    analytics_summary: dict | None = None,
    row_count: int | None = None,
    date_column: str | None = None,
    date_range: dict | None = None,
) -> str:
    lines = [f"Dataset: {dataset_name}"]
    if row_count is not None:
        lines.append(f"Total de filas: {row_count}")
    if date_column:
        range_text = ""
        if date_range:
            range_text = f" (rango: {date_range.get('min')} — {date_range.get('max')})"
        lines.append(f"Columna de fecha principal: {date_column}{range_text}")

    lines.extend(["", "Columnas:"])
    for col in columns:
        samples = col.get("sample_values") or []
        sample_text = ", ".join(str(v) for v in samples[:3]) if samples else "—"
        lines.append(
            f"- {col['name']} ({col['inferred_type']}): "
            f"{col.get('null_count', 0)} nulos. Muestras: {sample_text}"
        )

    if analytics_summary:
        lines.extend(["", "Perfil analítico (métricas por columna):"])
        summary = analytics_summary.get("summary", {})
        if summary:
            lines.append(
                f"- Resumen: {summary.get('row_count', '?')} filas, "
                f"{summary.get('column_count', '?')} columnas"
            )
        for col in analytics_summary.get("columns", []):
            metrics = col.get("metrics", {})
            if metrics:
                col_type = col.get("type", "unknown")
                lines.append(f"- {col['name']} ({col_type}): {metrics}")
                top_values = metrics.get("top_values") if isinstance(metrics, dict) else None
                if top_values and col_type in {"categorical", "boolean"}:
                    values_text = ", ".join(
                        f"\"{item.get('value')}\" ({item.get('count', '?')})"
                        for item in top_values[:10]
                        if item.get("value") is not None
                    )
                    if values_text:
                        lines.append(
                            f"  → Valores para column_filters: {values_text}"
                        )

    lines.extend(["", "Filas de ejemplo (máx. 5):"])
    for row in sample_rows[:5]:
        lines.append(str(row))

    lines.append("")
    lines.append(
        "Filtros avanzados: usa column_filters (valores exactos) y date_from/date_to en build_chart."
    )
    lines.append("Tabla DuckDB: `data` (usa FROM data en tus consultas).")
    return "\n".join(lines)


def build_charts_catalog(widgets: list[dict]) -> str:
    if not widgets:
        return "Catálogo de gráficos: (ninguno generado automáticamente para este dataset)."

    lines = [
        "Catálogo de gráficos disponibles (usa widget_ids exactos para show_charts):",
        "",
    ]
    for widget in widgets[:MAX_CHAT_CHARTS]:
        config = widget.get("config", {})
        config_parts = ", ".join(
            f"{k}={v}"
            for k, v in config.items()
            if v and k not in {"filter_summary", "date_filter_summary", "x_label", "y_label"}
        )
        filter_summary = config.get("filter_summary")
        date_summary = config.get("date_filter_summary")
        extras: list[str] = []
        if filter_summary:
            extras.append(f'filters="{filter_summary}"')
        if date_summary:
            extras.append(f'dates="{date_summary}"')
        extra_text = f" | {' | '.join(extras)}" if extras else ""
        lines.append(
            f"- id=\"{widget['id']}\" | type={widget['type']} | "
            f"title=\"{widget['title']}\" | {config_parts}{extra_text}"
        )
    return "\n".join(lines)
