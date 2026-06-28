import uuid
from typing import Dict, Any

def create_appointment_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR Appointment resource.
    """
    appointment_id = str(uuid.uuid4())
    
    resource = {
        "fullUrl": f"urn:uuid:{appointment_id}",
        "resource": {
            "resourceType": "Appointment",
            "id": appointment_id,
            "status": data.get("status", "booked"),
            # "participant": [
            #     {"actor": {"reference": data.get("patient_ref")}, "status": "accepted"},
            #     {"actor": {"reference": data.get("practitioner_ref")}, "status": "accepted"}
            # ],
        },
    }

    if data.get("start_time"):
        resource["resource"]["start"] = data.get("start_time")
    if data.get("end_time"):
        resource["resource"]["end"] = data.get("end_time")
    if data.get("description"):
        resource["resource"]["description"] = data.get("description")
    if data.get("service_category_code"):
        resource["resource"]["serviceCategory"] = [
            {
                "coding": [
                    {
                        "system": "http://snomed.info/sct",
                        "code": data.get("service_category_code"),
                        "display": data.get("service_category_display"),
                    }
                ]
            }
        ]
    if data.get("service_type_code"):
        resource["resource"]["serviceType"] = [
            {
                "coding": [
                    {
                        "system": "http://snomed.info/sct",
                        "code": data.get("service_type_code"),
                        "display": data.get("service_type_display"),
                    }
                ]
            }
        ]
    if data.get("appointment_type_code"):
        resource["resource"]["appointmentType"] = {
            "coding": [
                {
                    "system": "http://snomed.info/sct",
                    "code": data.get("appointment_type_code"),
                    "display": data.get("appointment_type_display"),
                }
            ]
        }

    return resource
