"""
Code utilities for building FHIR CodeableConcept from flat prompt output fields.
"""

def build_codeable_concept(data: dict, code_key: str = "code", default_system: str = "http://snomed.info/sct") -> dict:
    """
    Build a FHIR CodeableConcept from flat prompt output fields.
    
    The prompt outputs flat fields like:
    - code: "12345678" (SNOMED/LOINC code)
    - codeSystem: "http://snomed.info/sct"
    - display: "Display name"
    - text: "As mentioned in conversation"
    
    This function converts them to FHIR CodeableConcept structure:
    {
        "coding": [{"system": "...", "code": "...", "display": "..."}],
        "text": "..."
    }
    
    Args:
        data: Dictionary containing the flat fields
        code_key: The key name for the code field (default: "code")
        default_system: Default code system if not provided
        
    Returns:
        FHIR CodeableConcept dictionary
    """
    code_value = data.get(code_key)
    code_system = data.get("codeSystem", default_system)
    display = data.get("display", "")
    text = data.get("text", "")
    
    # If no code at all, return empty text-only concept
    if not code_value:
        return {"text": text or display or "Unknown"}
    
    # If code is already a properly formatted dict, return as-is
    if isinstance(code_value, dict):
        if "coding" in code_value:
            return code_value
        # Old format with just text
        return {"text": code_value.get("text") or code_value.get("display") or str(code_value)}
    
    # Build full CodeableConcept from flat fields
    if code_system:
        return {
            "coding": [{
                "system": code_system,
                "code": str(code_value),
                "display": display or text or str(code_value)
            }],
            "text": text or display or str(code_value)
        }
    else:
        # No system, just use text
        return {"text": display or text or str(code_value)}


def build_medication_concept(data: dict) -> dict:
    """
    Build medication CodeableConcept from flat prompt output.
    
    Prompt outputs for medications:
    - code: "SNOMED code"
    - codeSystem: "http://snomed.info/sct"
    - display: "Medication name with strength"
    - text: "As mentioned"
    
    Returns FHIR CodeableConcept for medicationCodeableConcept field.
    """
    return build_codeable_concept(data, "code", "http://snomed.info/sct")


def build_observation_code(data: dict) -> dict:
    """
    Build observation code CodeableConcept from flat prompt output.
    Uses LOINC as default system.
    """
    return build_codeable_concept(data, "code", "http://loinc.org")


def build_condition_code(data: dict) -> dict:
    """
    Build condition code CodeableConcept from flat prompt output.
    Uses SNOMED as default system.
    """
    return build_codeable_concept(data, "code", "http://snomed.info/sct")


def build_vaccine_code(data: dict) -> dict:
    """
    Build vaccine code CodeableConcept from flat prompt output.
    Uses SNOMED as default system.
    """
    return build_codeable_concept(data, "vaccineCode", "http://snomed.info/sct")
