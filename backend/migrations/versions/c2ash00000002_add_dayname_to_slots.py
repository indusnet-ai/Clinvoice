"""Add dayname / status columns to doctor_slots and widen duration to text.

Revision ID: c2ash00000002
Revises: c1ash00000001
Create Date: 2026-06-15 20:50:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c2ash00000002'
down_revision: Union[str, None] = 'c1ash00000001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('doctor_slots') as batch:
        batch.add_column(sa.Column('dayname', sa.String(), nullable=True))
        batch.add_column(sa.Column('status', sa.String(), nullable=True))
        # Widen duration int -> string (frontend sends "30 Minutes")
        batch.alter_column('duration', type_=sa.String(), existing_type=sa.Integer(), postgresql_using='duration::text')


def downgrade() -> None:
    with op.batch_alter_table('doctor_slots') as batch:
        batch.alter_column('duration', type_=sa.Integer(), existing_type=sa.String(), postgresql_using='NULLIF(regexp_replace(duration, \'\\D\', \'\', \'g\'), \'\')::integer')
        batch.drop_column('status')
        batch.drop_column('dayname')
