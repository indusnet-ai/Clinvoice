import uuid
import datetime
from typing import Dict, Any


def create_composition_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR Composition resource.
    """
    comp_id = str(uuid.uuid4())
    timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "+05:30"

    resource = {
        "fullUrl": f"urn:uuid:{comp_id}",
        "resource": {
            "resourceType": "Composition",
            "id": comp_id,
            "meta": {
                "versionId": "1",
                "lastUpdated": timestamp,
                "profile": data.get("profile", ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultRecord"])
            },
            "language": "en-IN",
            "status": "final",
            "date": timestamp,
            "identifier": {
                "system": data.get("identifier_system", "https://ndhm.in/phr"),
                "value": data.get("identifier_value", comp_id)
            }
        }
    }

    # Type
    type_code = data.get("type_code", "371530004")
    type_display = data.get("type_display", "Clinical consultation report")
    resource["resource"]["type"] = {
        "coding": [{
            "system": "http://snomed.info/sct",
            "code": type_code,
            "display": type_display,
        }],
        "text": type_display,
    }

    # Title
    resource["resource"]["title"] = data.get("title", "Clinical Consultation Note")

    # Sections
    if data.get("sections"):
        resource["resource"]["section"] = data.get("sections")

    return resource
