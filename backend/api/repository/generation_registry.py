"""
Generation Service Registry

Provides a unified, configuration-driven approach for all transcript-based
generation services. Eliminates code duplication across repository files
by using a single registry of service configurations.

Each service configuration specifies:
- endpoint: API endpoint name for logging
- model_class: SQLAlchemy model for caching results
- result_field: Column name in the model that stores the result
- service_name: Name passed to the LLM service (optional)
- prompt_path: Relative path to the prompt text file
- generator: Optional custom generator type (default uses generate_service_async)
"""

import os
from typing import Tuple, Any, Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request

from api.repository.base_generation_service import BaseGenerationService
from services.vertex.claude_service import generate_service_async
from services.vertex.fhir_bundle_service import create_fhir_bundle
from db.models import (
    SnomedCTCode, 
    ICDCode, 
    SOAPNote, 
    MedicalReport, 
    MedicalReportV1, 
    DentalMedicalReport,
    FHIRBundle,
    SOAPNoteV1
)

# Calculate project root for FHIR bundle service
current_dir = os.path.dirname(__file__)
PROJECT_ROOT = os.path.abspath(os.path.join(current_dir, '../..'))


# Registry of all LLM-based generation services
SERVICE_REGISTRY = {
    "snomed": {
        "endpoint": "/SNOMED_CT",
        "model_class": SnomedCTCode,
        "result_field": "snomed_ct",
        "service_name": "snomed",
        "prompt_path": "prompts/general/snomed_prompt.txt",
        "description": "SNOMED CT clinical terminology codes",
    },
    "icd": {
        "endpoint": "/ICD-10_code",
        "model_class": ICDCode,
        "result_field": "icd_code",
        "service_name": "icd",
        "prompt_path": "prompts/general/icd_prompt.txt",
        "description": "ICD-10 diagnosis codes for billing",
    },
    "soap_notes": {
        "endpoint": "/SOAP_notes",
        "model_class": SOAPNote,
        "result_field": "soap_note",
        "service_name": "SOAP_notes",
        "prompt_path": "prompts/general/SOAP_notes_prompt.txt",
        "description": "SOAP format clinical notes",
    },
    "soap_notes_v1": {
        "endpoint": "/v1/soap_notes",
        "model_class": SOAPNoteV1,
        "result_field": "soap_note",
        "service_name": "soap_notes_v1",
        "prompt_path": "prompts/v1/soap_notes_format_1_prompt.txt",
        "description": "Professional SOAP notes (v1)",
    },
    "medical_report": {
        "endpoint": "/v2/medical_report",
        "model_class": MedicalReport,
        "result_field": "medical_report",
        "service_name": "medical_report",
        "prompt_path": "prompts/general/medical_report_prompt.txt",
        "description": "Structured medical report (v2)",
    },
    "medical_report_v1": {
        "endpoint": "/v1/medical_report",
        "model_class": MedicalReportV1,
        "result_field": "medical_report",
        "service_name": "medical_report_v1",
        "prompt_path": "prompts/v1/medical_report.txt",
        "description": "Extended medical report (v1)",
    },
    "dental_medical_report": {
        "endpoint": "/dental_medical_report",
        "model_class": DentalMedicalReport,
        "result_field": "dental_medical_report",
        "service_name": "dental_medical_report",
        "prompt_path": "prompts/general/dental_medical_report_prompt.txt",
        "description": "Dental consultation report",
    },
    "dental_medical_report_v1.1": {
        "endpoint": "/v1.1/dental_medical_report",
        "model_class": DentalMedicalReport,
        "result_field": "dental_medical_report",
        "service_name": "dental_medical_report_v1_1",
        "prompt_path": "prompts/v1/dental_medical_report.txt",
        "description": "Dental consultation report",
    },
    "fhir_bundle": {
        "endpoint": "/FHIR_bundle",
        "model_class": FHIRBundle,
        "result_field": "fhir_bundle",
        "generator": "fhir_bundle",  # Custom generator
        "description": "NRCES-compliant FHIR document bundle",
    },
    "clinical_summary": {
        "endpoint": "/v1/clinical_summary",
        "service_name": "clinical_summary",
        "prompt_path": "prompts/v1/clinical_summary_prompt.txt",
        "description": "Longitudinal clinical summary across multiple visits",
    },
}


class GenericGenerationService(BaseGenerationService[str]):
    """
    Generic service that can handle any registered generation type.
    
    Uses configuration from SERVICE_REGISTRY to determine behavior.
    All services share the same logic - only the configuration differs.
    """
    
    def __init__(
        self, 
        db: AsyncSession, 
        api_key_record, 
        claude_client,
        endpoint: str,
        model_class,
        result_field: str,
        prompt_path: str = None,
        service_name: str = None,
        generator: str = None,
        **kwargs  # Ignore extra fields like 'description'
    ):
        super().__init__(
            db=db,
            api_key_record=api_key_record,
            endpoint=endpoint,
            model_class=model_class,
            result_field=result_field
        )
        self.claude_client = claude_client
        self.service_name = service_name
        self.prompt_path = prompt_path
        self.generator = generator
        self._last_total_tokens: int = 0  # set by generate(); 0 for cache hits
    
    async def generate(
        self, 
        transcript_text: str, 
        **kwargs
    ) -> Tuple[Any, int, int]:
        """
        Generate result using the configured LLM service.
        """
        if self.generator == "fhir_bundle":
            result, input_tokens, output_tokens = await create_fhir_bundle(
                conversation_text=transcript_text,
                project_root=PROJECT_ROOT
            )
        else:
            # Pass prompt_path directly to the generator
            result, input_tokens, output_tokens = await generate_service_async(
                transcript_text, 
                self.claude_client, 
                service=self.service_name,
                prompt_path=self.prompt_path
            )
        # Store for get_or_generate_with_tokens(); stays 0 on cache hits
        self._last_total_tokens = input_tokens + output_tokens
        return result, input_tokens, output_tokens

    async def get_or_generate_with_tokens(self, transcript_id: str) -> Tuple[Any, int]:
        """
        Same as get_or_generate() but also returns total tokens consumed.
        """
        result = await self.get_or_generate(transcript_id)
        return result, self._last_total_tokens


async def get_or_generate(
    service_type: str,
    request: Request,
    transcript_id: str,
    db: AsyncSession,
    api_key_record
) -> Any:
    """
    Unified entry point for all generation services.
    """
    config = SERVICE_REGISTRY[service_type]
    claude_client = request.app.state.claude_client if hasattr(request.app.state, 'claude_client') else None
    
    service = GenericGenerationService(
        db=db,
        api_key_record=api_key_record,
        claude_client=claude_client,
        **config
    )
    
    return await service.get_or_generate(transcript_id)


# Convenience functions for backward compatibility with existing routers

async def get_snomed_code(request: Request, transcript_id: str, db: AsyncSession, api_key_record) -> str:
    """Extract SNOMED CT codes from a transcript."""
    return await get_or_generate("snomed", request, transcript_id, db, api_key_record)


async def get_icd_code(request: Request, transcript_id: str, db: AsyncSession, api_key_record) -> str:
    """Extract ICD-10 codes from a transcript."""
    return await get_or_generate("icd", request, transcript_id, db, api_key_record)


async def view_summary(request: Request, transcript_id: str, db: AsyncSession, api_key_record) -> str:
    """Generate SOAP notes from a transcript."""
    return await get_or_generate("soap_notes", request, transcript_id, db, api_key_record)


async def extract_medical_report(request: Request, transcript_id: str, db: AsyncSession, api_key_record) -> str:
    """Generate medical report (v2) from a transcript."""
    return await get_or_generate("medical_report", request, transcript_id, db, api_key_record)


async def extract_medical_report_v1(request: Request, transcript_id: str, db: AsyncSession, api_key_record) -> str:
    """Generate medical report (v1) from a transcript."""
    return await get_or_generate("medical_report_v1", request, transcript_id, db, api_key_record)


async def extract_dental_medical_report(request: Request, transcript_id: str, db: AsyncSession, api_key_record) -> str:
    """Generate dental medical report from a transcript."""
    return await get_or_generate("dental_medical_report", request, transcript_id, db, api_key_record)

async def extract_dental_medical_report_v1_1(request: Request, transcript_id: str, db: AsyncSession, api_key_record) -> str:
    """Generate dental medical report from a transcript."""
    return await get_or_generate("dental_medical_report_v1.1", request, transcript_id, db, api_key_record)


async def get_fhir_bundle(request: Request, transcript_id: str, db: AsyncSession, api_key_record) -> Dict[str, Any]:
    """Generate NRCES-compliant FHIR bundle from a transcript."""
    return await get_or_generate("fhir_bundle", request, transcript_id, db, api_key_record)


# --- V1 token-aware wrappers ---

async def extract_medical_report_v1_with_tokens(
    request: Request, transcript_id: str, db: AsyncSession, api_key_record
) -> Tuple[Any, int]:
    """Generate medical report (v1) and return (result, total_tokens)."""
    config = SERVICE_REGISTRY["medical_report_v1"]
    claude_client = request.app.state.claude_client if hasattr(request.app.state, "claude_client") else None
    service = GenericGenerationService(db=db, api_key_record=api_key_record, claude_client=claude_client, **config)
    return await service.get_or_generate_with_tokens(transcript_id)


async def extract_dental_medical_report_v1_1_with_tokens(
    request: Request, transcript_id: str, db: AsyncSession, api_key_record
) -> Tuple[Any, int]:
    """Generate dental report (v1.1) and return (result, total_tokens)."""
    config = SERVICE_REGISTRY["dental_medical_report_v1.1"]
    claude_client = request.app.state.claude_client if hasattr(request.app.state, "claude_client") else None
    service = GenericGenerationService(db=db, api_key_record=api_key_record, claude_client=claude_client, **config)
    return await service.get_or_generate_with_tokens(transcript_id)

async def extract_soap_notes_v1_with_tokens(
    request: Request, transcript_id: str, db: AsyncSession, api_key_record
) -> Tuple[Any, int]:
    """Generate SOAP notes (v1) and return (result, total_tokens)."""
    config = SERVICE_REGISTRY["soap_notes_v1"]
    claude_client = request.app.state.claude_client if hasattr(request.app.state, "claude_client") else None
    service = GenericGenerationService(db=db, api_key_record=api_key_record, claude_client=claude_client, **config)
    return await service.get_or_generate_with_tokens(transcript_id)

# --- Stateless Generation Helpers ---

async def generate_clinical_summary_with_tokens(
    request: Request, history_context: str, api_key_record
) -> Tuple[Any, int]:
    """
    Generate a clinical summary from provided history context.
    Stateless: does not use transcript_id or caching.
    """
    config = SERVICE_REGISTRY["clinical_summary"]
    claude_client = request.app.state.claude_client if hasattr(request.app.state, "claude_client") else None
    
    # We use generate_service_async directly as there's no DB transcript to bind to
    # but we pass the history_context as the 'transcript_text' parameter
    result, input_tokens, output_tokens = await generate_service_async(
        history_context, 
        claude_client, 
        service=config["service_name"],
        prompt_path=config["prompt_path"]
    )
    
    return result, (input_tokens + output_tokens)
