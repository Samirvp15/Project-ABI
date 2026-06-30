import uuid



import pandas as pd

from fastapi import HTTPException, status

from sqlalchemy.ext.asyncio import AsyncSession



from app.ai.chart_helpers import (
    MAX_CHAT_CHARTS,
    build_widget_from_sql_result,
    build_widgets_from_specs,
    match_widgets_by_message,
    normalize_chart_builds,
    pick_overview_widgets,
    resolve_widgets_by_ids,
)

from app.ai.openai_client import (
    AIServiceError,
    OpenAIClient,
    build_charts_catalog_from_widgets,
    build_schema_context_from_dataset,
    normalize_suggestions,
)

from app.core.config import settings

from app.data_engine.dashboard_engine import build_dashboard

from app.data_engine.duckdb_engine import SQLExecutionError, SQLValidationError, execute_select

from app.models.user import User

from app.repositories.analytics_repository import AnalyticsRepository

from app.repositories.chat_repository import ChatRepository

from app.repositories.dataset_repository import DatasetRepository

from app.schemas.ai import ChartHint, ChatMessageItem, ChatResponse, ChatSessionItem

from app.schemas.dashboard import DashboardWidget





class AIService:

    def __init__(self, db: AsyncSession) -> None:

        self.db = db

        self.dataset_repo = DatasetRepository(db)

        self.analytics_repo = AnalyticsRepository(db)

        self.chat_repo = ChatRepository(db)



    async def _get_ready_dataset(self, user_id: uuid.UUID, dataset_id: uuid.UUID):

        dataset = await self.dataset_repo.get_by_id(dataset_id, user_id)

        if not dataset:

            raise HTTPException(

                status_code=status.HTTP_404_NOT_FOUND,

                detail={"code": "DATASET_NOT_FOUND", "message": "Dataset not found"},

            )

        if dataset.status != "ready":

            raise HTTPException(

                status_code=status.HTTP_400_BAD_REQUEST,

                detail={

                    "code": "DATASET_NOT_READY",

                    "message": "El dataset debe estar listo para usar el chat",

                },

            )

        return dataset



    async def _check_rate_limit(self, user_id: uuid.UUID) -> None:

        count = await self.chat_repo.count_user_messages_last_hour(user_id)

        if count >= settings.ai_rate_limit_per_hour:

            raise HTTPException(

                status_code=status.HTTP_429_TOO_MANY_REQUESTS,

                detail={

                    "code": "RATE_LIMIT_EXCEEDED",

                    "message": f"Límite de {settings.ai_rate_limit_per_hour} consultas por hora alcanzado",

                },

            )



    def _parse_chart_hint(self, raw: dict | None) -> ChartHint:

        chart_hint_raw = raw or {}

        return ChartHint(

            type=chart_hint_raw.get("type", "none"),

            x_column=chart_hint_raw.get("x_column"),

            y_column=chart_hint_raw.get("y_column"),

        )



    def _widgets_from_dicts(self, widgets: list[dict]) -> list[DashboardWidget]:

        return [DashboardWidget(**widget) for widget in widgets]



    async def chat(

        self,

        user: User,

        dataset_id: uuid.UUID,

        message: str,

        session_id: uuid.UUID | None = None,

    ) -> ChatResponse:

        if not settings.openai_api_key:

            raise HTTPException(

                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,

                detail={

                    "code": "AI_UNAVAILABLE",

                    "message": "El asistente IA no está configurado (falta OPENAI_API_KEY)",

                },

            )



        await self._check_rate_limit(user.id)

        dataset = await self._get_ready_dataset(user.id, dataset_id)



        if session_id:

            session = await self.chat_repo.get_session(session_id, user.id)

            if not session or session.dataset_id != dataset_id:

                raise HTTPException(

                    status_code=status.HTTP_404_NOT_FOUND,

                    detail={"code": "SESSION_NOT_FOUND", "message": "Sesión no encontrada"},

                )

        else:

            session = await self.chat_repo.create_session(user.id, dataset_id)



        await self.chat_repo.add_message(session.id, "user", message)



        history = [

            {"role": m.role, "content": m.content}

            for m in await self.chat_repo.get_messages(session.id)

            if m.role in {"user", "assistant"}

        ][:-1]



        rows = await self.analytics_repo.get_all_rows(dataset_id)

        sample_rows = rows[:5]

        cache = await self.analytics_repo.get_cache(dataset_id)

        analytics_profile = cache.profile_json if cache else None



        columns_meta = [

            {

                "name": col.name,

                "inferred_type": col.inferred_type,

                "null_count": col.null_count,

            }

            for col in sorted(dataset.columns, key=lambda c: c.position)

        ]



        dashboard_payload = build_dashboard(columns_meta, rows)

        all_widgets = dashboard_payload.get("widgets", [])

        date_column = dashboard_payload.get("date_column")

        date_range = dashboard_payload.get("date_range")

        row_count = dashboard_payload.get("summary", {}).get("row_count", len(rows))



        schema_context = build_schema_context_from_dataset(

            dataset.name,

            dataset.columns,

            sample_rows,

            analytics_profile,

            row_count=row_count,

            date_column=date_column,

            date_range=date_range,

        )

        charts_catalog = build_charts_catalog_from_widgets(all_widgets)



        total_tokens = 0

        try:

            client = OpenAIClient()

            plan, tokens1 = client.generate_chat_plan(

                schema_context, charts_catalog, message, history

            )

            total_tokens += tokens1

        except AIServiceError as exc:

            raise HTTPException(

                status_code=status.HTTP_502_BAD_GATEWAY,

                detail={"code": "AI_ERROR", "message": str(exc)},

            ) from exc



        intent = str(plan.get("intent") or "query").lower()

        chart_hint = self._parse_chart_hint(plan.get("chart_hint"))

        chart_widgets: list[dict] = []

        sql: str | None = str(plan.get("sql") or "").strip() or None

        result: list[dict] = []

        answer = str(plan.get("explanation") or "Consulta procesada.")

        suggestions: list[str] = normalize_suggestions(plan.get("follow_up_suggestions"))

        used_query_explain = False

        if intent == "show_charts":

            sql = None

            widget_ids = plan.get("widget_ids") or []

            chart_widgets = resolve_widgets_by_ids(widget_ids, all_widgets)

            if not chart_widgets:

                chart_widgets = match_widgets_by_message(message, all_widgets)

            if not chart_widgets and all_widgets:

                chart_widgets = pick_overview_widgets(all_widgets, limit=MAX_CHAT_CHARTS)

            if chart_widgets:

                answer = answer or "Estos son los gráficos disponibles para tu consulta:"

            else:

                answer = (

                    "No encontré gráficos que coincidan con tu solicitud. "

                    "Puedes pedirme que genere uno nuevo, por ejemplo: "

                    "'gráfico de barras de ventas por categoría'."

                )



        elif intent == "build_chart":

            sql = None

            builds = normalize_chart_builds(plan)

            chart_widgets, build_errors = build_widgets_from_specs(columns_meta, rows, builds)

            if chart_widgets:

                if build_errors:

                    answer = f"{answer} (Se omitieron {len(build_errors)} gráfico(s) por configuración inválida.)"

            elif build_errors:

                answer = f"No pude generar los gráficos solicitados: {'; '.join(build_errors[:3])}"



        elif intent == "overview":

            sql = None

            chart_widgets = pick_overview_widgets(all_widgets, limit=MAX_CHAT_CHARTS)

            if not answer or answer == "Consulta procesada.":

                profile_note = ""

                if analytics_profile and analytics_profile.get("summary"):

                    s = analytics_profile["summary"]

                    profile_note = (

                        f" El dataset tiene {s.get('row_count', row_count)} filas "

                        f"y {s.get('column_count', len(columns_meta))} columnas."

                    )

                answer = f"Resumen del dataset {dataset.name}:{profile_note} {answer}"



        elif sql:

            try:

                result = execute_select(

                    pd.DataFrame(rows),

                    sql,

                    limit=settings.ai_sql_result_limit,

                )

                query_widget = build_widget_from_sql_result(result, chart_hint)

                if query_widget:

                    chart_widgets = [query_widget]

                explain, explain_suggestions, tokens2 = client.explain_results(

                    message, sql, result, has_chart=bool(chart_widgets), dataset_name=dataset.name

                )

                total_tokens += tokens2

                answer = explain

                suggestions = explain_suggestions or suggestions

                used_query_explain = True

            except (SQLValidationError, SQLExecutionError) as exc:

                answer = (

                    f"No pude ejecutar la consulta generada de forma segura: {exc}. "

                    "Intenta reformular tu pregunta."

                )

                sql = None

                result = []

                chart_hint = ChartHint(type="none")

                chart_widgets = []



        if not used_query_explain:

            enriched, enriched_suggestions, tokens3 = client.enrich_answer(

                message,

                intent,

                answer,

                dataset.name,

                [str(w.get("title", "")) for w in chart_widgets],

                plan_suggestions=suggestions,

            )

            total_tokens += tokens3

            answer = enriched

            suggestions = enriched_suggestions or suggestions



        chart_hint_payload = chart_hint.model_dump() if chart_hint.type != "none" else None

        charts_payload = chart_widgets or None

        dashboard_charts = self._widgets_from_dicts(chart_widgets) if chart_widgets else None



        await self.chat_repo.add_message(

            session.id,

            "assistant",

            answer,

            sql_generated=sql,

            result_json=result or None,

            chart_hint_json=chart_hint_payload,

            charts_json=charts_payload,

            suggestions_json=suggestions or None,

            tokens_used=total_tokens,

        )



        return ChatResponse(

            session_id=str(session.id),

            answer=answer,

            sql=sql,

            result=result or None,

            chart_hint=chart_hint if chart_hint.type != "none" else None,

            charts=dashboard_charts,

            suggestions=suggestions or None,

            tokens_used=total_tokens,

        )



    async def list_sessions(self, user: User, dataset_id: uuid.UUID) -> list[ChatSessionItem]:

        await self._get_ready_dataset(user.id, dataset_id)

        sessions = await self.chat_repo.list_sessions(user.id, dataset_id)

        items: list[ChatSessionItem] = []

        for session in sessions:

            messages = await self.chat_repo.get_messages(session.id)

            items.append(

                ChatSessionItem(

                    id=str(session.id),

                    dataset_id=str(session.dataset_id),

                    created_at=session.created_at,

                    updated_at=session.updated_at,

                    message_count=len(messages),

                )

            )

        return items



    async def get_messages(self, user: User, session_id: uuid.UUID) -> list[ChatMessageItem]:

        session = await self.chat_repo.get_session(session_id, user.id)

        if not session:

            raise HTTPException(

                status_code=status.HTTP_404_NOT_FOUND,

                detail={"code": "SESSION_NOT_FOUND", "message": "Sesión no encontrada"},

            )

        messages = await self.chat_repo.get_messages(session_id)

        items: list[ChatMessageItem] = []

        for m in messages:

            chart_hint = None

            if m.chart_hint_json:

                chart_hint = ChartHint(**m.chart_hint_json)

            charts = None

            if m.charts_json:

                charts = [DashboardWidget(**widget) for widget in m.charts_json]

            items.append(

                ChatMessageItem(

                    id=str(m.id),

                    role=m.role,

                    content=m.content,

                    sql_generated=m.sql_generated,

                    result_json=m.result_json,

                    chart_hint=chart_hint,

                    charts=charts,

                    suggestions=m.suggestions_json,

                    tokens_used=m.tokens_used,

                    created_at=m.created_at,

                )

            )

        return items

