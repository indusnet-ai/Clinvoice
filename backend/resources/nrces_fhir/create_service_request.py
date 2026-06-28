import uuid
import datetime
from typing import Dict, Any

def create_service_request_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR ServiceRequest resource.
    """
    service_request_id = str(uuid.uuid4())
    
    resource = {
        "fullUrl": f"urn:uuid:{service_request_id}",
        "resource": {
            "resourceType": "ServiceRequest",
            "id": service_request_id,
            #"subject": {"reference": data.get("patient_ref")},
            #"requester": {"reference": data.get("requester_ref")},
            "authoredOn": datetime.datetime.utcnow().isoformat() + "Z",
            "status": data.get("status", "active"),
            "intent": data.get("intent", "order"),
        },
    }

    if data.get("code"):
        code_data = data.get("code")
        if isinstance(code_data, dict) and "coding" in code_data:
            resource["resource"]["code"] = code_data
        elif isinstance(code_data, dict):
            code_element = {
                "coding": [
                    {
                        "system": "http://snomed.info/sct",
                        "code": code_data.get("code", ""),
                        "display": code_data.get("text") or code_data.get("display", "")
                    }
                ],
                "text": code_data.get("text") or code_data.get("display", "")
            }
            resource["resource"]["code"] = code_element
        elif isinstance(code_data, str):
            # Handle string format
            code_element = {
                "coding": [
                    {
                        "system": "http://snomed.info/sct",
                        "code": "",
                        "display": code_data
                    }
                ],
                "text": code_data
            }
            resource["resource"]["code"] = code_element

    # SNOMED coding for service request categories
    SERVICE_REQUEST_CATEGORY_CODES = {
        "laboratory": {"code": "108252007", "display": "Laboratory procedure", "system": "http://snomed.info/sct"},
        "lab": {"code": "108252007", "display": "Laboratory procedure", "system": "http://snomed.info/sct"},
        "radiology": {"code": "363679005", "display": "Imaging", "system": "http://snomed.info/sct"},
        "imaging": {"code": "363679005", "display": "Imaging", "system": "http://snomed.info/sct"},
        "procedure": {"code": "71388002", "display": "Procedure", "system": "http://snomed.info/sct"},
        "counseling": {"code": "409063005", "display": "Counseling", "system": "http://snomed.info/sct"},
        "referral": {"code": "306206005", "display": "Referral to service", "system": "http://snomed.info/sct"},
    }
    
    if data.get("category"):
        resource["resource"]["category"] = []
        categories = data.get("category")
        # Handle if categories is a list or a single item
        if not isinstance(categories, list):
            categories = [categories]
        for cat in categories:
            # Extract text from category
            if isinstance(cat, str):
                cat_text = cat
            elif isinstance(cat, dict):
                cat_text = cat.get("text", str(cat))
            else:
                cat_text = str(cat)
            
            cat_lower = cat_text.lower().strip()
            
            # Build category element with coding if available
            if cat_lower in SERVICE_REQUEST_CATEGORY_CODES:
                code_info = SERVICE_REQUEST_CATEGORY_CODES[cat_lower]
                cat_element = {
                    "coding": [
                        {
                            "system": code_info["system"],
                            "code": code_info["code"],
                            "display": code_info["display"]
                        }
                    ],
                    "text": cat_text
                }
            else:
                # Fallback to text-only if unknown category
                cat_element = {"text": cat_text}
            
            resource["resource"]["category"].append(cat_element)
            
    return resource
