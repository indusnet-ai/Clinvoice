"""
FHIR Observation Resource Creator

Comprehensive observation creator supporting vital signs, labs, imaging, wellness.
"""

import uuid
import datetime
from typing import Dict, Any


# Category mapping
CATEGORY_MAPPING = {
    "vital-signs": ("vital-signs", "Vital Signs"),
    "laboratory": ("laboratory", "Laboratory"),
    "imaging": ("imaging", "Imaging"),
    "exam": ("exam", "Exam"),
    "social-history": ("social-history", "Social History"),
    "Vital Signs": ("vital-signs", "Vital Signs"),
    "Body Measurement": ("exam", "Body Measurement"),
    "Physical Activity": ("activity", "Physical Activity"),
}

# Interpretation mapping
INTERPRETATION_TEXT_TO_CODE = {
    "normal": "N", "low": "L", "high": "H",
    "critical low": "LL", "critical high": "HH", "abnormal": "A",
}

INTERPRETATION_CODE_TO_TEXT = {
    "N": "Normal", "L": "Low", "H": "High",
    "LL": "Critical low", "HH": "Critical high", "A": "Abnormal",
}


def parse_interpretation(interpretation_input: str) -> tuple[str, str]:
    if not interpretation_input:
        return "", ""
    input_str = str(interpretation_input).strip()
    input_lower = input_str.lower()
    if input_lower in INTERPRETATION_TEXT_TO_CODE:
        return INTERPRETATION_TEXT_TO_CODE[input_lower], input_str.capitalize()
    elif input_str.upper() in INTERPRETATION_CODE_TO_TEXT:
        code = input_str.upper()
        return code, INTERPRETATION_CODE_TO_TEXT[code]
    return "", input_str


def create_observation_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR Observation resource.
    """
    obs_id = str(uuid.uuid4())
    timestamp = datetime.datetime.utcnow().isoformat() + "Z"

    resource = {
        "fullUrl": f"urn:uuid:{obs_id}",
        "resource": {
            "resourceType": "Observation",
            "id": obs_id,
            "meta": {
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/Observation"]
            },
            "status": data.get("status", "final"),
            "effectiveDateTime": data.get("effectiveDateTime") or timestamp
        }
    }

    # Category
    category = data.get("category", "exam")
    if category in CATEGORY_MAPPING:
        cat_code, cat_display = CATEGORY_MAPPING[category]
    else:
        cat_code = category.lower().replace(" ", "-") if category else "exam"
        cat_display = category or "Exam"
    
    resource["resource"]["category"] = [{
        "coding": [{
            "system": "http://terminology.hl7.org/CodeSystem/observation-category",
            "code": cat_code,
            "display": cat_display
        }]
    }]

    # Code
    code = data.get("code", "")
    code_system = data.get("codeSystem", "http://loinc.org")
    display = data.get("display", "")
    text = data.get("text", display)
    
    resource["resource"]["code"] = {
        "coding": [{
            "system": code_system,
            "code": str(code) if code else "",
            "display": display or text
        }],
        "text": text or display
    }

    # Value
    value = data.get("value")
    unit = data.get("unit", "")
    
    if value is not None:
        try:
            numeric_value = float(value)
            resource["resource"]["valueQuantity"] = {
                "value": numeric_value,
                "unit": unit,
                "system": "http://unitsofmeasure.org",
                "code": unit
            }
        except (ValueError, TypeError):
            resource["resource"]["valueString"] = str(value)

    # Interpretation
    if data.get("interpretation"):
        code, display = parse_interpretation(data.get("interpretation"))
        interpretation_entry = {"text": display}
        if code:
            interpretation_entry["coding"] = [{
                "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                "code": code,
                "display": display
            }]
        resource["resource"]["interpretation"] = [interpretation_entry]

    # Reference Range
    ref_range = data.get("referenceRange") or data.get("reference_range")
    if ref_range and isinstance(ref_range, dict):
        range_entry = {}
        if ref_range.get("low"):
            range_entry["low"] = {"value": float(ref_range["low"].get("value", 0)), "unit": ref_range["low"].get("unit", "")}
        if ref_range.get("high"):
            range_entry["high"] = {"value": float(ref_range["high"].get("value", 0)), "unit": ref_range["high"].get("unit", "")}
        if range_entry:
            resource["resource"]["referenceRange"] = [range_entry]

    # Components
    if data.get("components"):
        resource["resource"]["component"] = []
        for comp in data.get("components"):
            component = {
                "code": {
                    "coding": [{
                        "system": comp.get("codeSystem", "http://loinc.org"),
                        "code": str(comp.get("code", "")),
                        "display": comp.get("name") or comp.get("display", "")
                    }],
                    "text": comp.get("text", comp.get("name", ""))
                }
            }
            if comp.get("value") is not None:
                try:
                    component["valueQuantity"] = {
                        "value": float(comp.get("value")),
                        "unit": comp.get("unit", "")
                    }
                except (ValueError, TypeError):
                    component["valueString"] = str(comp.get("value"))
            resource["resource"]["component"].append(component)

    # Note
    if data.get("note"):
        resource["resource"]["note"] = [{"text": data.get("note")}]

    return resource
