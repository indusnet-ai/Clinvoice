import uuid
import datetime
from typing import Dict, Any


def create_procedure_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR Procedure resource.
    """
    procedure_id = str(uuid.uuid4())
    timestamp = datetime.datetime.utcnow().isoformat() + "Z"

    resource = {
        "fullUrl": f"urn:uuid:{procedure_id}",
        "resource": {
            "resourceType": "Procedure",
            "id": procedure_id,
            "meta": {
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/Procedure"]
            },
            "status": data.get("status", "completed"),
            "performedDateTime": data.get("performedDateTime") or timestamp
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

    # Body site
    if data.get("bodySite"):
        resource["resource"]["bodySite"] = [{
            "text": data.get("bodySite")
        }]

    # Follow up
    if data.get("followUp"):
        resource["resource"]["followUp"] = [{
            "text": data.get("followUp")
        }]

    # Note
    if data.get("note"):
        resource["resource"]["note"] = [{"text": data.get("note")}]

    return resource
