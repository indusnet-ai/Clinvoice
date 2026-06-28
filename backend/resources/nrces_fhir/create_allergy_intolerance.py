import uuid
import datetime
from typing import Dict, Any

def create_allergy_intolerance_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR AllergyIntolerance resource.
    """
    allergy_id = str(uuid.uuid4())
    
    resource = {
        "fullUrl": f"urn:uuid:{allergy_id}",
        "resource": {
            "resourceType": "AllergyIntolerance",
            "id": allergy_id,
            #"patient": {"reference": data.get("patient_ref")},
            #"recorder": {"reference": data.get("recorder_ref")},
            "recordedDate": datetime.datetime.utcnow().isoformat() + "Z",
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

    if data.get("clinicalStatus"):
        resource["resource"]["clinicalStatus"] = {
            "coding": [
                {
                    "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
                    "code": data.get("clinicalStatus"),
                    "display": data.get("clinicalStatus").capitalize(),
                }
            ]
        }

    if data.get("verificationStatus"):
        resource["resource"]["verificationStatus"] = {
            "coding": [
                {
                    "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
                    "code": data.get("verificationStatus"),
                    "display": data.get("verificationStatus").capitalize(),
                }
            ]
        }

    if data.get("reaction"):
        resource["resource"]["reaction"] = []
        reactions = data.get("reaction")
        # Handle if reactions is a list or a single item
        if not isinstance(reactions, list):
            reactions = [reactions]
        for reaction in reactions:
            reaction_resource = {"manifestation": []}
            # Handle manifestation field
            manifestations = reaction.get("manifestation") if isinstance(reaction, dict) else None
            if manifestations:
                # Handle if manifestations is a list or a single item
                if not isinstance(manifestations, list):
                    manifestations = [manifestations]
                for manifestation in manifestations:
                    # Handle both string and dict formats
                    if isinstance(manifestation, str):
                        man_element = {"text": manifestation}
                    elif isinstance(manifestation, dict):
                        man_element = {"text": manifestation.get("text", str(manifestation))}
                    else:
                        man_element = {"text": str(manifestation)}
                    reaction_resource["manifestation"].append(man_element)
            # Handle severity field
            if isinstance(reaction, dict) and "severity" in reaction:
                reaction_resource["severity"] = reaction.get("severity")
            resource["resource"]["reaction"].append(reaction_resource)
            
    return resource
