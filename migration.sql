-- =============================================================================
-- ClinVoice AI — full schema for the Doctor App Voice backend.
--
-- Apply this once against a fresh Postgres database (the one your
-- DATABASE_URL points at). It's idempotent: re-running is safe.
--
--   psql postgresql://clinvoice:clinvoice@localhost:5432/clinvoice_db -f migration.sql
--
-- Tables are created in dependency order. Foreign keys are added inline.
-- =============================================================================

BEGIN;

-- ---------- Identity & Auth ----------

CREATE TABLE IF NOT EXISTS users (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR,
    email            VARCHAR UNIQUE,
    password         VARCHAR,
    role             VARCHAR DEFAULT 'doctor',
    is_active        BOOLEAN DEFAULT TRUE,
    is_reset_needed  BOOLEAN DEFAULT FALSE,
    voice_address    VARCHAR,
    voice_duration   DOUBLE PRECISION,
    voice_preview    TEXT,
    signature_url    VARCHAR,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);

CREATE TABLE IF NOT EXISTS api_keys (
    id       SERIAL PRIMARY KEY,
    key      VARCHAR UNIQUE,
    user_id  INTEGER REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS ix_api_keys_key ON api_keys(key);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id),
    token       VARCHAR UNIQUE,
    expires_at  TIMESTAMP NOT NULL,
    used        BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);


-- ---------- Hospital, Doctor, Slots ----------

CREATE TABLE IF NOT EXISTS hospitals (
    id                                SERIAL PRIMARY KEY,
    user_id                           INTEGER UNIQUE REFERENCES users(id),
    name                              VARCHAR NOT NULL,
    logo                              VARCHAR,
    type                              INTEGER,
    year_of_establishment             VARCHAR,
    email                             VARCHAR,
    primary_mobile_no_country_code    VARCHAR,
    primary_mobile_no                 VARCHAR,
    secondary_mobile_no_country_code  VARCHAR,
    secondary_mobile_no               VARCHAR,
    licence_number                    VARCHAR,
    certificate                       VARCHAR,
    website_url                       VARCHAR,
    address                           VARCHAR,
    country                           VARCHAR,
    state                             VARCHAR,
    district                          VARCHAR,
    pincode                           VARCHAR,
    created_at                        TIMESTAMP DEFAULT NOW(),
    updated_at                        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctors (
    id                                SERIAL PRIMARY KEY,
    user_id                           INTEGER REFERENCES users(id),
    hospital_id                       INTEGER REFERENCES hospitals(id),
    image                             VARCHAR,
    name                              VARCHAR NOT NULL,
    gender                            VARCHAR,
    dob                               VARCHAR,
    email                             VARCHAR,
    primary_mobile_no_country_code    VARCHAR,
    primary_mobile_no                 VARCHAR,
    secondary_mobile_no_country_code  VARCHAR,
    secondary_mobile_no               VARCHAR,
    graduation                        VARCHAR,
    specialisation                    VARCHAR,
    mrn                               VARCHAR,
    registration_council              VARCHAR,
    registration_at                   VARCHAR,
    experience                        VARCHAR,
    created_at                        TIMESTAMP DEFAULT NOW(),
    updated_at                        TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_doctors_user_id      ON doctors(user_id);
CREATE INDEX IF NOT EXISTS ix_doctors_hospital_id  ON doctors(hospital_id);

CREATE TABLE IF NOT EXISTS doctor_slots (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER REFERENCES users(id),
    hospital_id  INTEGER REFERENCES hospitals(id),
    doctor_id    INTEGER REFERENCES doctors(id),
    start_time   VARCHAR NOT NULL,
    end_time     VARCHAR NOT NULL,
    duration     VARCHAR,
    dayname      VARCHAR,
    weekday      INTEGER,
    status       VARCHAR,
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_slots_user_id      ON doctor_slots(user_id);
CREATE INDEX IF NOT EXISTS ix_slots_hospital_id  ON doctor_slots(hospital_id);
CREATE INDEX IF NOT EXISTS ix_slots_doctor_id    ON doctor_slots(doctor_id);


-- ---------- Patient + OPD ----------

CREATE TABLE IF NOT EXISTS patients (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER REFERENCES users(id),
    hospital_id   INTEGER REFERENCES hospitals(id),
    image         VARCHAR,
    salutation    VARCHAR,
    patient_name  VARCHAR NOT NULL,
    gender        VARCHAR,
    dob           VARCHAR,
    age           VARCHAR,
    blood_group   VARCHAR,
    country_code  VARCHAR,
    mobile_no     VARCHAR,
    email         VARCHAR,
    address       VARCHAR,
    status        VARCHAR DEFAULT 'active',
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_patients_user_id        ON patients(user_id);
CREATE INDEX IF NOT EXISTS ix_patients_patient_name   ON patients(patient_name);
CREATE INDEX IF NOT EXISTS ix_patients_mobile_no      ON patients(mobile_no);


-- transcripts must exist before opds (FK from opds -> transcripts)
CREATE TABLE IF NOT EXISTS transcripts (
    id             SERIAL PRIMARY KEY,
    transcript_id  VARCHAR UNIQUE,
    transcript     VARCHAR,
    created_at     TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_transcripts_transcript_id ON transcripts(transcript_id);


CREATE TABLE IF NOT EXISTS opds (
    id                       SERIAL PRIMARY KEY,
    user_id                  INTEGER REFERENCES users(id),
    hospital_id              INTEGER REFERENCES hospitals(id),
    patient_id               INTEGER REFERENCES patients(id),
    doctor_id                INTEGER REFERENCES doctors(id),
    slot_id                  INTEGER REFERENCES doctor_slots(id),
    transcript_id            INTEGER REFERENCES transcripts(id),
    date                     VARCHAR,
    time                     VARCHAR,
    slot_start_time          VARCHAR,
    slot_end_time            VARCHAR,
    priority                 VARCHAR,
    specialist               VARCHAR,
    amount                   VARCHAR,
    message                  TEXT,
    opd_status               VARCHAR DEFAULT 'pending',
    source                   VARCHAR,
    live_consult             VARCHAR,
    cancellation_reason      VARCHAR,
    opd_status_id            VARCHAR,
    is_token_verified        BOOLEAN DEFAULT FALSE,
    is_consultation_closed   BOOLEAN DEFAULT FALSE,
    module                   VARCHAR DEFAULT 'opd',
    clinvoice_transaction_id     VARCHAR,
    token                    VARCHAR,
    status                   VARCHAR DEFAULT 'active',
    created_at               TIMESTAMP DEFAULT NOW(),
    updated_at               TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_opds_user_id      ON opds(user_id);
CREATE INDEX IF NOT EXISTS ix_opds_hospital_id  ON opds(hospital_id);
CREATE INDEX IF NOT EXISTS ix_opds_patient_id   ON opds(patient_id);
CREATE INDEX IF NOT EXISTS ix_opds_status       ON opds(opd_status);
CREATE INDEX IF NOT EXISTS ix_opds_created_at   ON opds(created_at);


CREATE TABLE IF NOT EXISTS opd_case_sheets (
    id                    SERIAL PRIMARY KEY,
    opd_id                INTEGER UNIQUE REFERENCES opds(id),
    user_id               INTEGER REFERENCES users(id),
    hospital_id           INTEGER REFERENCES hospitals(id),
    doctor_id             INTEGER REFERENCES doctors(id),
    patient_id            INTEGER REFERENCES patients(id),
    sheet_type            VARCHAR DEFAULT 'medical',
    payload               JSONB,
    clinvoice_transaction_id  VARCHAR,
    created_at            TIMESTAMP DEFAULT NOW(),
    updated_at            TIMESTAMP DEFAULT NOW()
);


-- ---------- Voice-to-EMR core domain ----------

CREATE TABLE IF NOT EXISTS soap_notes (
    id             SERIAL PRIMARY KEY,
    soap_note      VARCHAR,
    transcript_id  INTEGER REFERENCES transcripts(id),
    created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS soap_notes_v1 (
    id             SERIAL PRIMARY KEY,
    soap_note      JSONB,
    transcript_id  INTEGER REFERENCES transcripts(id),
    created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medical_reports (
    id              SERIAL PRIMARY KEY,
    medical_report  VARCHAR,
    transcript_id   INTEGER REFERENCES transcripts(id),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medical_reports_v1 (
    id              SERIAL PRIMARY KEY,
    medical_report  VARCHAR,
    transcript_id   INTEGER REFERENCES transcripts(id),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dental_medical_reports (
    id                     SERIAL PRIMARY KEY,
    dental_medical_report  VARCHAR,
    transcript_id          INTEGER REFERENCES transcripts(id),
    created_at             TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS icd_codes (
    id             SERIAL PRIMARY KEY,
    icd_code       VARCHAR,
    transcript_id  INTEGER REFERENCES transcripts(id),
    created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS snomed_ct_codes (
    id             SERIAL PRIMARY KEY,
    snomed_ct      VARCHAR,
    transcript_id  INTEGER REFERENCES transcripts(id),
    created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fhir_bundles (
    id             SERIAL PRIMARY KEY,
    fhir_bundle    JSONB,
    transcript_id  INTEGER REFERENCES transcripts(id),
    created_at     TIMESTAMP DEFAULT NOW()
);


-- ---------- NRCES FHIR Bundle tables ----------

CREATE TABLE IF NOT EXISTS wellness_bundles (
    id             SERIAL PRIMARY KEY,
    bundle_id      VARCHAR UNIQUE,
    bundle_data    JSONB,
    api_key_id     INTEGER REFERENCES api_keys(id),
    transcript_id  INTEGER REFERENCES transcripts(id),
    created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescription_bundles (
    id             SERIAL PRIMARY KEY,
    bundle_id      VARCHAR UNIQUE,
    bundle_data    JSONB,
    api_key_id     INTEGER REFERENCES api_keys(id),
    transcript_id  INTEGER REFERENCES transcripts(id),
    created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS op_consult_bundles (
    id             SERIAL PRIMARY KEY,
    bundle_id      VARCHAR UNIQUE,
    bundle_data    JSONB,
    api_key_id     INTEGER REFERENCES api_keys(id),
    transcript_id  INTEGER REFERENCES transcripts(id),
    created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS immunization_bundles (
    id             SERIAL PRIMARY KEY,
    bundle_id      VARCHAR UNIQUE,
    bundle_data    JSONB,
    api_key_id     INTEGER REFERENCES api_keys(id),
    transcript_id  INTEGER REFERENCES transcripts(id),
    created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diagnostic_report_bundles (
    id             SERIAL PRIMARY KEY,
    bundle_id      VARCHAR UNIQUE,
    bundle_data    JSONB,
    api_key_id     INTEGER REFERENCES api_keys(id),
    transcript_id  INTEGER REFERENCES transcripts(id),
    created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discharge_summary_bundles (
    id             SERIAL PRIMARY KEY,
    bundle_id      VARCHAR UNIQUE,
    bundle_data    JSONB,
    api_key_id     INTEGER REFERENCES api_keys(id),
    transcript_id  INTEGER REFERENCES transcripts(id),
    created_at     TIMESTAMP DEFAULT NOW()
);


-- ---------- Logging ----------

CREATE TABLE IF NOT EXISTS usage_logs (
    id                SERIAL PRIMARY KEY,
    endpoint          VARCHAR,
    timestamp         TIMESTAMP DEFAULT NOW(),
    response_status   INTEGER,
    error_message     VARCHAR,
    user_id           INTEGER REFERENCES users(id),
    api_key_id        INTEGER REFERENCES api_keys(id),
    transcript_id     INTEGER REFERENCES transcripts(id),
    created_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_call_logs (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id),
    api_key_id      INTEGER REFERENCES api_keys(id),
    transcript_id   INTEGER REFERENCES transcripts(id),
    endpoint        VARCHAR,
    model_used      VARCHAR,
    input_tokens    INTEGER,
    output_tokens   INTEGER,
    audio_duration  NUMERIC,
    cost            NUMERIC,
    response_status INTEGER,
    error_message   VARCHAR,
    timestamp       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
    id            VARCHAR PRIMARY KEY,
    job_type      VARCHAR,
    status        VARCHAR DEFAULT 'pending',
    progress      INTEGER DEFAULT 0,
    message       VARCHAR,
    params        JSONB,
    result        JSONB,
    error         VARCHAR,
    user_id       INTEGER REFERENCES users(id),
    api_key_id    INTEGER REFERENCES api_keys(id),
    created_at    TIMESTAMP DEFAULT NOW(),
    completed_at  TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_jobs_job_type ON jobs(job_type);


-- =============================================================================
-- Seed the dev API key the frontend uses
-- (frontend env file ships VITE_CLINVOICE_API_KEY=dev-key-123)
-- The user_id is filled in automatically when a user signs up via POST /user/signup.
-- =============================================================================
-- (No seed inserts here — signup endpoint auto-creates the api_keys row idempotently.)


-- Mark Alembic's bookkeeping table as up-to-date so `alembic upgrade head`
-- becomes a no-op if anyone runs it later.
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL PRIMARY KEY
);
INSERT INTO alembic_version (version_num) VALUES ('c2ash00000002')
ON CONFLICT (version_num) DO NOTHING;

COMMIT;
