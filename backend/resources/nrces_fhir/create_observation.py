import uuid
from typing import Dict, Any

def _is_numeric(value) -> bool:
    """Check if value is numeric (int or float or numeric string)."""
    if isinstance(value, (int, float)):
        return True
    if isinstance(value, str):
        try:
            float(value.replace(",", ""))
            return True
        except ValueError:
            return False
    return False

def _is_boolean(value) -> bool:
    """Check if value represents a boolean."""
    if isinstance(value, bool):
        return True
    if isinstance(value, str):
        return value.lower() in ("true", "false", "yes", "no")
    return False

def _to_boolean(value) -> bool:
    """Convert value to boolean."""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ("true", "yes")
    return bool(value)

def create_observation_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR Observation resource (Generic).
    Uses code from LLM extraction via data['code'].
    Supports multiple value types: valueQuantity, valueString, valueCodeableConcept, valueBoolean.
    """
    import datetime
    
    obs_id = str(uuid.uuid4())
    timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "+05:30"

    resource = {
        "fullUrl": f"urn:uuid:{obs_id}",
        "resource": {
            "resourceType": "Observation",
            "id": obs_id,
            "meta": {
                "profile": [
                    "https://nrces.in/ndhm/fhir/r4/StructureDefinition/Observation"
                ]
            },
            "status": "final",
            "effectiveDateTime": data.get("effectiveDateTime", timestamp),
            # "subject": {"reference": data.get("patient_ref")},
        }
    }

    # if data.get("performer_ref"):
    #     performer = {"reference": data.get("performer_ref")}
    #     if data.get("performer_name"):
    #         performer["display"] = data.get("performer_name")
    #     resource["resource"]["performer"] = [performer]

    # Use pre-built code from bundle service (from LLM output)
    if data.get("code"):
        resource["resource"]["code"] = data.get("code")
    elif data.get("observation_name"):
        # Fallback: build code from observation_name
        resource["resource"]["code"] = {
            "coding": [
                {
                    "system": "http://snomed.info/sct",
                    "code": data.get("snomed_code", ""),
                    "display": data.get("observation_name")
                }
            ],
            "text": data.get("observation_name")
        }

    # Smart value type detection
    value = data.get("value")
    value_type = data.get("value_type", "").lower()  # LLM can hint the type
    unit = data.get("unit", "")
    
    if value is not None:
        # Priority 1: LLM explicitly specified value_type
        if value_type == "quantity" or value_type == "valuequantity":
            resource["resource"]["valueQuantity"] = {
                "value": float(str(value).replace(",", "")),
                "unit": unit,
                "system": "http://unitsofmeasure.org",
                "code": unit
            }
        elif value_type == "codeable" or value_type == "valuecodeableconcept":
            resource["resource"]["valueCodeableConcept"] = data.get("valueCoded", {
                "coding": [{"display": str(value)}],
                "text": str(value)
            })
        elif value_type == "boolean" or value_type == "valueboolean":
            resource["resource"]["valueBoolean"] = _to_boolean(value)
        elif value_type == "integer" or value_type == "valueinteger":
            resource["resource"]["valueInteger"] = int(float(str(value).replace(",", "")))
        # Priority 2: Auto-detect based on value and unit
        elif unit and _is_numeric(value):
            # Has unit + numeric = valueQuantity
            resource["resource"]["valueQuantity"] = {
                "value": float(str(value).replace(",", "")),
                "unit": unit,
                "system": "http://unitsofmeasure.org",
                "code": unit
            }
        elif _is_boolean(value):
            # Boolean-like value
            resource["resource"]["valueBoolean"] = _to_boolean(value)
        else:
            # Default: valueString for text/qualitative
            resource["resource"]["valueString"] = str(value)

    # Category code mapping for observation types
    # Maps category text to FHIR observation-category codes
    CATEGORY_CODE_MAP = {
        # Vitals should use "vital-signs", not "exam"
        "vital-signs": "vital-signs",
        "vitals": "vital-signs",
        "vital signs": "vital-signs",
        "physical exam": "exam",
        "physical examination": "exam",
        "exam": "exam",
        "laboratory": "laboratory",
        "lab": "laboratory",
        "imaging": "imaging",
        "radiology": "imaging",
        "social-history": "social-history",
        "lifestyle": "social-history",
        "activity": "activity",
        "survey": "survey",
        "therapy": "therapy",
    }
    
    # LOINC codes that are vital signs - auto-detect for correct category
    VITAL_SIGNS_LOINC_CODES = {
        "85354-9",  # Blood pressure panel
        "8480-6",   # Systolic blood pressure
        "8462-4",   # Diastolic blood pressure
        "8310-5",   # Body temperature
        "8867-4",   # Heart rate
        "9279-1",   # Respiratory rate
        "2708-6",   # Oxygen saturation
        "59408-5",  # Oxygen saturation (pulse oximetry)
        "8302-2",   # Body height
        "29463-7",  # Body weight
        "39156-5",  # BMI
        "8478-0",   # Mean blood pressure
    }
    
    # Extract observation code to check if it's a vital sign
    obs_code = None
    if data.get("code") and isinstance(data.get("code"), dict):
        coding = data["code"].get("coding", [])
        if coding and len(coding) > 0:
            obs_code = coding[0].get("code", "")
    
    # Determine category - prioritize vital signs detection from LOINC code
    category = data.get("category")
    category_code = None
    category_display = None
    
    if obs_code and obs_code in VITAL_SIGNS_LOINC_CODES:
        # Auto-detect vital signs from LOINC code
        category_code = "vital-signs"
        category_display = "Vital Signs"
    elif category:
        category_lower = category.lower().strip()
        category_code = CATEGORY_CODE_MAP.get(category_lower, "exam")
        category_display = category
    
    # Set the category if we have one
    if category_code:
        resource["resource"]["category"] = [
            {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                        "code": category_code,
                        "display": category_display,
                    }
                ]
            }
        ]

    if data.get("components"):
        resource["resource"]["component"] = []
        for component in data.get("components"):
            comp_name = component.get("display", "") or component.get("name", "")
            comp = {}
            
            # Build code from component - handle both dict and flat string formats
            if component.get("code"):
                code_value = component.get("code")
                if isinstance(code_value, dict) and "coding" in code_value:
                    # Already a CodeableConcept
                    comp["code"] = code_value
                else:
                    # Flat format from LLM - build CodeableConcept
                    comp["code"] = {
                        "coding": [
                            {
                                "system": "http://loinc.org",
                                "code": str(code_value),
                                "display": comp_name
                            }
                        ],
                        "text": comp_name
                    }
            else:
                comp["code"] = {
                    "text": comp_name
                }
            
            if component.get("value") is not None:
                comp["valueQuantity"] = {
                    "value": component.get("value"),
                    "unit": component.get("unit", ""),
                    "system": "http://unitsofmeasure.org",
                    "code": component.get("unit", "")
                }
            resource["resource"]["component"].append(comp)

    return resource
