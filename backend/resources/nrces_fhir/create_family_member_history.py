import uuid
import datetime
from typing import Dict, Any, List, Optional

def create_family_member_history_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR FamilyMemberHistory resource.
    Uses code from LLM extraction if provided.
    
    Args:
        data (Dict[str, Any]): Dictionary containing family member history details.
            Expected keys: patient_ref, relationship, condition_name, onset_age, deceased_boolean
            
    Returns:
        Dict[str, Any]: A dictionary representing the FHIR FamilyMemberHistory resource.
    """
    history_id = str(uuid.uuid4())
    current_time = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "+00:00"

    resource = {
        "fullUrl": f"urn:uuid:{history_id}",
        "resource": {
            "resourceType": "FamilyMemberHistory",
            "id": history_id,
            "meta": {
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/FamilyMemberHistory"]
            },
            "status": data.get("status", "completed"),
            # "patient": {"reference": data.get("patient_ref")},
            "date": current_time,
        }
    }

    if data.get("relationship"):
        resource["resource"]["relationship"] = {
            "coding": [
                {
                    "system": "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
                    "code": data.get("relationship"),
                    "display": data.get("relationship").capitalize()
                }
            ],
            "text": data.get("relationship").capitalize()
        }

    if data.get("deceased_boolean") is not None:
        resource["resource"]["deceasedBoolean"] = data.get("deceased_boolean")
    elif data.get("deceased_date"):
        resource["resource"]["deceasedDate"] = data.get("deceased_date")

    if data.get("condition_name") or data.get("condition"):
        condition_name = data.get("condition_name") or data.get("condition", "")
        
        condition_entry = {
            "code": {
                "coding": [
                    {
                        "system": "http://snomed.info/sct",
                        "code": data.get("code", {}).get("code", "") if isinstance(data.get("code"), dict) else data.get("snomed_code", ""),
                        "display": condition_name
                    }
                ],
                "text": condition_name
            }
        }
        if data.get("onset_age") or data.get("onsetAge"):
            onset_age = data.get("onset_age") or data.get("onsetAge")
            condition_entry["onsetAge"] = {
                "value": onset_age,
                "unit": "years",
                "system": "http://unitsofmeasure.org",
                "code": "a"
            }
        resource["resource"]["condition"] = [condition_entry]

    return resource
