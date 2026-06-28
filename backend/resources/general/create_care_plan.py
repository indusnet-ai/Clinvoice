import uuid
import datetime
from typing import Dict, Any


def create_care_plan_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR CarePlan resource.
    """
    care_plan_id = str(uuid.uuid4())
    timestamp = datetime.datetime.utcnow().isoformat() + "Z"

    resource = {
        "fullUrl": f"urn:uuid:{care_plan_id}",
        "resource": {
            "resourceType": "CarePlan",
            "id": care_plan_id,
            "meta": {
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/CarePlan"]
            },
            "status": data.get("status", "active"),
            "intent": data.get("intent", "plan"),
            "created": timestamp
        },
    }

    # Title
    if data.get("title"):
        resource["resource"]["title"] = data.get("title")

    # Description
    if data.get("description"):
        resource["resource"]["description"] = data.get("description")

    # Category
    category = data.get("category", "")
    if category:
        resource["resource"]["category"] = [{
            "coding": [{
                "system": "http://hl7.org/fhir/care-plan-category",
                "display": category
            }],
            "text": category
        }]

    # Activities
    activities = data.get("activities", [])
    if activities:
        resource["resource"]["activity"] = []
        for activity in activities:
            resource["resource"]["activity"].append({
                "detail": {
                    "description": activity,
                    "status": "not-started"
                }
            })

    # Note
    if data.get("note"):
        resource["resource"]["note"] = [{"text": data.get("note")}]

    return resource
