import uuid
from typing import Dict, Any

def create_care_plan_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR CarePlan resource.
    """
    care_plan_id = str(uuid.uuid4())
    
    resource = {
        "fullUrl": f"urn:uuid:{care_plan_id}",
        "resource": {
            "resourceType": "CarePlan",
            "id": care_plan_id,
            "status": data.get("status", "active"),
            "intent": data.get("intent", "plan"),
            "subject": {"reference": data.get("patient_ref")},
        },
    }

    if data.get("title"):
        resource["resource"]["title"] = data.get("title")
    if data.get("description"):
        resource["resource"]["description"] = data.get("description")
        
    return resource
