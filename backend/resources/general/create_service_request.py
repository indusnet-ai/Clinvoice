import uuid
import datetime
from typing import Dict, Any


def create_service_request_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR ServiceRequest resource.
    """
    service_request_id = str(uuid.uuid4())
    timestamp = datetime.datetime.utcnow().isoformat() + "Z"

    resource = {
        "fullUrl": f"urn:uuid:{service_request_id}",
        "resource": {
            "resourceType": "ServiceRequest",
            "id": service_request_id,
            "meta": {
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/ServiceRequest"]
            },
            "authoredOn": timestamp,
            "status": data.get("status", "active"),
            "intent": data.get("intent", "order"),
        },
    }

    # Code
    code = data.get("code", "")
    display = data.get("display", "")
    text = data.get("text", display)
    
    resource["resource"]["code"] = {
        "coding": [{
            "system": "http://snomed.info/sct",
            "code": str(code) if code else "",
            "display": display
        }],
        "text": text
    }

    # Category
    category = data.get("category", "")
    if category:
        resource["resource"]["category"] = [{
            "coding": [{
                "system": "http://snomed.info/sct",
                "display": category
            }],
            "text": category
        }]

    # Priority
    if data.get("priority"):
        resource["resource"]["priority"] = data.get("priority")

    # Note
    if data.get("note"):
        resource["resource"]["note"] = [{"text": data.get("note")}]

    return resource
