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
from resources.nrces_fhir.create_diagnostic_report import create_diagnostic_report_resource
from resources.nrces_fhir.create_observation import create_observation_resource
from resources.nrces_fhir.create_specimen import create_specimen_resource
from resources.nrces_fhir.create_service_request import create_service_request_resource
from resources.nrces_fhir.create_document_reference import create_document_reference_resource
from resources.nrces_fhir.create_composition import create_composition_resource
from resources.nrces_fhir.create_imaging_study import create_imaging_study_resource
from resources.nrces_fhir.create_media import create_media_resource


async def create_diagnostic_report_bundle(
    conversation_text: str,
    report_type: str = "lab",  # "lab" or "imaging"
    patient_details: Optional[Dict[str, Any]] = None,
    practitioner_details: Optional[Dict[str, Any]] = None,
    organization_details: Optional[Dict[str, Any]] = None,
    document_attachment: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Creates a FHIR Diagnostic Report Bundle (Lab or Imaging) from a conversation.
    """
    client = init_llm_client()
    if not client:
        return {"error": "Failed to initialize AI client"}

    # Use centralized prompts directory
    # Select prompt based on report type
    if report_type.lower() == "lab":
        prompt_filename = "prompt_diagnostic_report_lab.txt"
    elif report_type.lower() == "imaging":
        prompt_filename = "prompt_diagnostic_report_imaging.txt"
    else:
        return {"error": f"Invalid report_type: {report_type}. Must be 'lab' or 'imaging'"}
    
    prompt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "prompts", "nrces_fhir", prompt_filename)
    extracted_data_json = await generate_response(
        conversation_text, client, prompt_file=str(prompt_path)
    )
    extracted_data = json.loads(extracted_data_json) if extracted_data_json else {}

    bundle_id = str(uuid.uuid4())
    timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "+05:30"
    entries = []

    # 1. Patient
    patient_resource = None
    if patient_details:
        patient_resource = create_patient_resource(patient_details)
        entries.append(patient_resource)

    # 2. Practitioner (Performer/Interpreter)
    practitioner_resource = None
    if practitioner_details:
        practitioner_resource = create_practitioner_resource(practitioner_details)
        entries.append(practitioner_resource)

    # 3. Organization (Performer)
    organization_resource = None
    if organization_details:
        organization_resource = create_organization_resource(organization_details)
        entries.append(organization_resource)

    # 4. ServiceRequest
    service_request_resource = None
    if extracted_data.get("service_request"):
        sr_data = extracted_data.get("service_request")
        if isinstance(sr_data, list):
            sr_data = sr_data[0] if sr_data else None
            
        if sr_data:
            sr_data["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
            sr_data["requester_ref"] = practitioner_resource["fullUrl"] if practitioner_resource else None
        
        # Build FHIR CodeableConcept from flat prompt output
        sr_data["code"] = build_codeable_concept(sr_data)
        
        service_request_resource = create_service_request_resource(sr_data)
        entries.append(service_request_resource)

    # 5. Specimen (for Lab)
    specimen_refs = []
    if report_type == "lab":
        for specimen_data in extracted_data.get("specimens", []):
            specimen_data["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
            
            # Build FHIR CodeableConcept from flat prompt output
            if specimen_data.get("code") or specimen_data.get("display") or specimen_data.get("text"):
                specimen_data["type"] = build_codeable_concept(specimen_data)

            resource = create_specimen_resource(specimen_data)
            if resource:
                entries.append(resource)
                specimen_refs.append(resource["fullUrl"])

    # 6. Observations (for Lab)
    result_refs = []
    if report_type == "lab":
        for observation_data in extracted_data.get("observations", []):
            observation_data["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
            
            # Build FHIR CodeableConcept from flat prompt output
            observation_data["code"] = build_observation_code(observation_data)
            
            resource = create_observation_resource(observation_data)
            if resource:
                entries.append(resource)
                result_refs.append(resource["fullUrl"])

    # 7. ImagingStudy and Media (for Imaging)
    imaging_study_refs = []
    media_refs = []
    if report_type == "imaging":
        for study_data in extracted_data.get("imaging_studies", []):
            study_data["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
            study_data["interpreter_ref"] = practitioner_resource["fullUrl"] if practitioner_resource else None
            
            # Resolve bodySite using SNOMED
            for series in study_data.get("series", []):
                # Resolve Modality (Simple mapping as we don't have a DICOM service)
                modality_map = {
                    "Computed Tomography": "CT",
                    "CT": "CT",
                    "Magnetic Resonance Imaging": "MR",
                    "MRI": "MR",
                    "Ultrasound": "US",
                    "X-Ray": "DX",
                    "Digital X-Ray": "DX",
                    "Nuclear Medicine": "NM",
                    "Mammography": "MG"
                }
                if series.get("modality_display"):
                    display = series["modality_display"]
                    # Try to find a matching code
                    for key, code in modality_map.items():
                        if key.lower() in display.lower():
                            series["modality_code"] = code
                            break
                    if not series.get("modality_code"):
                         series["modality_code"] = "OT" # Other

                if series.get("bodySite"):
                     body_site_text = series["bodySite"]
                     if isinstance(body_site_text, dict):
                         body_site_text = body_site_text.get("display") or body_site_text.get("text")
                     
                     if body_site_text:
                         series["bodySite"] = {"text": body_site_text}

            resource = create_imaging_study_resource(study_data)
            if resource:
                entries.append(resource)
                imaging_study_refs.append(resource["fullUrl"])
        
        for media_data in extracted_data.get("media", []):
            media_data["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
            
            # Resolve bodySite - use text fallback
            if media_data.get("bodySite"):
                 body_site_text = media_data["bodySite"]
                 if isinstance(body_site_text, dict):
                     body_site_text = body_site_text.get("display") or body_site_text.get("text")
                 if body_site_text:
                     media_data["bodySite"] = {"text": body_site_text}

            resource = create_media_resource(media_data)
            if resource:
                entries.append(resource)
                media_refs.append(resource["fullUrl"])

    # 8. DiagnosticReport
    diagnostic_report_data = extracted_data.get("diagnostic_report", {})
    diagnostic_report_data["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
    diagnostic_report_data["performer_ref"] = organization_resource["fullUrl"] if organization_resource else None
    diagnostic_report_data["resultsInterpreter_ref"] = practitioner_resource["fullUrl"] if practitioner_resource else None
    
    # Build FHIR CodeableConcept from flat prompt output
    diagnostic_report_data["code"] = build_observation_code(diagnostic_report_data)
    
    # Ensure code is present for Imaging
    if report_type == "imaging" and not diagnostic_report_data.get("code"):
         diagnostic_report_data["code"] = {
             "coding": [{
                 "system": "http://loinc.org",
                 "code": "18748-4",
                 "display": "Diagnostic imaging study"
             }],
             "text": "Diagnostic imaging study"
         }

    # Resolve Category - use text fallback or keep as-is if already structured
    if diagnostic_report_data.get("category"):
        category_input = diagnostic_report_data["category"]
        if isinstance(category_input, str):
            diagnostic_report_data["category"] = {"text": category_input}
    
    # Force default category for Imaging if missing or generic
    if report_type == "imaging":
        # Check if we have a valid category, if not or if it's empty, set default
        has_valid_category = False
        if diagnostic_report_data.get("category") and "coding" in diagnostic_report_data["category"]:
             has_valid_category = True
        
        if not has_valid_category:
             diagnostic_report_data["category"] = {
                "coding": [
                    {
                        "system": "http://snomed.info/sct",
                        "code": "363679005",
                        "display": "Imaging"
                    },
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/v2-0074",
                        "code": "RAD",
                        "display": "Radiology"
                    }
                ]
            }

    # Resolve ConclusionCode - use text fallback
    if diagnostic_report_data.get("conclusionCode"):
        conclusion_input = diagnostic_report_data["conclusionCode"]
        if isinstance(conclusion_input, str):
            diagnostic_report_data["conclusionCode"] = {"text": conclusion_input}
        elif isinstance(conclusion_input, dict) and "coding" not in conclusion_input:
            diagnostic_report_data["conclusionCode"] = {"text": conclusion_input.get("text") or conclusion_input.get("display") or str(conclusion_input)}

    if report_type == "lab":
        diagnostic_report_data["specimen_refs"] = specimen_refs
        diagnostic_report_data["result_refs"] = result_refs
    else:
        diagnostic_report_data["imaging_study_refs"] = imaging_study_refs
        diagnostic_report_data["media_refs"] = media_refs

    # Add presentedForm if available (e.g. from input or extracted)
    if document_attachment:
         diagnostic_report_data["presentedForm"] = document_attachment

    diagnostic_report_resource = create_diagnostic_report_resource(diagnostic_report_data)
    entries.append(diagnostic_report_resource)

    # 9. DocumentReference (Optional, usually for the PDF report itself if separate)
    doc_ref_resource = None
    if document_attachment:
        doc_data = document_attachment.copy()
        doc_data["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
        doc_ref_resource = create_document_reference_resource(doc_data)
        entries.append(doc_ref_resource)

    # 10. Composition
    composition_sections = []
    
    # Main Report Section
    report_entry = [{"reference": diagnostic_report_resource["fullUrl"]}]
    section_code = "721981007" if report_type == "lab" else "721981007" # Diagnostic studies report
    section_display = "Diagnostic studies report"
    
    composition_sections.append({
        "title": "Diagnostic Report",
        "code": { "coding": [{ "system": "http://snomed.info/sct", "code": section_code, "display": section_display }] },
        "entry": report_entry
    })
    
    if doc_ref_resource:
         composition_sections.append({
            "title": "Document Reference",
            "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "371530004", "display": "Clinical consultation report" }] },
            "entry": [{"reference": doc_ref_resource["fullUrl"]}]
        })

    composition_data = {
        "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportRecord"],
        "type_code": "721981007",
        "type_display": "Diagnostic studies report",
        "subject_ref": patient_resource["fullUrl"] if patient_resource else None,
        "author_refs": [practitioner_resource["fullUrl"]] if practitioner_resource else [],
        "title": f"Diagnostic Report - {report_type.capitalize()}",
        "custodian_ref": organization_resource["fullUrl"] if organization_resource else None,
        "sections": composition_sections,
        "status": "final"
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

    return bundle
