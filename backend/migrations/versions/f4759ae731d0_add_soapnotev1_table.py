"""Add SOAPNoteV1 table

Revision ID: f4759ae731d0
Revises: a3f2aab691f6
Create Date: 2026-04-29 13:13:13.960458

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f4759ae731d0'
down_revision: Union[str, None] = 'a3f2aab691f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('soap_notes_v1',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('soap_note', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('transcript_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['transcript_id'], ['transcripts.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_soap_notes_v1_id'), 'soap_notes_v1', ['id'], unique=False)
    # NOTE: api_call_logs is already created by an earlier migration — the
    # duplicate create_table() that used to be here has been removed.


def downgrade() -> None:
    op.drop_index(op.f('ix_soap_notes_v1_id'), table_name='soap_notes_v1')
    op.drop_table('soap_notes_v1')
