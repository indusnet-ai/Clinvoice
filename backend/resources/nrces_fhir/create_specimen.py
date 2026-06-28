import uuid
import datetime
from typing import Dict, Any

def create_specimen_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR Specimen resource.
    """
    specimen_id = str(uuid.uuid4())
    
    resource = {
        "fullUrl": f"urn:uuid:{specimen_id}",
        "resource": {
            "resourceType": "Specimen",
            "id": specimen_id,
            "subject": {"reference": data.get("patient_ref")},
        },
    }

    if data.get("type"):
        type_data = data.get("type")
        # Handle both string and dict formats
        if isinstance(type_data, str):
            resource["resource"]["type"] = {"text": type_data}
        elif isinstance(type_data, dict):
            resource["resource"]["type"] = {"text": type_data.get("text", str(type_data))}
        else:
            resource["resource"]["type"] = {"text": str(type_data)}

    if data.get("receivedTime"):
        resource["resource"]["receivedTime"] = data.get("receivedTime")
    else:
        resource["resource"]["receivedTime"] = datetime.datetime.utcnow().isoformat() + "Z"
        
    return resource
