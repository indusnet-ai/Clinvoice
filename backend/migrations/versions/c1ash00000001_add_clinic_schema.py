"""Add full clinic schema (user voice/signature columns, hospitals, doctors, doctor_slots, patients, opds, opd_case_sheets, password_reset_tokens)

Revision ID: c1ash00000001
Revises: f4759ae731d0
Create Date: 2026-06-06 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c1ash00000001'
down_revision: Union[str, None] = 'f4759ae731d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---- Extend users ----
    with op.batch_alter_table('users') as batch:
        batch.add_column(sa.Column('role', sa.String(), server_default='doctor'))
        batch.add_column(sa.Column('is_active', sa.Boolean(), server_default=sa.true()))
        batch.add_column(sa.Column('is_reset_needed', sa.Boolean(), server_default=sa.false()))
        batch.add_column(sa.Column('voice_address', sa.String()))
        batch.add_column(sa.Column('voice_duration', sa.Float()))
        batch.add_column(sa.Column('voice_preview', sa.Text()))
        batch.add_column(sa.Column('signature_url', sa.String()))
        batch.add_column(sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()))
        batch.add_column(sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()))

    # ---- password_reset_tokens ----
    op.create_table(
        'password_reset_tokens',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('token', sa.String(), unique=True, index=True),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('used', sa.Boolean(), server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # ---- hospitals ----
    op.create_table(
        'hospitals',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), unique=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('logo', sa.String()),
        sa.Column('type', sa.Integer()),
        sa.Column('year_of_establishment', sa.String()),
        sa.Column('email', sa.String()),
        sa.Column('primary_mobile_no_country_code', sa.String()),
        sa.Column('primary_mobile_no', sa.String()),
        sa.Column('secondary_mobile_no_country_code', sa.String()),
        sa.Column('secondary_mobile_no', sa.String()),
        sa.Column('licence_number', sa.String()),
        sa.Column('certificate', sa.String()),
        sa.Column('website_url', sa.String()),
        sa.Column('address', sa.String()),
        sa.Column('country', sa.String()),
        sa.Column('state', sa.String()),
        sa.Column('district', sa.String()),
        sa.Column('pincode', sa.String()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # ---- doctors ----
    op.create_table(
        'doctors',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), index=True),
        sa.Column('hospital_id', sa.Integer(), sa.ForeignKey('hospitals.id'), index=True),
        sa.Column('image', sa.String()),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('gender', sa.String()),
        sa.Column('dob', sa.String()),
        sa.Column('email', sa.String()),
        sa.Column('primary_mobile_no_country_code', sa.String()),
        sa.Column('primary_mobile_no', sa.String()),
        sa.Column('secondary_mobile_no_country_code', sa.String()),
        sa.Column('secondary_mobile_no', sa.String()),
        sa.Column('graduation', sa.String()),
        sa.Column('specialisation', sa.String()),
        sa.Column('mrn', sa.String()),
        sa.Column('registration_council', sa.String()),
        sa.Column('registration_at', sa.String()),
        sa.Column('experience', sa.String()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # ---- doctor_slots ----
    op.create_table(
        'doctor_slots',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('hospital_id', sa.Integer(), sa.ForeignKey('hospitals.id')),
        sa.Column('doctor_id', sa.Integer(), sa.ForeignKey('doctors.id')),
        sa.Column('start_time', sa.String(), nullable=False),
        sa.Column('end_time', sa.String(), nullable=False),
        sa.Column('duration', sa.Integer()),
        sa.Column('weekday', sa.Integer()),
        sa.Column('is_active', sa.Boolean(), server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # ---- patients ----
    op.create_table(
        'patients',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), index=True),
        sa.Column('hospital_id', sa.Integer(), sa.ForeignKey('hospitals.id')),
        sa.Column('image', sa.String()),
        sa.Column('salutation', sa.String()),
        sa.Column('patient_name', sa.String(), nullable=False),
        sa.Column('gender', sa.String()),
        sa.Column('dob', sa.String()),
        sa.Column('age', sa.String()),
        sa.Column('blood_group', sa.String()),
        sa.Column('country_code', sa.String()),
        sa.Column('mobile_no', sa.String(), index=True),
        sa.Column('email', sa.String()),
        sa.Column('address', sa.String()),
        sa.Column('status', sa.String(), server_default='active'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # ---- opds ----
    op.create_table(
        'opds',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), index=True),
        sa.Column('hospital_id', sa.Integer(), sa.ForeignKey('hospitals.id'), index=True),
        sa.Column('patient_id', sa.Integer(), sa.ForeignKey('patients.id'), index=True),
        sa.Column('doctor_id', sa.Integer(), sa.ForeignKey('doctors.id')),
        sa.Column('slot_id', sa.Integer(), sa.ForeignKey('doctor_slots.id')),
        sa.Column('date', sa.String()),
        sa.Column('time', sa.String()),
        sa.Column('slot_start_time', sa.String()),
        sa.Column('slot_end_time', sa.String()),
        sa.Column('priority', sa.String()),
        sa.Column('specialist', sa.String()),
        sa.Column('amount', sa.String()),
        sa.Column('message', sa.Text()),
        sa.Column('opd_status', sa.String(), server_default='pending'),
        sa.Column('source', sa.String()),
        sa.Column('live_consult', sa.String()),
        sa.Column('cancellation_reason', sa.String()),
        sa.Column('opd_status_id', sa.String()),
        sa.Column('is_token_verified', sa.Boolean(), server_default=sa.false()),
        sa.Column('is_consultation_closed', sa.Boolean(), server_default=sa.false()),
        sa.Column('module', sa.String(), server_default='opd'),
        sa.Column('aswin_transaction_id', sa.String()),
        sa.Column('token', sa.String()),
        sa.Column('status', sa.String(), server_default='active'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # ---- opd_case_sheets ----
    op.create_table(
        'opd_case_sheets',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('opd_id', sa.Integer(), sa.ForeignKey('opds.id'), unique=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('hospital_id', sa.Integer(), sa.ForeignKey('hospitals.id')),
        sa.Column('doctor_id', sa.Integer(), sa.ForeignKey('doctors.id')),
        sa.Column('patient_id', sa.Integer(), sa.ForeignKey('patients.id')),
        sa.Column('sheet_type', sa.String(), server_default='medical'),
        sa.Column('payload', postgresql.JSONB()),
        sa.Column('aswin_transaction_id', sa.String()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('opd_case_sheets')
    op.drop_table('opds')
    op.drop_table('patients')
    op.drop_table('doctor_slots')
    op.drop_table('doctors')
    op.drop_table('hospitals')
    op.drop_table('password_reset_tokens')
    with op.batch_alter_table('users') as batch:
        for col in [
            'updated_at', 'created_at', 'signature_url', 'voice_preview',
            'voice_duration', 'voice_address', 'is_reset_needed', 'is_active', 'role'
        ]:
            batch.drop_column(col)
