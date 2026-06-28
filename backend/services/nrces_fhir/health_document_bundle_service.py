import json
import uuid
import datetime
from typing import Dict, Any, Optional

from fhir_v2.resources.create_patient import create_patient_resource
from fhir_v2.resources.create_practitioner import create_practitioner_resource
from fhir_v2.resources.create_organization import create_organization_resource
from fhir_v2.resources.create_document_reference import create_document_reference_resource
from fhir_v2.resources.create_composition import create_composition_resource
from fhir_v2.resources.create_signature import create_signature_resource

async def create_health_document_bundle(
    patient_details: Optional[Dict[str, Any]] = None,
    practitioner_details: Optional[Dict[str, Any]] = None,
    org_details: Optional[Dict[str, Any]] = None,
    document_attachment: Optional[Dict[str, Any]] = None,
    signature_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Creates a FHIR Health Document Record Bundle.
    """
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

    organization_resource = None
    if org_details:
        organization_resource = create_organization_resource(org_details)
        entries.append(organization_resource)

    doc_ref_entry = None
    if document_attachment:
        document_attachment["patient_ref"] = patient_resource["fullUrl"] if patient_resource else None
        doc_ref_resource = create_document_reference_resource(document_attachment)
        if doc_ref_resource:
            doc_ref_entry = doc_ref_resource
            entries.append(doc_ref_entry)

    composition_data = {
        "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/HealthDocumentRecord"],
        "identifier_system": "https://ndhm.in/phr",
        "identifier_value": str(uuid.uuid4()),
        "type_code": "419891008",
        "type_display": "Record artifact",
        "subject_ref": patient_resource["fullUrl"] if patient_resource else None,
        "author_refs": [practitioner_resource["fullUrl"]] if practitioner_resource else [],
        "title": "Health Document",
        "custodian_ref": organization_resource["fullUrl"] if organization_resource else None,
        "sections": [
            {
                "title": "Health Document",
                "code": {
                    "coding": [
                        {
                            "system": "http://snomed.info/sct",
                            "code": "419891008",
                            "display": "Record artifact",
                        }
                    ]
                },
                "entry": [
                    {"reference": doc_ref_entry["fullUrl"], "type": "DocumentReference"}
                ] if doc_ref_entry else [],
            }
        ],
    }
    
    if signature_data:
        signature_data["who_reference"] = practitioner_resource["fullUrl"] if practitioner_resource else None
        signature_data["when"] = timestamp
        signature = create_signature_resource(signature_data)
        composition_data["signature"] = signature

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
