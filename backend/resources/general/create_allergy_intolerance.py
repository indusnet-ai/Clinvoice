import uuid
import datetime
from typing import Dict, Any


def create_allergy_intolerance_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR AllergyIntolerance resource.
    """
    allergy_id = str(uuid.uuid4())
    timestamp = datetime.datetime.utcnow().isoformat() + "Z"

    resource = {
        "fullUrl": f"urn:uuid:{allergy_id}",
        "resource": {
            "resourceType": "AllergyIntolerance",
            "id": allergy_id,
            "meta": {
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/AllergyIntolerance"]
            },
            "recordedDate": timestamp,
        },
    }

    # Code - using Claude-provided SNOMED codes
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

    # Clinical Status
    clinical_status = data.get("clinicalStatus", "active")
    resource["resource"]["clinicalStatus"] = {
        "coding": [{
            "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
            "code": clinical_status,
            "display": clinical_status.capitalize(),
        }]
    }

    # Verification Status
    verification_status = data.get("verificationStatus", "confirmed")
    resource["resource"]["verificationStatus"] = {
        "coding": [{
            "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
            "code": verification_status,
            "display": verification_status.capitalize(),
        }]
    }

    # Type
    if data.get("type"):
        resource["resource"]["type"] = data.get("type")

    # Category
    if data.get("category"):
        resource["resource"]["category"] = data.get("category")

    # Criticality
    if data.get("criticality"):
        resource["resource"]["criticality"] = data.get("criticality")

    # Reaction
    if data.get("reaction"):
        resource["resource"]["reaction"] = []
        for reaction in data.get("reaction"):
            reaction_resource = {"manifestation": []}
            manifestation = reaction.get("manifestation", "")
            if manifestation:
                reaction_resource["manifestation"].append({
                    "coding": [{
                        "system": "http://snomed.info/sct",
                        "display": manifestation
                    }],
                    "text": manifestation
                })
            if reaction.get("severity"):
                reaction_resource["severity"] = reaction.get("severity")
            resource["resource"]["reaction"].append(reaction_resource)

    # Note
    if data.get("note"):
        resource["resource"]["note"] = [{"text": data.get("note")}]

    return resource
