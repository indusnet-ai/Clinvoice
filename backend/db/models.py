"""
SQLAlchemy models for ClinVoice AI.

Column names deliberately match the JSON shapes the React frontend already
uses (licence_number, specialisation, mobile_no, primary_mobile_no_country_code,
patient_name, dob, registration_at, etc.) — do not rename them.
"""
from sqlalchemy import (
    Column, String, Integer, ForeignKey, DateTime, DECIMAL, Boolean, Date, Text, Float
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects import postgresql
import datetime

from db.database import Base


# ============================================================================
# Identity & Auth
# ============================================================================

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)  # bcrypt hash
    role = Column(String, default="doctor")
    is_active = Column(Boolean, default=True)
    is_reset_needed = Column(Boolean, default=False)

    voice_address = Column(String, nullable=True)       # /uploads/voice/...
    voice_duration = Column(Float, nullable=True)
    voice_preview = Column(Text, nullable=True)
    signature_url = Column(String, nullable=True)       # /uploads/signatures/...

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    api_keys = relationship("APIKey", back_populates="user")
    usage_logs = relationship("UsageLog", back_populates="user")
    api_call_logs = relationship("APICallLog", back_populates="user")


class APIKey(Base):
    __tablename__ = 'api_keys'

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))

    user = relationship("User", back_populates="api_keys")
    usage_logs = relationship("UsageLog", back_populates="api_key")
    api_call_logs = relationship("APICallLog", back_populates="api_key")


class PasswordResetToken(Base):
    __tablename__ = 'password_reset_tokens'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    token = Column(String, unique=True, index=True)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# ============================================================================
# Hospital + Doctor + Doctor Slot
# ============================================================================

class Hospital(Base):
    __tablename__ = 'hospitals'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True)

    name = Column(String, nullable=False)
    logo = Column(String, nullable=True)
    type = Column(Integer, nullable=True)          # hospital_type as int
    year_of_establishment = Column(String, nullable=True)
    email = Column(String, nullable=True)

    primary_mobile_no_country_code = Column(String, nullable=True)
    primary_mobile_no = Column(String, nullable=True)
    secondary_mobile_no_country_code = Column(String, nullable=True)
    secondary_mobile_no = Column(String, nullable=True)

    licence_number = Column(String, nullable=True)
    certificate = Column(String, nullable=True)

    website_url = Column(String, nullable=True)
    address = Column(String, nullable=True)
    country = Column(String, nullable=True)
    state = Column(String, nullable=True)
    district = Column(String, nullable=True)
    pincode = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Doctor(Base):
    __tablename__ = 'doctors'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    hospital_id = Column(Integer, ForeignKey('hospitals.id'), index=True, nullable=True)

    image = Column(String, nullable=True)
    name = Column(String, nullable=False)
    gender = Column(String, nullable=True)
    dob = Column(String, nullable=True)
    email = Column(String, nullable=True)

    primary_mobile_no_country_code = Column(String, nullable=True)
    primary_mobile_no = Column(String, nullable=True)
    secondary_mobile_no_country_code = Column(String, nullable=True)
    secondary_mobile_no = Column(String, nullable=True)

    graduation = Column(String, nullable=True)
    specialisation = Column(String, nullable=True)
    mrn = Column(String, nullable=True)
    registration_council = Column(String, nullable=True)
    registration_at = Column(String, nullable=True)
    experience = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class DoctorSlot(Base):
    __tablename__ = 'doctor_slots'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    hospital_id = Column(Integer, ForeignKey('hospitals.id'), index=True)
    doctor_id = Column(Integer, ForeignKey('doctors.id'), index=True)

    start_time = Column(String, nullable=False)   # "09:00" or "09:00:00"
    end_time = Column(String, nullable=False)
    duration = Column(String, nullable=True)      # frontend sends "30 Minutes" as string
    dayname = Column(String, nullable=True)       # "monday".."sunday"
    weekday = Column(Integer, nullable=True)      # legacy
    status = Column(String, nullable=True)        # frontend sends "1"

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


# ============================================================================
# Patient + OPD
# ============================================================================

class Patient(Base):
    __tablename__ = 'patients'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    hospital_id = Column(Integer, ForeignKey('hospitals.id'), index=True, nullable=True)

    image = Column(String, nullable=True)
    salutation = Column(String, nullable=True)
    patient_name = Column(String, nullable=False, index=True)
    gender = Column(String, nullable=True)
    dob = Column(String, nullable=True)
    age = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)

    country_code = Column(String, nullable=True)
    mobile_no = Column(String, nullable=True, index=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)

    status = Column(String, default="active")  # active, deleted
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class OPD(Base):
    """Out-patient appointment / visit."""
    __tablename__ = 'opds'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    hospital_id = Column(Integer, ForeignKey('hospitals.id'), index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), index=True)
    doctor_id = Column(Integer, ForeignKey('doctors.id'), nullable=True)
    slot_id = Column(Integer, ForeignKey('doctor_slots.id'), nullable=True)

    date = Column(String, nullable=True)              # "YYYY-MM-DD"
    time = Column(String, nullable=True)              # "HH:MM"
    slot_start_time = Column(String, nullable=True)
    slot_end_time = Column(String, nullable=True)

    priority = Column(String, nullable=True)          # "normal" / "urgent"
    specialist = Column(String, nullable=True)
    amount = Column(String, nullable=True)
    message = Column(Text, nullable=True)
    opd_status = Column(String, default="pending")    # pending, in_progress, completed, cancelled, paused
    source = Column(String, nullable=True)            # walk-in / online
    live_consult = Column(String, nullable=True)
    cancellation_reason = Column(String, nullable=True)
    opd_status_id = Column(String, nullable=True)
    is_token_verified = Column(Boolean, default=False)
    is_consultation_closed = Column(Boolean, default=False)
    module = Column(String, default="opd")            # opd / ipd / dental
    clinvoice_transaction_id = Column(String, nullable=True)  # clinvoice transcript_id
    token = Column(String, nullable=True)

    status = Column(String, default="active")         # active / deleted
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class OPDCaseSheet(Base):
    """Doctor's case sheet attached to an OPD visit (medical / dental / manual)."""
    __tablename__ = 'opd_case_sheets'

    id = Column(Integer, primary_key=True, index=True)
    opd_id = Column(Integer, ForeignKey('opds.id'), unique=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    hospital_id = Column(Integer, ForeignKey('hospitals.id'))
    doctor_id = Column(Integer, ForeignKey('doctors.id'), nullable=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=True)

    # JSON payload — frontend builds the structure (medical vs dental vs manual)
    sheet_type = Column(String, default="medical")   # medical / dental / manual
    payload = Column(postgresql.JSONB, nullable=True)
    clinvoice_transaction_id = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


# ============================================================================
# Core voice-to-EMR domain
# ============================================================================

class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    transcript_id = Column(String, unique=True, index=True)
    transcript = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    soap_notes = relationship("SOAPNote", back_populates="transcript")
    medical_reports_v1 = relationship("MedicalReportV1", back_populates="transcript")
    medical_reports = relationship("MedicalReport", back_populates="transcript")
    dental_medical_reports = relationship("DentalMedicalReport", back_populates="transcript")
    icd_codes = relationship("ICDCode", back_populates="transcript")
    snomed_ct_codes = relationship("SnomedCTCode", back_populates="transcript")
    fhir_bundles = relationship("FHIRBundle", back_populates="transcript")
    soap_notes_v1 = relationship("SOAPNoteV1", back_populates="transcript")


class SOAPNote(Base):
    __tablename__ = 'soap_notes'
    id = Column(Integer, primary_key=True, index=True)
    soap_note = Column(String)
    transcript_id = Column(Integer, ForeignKey('transcripts.id'))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    transcript = relationship("Transcript", back_populates="soap_notes")


class SOAPNoteV1(Base):
    __tablename__ = 'soap_notes_v1'
    id = Column(Integer, primary_key=True, index=True)
    soap_note = Column(postgresql.JSONB)
    transcript_id = Column(Integer, ForeignKey('transcripts.id'))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    transcript = relationship("Transcript", back_populates="soap_notes_v1")


class MedicalReportV1(Base):
    __tablename__ = 'medical_reports_v1'
    id = Column(Integer, primary_key=True, index=True)
    medical_report = Column(String)
    transcript_id = Column(Integer, ForeignKey('transcripts.id'))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    transcript = relationship("Transcript", back_populates="medical_reports_v1")


class MedicalReport(Base):
    __tablename__ = 'medical_reports'
    id = Column(Integer, primary_key=True, index=True)
    medical_report = Column(String)
    transcript_id = Column(Integer, ForeignKey('transcripts.id'))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    transcript = relationship("Transcript", back_populates="medical_reports")


class DentalMedicalReport(Base):
    __tablename__ = 'dental_medical_reports'
    id = Column(Integer, primary_key=True, index=True)
    dental_medical_report = Column(String)
    transcript_id = Column(Integer, ForeignKey('transcripts.id'))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    transcript = relationship("Transcript", back_populates="dental_medical_reports")


class ICDCode(Base):
    __tablename__ = 'icd_codes'
    id = Column(Integer, primary_key=True, index=True)
    icd_code = Column(String)
    transcript_id = Column(Integer, ForeignKey('transcripts.id'))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    transcript = relationship("Transcript", back_populates="icd_codes")


class SnomedCTCode(Base):
    __tablename__ = 'snomed_ct_codes'
    id = Column(Integer, primary_key=True, index=True)
    snomed_ct = Column(String)
    transcript_id = Column(Integer, ForeignKey('transcripts.id'))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    transcript = relationship("Transcript", back_populates="snomed_ct_codes")


class FHIRBundle(Base):
    __tablename__ = 'fhir_bundles'
    id = Column(Integer, primary_key=True, index=True)
    fhir_bundle = Column(postgresql.JSONB)
    transcript_id = Column(Integer, ForeignKey('transcripts.id'))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    transcript = relationship("Transcript", back_populates="fhir_bundles")


# ============================================================================
# NRCES FHIR Bundle Tables (unchanged)
# ============================================================================

def _bundle_table(name):
    """Tiny factory so the six near-identical bundle classes below stay readable."""
    pass  # placeholder doc


class WellnessBundle(Base):
    __tablename__ = 'wellness_bundles'
    id = Column(Integer, primary_key=True, index=True)
    bundle_id = Column(String, unique=True, index=True)
    bundle_data = Column(postgresql.JSONB)
    api_key_id = Column(Integer, ForeignKey('api_keys.id'), nullable=True)
    transcript_id = Column(Integer, ForeignKey('transcripts.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    transcript = relationship("Transcript")


class PrescriptionBundle(Base):
    __tablename__ = 'prescription_bundles'
    id = Column(Integer, primary_key=True, index=True)
    bundle_id = Column(String, unique=True, index=True)
    bundle_data = Column(postgresql.JSONB)
    api_key_id = Column(Integer, ForeignKey('api_keys.id'), nullable=True)
    transcript_id = Column(Integer, ForeignKey('transcripts.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    transcript = relationship("Transcript")


class OPConsultBundle(Base):
    __tablename__ = 'op_consult_bundles'
    id = Column(Integer, primary_key=True, index=True)
    bundle_id = Column(String, unique=True, index=True)
    bundle_data = Column(postgresql.JSONB)
    api_key_id = Column(Integer, ForeignKey('api_keys.id'), nullable=True)
    transcript_id = Column(Integer, ForeignKey('transcripts.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    transcript = relationship("Transcript")


class ImmunizationBundle(Base):
    __tablename__ = 'immunization_bundles'
    id = Column(Integer, primary_key=True, index=True)
    bundle_id = Column(String, unique=True, index=True)
    bundle_data = Column(postgresql.JSONB)
    api_key_id = Column(Integer, ForeignKey('api_keys.id'), nullable=True)
    transcript_id = Column(Integer, ForeignKey('transcripts.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    transcript = relationship("Transcript")


class DiagnosticReportBundle(Base):
    __tablename__ = 'diagnostic_report_bundles'
    id = Column(Integer, primary_key=True, index=True)
    bundle_id = Column(String, unique=True, index=True)
    bundle_data = Column(postgresql.JSONB)
    api_key_id = Column(Integer, ForeignKey('api_keys.id'), nullable=True)
    transcript_id = Column(Integer, ForeignKey('transcripts.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    transcript = relationship("Transcript")


class DischargeSummaryBundle(Base):
    __tablename__ = 'discharge_summary_bundles'
    id = Column(Integer, primary_key=True, index=True)
    bundle_id = Column(String, unique=True, index=True)
    bundle_data = Column(postgresql.JSONB)
    api_key_id = Column(Integer, ForeignKey('api_keys.id'), nullable=True)
    transcript_id = Column(Integer, ForeignKey('transcripts.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    transcript = relationship("Transcript")


# ============================================================================
# Logging
# ============================================================================

class UsageLog(Base):
    __tablename__ = 'usage_logs'
    id = Column(Integer, primary_key=True, index=True)
    endpoint = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    response_status = Column(Integer, nullable=True)
    error_message = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    api_key_id = Column(Integer, ForeignKey('api_keys.id'), nullable=True)
    transcript_id = Column(Integer, ForeignKey('transcripts.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="usage_logs")
    api_key = relationship("APIKey", back_populates="usage_logs")
    transcript = relationship("Transcript")


class APICallLog(Base):
    __tablename__ = 'api_call_logs'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    api_key_id = Column(Integer, ForeignKey('api_keys.id'), nullable=True)
    transcript_id = Column(Integer, ForeignKey('transcripts.id'), nullable=True)
    endpoint = Column(String)
    model_used = Column(String)
    input_tokens = Column(Integer, nullable=True)
    output_tokens = Column(Integer, nullable=True)
    audio_duration = Column(DECIMAL, nullable=True)
    cost = Column(DECIMAL, nullable=True)
    response_status = Column(Integer, nullable=True)
    error_message = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="api_call_logs")
    api_key = relationship("APIKey", back_populates="api_call_logs")
    transcript = relationship("Transcript")


class Job(Base):
    __tablename__ = 'jobs'
    id = Column(String, primary_key=True)
    job_type = Column(String, index=True)
    status = Column(String, default="pending")
    progress = Column(Integer, default=0)
    message = Column(String, nullable=True)
    params = Column(postgresql.JSONB, nullable=True)
    result = Column(postgresql.JSONB, nullable=True)
    error = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    api_key_id = Column(Integer, ForeignKey('api_keys.id'))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
