
import uuid
from typing import Dict, Any

def create_organization_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates a FHIR Organization resource as a Python dictionary.
    """
    name = data.get("name")
    identifier_value = data.get("identifier_value")
    phone = data.get("phone")
    email = data.get("email")
    
    org_id = str(uuid.uuid4())
    
    organization_data = {
        "fullUrl": f"urn:uuid:{org_id}",
        "resource": {
            "resourceType": "Organization",
            "id": org_id,
            "meta": {
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/Organization"]
            },
            "text": {
                "status": "generated",
                "div": f"<div xmlns=\"http://www.w3.org/1999/xhtml\"><a name=\"Organization_{org_id}\"> </a><p class=\"res-header-id\"><b>Generated Narrative: Organization {org_id}</b></p><a name=\"{org_id}\"> </a><a name=\"hc{org_id}\"> </a><a name=\"{org_id}-hi-IN\"> </a><p><b>identifier</b>: Provider number/{identifier_value}</p><p><b>name</b>: {name}</p><p><b>telecom</b>: <a href=\"tel:{phone}\">{phone}</a>, <a href=\"mailto:{email}\">{email}</a></p></div>"
            },
            "identifier": [{
                "type": {
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
                        "code": "PRN",
                        "display": "Provider number"
                    }]
                },
                "system": "https://facility.ndhm.gov.in",
                "value": identifier_value
            }],
            "name": name,
            "telecom": [{
                "system": "phone",
                "value": phone,
                "use": "work"
            },
            {
                "system": "email",
                "value": email,
                "use": "work"
            }]
        }
    }
    
    return organization_data
