from fastapi import FastAPI, File, UploadFile, Depends, HTTPException
import uvicorn
from sqlalchemy.orm import Session
from pydantic import BaseModel
import logging
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import Request

# V0 routers - Synchronous endpoints
from api.router.v0 import (
    bundles as v0_bundles,
    upload as v0_upload,
    transcript as v0_transcript,
    summary as v0_summary,
    medical_report as v0_medical_report,
    medical_report_v1 as v0_medical_report_v1,
    snomed as v0_snomed,
    icd as v0_icd,
    dental_medical_report as v0_dental,
    dental_medical_report_v1_1 as v1_1_dental,
    usage_tracking as v0_usage,
)

# V1 routers
from api.router.v1 import (
    soap_notes as v1_soap_notes,
    translation_soap_notes as v1_translation,
    upload as v1_upload,
    medical_report as v1_medical_report,
    dental_medical_report as v1_dental_report,
    clinical_summary as v1_clinical_summary,
)

# Clinic routers (frontend `service: "backend"` URLs)
from api.router.clinic import (
    user as clinic_user,
    hospital as clinic_hospital,
    doctor as clinic_doctor,
    doctor_slot as clinic_doctor_slot,
    patient as clinic_patient,
    opd as clinic_opd,
    abha as clinic_abha,
    file as clinic_file,
    ws_stream as clinic_ws_stream,
)

from api.utils.file_upload import UPLOAD_DIR
from core.lifespan_handler import lifespan

title = "ClinVoice AI"
version = " 0.0.7"

description = '''
Generates diarized transcripts, SOAP notes, medical reports, and FHIR bundles from doctor-patient audio recordings.

## How to use

1. Upload the audio recording of the conversation between the doctor and patient.  
_(As of now it supports only .wav format and 16k sampling rate)_
2. Upon uploading the audio file, you will receive a unique transcript ID.
3. Use the transcript ID to access:
   - **/transcript** - View transcription
   - **/SOAP_notes** - SOAP notes
   - **/medical_report** - Medical report
   - **/fhir-bundle** - FHIR bundle
   - **/SNOMED_CT** - SNOMED codes
   - **/ICD-10_code** - ICD-10 codes

### NRCES-Compliant FHIR Bundles
Generate NRCES-compliant FHIR bundles from transcript:
- **/wellness-record** - Wellness Record Bundle
- **/prescription-record** - Prescription Bundle
- **/op-consult-record** - OP Consult Bundle
- **/immunization-record** - Immunization Record Bundle

_More features to be added soon in future updates :)_

'''

openapi_tags = [
    {"name": "Contextualization", "description": "Audio upload and transcription endpoints"},
    {"name": "SOAP notes (for all practices)", "description": "Generate SOAP notes from transcripts"},
    {"name": "OPD", "description": "Medical report generation endpoints"},
    {"name": "FHIR Bundle", "description": "FHIR bundle generation from transcripts"},
    {"name": "NRCES Bundles", "description": "NRCES-compliant FHIR bundle generation from conversations"},
    {"name": "Dental", "description": "Dental medical report endpoints"},
    {"name": "Terminology", "description": "SNOMED CT and ICD-10 code extraction"},
    #{"name": "Metrics", "description": "Usage tracking endpoints"},
]

app = FastAPI(
    title=title,
    version=version,
    description=description,
    openapi_tags=openapi_tags,
    lifespan=lifespan
)

 
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_methods=["*"],
  allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# =============================================================================
# V0 - Sync endpoints
# =============================================================================
app.include_router(v0_upload.router)
app.include_router(v0_transcript.router)
app.include_router(v0_summary.router)
app.include_router(v0_medical_report_v1.router)
app.include_router(v0_medical_report.router)
app.include_router(v0_dental.router)
app.include_router(v1_1_dental.router)
app.include_router(v0_snomed.router)
app.include_router(v0_icd.router)
#app.include_router(v0_usage.router)
#app.include_router(test_router, prefix="") # New test router (no shared prefix to match requested paths)
app.include_router(v0_bundles.router)

# =============================================================================
# V1 - New endpoints
# =============================================================================
app.include_router(v1_soap_notes.router, prefix="/api/v1")
app.include_router(v1_translation.router, prefix="/api/v1")
app.include_router(v1_upload.router, prefix="/api/v1")
app.include_router(v1_medical_report.router, prefix="/api/v1")
app.include_router(v1_dental_report.router, prefix="/api/v1")
app.include_router(v1_clinical_summary.router, prefix="/api/v1")

# =============================================================================
# Clinic endpoints (frontend "backend" service)
# =============================================================================
app.include_router(clinic_user.router)
app.include_router(clinic_hospital.router)
app.include_router(clinic_doctor.router)
app.include_router(clinic_doctor_slot.router)
app.include_router(clinic_patient.router)
app.include_router(clinic_opd.opd_router)
app.include_router(clinic_opd.case_router)
app.include_router(clinic_abha.router)
app.include_router(clinic_file.router)
app.include_router(clinic_ws_stream.router)

# Serve uploads (logos, avatars, signatures, voice samples)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8020)
