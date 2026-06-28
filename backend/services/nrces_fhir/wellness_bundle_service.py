import json
import uuid
import datetime
from typing import Dict, Any, Optional
from pathlib import Path

from core.config import settings
from services.nrces_fhir.llm_service import generate_response, init_llm_client
from services.nrces_fhir.code_utils import build_observation_code
#from resources.nrces_fhir.create_patient import create_patient_resource
#from resources.nrces_fhir.create_practitioner import create_practitioner_resource
#from resources.nrces_fhir.create_organization import create_organization_resource
from resources.nrces_fhir.create_wellness_observation import create_wellness_observation_resource
#from resources.nrces_fhir.create_document_reference import create_document_reference_resource
from resources.nrces_fhir.create_composition import create_composition_resource



async def create_wellness_bundle(
    conversation_text: str,
    #patient_details: Optional[Dict[str, Any]] = None,
    #practitioner_details: Optional[Dict[str, Any]] = None,
    #org_details: Optional[Dict[str, Any]] = None,
    #document_attachment: Optional[Dict[str, Any]] = None,
) -> tuple[Dict[str, Any], int, int]:
    """
    Creates a FHIR Wellness Record Bundle from a conversation.
    """
    client = init_llm_client()
    if not client:
        return {"error": "Failed to initialize AI client"}

    # Use centralized prompts directory
    import os
    prompt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "prompts", "nrces_fhir", "prompt_wellness.txt")
    extracted_data_json, input_tokens, output_tokens = await generate_response(
        conversation_text, client, prompt_file=str(prompt_path)
    )

    try:
        clinical_data = json.loads(extracted_data_json) if extracted_data_json else {}
    except json.JSONDecodeError:
        clinical_data = {}

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

    observation_entries = []
    if "observations" in clinical_data:
        for obs_data in clinical_data["observations"]:
            # Build FHIR CodeableConcept from flat prompt output fields
            obs_data["code"] = build_observation_code(obs_data)
            
            obs_entry = create_wellness_observation_resource(obs_data)
            if obs_entry:
                observation_entries.append(obs_entry)
    entries.extend(observation_entries)

    # doc_ref_entry = None
    # if document_attachment:
    #     document_attachment["patient_ref"] = patient_resource["fullUrl"] if patient_resource and "fullUrl" in patient_resource else None
    #     doc_ref_resource = create_document_reference_resource(document_attachment)
    #     if doc_ref_resource:
    #         doc_ref_entry = doc_ref_resource
    #         entries.append(doc_ref_entry)

    comp_id = str(uuid.uuid4())
    section_entries = []

    if observation_entries:
        categories = set(obs["resource"]["category"][0]["coding"][0]["display"] for obs in observation_entries if obs.get("resource", {}).get("category") and obs["resource"]["category"][0]["coding"])
        for category in categories:
            category_obs_entries = []
            for entry in observation_entries:
                try:
                    entry_cat = entry["resource"]["category"][0]["coding"][0]["display"]
                    if entry_cat == category:
                        category_obs_entries.append({
                            "reference": entry["fullUrl"],
                            "display": entry["resource"]["code"]["text"]
                        })
                except (KeyError, IndexError):
                    continue
            
            if category_obs_entries:
                section_entries.append({
                    "title": category,
                    "entry": category_obs_entries
                })

    # if doc_ref_entry:
    #     section_entries.append(
    #         {
    #             "title": "Document Reference",
    #             "entry": [
    #                 {"reference": doc_ref_entry["fullUrl"], "display": "DocumentReference"}
    #             ],
    #         }
    #     )

    composition_resource = {
        "fullUrl": f"urn:uuid:{comp_id}",
        "resource": {
            "resourceType": "Composition",
            "id": comp_id,
            "meta": {
                "versionId": "1",
                "lastUpdated": timestamp,
                "profile": [
                    "https://nrces.in/ndhm/fhir/r4/StructureDefinition/WellnessRecord"
                ],
            },
            "language": "en-IN",
            "status": "final",
            "type": {
                "coding": [
                    {
                        "system": "http://snomed.info/sct",
                        "code": "419891008",
                        "display": "Wellness record",
                    }
                ],
                "text": "Wellness record",
            },
            # "subject": {
            #     "reference": patient_resource["fullUrl"] if patient_resource and "fullUrl" in patient_resource else None,
            #     "display": patient_details.get("name") if patient_details else None
            #     },
            "date": timestamp,
            # "author": [{
            #     "reference": practitioner_resource["fullUrl"] if practitioner_resource and "fullUrl" in practitioner_resource else None,
            #     "display": practitioner_details.get("name") if practitioner_details else None
            #     }],
            "title": "Wellness Record",
            # "custodian": {"reference": organization_resource["fullUrl"] if organization_resource and "fullUrl" in organization_resource else None},
            "section": section_entries,
        }
    }
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
