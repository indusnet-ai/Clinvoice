import uuid
from typing import Dict, Any

def create_location_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR Location resource.
    """
    loc_id = str(uuid.uuid4())
    
    resource = {
        "fullUrl": f"urn:uuid:{loc_id}",
        "resource": {
            "resourceType": "Location",
            "id": loc_id,
            "status": "active",
            "mode": "instance",
        }
    }

    if data.get("name"):
        resource["resource"]["name"] = data.get("name")
    
    if data.get("description"):
        resource["resource"]["description"] = data.get("description")

    address = {}
    if data.get("postal_code"):
        address["postalCode"] = data.get("postal_code")
    if data.get("country"):
        address["country"] = data.get("country")
    if address:
        resource["resource"]["address"] = address

    if data.get("org_ref"):
        resource["resource"]["managingOrganization"] = {
            "reference": data.get("org_ref"),
            "display": data.get("org_display", "Organization")
        }
        
    resource["resource"]["type"] = [{
        "coding": [{
            "system": "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
            "code": "HOSP",
            "display": "Hospital"
        }]
    }]
    
    resource["resource"]["physicalType"] = {
        "coding": [{
            "system": "http://terminology.hl7.org/CodeSystem/location-physical-type",
            "code": "bu",
            "display": "Building"
        }]
    }

    return resource
