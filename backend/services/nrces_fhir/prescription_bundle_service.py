import json
import uuid
import datetime
import os
from typing import Dict, Any, Optional
from pathlib import Path

from services.nrces_fhir.llm_service import generate_response, init_llm_client
from services.nrces_fhir.code_utils import build_medication_concept, build_condition_code
#from resources.nrces_fhir.create_patient import create_patient_resource
#from resources.nrces_fhir.create_practitioner import create_practitioner_resource
#from resources.nrces_fhir.create_organization import create_organization_resource
from resources.nrces_fhir.create_condition import create_condition_resource
from resources.nrces_fhir.create_medication_request import create_medication_request_resource
#from resources.nrces_fhir.create_document_reference import create_document_reference_resource
from resources.nrces_fhir.create_composition import create_composition_resource


async def create_prescription_bundle(
    conversation_text: str,
    #patient_details: Optional[Dict[str, Any]] = None,
    #practitioner_details: Optional[Dict[str, Any]] = None,
    #org_details: Optional[Dict[str, Any]] = None,
    #document_attachment: Optional[Dict[str, Any]] = None,
    #signature_data: Optional[Dict[str, Any]] = None,
) -> tuple[Dict[str, Any], int, int]:
    """
    Creates a FHIR Prescription Record Bundle from a conversation.
    """
    client = init_llm_client()
    if not client:
        return {"error": "Failed to initialize AI client"}

    # Use centralized prompts directory
    prompt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "prompts", "nrces_fhir", "prompt_prescription.txt")
    extracted_data_json, input_tokens, output_tokens = await generate_response(
        conversation_text, client, prompt_file=str(prompt_path)
    )
    try:
        extracted_data = (
            json.loads(extracted_data_json)
            if extracted_data_json
            else {"medications": [], "conditions": []}
        )
    except json.JSONDecodeError:
        extracted_data = {"medications": [], "conditions": []}

    medications_data = extracted_data.get("medications", [])
    conditions_data = extracted_data.get("conditions", [])

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

    condition_entries = []
    condition_map = {}
    if conditions_data:
        for cond_data in conditions_data:
            # Build FHIR CodeableConcept from flat prompt output
            cond_data["code"] = build_condition_code(cond_data)
            
            cond_resource = create_condition_resource(cond_data)
            if cond_resource:
                condition_entries.append(cond_resource)
                # Use display or text as the key for condition matching
                name_key = (cond_data.get("display") or cond_data.get("text") or "").lower()
                if name_key:
                    condition_map[name_key] = cond_resource["fullUrl"]
    entries.extend(condition_entries)
    
    medication_entries = []
    if medications_data:
        for med_data in medications_data:
            reason_ref = None
            reason_name = med_data.get("reason", "").lower()
            if reason_name in condition_map:
                reason_ref = condition_map[reason_name]
            
            med_data["condition_ref"] = reason_ref
            
            # Build FHIR CodeableConcept from flat prompt output
            med_data["medication"] = build_medication_concept(med_data)

            med_resource = create_medication_request_resource(med_data)
            if med_resource:
                medication_entries.append(med_resource)
    entries.extend(medication_entries)

    # doc_ref_entry = None
    # if document_attachment:
    #     document_attachment["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
    #     doc_ref_resource = create_document_reference_resource(document_attachment)
    #     if doc_ref_resource:
    #         doc_ref_entry = doc_ref_resource
    #         entries.append(doc_ref_entry)

    comp_id = str(uuid.uuid4())
    all_section_entries = []
    for entry in medication_entries:
        all_section_entries.append({
            "reference": entry["fullUrl"],
            "type": "MedicationRequest"
        })
    for entry in condition_entries:
        all_section_entries.append({
            "reference": entry["fullUrl"],
            "type": "Condition"
        })
    # if doc_ref_entry:
    #     all_section_entries.append({
    #         "reference": doc_ref_entry["fullUrl"],
    #         "type": "Binary"
    #     })
    
    section_entries = [{
        "title": "Prescription record",
        "code": {
            "coding": [{
                "system": "http://snomed.info/sct",
                "code": "440545006",
                "display": "Prescription record"
            }]
        },
        "entry": all_section_entries
    }] if all_section_entries else []

    composition_resource = {
        "fullUrl": f"urn:uuid:{comp_id}",
        "resource": {
            "resourceType": "Composition",
            "id": comp_id,
            "meta": {
                "versionId": "1",
                "lastUpdated": timestamp,
                "profile": [
                    "https://nrces.in/ndhm/fhir/r4/StructureDefinition/PrescriptionRecord"
                ],
            },
            "language": "en-IN",
            "identifier": {
                "system": "https://ndhm.in/phr",
                "value": comp_id
            },
            "status": "final",
            "type": {
                "coding": [
                    {
                        "system": "http://snomed.info/sct",
                        "code": "440545006",
                        "display": "Prescription record",
                    }
                ],
                "text": "Prescription record",
            },
            #"subject": {"reference": patient_resource["fullUrl"] if patient_resource else None},
            "date": timestamp,
            #"author": [{"reference": practitioner_resource["fullUrl"] if practitioner_resource else None}],
            "title": "Prescription Record",
            #"custodian": {"reference": organization_resource["fullUrl"] if organization_resource else None},
            "section": section_entries,
        }
    }
    
    # if signature_data:
    #     signature_data["who_reference"] = practitioner_resource["fullUrl"] if practitioner_resource else None
    #     signature_data["when"] = timestamp
    #     signature = create_signature_resource(signature_data)
    #     composition_resource["resource"]["signature"] = signature

    entries.insert(0, composition_resource)

    bundle = {
        "resourceType": "Bundle",
        "id": bundle_id,
        "meta": {
            "versionId": "1",
            "lastUpdated": timestamp,
            "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"],
            "security": [
                {
                    "system": "http://terminology.hl7.org/CodeSystem/v3-Confidentiality",
                    "code": "V",
                    "display": "very restricted",
                }
            ],
        },
        "identifier": {"system": "http://hip.in", "value": bundle_id},
        "type": "document",
        "timestamp": timestamp,
        "entry": entries,
    }

    return bundle, input_tokens, output_tokens
