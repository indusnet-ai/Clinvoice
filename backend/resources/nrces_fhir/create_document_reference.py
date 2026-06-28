import uuid
import datetime
from typing import Dict, Any

def create_document_reference_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR DocumentReference resource.
    """
    doc_ref_id = str(uuid.uuid4())
    current_time = datetime.datetime.now(datetime.timezone.utc).isoformat()

    resource = {
        "fullUrl": f"urn:uuid:{doc_ref_id}",
        "resource": {
            "resourceType": "DocumentReference",
            "id": doc_ref_id,
            "meta": {
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentReference"]
            },
            "status": "current",
            "subject": {
                "reference": data.get("patient_ref"),
                "display": "Patient"
            },
        }
    }

    if data.get("doc_status"):
        resource["resource"]["docStatus"] = data.get("doc_status")
    
    if data.get("doc_type"):
        resource["resource"]["type"] = {
            "text": data.get("doc_type")
        }

    attachment = {}
    if data.get("content_type"):
        attachment["contentType"] = data.get("content_type")
    if data.get("language"):
        attachment["language"] = data.get("language")
    if data.get("data"):
        attachment["data"] = data.get("data")
    if data.get("title"):
        attachment["title"] = data.get("title")
    if data.get("creation"):
        attachment["creation"] = data.get("creation")
    
    if attachment:
        resource["resource"]["content"] = [{"attachment": attachment}]

    return resource
