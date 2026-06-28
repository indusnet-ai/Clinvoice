
import uuid
from datetime import datetime
from typing import Dict, Any

def create_practitioner_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates a FHIR Practitioner resource as a Python dictionary.
    """
    name = data.get("name")
    medical_license_number = data.get("medical_license_number")
    
    practitioner_id = str(uuid.uuid4())
    current_time = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "+00:00"

    practitioner_data = {
        "fullUrl": f"urn:uuid:{practitioner_id}",
        "resource": {
            "resourceType": "Practitioner",
            "id": practitioner_id,
            "meta": {
                "versionId": "1",
                "lastUpdated": current_time,
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/Practitioner"]
            },
            "text": {
                "status": "generated",
                "div": f"<div xmlns=\"http://www.w3.org/1999/xhtml\"><a name=\"Practitioner_{practitioner_id}\"> </a><p class=\"res-header-id\"><b>Generated Narrative: Practitioner {practitioner_id}</b></p><a name=\"{practitioner_id}\"> </a><a name=\"hc{practitioner_id}\"> </a><a name=\"{practitioner_id}-hi-IN\"> </a><div style=\"display: inline-block; background-color: #d9e0e7; padding: 6px; margin: 4px; border: 1px solid #8da1b4; border-radius: 5px; line-height: 60%\"><p style=\"margin-bottom: 0px\">version: 1; Last updated: {current_time}</p><p style=\"margin-bottom: 0px\">Profile: <a href=\"StructureDefinition-Practitioner.html\">Practitioner</a></p></div><p><b>identifier</b>: Medical License number/{medical_license_number}</p><p><b>name</b>: {name}</p></div>"
            },
            "identifier": [
                {
                    "type": {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
                                "code": "MD",
                                "display": "Medical License number"
                            }
                        ]
                    },
                    "system": "https://doctor.ndhm.gov.in",
                    "value": medical_license_number
                }
            ],
            "name": [
                {
                    "text": name
                }
            ]
        }
    }

    return practitioner_data
