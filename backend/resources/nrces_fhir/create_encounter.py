import uuid
from typing import Dict, Any

def create_encounter_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR Encounter resource.
    """
    encounter_id = str(uuid.uuid4())
    
    resource = {
        "fullUrl": f"urn:uuid:{encounter_id}",
        "resource": {
            "resourceType": "Encounter",
            "id": encounter_id,
            "status": data.get("status", "finished"),
            #"subject": {"reference": data.get("patient_ref")},
        },
    }
    
    if data.get("encounter_class"):
        resource["resource"]["class"] = {
            "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            "code": data.get("encounter_class"),
            "display": data.get("encounter_class_display"),
        }

    period = {}
    if data.get("start_time"):
        period["start"] = data.get("start_time")
    if data.get("end_time"):
        period["end"] = data.get("end_time")
    if period:
        resource["resource"]["period"] = period

    if data.get("hospital_ref"):
        resource["resource"]["serviceProvider"] = {"reference": data.get("hospital_ref")}

    if data.get("diagnosis_refs"):
        resource["resource"]["diagnosis"] = []
        for diag_ref in data.get("diagnosis_refs"):
            resource["resource"]["diagnosis"].append({
                "condition": {"reference": diag_ref},
                "use": {
                    "coding": [{
                        "system": "http://snomed.info/sct",
                        "code": "39154008",
                        "display": "Clinical diagnosis"
                    }]
                }
            })
            
    return resource
