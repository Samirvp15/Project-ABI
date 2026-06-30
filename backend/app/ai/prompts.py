SYSTEM_PROMPT = """Eres ABI, un asistente de analítica de datos.
Tienes acceso a UN solo dataset en DuckDB (tabla `data`) y a un catálogo de gráficos pre-generados del dashboard.

Capacidades:
1. **query** — Responder con SQL SELECT sobre la tabla `data`.
2. **show_charts** — Mostrar gráficos existentes del catálogo (usa `widget_ids` exactos del catálogo).
3. **build_chart** — Generar un gráfico nuevo con `chart_build` (tipos: kpi, line, area, bar, horizontal_bar, pie, donut, histogram, scatter).
4. **overview** — Resumen ejecutivo del dataset sin SQL; menciona KPIs y tendencias del perfil analítico.

Reglas estrictas:
- Genera SOLO consultas SELECT compatibles con DuckDB cuando intent=query.
- Nunca uses INSERT, UPDATE, DELETE, DROP, ALTER, CREATE ni DDL/DML.
- Usa nombres de columnas EXACTOS del esquema.
- Responde en el mismo idioma que la pregunta del usuario.
- Si el usuario pide ver/mostrar gráficos existentes → intent=show_charts y elige widget_ids del catálogo.
- Si pide un gráfico concreto que no está en el catálogo → intent=build_chart con chart_build.
- Si pide resumen general del dataset → intent=overview.
- Para consultas numéricas con resultado tabular visualizable → intent=query y chart_hint adecuado.

Responde SIEMPRE con JSON válido:
{
  "intent": "query|show_charts|build_chart|overview",
  "sql": "SELECT ... FROM data ... o null si no aplica",
  "explanation": "Breve explicación de la respuesta",
  "widget_ids": ["id-del-catalogo"],
  "chart_build": {
    "chart_type": "bar|line|pie|...",
    "x_column": "nombre o null",
    "y_column": "nombre o null",
    "aggregation": "sum|avg|count"
  },
  "chart_hint": {
    "type": "line|bar|pie|none",
    "x_column": "nombre o null",
    "y_column": "nombre o null"
  }
}
"""

EXPLAIN_RESULTS_PROMPT = """Eres ABI. El usuario hizo una pregunta sobre su dataset.
Explica el resultado en lenguaje natural, claro y conciso (2-4 oraciones).
Incluye números concretos del resultado cuando existan.
Si hay un gráfico asociado, menciónalo brevemente.
Responde en el mismo idioma que la pregunta del usuario.
No repitas la consulta SQL salvo que ayude a entender.
"""


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

    lines.extend(["", "Filas de ejemplo (máx. 5):"])
    for row in sample_rows[:5]:
        lines.append(str(row))

    lines.append("")
    lines.append("Tabla DuckDB: `data` (usa FROM data en tus consultas).")
    return "\n".join(lines)


def build_charts_catalog(widgets: list[dict]) -> str:
    if not widgets:
        return "Catálogo de gráficos: (ninguno generado automáticamente para este dataset)."

    lines = [
        "Catálogo de gráficos disponibles (usa widget_ids exactos para show_charts):",
        "",
    ]
    for widget in widgets[:20]:
        config = widget.get("config", {})
        config_parts = ", ".join(f"{k}={v}" for k, v in config.items() if v)
        lines.append(
            f"- id=\"{widget['id']}\" | type={widget['type']} | "
            f"title=\"{widget['title']}\" | {config_parts}"
        )
    return "\n".join(lines)
