import uuid
from typing import Dict, Any

def create_media_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR Media resource.
    """
    media_id = str(uuid.uuid4())
    
    resource = {
        "fullUrl": f"urn:uuid:{media_id}",
        "resource": {
            "resourceType": "Media",
            "id": media_id,
            "status": data.get("status", "completed"),
            "subject": {"reference": data.get("patient_ref")},
            "content": {
                "contentType": data.get("content", {}).get("contentType", "image/jpeg"),
                "data": data.get("content", {}).get("data")
            }
        },
    }
    
    if data.get("modality"):
        modality_data = data.get("modality")
        # Handle both string and dict formats
        if isinstance(modality_data, str):
            resource["resource"]["modality"] = {
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/media-modality",
                    "code": modality_data,
                    "display": modality_data.capitalize()
                }]
            }
        elif isinstance(modality_data, dict):
            resource["resource"]["modality"] = {
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/media-modality",
                    "code": modality_data.get("code", "image"),
                    "display": modality_data.get("display", "Image")
                }]
            }

    if data.get("createdDateTime"):
        resource["resource"]["createdDateTime"] = data.get("createdDateTime")
        
    if data.get("bodySite"):
        body_site_data = data.get("bodySite")
        # Handle both string and dict formats
        if isinstance(body_site_data, str):
            resource["resource"]["bodySite"] = {
                "coding": [{
                    "system": "http://snomed.info/sct",
                    "code": "",
                    "display": body_site_data
                }]
            }
        elif isinstance(body_site_data, dict):
            resource["resource"]["bodySite"] = {
                "coding": [{
                    "system": "http://snomed.info/sct",
                    "code": body_site_data.get("code", ""),
                    "display": body_site_data.get("display") or body_site_data.get("text", "")
                }]
            }

    return resource
