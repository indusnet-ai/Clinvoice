import uuid
from typing import Dict, Any, List

def create_imaging_study_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR ImagingStudy resource.
    """
    imaging_study_id = str(uuid.uuid4())
    
    resource = {
        "fullUrl": f"urn:uuid:{imaging_study_id}",
        "resource": {
            "resourceType": "ImagingStudy",
            "id": imaging_study_id,
            "status": data.get("status", "available"),
            "subject": {"reference": data.get("patient_ref")},
        },
    }

    if data.get("identifier"):
        resource["resource"]["identifier"] = [{
            "system": "https://xyz.com/imaging/study", # Placeholder system
            "value": data.get("identifier")
        }]

    if data.get("interpreter_ref"):
        resource["resource"]["interpreter"] = [{"reference": data.get("interpreter_ref")}]
        
    if data.get("numberOfSeries"):
        resource["resource"]["numberOfSeries"] = data.get("numberOfSeries")
        
    if data.get("numberOfInstances"):
        resource["resource"]["numberOfInstances"] = data.get("numberOfInstances")
        
    if data.get("series"):
        resource["resource"]["series"] = []
        for series_data in data.get("series"):
            series_entry = {
                "uid": series_data.get("uid", str(uuid.uuid4())),
                "number": series_data.get("number"),
                "modality": {
                    "system": "http://dicom.nema.org/resources/ontology/DCM",
                    "code": series_data.get("modality_code"),
                    "display": series_data.get("modality_display")
                },
                "description": series_data.get("description"),
            }
            
            if series_data.get("bodySite"):
                body_site_data = series_data.get("bodySite")
                # Handle both string and dict formats
                if isinstance(body_site_data, str):
                    series_entry["bodySite"] = {
                        "system": "http://snomed.info/sct",
                        "code": "",
                        "display": body_site_data
                    }
                elif isinstance(body_site_data, dict):
                    series_entry["bodySite"] = {
                        "system": "http://snomed.info/sct",
                        "code": body_site_data.get("code", ""),
                        "display": body_site_data.get("display") or body_site_data.get("text", "")
                    }
            
            if series_data.get("instance"):
                series_entry["instance"] = []
                for instance_data in series_data.get("instance"):
                    instance_entry = {
                        "uid": instance_data.get("uid", str(uuid.uuid4())),
                        "sopClass": {
                            "system": "urn:ietf:rfc:3986",
                            "code": instance_data.get("sopClass", "urn:oid:1.2.840.10008.5.1.4.1.1.2") 
                        },
                        "number": instance_data.get("number"),
                        "title": instance_data.get("title")
                    }
                    series_entry["instance"].append(instance_entry)
            
            resource["resource"]["series"].append(series_entry)

    return resource
