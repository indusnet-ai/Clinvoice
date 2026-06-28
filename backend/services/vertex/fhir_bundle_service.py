"""
FHIR Bundle Service

Generates FHIR document bundles from doctor-patient conversation transcripts.
Extracts clinical data using LLM and creates NRCES-compliant FHIR resources.
"""

import json
import uuid
import datetime
import logging
import os
from typing import Dict, Any, Tuple

from services.vertex.claude_init import init_async_anthropic_vertex
from services.vertex.claude_service import get_response_with_tokens

from resources.general.create_condition import create_condition_resource
from resources.general.create_allergy_intolerance import create_allergy_intolerance_resource
from resources.general.create_observation import create_observation_resource
from resources.general.create_medication_request import create_medication_request_resource
from resources.general.create_service_request import create_service_request_resource
from resources.general.create_procedure import create_procedure_resource
from resources.general.create_care_plan import create_care_plan_resource
from resources.general.create_composition import create_composition_resource

logger = logging.getLogger(__name__)


def clean_llm_output(text: str) -> str:
    """
    Remove markdown code block markers from LLM output.
    Handles ```json and ``` wrappers that LLMs sometimes add.
    """
    text = text.strip()
    if text.startswith('```json'):
        text = text[7:]
    if text.startswith('```'):
        text = text[3:]
    if text.endswith('```'):
        text = text[:-3]
    return text.strip()


async def create_fhir_bundle(
    conversation_text: str,
    project_root: str,
) -> Tuple[Dict[str, Any], int, int]:
    """
    Generate a FHIR document bundle from a medical conversation transcript.
    
    Args:
        conversation_text: The doctor-patient conversation transcript
        project_root: Path to project root directory
        
    Returns:
        Tuple containing:
        - FHIR Bundle (dict)
        - Input tokens used
        - Output tokens used
        
    Raises:
        RuntimeError: If Claude client initialization fails
    """
    # Initialize LLM client
    client = init_async_anthropic_vertex()
    if not client:
        raise RuntimeError("Failed to initialize Claude client")
    
    # Extract clinical data from conversation
    prompt_filepath = "prompts/general/fhir_bundle_prompt.txt"
    logger.info("Extracting clinical data from conversation")
    
    response_text, input_tokens, output_tokens = await get_response_with_tokens(
        client=client,
        prompt_filepath=prompt_filepath,
        conversation=conversation_text,
        PROJECT_ROOT=project_root
    )
    
    # Parse extracted data
    try:
        cleaned_text = clean_llm_output(response_text)
        extracted_data = json.loads(cleaned_text)
        logger.info("Clinical data extraction successful")
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse extracted data: {e}")
        logger.error(f"Raw response: {response_text[:500]}...")
        extracted_data = {}
    
    # Initialize bundle structure
    bundle_id = str(uuid.uuid4())
    timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "+05:30"
    entries = []
    
    # Track resources for composition sections
    section_map = {
        "Condition": [],
        "AllergyIntolerance": [],
        "Observation": [],
        "MedicationRequest": [],
        "ServiceRequest": [],
        "Procedure": [],
        "CarePlan": []
    }
    
    # Create Condition resources
    for data in extracted_data.get("conditions", []):
        resource = create_condition_resource(data)
        if resource:
            entries.append(resource)
            section_map["Condition"].append({"reference": resource["fullUrl"]})
    
    # Create AllergyIntolerance resources
    for data in extracted_data.get("allergies", []):
        resource = create_allergy_intolerance_resource(data)
        if resource:
            entries.append(resource)
            section_map["AllergyIntolerance"].append({"reference": resource["fullUrl"]})
    
    # Create Observation resources (vitals, labs, etc.)
    for data in extracted_data.get("observations", []):
        resource = create_observation_resource(data)
        if resource:
            entries.append(resource)
            section_map["Observation"].append({"reference": resource["fullUrl"]})
    
    # Create MedicationRequest resources
    for data in extracted_data.get("medications", []):
        resource = create_medication_request_resource(data)
        if resource:
            entries.append(resource)
            section_map["MedicationRequest"].append({"reference": resource["fullUrl"]})
    
    # Create ServiceRequest resources (lab orders, imaging, referrals)
    for data in extracted_data.get("serviceRequests", []):
        resource = create_service_request_resource(data)
        if resource:
            entries.append(resource)
            section_map["ServiceRequest"].append({"reference": resource["fullUrl"]})
    
    # Create Procedure resources
    for data in extracted_data.get("procedures", []):
        resource = create_procedure_resource(data)
        if resource:
            entries.append(resource)
            section_map["Procedure"].append({"reference": resource["fullUrl"]})
    
    # Create CarePlan resources
    for data in extracted_data.get("carePlans", []):
        resource = create_care_plan_resource(data)
        if resource:
            entries.append(resource)
            section_map["CarePlan"].append({"reference": resource["fullUrl"]})
    
    # Build composition sections with SNOMED codes
    sections = []
    section_codes = {
        "Condition": ("404684003", "Clinical finding"),
        "AllergyIntolerance": ("722446000", "Allergy record"),
        "Observation": ("384821006", "Observations"),
        "MedicationRequest": ("440545006", "Prescription record"),
        "ServiceRequest": ("721963009", "Order document"),
        "Procedure": ("371525003", "Clinical procedure report"),
        "CarePlan": ("734163000", "Care plan")
    }
    
    for resource_type, refs in section_map.items():
        if refs:
            code, display = section_codes.get(resource_type, ("", resource_type))
            sections.append({
                "title": resource_type,
                "code": {
                    "coding": [{
                        "system": "http://snomed.info/sct",
                        "code": code,
                        "display": display
                    }]
                },
                "entry": refs
            })
    
    # Create Composition resource (required first entry in document bundle)
    composition_data = {
        "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultRecord"],
        "identifier_system": "https://ndhm.in/phr",
        "identifier_value": bundle_id,
        "type_code": "371530004",
        "type_display": "Clinical consultation report",
        "title": "Clinical Consultation Note",
        "sections": sections,
    }
    
    composition_resource = create_composition_resource(composition_data)
    entries.insert(0, composition_resource)
    
    # Assemble final FHIR document bundle
    bundle = {
        "resourceType": "Bundle",
        "id": bundle_id,
        "meta": {
            "versionId": "1",
            "lastUpdated": timestamp,
            "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"],
            "security": [{
                "system": "http://terminology.hl7.org/CodeSystem/v3-Confidentiality",
                "code": "V",
                "display": "very restricted",
            }],
        },
        "identifier": {
            "system": "http://hip.in",
            "value": bundle_id
        },
        "type": "document",
        "timestamp": timestamp,
        "entry": entries,
    }
    
    logger.info(f"FHIR bundle created with {len(entries)} resources")
    return bundle, input_tokens, output_tokens
