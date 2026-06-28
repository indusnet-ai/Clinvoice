import uuid
import datetime
from typing import Dict, Any

def create_immunization_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR Immunization resource.
    """
    imm_id = str(uuid.uuid4())
    
    resource = {
        "fullUrl": f"urn:uuid:{imm_id}",
        "resource": {
            "resourceType": "Immunization",
            "id": imm_id,
            "meta": {
                "versionId": "1",
                "lastUpdated": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "+05:30",
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/Immunization"]
            },
            "status": data.get("status", "completed"),
            # "patient": {
            #     "reference": data.get("patient_ref"),
            #     "display": "Patient"
            # },
            "primarySource": True
        }
    }
    
    # Status Reason (for not-done immunizations)
    if data.get("status_reason"):
        resource["resource"]["statusReason"] = {
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/v3-ActReason",
                "code": data.get("status_reason_code", ""),
                "display": data.get("status_reason")
            }]
        }

    if data.get("brand_name"):
        resource["resource"]["extension"] = [{
            "url": "https://nrces.in/ndhm/fhir/r4/StructureDefinition/BrandName",
            "valueString": data.get("brand_name") 
        }]
    
    if data.get("vaccineCode"):
        resource["resource"]["vaccineCode"] = data.get("vaccineCode")
    elif data.get("vaccine_name"):
        resource["resource"]["vaccineCode"] = {
            "coding": [{
                "display": data.get("vaccine_name")
            }]
        }

    if data.get("date"):
        resource["resource"]["occurrenceDateTime"] = data.get("date")

    if data.get("location_ref"):
        resource["resource"]["location"] = {
            "reference": data.get("location_ref")
        }

    if data.get("manufacturer_ref"):
        resource["resource"]["manufacturer"] = {
            "reference": data.get("manufacturer_ref"),
            "display": data.get("manufacturer_display", "Organization")
        }

    if data.get("lot_number"):
        resource["resource"]["lotNumber"] = data.get("lot_number")

    if data.get("practitioner_ref"):
        resource["resource"]["performer"] = [{
            "function": {
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/v2-0443",
                    "code": "AP",
                    "display": "Administering Provider"
                }]
            },
            "actor": {
                "reference": data.get("practitioner_ref"),
                "display": data.get("practitioner_display", "Practitioner")
            }
        }]

    protocol_applied = {}
    if data.get("series"):
        protocol_applied["series"] = data.get("series")
    
    if data.get("dose_number"):
        protocol_applied["doseNumberPositiveInt"] = int(data.get("dose_number"))

    if protocol_applied:
        resource["resource"]["protocolApplied"] = [protocol_applied]

    return resource
