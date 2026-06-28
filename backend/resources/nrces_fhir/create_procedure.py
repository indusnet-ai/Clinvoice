import uuid
import datetime
from typing import Dict, Any

def create_procedure_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR Procedure resource.
    """
    procedure_id = str(uuid.uuid4())
    
    resource = {
        "fullUrl": f"urn:uuid:{procedure_id}",
        "resource": {
            "resourceType": "Procedure",
            "id": procedure_id,
            #"subject": {"reference": data.get("patient_ref")},
            "status": data.get("status", "completed"),
        },
    }

    if data.get("code"):
        code_data = data.get("code")
        if isinstance(code_data, dict) and "coding" in code_data:
            resource["resource"]["code"] = code_data
        elif isinstance(code_data, dict):
            code_element = {
                "coding": [
                    {
                        "system": "http://snomed.info/sct",
                        "code": code_data.get("code", ""),
                        "display": code_data.get("text") or code_data.get("display", "")
                    }
                ],
                "text": code_data.get("text") or code_data.get("display", "")
            }
            resource["resource"]["code"] = code_element
        elif isinstance(code_data, str):
            # Handle string format
            code_element = {
                "coding": [
                    {
                        "system": "http://snomed.info/sct",
                        "code": "",
                        "display": code_data
                    }
                ],
                "text": code_data
            }
            resource["resource"]["code"] = code_element

    # Auto-correct status based on performedDateTime
    # Status "preparation" is incompatible with performedDateTime
    if data.get("performedDateTime"):
        resource["resource"]["performedDateTime"] = data.get("performedDateTime")
        if resource["resource"]["status"] == "preparation":
            resource["resource"]["status"] = "completed"
    else:
        resource["resource"]["performedDateTime"] = datetime.datetime.utcnow().isoformat() + "Z"
        if resource["resource"]["status"] == "preparation":
            resource["resource"]["status"] = "completed"
        
    if data.get("followUp"):
        resource["resource"]["followUp"] = []
        follow_ups = data.get("followUp")
        # Handle if follow_ups is a list or a single item
        if not isinstance(follow_ups, list):
            follow_ups = [follow_ups]
        for follow_up in follow_ups:
            # Handle both string and dict formats
            if isinstance(follow_up, str):
                fu_element = {"text": follow_up}
            elif isinstance(follow_up, dict):
                fu_element = {"text": follow_up.get("text", str(follow_up))}
            else:
                fu_element = {"text": str(follow_up)}
            resource["resource"]["followUp"].append(fu_element)
            
    return resource
