import uuid
import datetime
from typing import Dict, Any

def create_medication_statement_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR MedicationStatement resource.
    """
    medication_statement_id = str(uuid.uuid4())
    
    resource = {
        "fullUrl": f"urn:uuid:{medication_statement_id}",
        "resource": {
            "resourceType": "MedicationStatement",
            "id": medication_statement_id,
            #"subject": {"reference": data.get("patient_ref")},
            "dateAsserted": datetime.datetime.utcnow().isoformat() + "Z",
            "status": data.get("status", "active"),
        },
    }

    # Handle medication from various sources
    if data.get("medication"):
        # From bundle service (pre-built CodeableConcept)
        resource["resource"]["medicationCodeableConcept"] = data.get("medication")
    elif data.get("medicationCodeableConcept"):
        med_data = data.get("medicationCodeableConcept")
        # Handle both string and dict formats
        if isinstance(med_data, str):
            med_element = {"text": med_data}
        elif isinstance(med_data, dict):
            med_element = med_data  # Use as-is if already structured
        else:
            med_element = {"text": str(med_data)}
        resource["resource"]["medicationCodeableConcept"] = med_element
    elif data.get("medication_name"):
        # Fallback: build from medication_name
        resource["resource"]["medicationCodeableConcept"] = {
            "coding": [
                {
                    "system": "http://snomed.info/sct",
                    "code": data.get("code", ""),
                    "display": data.get("medication_name")
                }
            ],
            "text": data.get("medication_name")
        }

    if data.get("effectivePeriod"):
        resource["resource"]["effectivePeriod"] = data.get("effectivePeriod")
        
    return resource
