"""add suggestions_json to chat_messages

Revision ID: 006
Revises: 005
Create Date: 2026-06-30

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "chat_messages",
        sa.Column("suggestions_json", postgresql.JSONB(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("chat_messages", "suggestions_json")
