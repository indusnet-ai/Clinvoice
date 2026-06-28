import json
import uuid
import datetime
import logging
import os
from typing import Dict, Any, Optional, List
from pathlib import Path

from services.nrces_fhir.llm_service import generate_response, init_llm_client
from services.nrces_fhir.code_utils import build_codeable_concept, build_observation_code
#from resources.nrces_fhir.create_patient import create_patient_resource
#from resources.nrces_fhir.create_practitioner import create_practitioner_resource
#from resources.nrces_fhir.create_organization import create_organization_resource
from resources.nrces_fhir.create_allergy_intolerance import create_allergy_intolerance_resource
from resources.nrces_fhir.create_condition import create_condition_resource
from resources.nrces_fhir.create_procedure import create_procedure_resource
from resources.nrces_fhir.create_service_request import create_service_request_resource
from resources.nrces_fhir.create_medication_statement import create_medication_statement_resource
from resources.nrces_fhir.create_medication_request import create_medication_request_resource
from resources.nrces_fhir.create_encounter import create_encounter_resource
from resources.nrces_fhir.create_appointment import create_appointment_resource
#from resources.nrces_fhir.create_document_reference import create_document_reference_resource
from resources.nrces_fhir.create_composition import create_composition_resource
from resources.nrces_fhir.create_family_member_history import create_family_member_history_resource
from resources.nrces_fhir.create_observation import create_observation_resource

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


async def create_op_consult_bundle(
    conversation_text: str,
    #patient_details: Optional[Dict[str, Any]] = None,
    #practitioner_details: Optional[Dict[str, Any]] = None,
    #org_details: Optional[Dict[str, Any]] = None,
    #document_attachment: Optional[Dict[str, Any]] = None,
) -> tuple[Dict[str, Any], int, int]:
    """
    Creates a FHIR OP Consultation Bundle from a conversation.
    """
    client = init_llm_client()
    if not client:
        return {"error": "Failed to initialize AI client"}

    # Use centralized prompts directory
    prompt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "prompts", "nrces_fhir", "prompt_opconsult.txt")
    extracted_data_json, input_tokens, output_tokens = await generate_response(
        conversation_text, client, prompt_file=str(prompt_path)
    )
    
    # Parse JSON with better error handling
    try:
        if not extracted_data_json or not extracted_data_json.strip():
            raise ValueError("LLM returned empty response")
        extracted_data = json.loads(extracted_data_json)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {e}")
        logger.error(f"Raw response (first 500 chars): {extracted_data_json[:500] if extracted_data_json else 'EMPTY'}")
        raise ValueError(f"LLM returned invalid JSON: {e}")

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

    chief_complaints_entries = []
    physical_examination_entries = []
    allergies_entries = []
    medical_history_entries = []
    family_member_history_entries = []
    investigation_advice_entries = []
    medications_entries = []
    procedure_entries = []
    referral_entries = []
    other_observations_entries = []
    follow_up_entries = []
    document_entries = []
    diagnosis_refs = []
    
    for allergy_data in extracted_data.get("allergies", []):
        # Build FHIR CodeableConcept from flat prompt output
        allergy_data["code"] = build_codeable_concept(allergy_data)

        resource = create_allergy_intolerance_resource(allergy_data)
        if resource:
            entries.append(resource)
            allergies_entries.append({"reference": resource["fullUrl"]})

    # Chief Complaints - Create as Observations (patient-reported symptoms)
    for complaint_data in extracted_data.get("chief_complaints", []):
        # Build FHIR CodeableConcept from flat prompt output
        complaint_data["code"] = build_observation_code(complaint_data)
        
        # Set observation-specific fields
        complaint_data["value"] = complaint_data.get("text", "")
        complaint_data["value_type"] = "string"
        complaint_data["category"] = "Chief Complaint"
        
        # Add duration as note if present
        if complaint_data.get("duration"):
            complaint_data["note"] = f"Duration: {complaint_data.get('duration')}"

        resource = create_observation_resource(complaint_data)
        if resource:
            entries.append(resource)
            chief_complaints_entries.append({"reference": resource["fullUrl"]})

    # Diagnoses - Create as Conditions (clinician-confirmed conditions)
    for diagnosis_data in extracted_data.get("diagnoses", []):
        # Build FHIR CodeableConcept from flat prompt output
        diagnosis_data["code"] = build_codeable_concept(diagnosis_data)
        
        # Map condition name for create_condition_resource
        if not diagnosis_data.get("condition_name"):
            diagnosis_data["condition_name"] = (
                diagnosis_data.get("display") or 
                diagnosis_data.get("text") or 
                ""
            )

        resource = create_condition_resource(diagnosis_data)
        if resource:
            entries.append(resource)
            diagnosis_refs.append(resource["fullUrl"])
            status = diagnosis_data.get("clinicalStatus", "active").lower()
            if status != "active":
                medical_history_entries.append({"reference": resource["fullUrl"]})
                
                
    for procedure_data in extracted_data.get("procedures", []):
        # Build FHIR CodeableConcept from flat prompt output
        procedure_data["code"] = build_codeable_concept(procedure_data)

        resource = create_procedure_resource(procedure_data)
        if resource:
            entries.append(resource)
            procedure_entries.append({"reference": resource["fullUrl"]})

    for service_request_data in extracted_data.get("servicerequests", []):
        # Build FHIR CodeableConcept from flat prompt output
        service_request_data["code"] = build_codeable_concept(service_request_data)

        resource = create_service_request_resource(service_request_data)
        if resource:
            entries.append(resource)
            investigation_advice_entries.append({"reference": resource["fullUrl"]})

    for med_statement_data in extracted_data.get("medicationstatements", []):
        # Build FHIR CodeableConcept from flat prompt output
        med_statement_data["medication"] = build_codeable_concept(med_statement_data)
        
        # Map medication name for medication statement
        if not med_statement_data.get("medication_name"):
            med_statement_data["medication_name"] = (
                med_statement_data.get("display") or 
                med_statement_data.get("text") or 
                ""
            )

        resource = create_medication_statement_resource(med_statement_data)
        if resource:
            entries.append(resource)
            medications_entries.append({"reference": resource["fullUrl"]})

    for med_request_data in extracted_data.get("medicationrequests", []):
        # Build FHIR CodeableConcept from flat prompt output
        med_request_data["medication"] = build_codeable_concept(med_request_data)
        
        # Map medication name for medication request
        if not med_request_data.get("medication_name"):
            med_request_data["medication_name"] = (
                med_request_data.get("display") or 
                med_request_data.get("text") or 
                ""
            )
        
        # Flatten dosage object to individual fields for create_medication_request
        dosage = med_request_data.get("dosage", {})
        if isinstance(dosage, dict):
            # Map nested dosage fields to flat fields expected by create_medication_request
            if dosage.get("text"):
                med_request_data["dosage_instruction"] = str(dosage.get("text"))  # Must be string!
            if dosage.get("frequency"):
                med_request_data["frequency"] = dosage.get("frequency")
            if dosage.get("period"):
                med_request_data["period"] = dosage.get("period")
            if dosage.get("periodUnit"):
                med_request_data["period_unit"] = dosage.get("periodUnit")
            if dosage.get("route"):
                med_request_data["route"] = dosage.get("route")
            if dosage.get("additionalInstruction"):
                med_request_data["additional_instruction"] = dosage.get("additionalInstruction")
            # Add doseValue and doseUnit for doseAndRate
            if dosage.get("doseValue"):
                med_request_data["dose_value"] = dosage.get("doseValue")
            if dosage.get("doseUnit"):
                med_request_data["dose_unit"] = dosage.get("doseUnit")
            # Add meal context for timing.when
            if dosage.get("mealContext"):
                med_request_data["meal_context"] = dosage.get("mealContext")
            # Add dispenseRequest fields if present
            if dosage.get("quantity"):
                med_request_data["quantity_value"] = dosage.get("quantity")
            if dosage.get("quantityUnit"):
                med_request_data["quantity_unit"] = dosage.get("quantityUnit")
            if dosage.get("duration"):
                med_request_data["duration_value"] = dosage.get("duration")

        resource = create_medication_request_resource(med_request_data)
        if resource:
            entries.append(resource)
            medications_entries.append({"reference": resource["fullUrl"]})

    for phys_exam_data in extracted_data.get("physical_examination", []):
        phys_exam_data["category"] = "Physical Exam"
        
        # Build FHIR CodeableConcept from flat prompt output
        phys_exam_data["code"] = build_observation_code(phys_exam_data)

        resource = create_observation_resource(phys_exam_data)
        if resource:
            entries.append(resource)
            physical_examination_entries.append({"reference": resource["fullUrl"]})

    for family_history_data in extracted_data.get("family_member_history", []):
        #family_history_data["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
        resource = create_family_member_history_resource(family_history_data)
        if resource:
            entries.append(resource)
            family_member_history_entries.append({"reference": resource["fullUrl"]})

    for referral_data in extracted_data.get("referrals", []):
        service_request_data = {
            #"patient_ref": patient_resource["fullUrl"] if patient_resource else None,
            #"requester_ref": practitioner_resource["fullUrl"] if practitioner_resource else None,
            "status": "active",
            "intent": "order",
            "category": [{"text": "Referral"}],
            "code": {"text": referral_data.get("specialty", "") + " - " + referral_data.get("reason", "")}
        }
        resource = create_service_request_resource(service_request_data)
        if resource:
            entries.append(resource)
            referral_entries.append({"reference": resource["fullUrl"]})

    for other_obs_data in extracted_data.get("other_observations", []):
        #other_obs_data["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
        #other_obs_data["performer_ref"] = practitioner_resource["fullUrl"] if practitioner_resource else None
        #other_obs_data["performer_name"] = practitioner_details.get("name") if practitioner_details else None
        resource = create_observation_resource(other_obs_data)
        if resource:
            entries.append(resource)
            other_observations_entries.append({"reference": resource["fullUrl"]})

    encounter_data = {
        #"patient_ref": patient_resource["fullUrl"] if patient_resource else None,
        "diagnosis_refs": diagnosis_refs
    }
    encounter_resource = create_encounter_resource(encounter_data)
    entries.append(encounter_resource)

    for follow_up_data in extracted_data.get("follow_up", []):
        appointment_data = {
            #"patient_ref": patient_resource["fullUrl"] if patient_resource else None,
            #"practitioner_ref": practitioner_resource["fullUrl"] if practitioner_resource else None,
            "description": follow_up_data.get("reason", "Follow-up visit") + " - " + follow_up_data.get("instruction", ""),
        }
        if follow_up_data.get("date"):
            appointment_data["start_time"] = follow_up_data.get("date") + "T09:00:00Z"
            appointment_data["end_time"] = follow_up_data.get("date") + "T09:30:00Z"
            
        resource = create_appointment_resource(appointment_data)
        if resource:
            entries.append(resource)
            follow_up_entries.append({"reference": resource["fullUrl"]})

    # if document_attachment:
    #     document_attachment["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
    #     doc_ref_resource = create_document_reference_resource(document_attachment)
    #     if doc_ref_resource:
    #         entries.append(doc_ref_resource)
    #         document_entries.append({"reference": doc_ref_resource["fullUrl"]})

    sections = []
    if chief_complaints_entries:
        sections.append({
            "title": "Chief complaints",
            "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "422843007", "display": "Chief complaint section" }] },
            "entry": chief_complaints_entries
        })
    if physical_examination_entries:
        sections.append({
            "title": "Physical Examination",
            "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "425044008", "display": "Physical exam section" }] },
            "entry": physical_examination_entries
        })
    if allergies_entries:
        sections.append({
            "title": "Allergies",
            "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "722446000", "display": "Allergy record" }] },
            "entry": allergies_entries
        })
    if medical_history_entries:
        sections.append({
            "title": "Medical History",
            "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "371529009", "display": "History and physical report" }] },
            "entry": medical_history_entries
        })
    if family_member_history_entries:
        sections.append({
            "title": "Family Member History",
            "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "422432008", "display": "Family history section" }] },
            "entry": family_member_history_entries
        })
    if investigation_advice_entries:
        sections.append({
            "title": "Investigation Advice",
            "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "721963009", "display": "Order document" }] },
            "entry": investigation_advice_entries
        })
    if medications_entries:
        sections.append({
            "title": "Medications",
            "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "721912009", "display": "Medication summary document" }] },
            "entry": medications_entries
        })
    if procedure_entries:
        sections.append({
            "title": "Procedure",
            "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "371525003", "display": "Clinical procedure report" }] },
            "entry": procedure_entries
        })
    if referral_entries:
        sections.append({
            "title": "Referrals",
            "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "306206005", "display": "Referral note" }] },
            "entry": referral_entries
        })
    if other_observations_entries:
        sections.append({
            "title": "Other Observations",
            "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "700047008", "display": "Other observations" }] },
            "entry": other_observations_entries
        })
    if follow_up_entries:
        sections.append({
            "title": "Follow Up",
            "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "736271009", "display": "Outpatient care plan" }] },
            "entry": follow_up_entries
        })
    # if document_entries:
    #     sections.append({
    #         "title": "Document Reference",
    #         "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "371530004", "display": "Clinical consultation report" }] },
    #         "entry": document_entries
    #     })

    composition_data = {
        "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultRecord"],
        "identifier_system": "https://ndhm.in/phr",
        "identifier_value": str(uuid.uuid4()),
        "type_code": "371530004",
        "type_display": "Clinical consultation report",
        #"subject_ref": patient_resource["fullUrl"] if patient_resource else None,
        "encounter_ref": encounter_resource["fullUrl"] if encounter_resource else None,
        #"author_refs": [practitioner_resource["fullUrl"]] if practitioner_resource else [],
        "title": "OP Consultation Note",
        #"custodian_ref": organization_resource["fullUrl"] if organization_resource else None,
        "sections": sections,
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
