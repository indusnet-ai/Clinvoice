import json
import uuid
import datetime
import os
from typing import Dict, Any, Optional
from pathlib import Path

from services.nrces_fhir.llm_service import generate_response, init_llm_client
from services.nrces_fhir.code_utils import build_vaccine_code, build_codeable_concept
#from resources.nrces_fhir.create_patient import create_patient_resource
#from resources.nrces_fhir.create_practitioner import create_practitioner_resource
#from resources.nrces_fhir.create_organization import create_organization_resource
#from resources.nrces_fhir.create_location import create_location_resource
from resources.nrces_fhir.create_immunization import create_immunization_resource
from resources.nrces_fhir.create_immunization_recommendation import create_immunization_recommendation_resource
#from resources.nrces_fhir.create_document_reference import create_document_reference_resource
from resources.nrces_fhir.create_composition import create_composition_resource


async def create_immunization_bundle(
    conversation_text: str,
    #patient_details: Optional[Dict[str, Any]] = None,
    #practitioner_details: Optional[Dict[str, Any]] = None,
    #org_details: Optional[Dict[str, Any]] = None,
    #location_details: Optional[Dict[str, Any]] = None,
    #document_attachment: Optional[Dict[str, Any]] = None,
) -> tuple[Dict[str, Any], int, int]:
    """
    Creates a FHIR Immunization Record Bundle from a conversation.
    """
    client = init_llm_client()
    if not client:
        return {"error": "Failed to initialize AI client"}

    # Use centralized prompts directory
    prompt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "prompts", "nrces_fhir", "prompt_immunization_record.txt")
    extracted_data_json, input_tokens, output_tokens = await generate_response(
        conversation_text, client, prompt_file=str(prompt_path)
    )
    try:
        extracted_data = json.loads(extracted_data_json) if extracted_data_json else {"immunizations": [], "recommendations": []}
    except json.JSONDecodeError:
        extracted_data = {"immunizations": [], "recommendations": []}

    immunizations_data = extracted_data.get("immunizations", [])
    recommendations_data = extracted_data.get("recommendations", [])

    bundle_id = str(uuid.uuid4())
    timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "+05:30"
    entries = []

    # patient_resource = None
    # if patient_details:
    #     patient_resource = create_patient_resource(patient_details)
    #     entries.append(patient_resource)

    # practitioner_resource = None
    # if practitioner_details:
    #     practitioner_resource = create_practitioner_resource(practitioner_details)
    #     entries.append(practitioner_resource)

    # organization_resource = None
    # if org_details:
    #     organization_resource = create_organization_resource(org_details)
    #     entries.append(organization_resource)

    # location_resource = None
    # if location_details:
    #     location_details["org_ref"] = organization_resource["fullUrl"] if organization_resource else None
    #     location_resource = create_location_resource(location_details)
    #     entries.append(location_resource)
        
    immunization_entries = []
    last_imm_ref = None
    if immunizations_data:
        for imm_data in immunizations_data:
            # imm_data["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
            # imm_data["location_ref"] = location_resource["fullUrl"] if location_resource else None
            # imm_data["manufacturer_ref"] = organization_resource["fullUrl"] if organization_resource else None
            # imm_data["practitioner_ref"] = practitioner_resource["fullUrl"] if practitioner_resource else None
            
            # Build FHIR CodeableConcept from flat prompt output
            imm_data["vaccineCode"] = build_vaccine_code(imm_data)
            
            # Build route CodeableConcept if present
            if imm_data.get("route") and isinstance(imm_data["route"], str):
                imm_data["route"] = {"text": imm_data["route"]}
            
            # Build site CodeableConcept if present
            if imm_data.get("site") and isinstance(imm_data["site"], str):
                imm_data["site"] = {"text": imm_data["site"]}

            imm_entry = create_immunization_resource(imm_data)
            if imm_entry:
                immunization_entries.append(imm_entry)
                last_imm_ref = imm_entry["fullUrl"]
    entries.extend(immunization_entries)
    
    recommendation_entries = []
    if recommendations_data:
        for rec_data in recommendations_data:
            rec_data["supporting_imm_ref"] = last_imm_ref
            
            # Build FHIR CodeableConcept from flat prompt output
            rec_data["vaccineCode"] = build_vaccine_code(rec_data)

            rec_entry = create_immunization_recommendation_resource(rec_data)
            if rec_entry:
                recommendation_entries.append(rec_entry)
    entries.extend(recommendation_entries)
    
    doc_ref_entry = None
    # if document_attachment:
    #     document_attachment["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
    #     doc_ref_resource = create_document_reference_resource(document_attachment)
    #     if doc_ref_resource:
    #         doc_ref_entry = doc_ref_resource
    #         entries.append(doc_ref_entry)
            
    section_entries = []
    if immunization_entries or recommendation_entries or doc_ref_entry:
        imm_section_entries = []
        if immunization_entries:
            imm_section_entries.extend([{"reference": entry["fullUrl"], "type": "Immunization"} for entry in immunization_entries])
        if recommendation_entries:
            imm_section_entries.extend([{"reference": entry["fullUrl"], "type": "ImmunizationRecommendation"} for entry in recommendation_entries])
        # if doc_ref_entry:
        #     imm_section_entries.append({"reference": doc_ref_entry["fullUrl"], "type": "DocumentReference"})
        
        section_entries.append({
            "title": "Immunization record",
            "code": {
                "coding": [{
                    "system": "http://snomed.info/sct",
                    "code": "41000179103",
                    "display": "Immunization record"
                }]
            },
            "entry": imm_section_entries
        })

    composition_data = {
        "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/ImmunizationRecord"],
        "identifier_system": "https://ndhm.in/phr",
        "identifier_value": str(uuid.uuid4()),
        "type_code": "41000179103",
        "type_display": "Immunization record",
        #"subject_ref": patient_resource["fullUrl"] if patient_resource else None,
        #"author_refs": [practitioner_resource["fullUrl"]] if practitioner_resource else [],
        "title": "Immunization record",
        #"custodian_ref": organization_resource["fullUrl"] if organization_resource else None,
        "sections": section_entries,
    }
    
    composition_resource = create_composition_resource(composition_data)
    entries.insert(0, composition_resource)

    bundle = {
        "resourceType": "Bundle",
        "id": bundle_id,
        "type": "document",
        "timestamp": timestamp,
        "entry": entries,
    }
    
    return bundle, input_tokens, output_tokens
