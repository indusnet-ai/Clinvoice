
import uuid
from datetime import datetime
from typing import Dict, Any

def create_patient_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates a FHIR Patient resource as a Python dictionary.
    """
    name = data.get("name")
    medical_record_number = data.get("medical_record_number")
    phone = data.get("phone")
    gender = data.get("gender")
    birth_date = data.get("birth_date")
    
    patient_id = str(uuid.uuid4())
    current_time = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "+00:00"

    patient_data = {
        "fullUrl": f"urn:uuid:{patient_id}",
        "resource": {
            "resourceType": "Patient",
            "id": patient_id,
            "meta": {
                "versionId": "1",
                "lastUpdated": current_time,
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient"]
            },
            "text": {
                "status": "generated",
                "div": f"<div xmlns=\"http://www.w3.org/1999/xhtml\"><a name=\"Patient_{patient_id}\"> </a><p class=\"res-header-id\"><b>Generated Narrative: Patient {patient_id}</b></p><a name=\"{patient_id}\"> </a><a name=\"hc{patient_id}\"> </a><a name=\"{patient_id}-hi-IN\"> </a><div style=\"display: inline-block; background-color: #d9e0e7; padding: 6px; margin: 4px; border: 1px solid #8da1b4; border-radius: 5px; line-height: 60%\"><p style=\"margin-bottom: 0px\">version: 1; Last updated: {current_time}</p><p style=\"margin-bottom: 0px\">Profile: <a href=\"StructureDefinition-Patient.html\">Patient</a></p></div><p style=\"border: 1px #661aff solid; background-color: #e6e6ff; padding: 10px;\">{name} {gender.capitalize()}, DoB: {birth_date} ( Medical record number: {medical_record_number})</p><hr/><table class=\"grid\"><tr><td style=\"background-color: #f3f5da\" title=\"Ways to contact the Patient\">Contact Detail</td><td colspan=\"3\"><a href=\"tel:{phone}\">{phone}</a></td></tr></table></div>"
            },
            "identifier": [
                {
                    "type": {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
                                "code": "MR",
                                "display": "Medical record number"
                            }
                        ]
                    },
                    "system": "https://healthid.ndhm.gov.in",
                    "value": medical_record_number
                }
            ],
            "name": [
                {
                    "text": name
                }
            ],
            "telecom": [
                {
                    "system": "phone",
                    "value": phone,
                    "use": "home"
                }
            ],
            "gender": gender,
            "birthDate": birth_date
        }
    }

    return patient_data
