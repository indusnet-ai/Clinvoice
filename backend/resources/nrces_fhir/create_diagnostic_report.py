import uuid
from typing import Dict, Any, List

def create_diagnostic_report_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR DiagnosticReport resource.
    """
    diagnostic_report_id = str(uuid.uuid4())
    
    resource = {
        "fullUrl": f"urn:uuid:{diagnostic_report_id}",
        "resource": {
            "resourceType": "DiagnosticReport",
            "id": diagnostic_report_id,
            "status": data.get("status", "final"),
            "subject": {"reference": data.get("patient_ref")},
        },
    }

    if data.get("category"):
        category_data = data.get("category")
        # Handle both string and dict formats
        if isinstance(category_data, str):
            resource["resource"]["category"] = [{
                "coding": [{
                    "system": "http://snomed.info/sct",
                    "code": "",
                    "display": category_data
                }]
            }]
        elif isinstance(category_data, dict) and (category_data.get("code") or category_data.get("display")):
            resource["resource"]["category"] = [{
                "coding": [{
                    "system": "http://snomed.info/sct",
                    "code": category_data.get("code", ""),
                    "display": category_data.get("display", "")
                }]
            }]

    if data.get("code"):
        code_data = data.get("code")
        if isinstance(code_data, dict) and "coding" in code_data:
            resource["resource"]["code"] = code_data
        elif isinstance(code_data, dict):
            resource["resource"]["code"] = {
                "coding": [
                    {
                        "system": "http://loinc.org",
                        "code": code_data.get("code", ""),
                        "display": code_data.get("text") or code_data.get("display", "")
                    }
                ],
                "text": code_data.get("text") or code_data.get("display", "")
            }
        elif isinstance(code_data, str):
            # Handle string format
            resource["resource"]["code"] = {
                "coding": [
                    {
                        "system": "http://loinc.org",
                        "code": "",
                        "display": code_data
                    }
                ],
                "text": code_data
            }
        
    if data.get("issued"):
        resource["resource"]["issued"] = data.get("issued")
        
    if data.get("performer_ref"):
        resource["resource"]["performer"] = [{"reference": data.get("performer_ref")}]
        
    if data.get("resultsInterpreter_ref"):
        resource["resource"]["resultsInterpreter"] = [{"reference": data.get("resultsInterpreter_ref")}]

    if data.get("specimen_refs"):
        resource["resource"]["specimen"] = [{"reference": ref} for ref in data.get("specimen_refs")]

    if data.get("result_refs"):
        resource["resource"]["result"] = [{"reference": ref} for ref in data.get("result_refs")]
        
    if data.get("imaging_study_refs"):
        resource["resource"]["imagingStudy"] = [{"reference": ref} for ref in data.get("imaging_study_refs")]
        
    if data.get("media_refs"):
        resource["resource"]["media"] = [{"link": {"reference": ref}} for ref in data.get("media_refs")]

    if data.get("conclusion"):
        resource["resource"]["conclusion"] = data.get("conclusion")
        
    if data.get("conclusionCode"):
        conclusion_code_data = data.get("conclusionCode")
        # Handle both string and dict formats
        if isinstance(conclusion_code_data, str):
            resource["resource"]["conclusionCode"] = [{
                "coding": [{
                    "system": "http://snomed.info/sct",
                    "code": "",
                    "display": conclusion_code_data
                }]
            }]
        elif isinstance(conclusion_code_data, dict) and (conclusion_code_data.get("code") or conclusion_code_data.get("display") or conclusion_code_data.get("text")):
            resource["resource"]["conclusionCode"] = [{
                "coding": [{
                    "system": "http://snomed.info/sct",
                    "code": conclusion_code_data.get("code", ""),
                    "display": conclusion_code_data.get("display") or conclusion_code_data.get("text", "")
                }]
            }]
        
    if data.get("presentedForm"):
        resource["resource"]["presentedForm"] = [{
            "contentType": data.get("presentedForm").get("contentType", "application/pdf"),
            "language": data.get("presentedForm").get("language", "en-IN"),
            "data": data.get("presentedForm").get("data")
        }]

    return resource
