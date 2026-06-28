import uuid
import datetime
from typing import Dict, Any

def create_immunization_recommendation_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR ImmunizationRecommendation resource.
    """
    rec_id = str(uuid.uuid4())
    timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "+05:30"

    recommendation_entry = {}

    if data.get("vaccineCode"):
        recommendation_entry["vaccineCode"] = [data.get("vaccineCode")]
    elif data.get("vaccine_name"):
        recommendation_entry["vaccineCode"] = [{
            "coding": [{
                "display": data.get("vaccine_name")
            }]
        }]
    
    if data.get("status"):
        recommendation_entry["forecastStatus"] = {
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/immunization-recommendation-status",
                "code": data.get("status"),
                "display": data.get("status").capitalize()
            }]
        }

    if data.get("date_due"):
        recommendation_entry["dateCriterion"] = [{
            "code": {
                "coding": [{
                    "system": "http://loinc.org",
                    "code": "30980-7",
                    "display": "Date vaccine due"
                }]
            },
            "value": data.get("date_due") + "T00:00:00-05:00"
        }]

    if data.get("description"):
        recommendation_entry["description"] = data.get("description")
    
    if data.get("series"):
        recommendation_entry["series"] = data.get("series")

    if data.get("dose_number"):
        recommendation_entry["doseNumberPositiveInt"] = int(data.get("dose_number"))
    
    if data.get("series_doses"):
        recommendation_entry["seriesDosesPositiveInt"] = int(data.get("series_doses"))

    if data.get("supporting_imm_ref"):
        recommendation_entry["supportingImmunization"] = [{
            "reference": data.get("supporting_imm_ref"),
            "display": "Immunization"
        }]

    resource = {
        "fullUrl": f"urn:uuid:{rec_id}",
        "resource": {
            "resourceType": "ImmunizationRecommendation",
            "id": rec_id,
            "meta": {
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/ImmunizationRecommendation"]
            },
            # "patient": {
            #     "reference": data.get("patient_ref"),
            #     "display": "Patient"
            # },
            "date": timestamp,
            # "authority": {
            #     "reference": data.get("organization_ref")
            # },
            "recommendation": [recommendation_entry]
        }
    }

    return resource
