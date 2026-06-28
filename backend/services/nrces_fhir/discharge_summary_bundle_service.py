import json
import uuid
import datetime
import os
from typing import Dict, Any, Optional
from pathlib import Path

from services.nrces_fhir.llm_service import generate_response, init_llm_client
from services.nrces_fhir.code_utils import build_codeable_concept, build_observation_code
from resources.nrces_fhir.create_patient import create_patient_resource
from resources.nrces_fhir.create_practitioner import create_practitioner_resource
from resources.nrces_fhir.create_organization import create_organization_resource
from resources.nrces_fhir.create_condition import create_condition_resource
from resources.nrces_fhir.create_observation import create_observation_resource
from resources.nrces_fhir.create_procedure import create_procedure_resource
from resources.nrces_fhir.create_medication_request import create_medication_request_resource
from resources.nrces_fhir.create_allergy_intolerance import create_allergy_intolerance_resource
from resources.nrces_fhir.create_family_member_history import create_family_member_history_resource
from resources.nrces_fhir.create_care_plan import create_care_plan_resource
from resources.nrces_fhir.create_encounter import create_encounter_resource
from resources.nrces_fhir.create_document_reference import create_document_reference_resource
from resources.nrces_fhir.create_composition import create_composition_resource


async def create_discharge_summary_bundle(
    conversation_text: str,
    patient_details: Optional[Dict[str, Any]] = None,
    practitioner_details: Optional[Dict[str, Any]] = None,
    hospital_details: Optional[Dict[str, Any]] = None,
    lab_details: Optional[Dict[str, Any]] = None,
    document_attachment: Optional[Dict[str, Any]] = None,
    signature_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Creates a FHIR Discharge Summary Bundle from a conversation.
    """
    client = init_llm_client()
    if not client:
        return {"error": "Failed to initialize AI client"}

    # Use centralized prompts directory
    prompt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "prompts", "nrces_fhir", "prompt_discharge_summary.txt")
    extracted_data_json = await generate_response(
        conversation_text, client, prompt_file=str(prompt_path)
    )
    extracted_data = json.loads(extracted_data_json) if extracted_data_json else {}

    bundle_id = str(uuid.uuid4())
    timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "+05:30"
    entries = []

    patient_resource = None
    if patient_details:
        patient_resource = create_patient_resource(patient_details)
        entries.append(patient_resource)

    practitioner_resource = None
    if practitioner_details:
        practitioner_resource = create_practitioner_resource(practitioner_details)
        entries.append(practitioner_resource)

    hospital_resource = None
    if hospital_details:
        hospital_resource = create_organization_resource(hospital_details)
        entries.append(hospital_resource)
        
    lab_resource = None
    if lab_details:
        lab_resource = create_organization_resource(lab_details)
        entries.append(lab_resource)

    encounter_data = {
        "patient_ref": patient_resource["fullUrl"] if patient_resource else None,
        "start_time": extracted_data.get("admission_date"),
        "end_time": extracted_data.get("discharge_date"),
        "hospital_ref": hospital_resource["fullUrl"] if hospital_resource else None,
    }
    encounter_resource = create_encounter_resource(encounter_data)
    entries.append(encounter_resource)

    chief_complaints_entries = []
    physical_examination_entries = []
    medical_history_entries = []
    family_member_history_entries = []
    allergies_entries = []
    investigation_entries = []
    procedure_entries = []
    medication_entries = []
    care_plan_entries = []
    follow_up_entries = []
    document_entries = []
    specimen_refs = []

    for condition_data in extracted_data.get("conditions", []):
        condition_data["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
        
        # Build FHIR CodeableConcept from flat prompt output
        condition_data["code"] = build_codeable_concept(condition_data)

        resource = create_condition_resource(condition_data)
        if resource:
            entries.append(resource)
            status = condition_data.get("clinicalStatus", "active").lower()
            if status == "active":
                chief_complaints_entries.append({"reference": resource["fullUrl"]})
            else:
                medical_history_entries.append({"reference": resource["fullUrl"]})
    
    for observation_data in extracted_data.get("observations", []):
        observation_data["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
        
        # Build FHIR CodeableConcept from flat prompt output
        observation_data["code"] = build_observation_code(observation_data)

        resource = create_observation_resource(observation_data)
        if resource:
            entries.append(resource)
            investigation_entries.append({"reference": resource["fullUrl"]})

    for procedure_data in extracted_data.get("procedures", []):
        procedure_data["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
        
        # Build FHIR CodeableConcept from flat prompt output
        procedure_data["code"] = build_codeable_concept(procedure_data)

        resource = create_procedure_resource(procedure_data)
        if resource:
            entries.append(resource)
            procedure_entries.append({"reference": resource["fullUrl"]})

    for med_request_data in extracted_data.get("medicationrequests", []):
        med_request_data["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
        med_request_data["requester_ref"] = practitioner_resource["fullUrl"] if practitioner_resource else None
        
        # Build FHIR CodeableConcept from flat prompt output
        med_request_data["medication"] = build_codeable_concept(med_request_data)

        resource = create_medication_request_resource(med_request_data)
        if resource:
            entries.append(resource)
            medication_entries.append({"reference": resource["fullUrl"]})
            
    for care_plan_data in extracted_data.get("careplans", []):
        care_plan_data["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
        # CarePlan category/code could be resolved, but often text instructions. 
        # If there's a specific code field, we can resolve it. Assuming text for now or already handled.
        resource = create_care_plan_resource(care_plan_data)
        if resource:
            entries.append(resource)
            care_plan_entries.append({"reference": resource["fullUrl"]})

    for specimen_data in extracted_data.get("specimens", []):
        specimen_data["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
        
        # Build FHIR CodeableConcept from flat prompt output for type
        if specimen_data.get("code"):
            specimen_data["type"] = build_codeable_concept(specimen_data)
        elif specimen_data.get("display") or specimen_data.get("text"):
            specimen_data["type"] = build_codeable_concept(specimen_data)

        resource = create_specimen_resource(specimen_data)
        if resource:
            entries.append(resource)
            specimen_refs.append(resource["fullUrl"])

    for report_data in extracted_data.get("diagnosticreports", []):
        report_data["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
        report_data["performer_ref"] = lab_resource["fullUrl"] if report_data.get("performer") == "lab" else hospital_resource["fullUrl"]
        report_data["specimen_refs"] = specimen_refs
        
        # Build FHIR CodeableConcept from flat prompt output
        report_data["code"] = build_observation_code(report_data)
        
        # Build conclusionCode if present
        if report_data.get("conclusionCode"):
            report_data["conclusionCode"] = build_codeable_concept({"code": report_data.get("conclusionCode"), "codeSystem": "http://snomed.info/sct"})

        resource = create_diagnostic_report_resource(report_data)
        if resource:
            entries.append(resource)
            investigation_entries.append({"reference": resource["fullUrl"]})

    for phys_exam_data in extracted_data.get("physical_examination", []):
        phys_exam_data["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
        phys_exam_data["performer_ref"] = practitioner_resource["fullUrl"] if practitioner_resource else None
        phys_exam_data["performer_name"] = practitioner_details.get("name") if practitioner_details else None
        phys_exam_data["category"] = "Physical Exam"
        
        # Build FHIR CodeableConcept from flat prompt output
        phys_exam_data["code"] = build_observation_code(phys_exam_data)

        resource = create_observation_resource(phys_exam_data)
        if resource:
            entries.append(resource)
            physical_examination_entries.append({"reference": resource["fullUrl"]})

    for allergy_data in extracted_data.get("allergies", []):
        allergy_data["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
        allergy_data["recorder_ref"] = practitioner_resource["fullUrl"] if practitioner_resource else None
        
        # Build FHIR CodeableConcept from flat prompt output
        allergy_data["code"] = build_codeable_concept(allergy_data)

        resource = create_allergy_intolerance_resource(allergy_data)
        if resource:
            entries.append(resource)
            allergies_entries.append({"reference": resource["fullUrl"]})

    for family_history_data in extracted_data.get("family_member_history", []):
        family_history_data["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
        
        # Resolve condition code using SNOMED
        if family_history_data.get("condition"):
             # Assuming structure might have condition list or single
             # If it's a list of conditions in the resource generator, we might need to handle it there or here.
             # create_family_member_history_resource likely expects a specific structure.
             # Let's assume it takes a 'condition' field which has a code.
             pass # Logic depends on resource generator, but let's try to resolve if 'condition' key exists and has code
             
        resource = create_family_member_history_resource(family_history_data)
        if resource:
            entries.append(resource)
            family_member_history_entries.append({"reference": resource["fullUrl"]})

    for follow_up_data in extracted_data.get("follow_up", []):
        appointment_data = {
            "patient_ref": patient_resource["fullUrl"] if patient_resource else None,
            "practitioner_ref": practitioner_resource["fullUrl"] if practitioner_resource else None,
            "description": follow_up_data.get("reason", "Follow-up visit") + " - " + follow_up_data.get("instruction", ""),
        }
        if follow_up_data.get("date"):
            appointment_data["start_time"] = follow_up_data.get("date") + "T09:00:00Z"
            appointment_data["end_time"] = follow_up_data.get("date") + "T09:30:00Z"
            
        resource = create_appointment_resource(appointment_data)
        if resource:
            entries.append(resource)
            follow_up_entries.append({"reference": resource["fullUrl"]})

    if document_attachment:
        document_attachment["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
        doc_ref_resource = create_document_reference_resource(document_attachment)
        if doc_ref_resource:
            entries.append(doc_ref_resource)
            document_entries.append({"reference": doc_ref_resource["fullUrl"]})

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
    if allergies_entries:
        sections.append({
            "title": "Allergies",
            "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "722446000", "display": "Allergy record" }] },
            "entry": allergies_entries
        })
    if investigation_entries:
        sections.append({
            "title": "Investigations",
            "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "104145002", "display": "Allergies and adverse reactions document" }] },
            "entry": investigation_entries
        })
    if procedure_entries:
        sections.append({
            "title": "Procedures",
            "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "371525003", "display": "Clinical procedure report" }] },
            "entry": procedure_entries
        })
    if medication_entries:
        sections.append({
            "title": "Medications",
            "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "721912009", "display": "Medication summary document" }] },
            "entry": medication_entries
        })
    if care_plan_entries:
        sections.append({
            "title": "Care Plan",
            "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "736271009", "display": "Outpatient care plan" }] },
            "entry": care_plan_entries
        })
    if follow_up_entries:
        sections.append({
            "title": "Follow Up",
            "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "736271009", "display": "Outpatient care plan" }] },
            "entry": follow_up_entries
        })
    if document_entries:
        sections.append({
            "title": "Document Reference",
            "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "371530004", "display": "Clinical consultation report" }] },
            "entry": document_entries
        })

    composition_data = {
        "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DischargeSummaryRecord"],
        "type_code": "373942005",
        "type_display": "Discharge summary",
        "subject_ref": patient_resource["fullUrl"] if patient_resource else None,
        "encounter_ref": encounter_resource["fullUrl"] if encounter_resource else None,
        "author_refs": [practitioner_resource["fullUrl"]] if practitioner_resource else [],
        "title": "Discharge Summary",
        "custodian_ref": hospital_resource["fullUrl"] if hospital_resource else None,
        "sections": sections,
    }
    
    if signature_data:
        signature_data["who_reference"] = practitioner_resource["fullUrl"] if practitioner_resource else None
        signature_data["when"] = timestamp
        signature = create_signature_resource(signature_data)
        composition_data["signature"] = signature

    composition_resource = create_composition_resource(composition_data)
    entries.insert(0, composition_resource)

    provenance_data = {
        "target_ref": composition_resource["fullUrl"],
        "agent_refs": [practitioner_resource["fullUrl"]] if practitioner_resource else [],
        "signature": [composition_data["signature"]] if "signature" in composition_data else None
    }
    provenance_resource = create_provenance_resource(provenance_data)
    entries.append(provenance_resource)

    bundle = {
        "resourceType": "Bundle",
        "id": bundle_id,
        "type": "document",
        "timestamp": timestamp,
        "entry": entries,
    }

    return bundle
