import uuid
from typing import Dict, Any, Optional


def create_wellness_observation_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR Observation resource for Wellness Record.
    
    Supports all FHIR observation value types:
    - valueQuantity: Measurements with units (height, weight, BP, etc.)
    - valueString: Text values (activity level, sleep quality, etc.)
    
    Also supports: interpretation, referenceRange, bodySite, and multi-part components.
    Handles text interpretation inputs (Normal, Low, High) and converts to standard codes.
    """
    obs_id = str(uuid.uuid4())

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
            #"subject": {"reference": data.get("patient_ref")},
        }
    }

    # Performer
    if data.get("performer_ref"):
        performer = {"reference": data.get("performer_ref")}
        if data.get("performer_name"):
            performer["display"] = data.get("performer_name")
        resource["resource"]["performer"] = [performer]

    # Observation code - Use code from LLM (formatted by service)
    if data.get("code"):
        resource["resource"]["code"] = data.get("code")
    else:
        # Fallback if code object missing, just use name as text
        resource["resource"]["code"] = {
            "text": data.get("observation_name", "")
        }

    # Category
    category_mapping = {
        "Vital Signs": "vital-signs",
        "Body Measurement": "exam",
        "Physical Activity": "activity",
        "General Assessment": "exam",
        "Women Health": "exam",
        "Lifestyle": "social-history"
    }

    category = data.get("category")
    if category and category in category_mapping:
        resource["resource"]["category"] = [
            {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                        "code": category_mapping[category],
                        "display": category,
                    }
                ]
            }
        ]
    elif category:
        resource["resource"]["category"] = [
            {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                        "code": "",
                        "display": category,
                    }
                ]
            }
        ]

    # =================================================================
    # VALUE TYPE DETECTION AND ASSIGNMENT
    # =================================================================
    
    # Determine value type based on available data
    value_type = data.get("value_type", "").lower()  # Optional hint from LLM
    
    # If not provided, auto-detect
    if not value_type:
        if data.get("components"):
            value_type = "component"  # Multi-part observation
        elif data.get("unit") or data.get("unit_code"):
            value_type = "quantity"
        else:
            value_type = "string"  # Default fallback
    
    # Assign value based on detected/specified type
    if value_type == "quantity" and data.get("value") is not None:
        # valueQuantity: For measurements with units
        unit_code = data.get("unit_code") or data.get("unit", "")  # Use UCUM code if provided, fallback to unit
        unit_text = data.get("unit", "")
        
        # Handle potential string values that should be numbers
        value = data.get("value")
        try:
            if isinstance(value, str):
                # Try to convert string to number
                value = float(value) if '.' in value else int(value)
            elif not isinstance(value, (int, float)):
                value = float(value)
        except (ValueError, TypeError):
            # If conversion fails, use as-is
            pass
        
        resource["resource"]["valueQuantity"] = {
            "value": value,
            "unit": unit_text,
            "system": "http://unitsofmeasure.org",
            "code": unit_code
        }
        
    elif value_type == "string" and data.get("value"):
        # valueString: For text values
        resource["resource"]["valueString"] = str(data.get("value"))
    
    # If value_type is "component", don't add a value field here - use components instead
    
    # =================================================================
    # ADDITIONAL FIELDS
    # =================================================================
    
    # Interpretation - handles both codes (N, L, H) and text (Normal, Low, High)
    if data.get("interpretation"):
        interpretation_input = str(data.get("interpretation", "")).strip()
        interpretation_code = ""
        interpretation_display = ""
        
        # Map text to codes
        text_to_code_map = {
            "normal": "N",
            "low": "L",
            "high": "H",
            "critical low": "LL",
            "critical high": "HH",
            "critical": "A",
            "abnormal": "A"
        }
        
        # Map codes to display text
        code_to_text_map = {
            "N": "Normal",
            "L": "Low",
            "H": "High",
            "LL": "Critical low",
            "HH": "Critical high",
            "A": "Abnormal"
        }
        
        # Check if input is a code or text
        input_lower = interpretation_input.lower()
        if input_lower in text_to_code_map:
            # Input is text, convert to code
            interpretation_code = text_to_code_map[input_lower]
            interpretation_display = interpretation_input
        elif interpretation_input.upper() in code_to_text_map:
            # Input is code
            interpretation_code = interpretation_input.upper()
            interpretation_display = code_to_text_map[interpretation_code]
        else:
            # Unknown input, use as-is for display, no code
            interpretation_code = ""
            interpretation_display = interpretation_input
        
        if interpretation_code or interpretation_display:
            resource["resource"]["interpretation"] = [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                            "code": interpretation_code,
                            "display": interpretation_display
                        }
                    ] if interpretation_code else [],
                    "text": interpretation_display
                }
            ]
    
    # Reference Range
    if data.get("reference_range") and isinstance(data.get("reference_range"), dict):
        ref_range = data.get("reference_range")
        range_entry = {}
        
        if ref_range.get("low") and isinstance(ref_range.get("low"), dict):
            low = ref_range["low"]
            if low.get("value") is not None:
                range_entry["low"] = {
                    "value": low.get("value"),
                    "unit": low.get("unit", ""),
                    "system": "http://unitsofmeasure.org",
                    "code": low.get("code") or low.get("unit", "")
                }
        
        if ref_range.get("high") and isinstance(ref_range.get("high"), dict):
            high = ref_range["high"]
            if high.get("value") is not None:
                range_entry["high"] = {
                    "value": high.get("value"),
                    "unit": high.get("unit", ""),
                    "system": "http://unitsofmeasure.org",
                    "code": high.get("code") or high.get("unit", "")
                }
        
        if range_entry:
            resource["resource"]["referenceRange"] = [range_entry]
    
    # Body Site - only add text, no SNOMED codes required
    if data.get("body_site"):
        body_site_text = data.get("body_site")
        resource["resource"]["bodySite"] = {
            "text": body_site_text
        }
    
    # =================================================================
    # COMPONENTS (Multi-part observations like Blood Pressure)
    # =================================================================
    
    if data.get("components"):
        resource["resource"]["component"] = []
        for component in data.get("components"):
            comp_name = component.get("name", "") or component.get("display", "")
            
            comp = {}
            
            # Component code - construct directly from LLM output
            if component.get("code"):
                 comp["code"] = {
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": component.get("code"),
                            "display": comp_name
                        }
                    ],
                    "text": comp_name
                }
            else:
                 comp["code"] = {
                    "text": comp_name
                }
            
            # Component value - support different types
            comp_value_type = component.get("value_type", "quantity")  # Default to quantity for backward compatibility
            
            if comp_value_type == "quantity" and component.get("value") is not None:
                unit_code = component.get("unit_code") or component.get("unit", "")
                comp["valueQuantity"] = {
                    "value": float(component.get("value")) if not isinstance(component.get("value"), (int, float)) else component.get("value"),
                    "unit": component.get("unit", ""),
                    "system": "http://unitsofmeasure.org",
                    "code": unit_code
                }
            elif comp_value_type == "string" and component.get("value"):
                comp["valueString"] = str(component.get("value"))
            
            # Component interpretation - handles both codes and text
            if component.get("interpretation"):
                comp_interp_input = str(component.get("interpretation", "")).strip()
                comp_interp_code = ""
                comp_interp_display = ""
                
                # Map text to codes
                text_to_code_map = {"normal": "N", "low": "L", "high": "H", "critical low": "LL", "critical high": "HH", "critical": "A", "abnormal": "A"}
                # Map codes to text
                code_to_text_map = {"N": "Normal", "L": "Low", "H": "High", "LL": "Critical low", "HH": "Critical high", "A": "Abnormal"}
                
                # Check if input is code or text
                input_lower = comp_interp_input.lower()
                if input_lower in text_to_code_map:
                    comp_interp_code = text_to_code_map[input_lower]
                    comp_interp_display = comp_interp_input
                elif comp_interp_input.upper() in code_to_text_map:
                    comp_interp_code = comp_interp_input.upper()
                    comp_interp_display = code_to_text_map[comp_interp_code]
                else:
                    comp_interp_code = ""
                    comp_interp_display = comp_interp_input
                
                if comp_interp_code or comp_interp_display:
                    comp["interpretation"] = [
                        {
                            "coding": [
                                {
                                    "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                                    "code": comp_interp_code,
                                    "display": comp_interp_display
                                }
                            ] if comp_interp_code else [],
                            "text": comp_interp_display
                        }
                    ]
            
            resource["resource"]["component"].append(comp)

    return resource
