import uuid
import datetime
from typing import Dict, Any, List

def create_composition_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR Composition resource.
    """
    comp_id = str(uuid.uuid4())
    timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "+05:30"

    resource = {
        "fullUrl": f"urn:uuid:{comp_id}",
        "resource": {
            "resourceType": "Composition",
            "id": comp_id,
            "meta": {
                "versionId": "1",
                "lastUpdated": timestamp,
            },
            "language": "en-IN",
            "status": "final",
            "date": timestamp,
        }
    }

    if data.get("profile"):
        resource["resource"]["meta"]["profile"] = data.get("profile")

    if data.get("identifier_system") and data.get("identifier_value"):
        resource["resource"]["identifier"] = {
            "system": data.get("identifier_system"),
            "value": data.get("identifier_value")
        }

    if data.get("type_code") and data.get("type_display"):
        resource["resource"]["type"] = {
            "coding": [
                {
                    "system": "http://snomed.info/sct",
                    "code": data.get("type_code"),
                    "display": data.get("type_display"),
                }
            ],
            "text": data.get("type_display"),
        }
    
    if data.get("subject_ref"):
        resource["resource"]["subject"] = {"reference": data.get("subject_ref")}
    
    if data.get("encounter_ref"):
        resource["resource"]["encounter"] = {"reference": data.get("encounter_ref")}

    if data.get("author_refs"):
        resource["resource"]["author"] = [{"reference": ref} for ref in data.get("author_refs")]

    if data.get("title"):
        resource["resource"]["title"] = data.get("title")

    if data.get("custodian_ref"):
        resource["resource"]["custodian"] = {"reference": data.get("custodian_ref")}

    if data.get("sections"):
        resource["resource"]["section"] = data.get("sections")
        
    if data.get("signature"):
        resource["resource"]["signature"] = data.get("signature")

    return resource
