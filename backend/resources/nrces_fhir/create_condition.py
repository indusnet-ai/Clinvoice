import uuid
import datetime
from typing import Dict, Any

def create_condition_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR Condition resource.
    Uses code directly from LLM extraction via data['code'].
    """
    condition_id = str(uuid.uuid4())
    timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "+05:30"

    resource = {
        "fullUrl": f"urn:uuid:{condition_id}",
        "resource": {
            "resourceType": "Condition",
            "id": condition_id,
            "meta": {
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/Condition"]
            },
            # "subject": {
            #     "reference": data.get("patient_ref"),
            #     "display": "Patient"
            # },
            "recordedDate": timestamp
        }
    }

    if data.get("clinical_status"):
        resource["resource"]["clinicalStatus"] = {
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                "code": data.get("clinical_status"),
                "display": data.get("clinical_status")
            }]
        }

    if data.get("verification_status"):
        resource["resource"]["verificationStatus"] = {
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                "code": data.get("verification_status"),
                "display": data.get("verification_status")
            }]
        }
    
    # Use pre-built code from bundle service (from LLM output)
    if data.get("code"):
        resource["resource"]["code"] = data.get("code")
    elif data.get("condition_name"):
        # Fallback: build code from condition_name
        resource["resource"]["code"] = {
            "coding": [
                {
                    "system": "http://snomed.info/sct",
                    "code": data.get("snomed_code", ""),
                    "display": data.get("condition_name")
                }
            ],
            "text": data.get("condition_name")
        }

    if data.get("severity"):
        resource["resource"]["severity"] = {
            "coding": [{
                "system": "http://snomed.info/sct",
                "display": data.get("severity")
            }]
        }
    
    # Recorder field (Practitioner who recorded the condition)
    # if data.get("recorder_ref"):
    #     resource["resource"]["recorder"] = {
    #         "reference": data.get("recorder_ref")
    #     }
    
    # Onset fields (when the condition started)
    if data.get("onset_string"):
        resource["resource"]["onsetString"] = data.get("onset_string")
    elif data.get("onset_date"):
        resource["resource"]["onsetDateTime"] = data.get("onset_date")

    return resource
