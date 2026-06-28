
import logging

logger = logging.getLogger(__name__)

def calculate_and_add_bmi(final_json_list: list) -> list:
    """
    Calculates BMI from height and weight observations and adds it as a new Observation resource.
    It also removes any pre-existing BMI observation to avoid duplicates or incorrect values.

    Args:
        final_json_list: A list of FHIR resource dictionaries.

    Returns:
        The list of FHIR resource dictionaries, with a correct BMI Observation if possible.
    """
    height_cm = None
    weight_kg = None
    patient_reference = None

    # Find height and weight from the observation list
    for resource in final_json_list:
        if resource.get("resourceType") == "Observation":
            code_text = resource.get("code", {}).get("text", "").lower()
            if "height" in code_text:
                height_cm = resource.get("valueQuantity", {}).get("value")
                if resource.get("subject"):
                    patient_reference = resource.get("subject")
            elif "weight" in code_text:
                weight_kg = resource.get("valueQuantity", {}).get("value")
                if not patient_reference and resource.get("subject"):
                    patient_reference = resource.get("subject")

    # If height and weight are found, calculate BMI
    if height_cm is not None and weight_kg is not None and patient_reference is not None:
        try:
            # Remove any existing BMI observation to prevent incorrect data
            final_json_list = [
                res for res in final_json_list
                if not ("bmi" in res.get("code", {}).get("text", "").lower() or 
                        "body mass index" in res.get("code", {}).get("text", "").lower())
            ]

            height_m = float(height_cm) / 100
            if height_m == 0:
                raise ZeroDivisionError("Height cannot be zero.")
                
            bmi = round(float(weight_kg) / (height_m ** 2), 1)

            bmi_observation = {
                "resourceType": "Observation",
                "status": "final",
                "category": [
                    {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                                "code": "vital-signs",
                                "display": "Vital Signs"
                            }
                        ]
                    }
                ],
                "code": {
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": "39156-5",
                            "display": "Body mass index (BMI) [Ratio]"
                        },
                        {
                            "system": "http://snomed.info/sct",
                            "code": "60621009",
                            "display": "Body mass index"
                        }
                    ],
                    "text": "Body Mass Index"
                },
                "subject": patient_reference,
                "valueQuantity": {
                    "value": bmi,
                    "unit": "kg/m2",
                    "system": "http://unitsofmeasure.org",
                    "code": "kg/m2"
                }
            }
            final_json_list.append(bmi_observation)
            logger.info(f"Calculated and added BMI: {bmi} to the FHIR bundle.")
        except (ValueError, TypeError, ZeroDivisionError) as e:
            logger.error(f"Could not calculate BMI due to an error: {e}. Height: {height_cm}, Weight: {weight_kg}")

    return final_json_list
