"""add chart columns to chat_messages

Revision ID: 005
Revises: 004
Create Date: 2026-06-30

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "chat_messages",
        sa.Column("chart_hint_json", postgresql.JSONB(), nullable=True),
    )
    op.add_column(
        "chat_messages",
        sa.Column("charts_json", postgresql.JSONB(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("chat_messages", "charts_json")
    op.drop_column("chat_messages", "chart_hint_json")
