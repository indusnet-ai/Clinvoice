import uuid
import datetime
from typing import Dict, Any

def create_medication_request_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR MedicationRequest resource.
    Uses medication code from LLM extraction via data['medication'].
    """
    med_req_id = str(uuid.uuid4())
    timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "+05:30"

    resource = {
        "fullUrl": f"urn:uuid:{med_req_id}",
        "resource": {
            "resourceType": "MedicationRequest",
            "id": med_req_id,
            "meta": {
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/MedicationRequest"]
            },
            "status": data.get("status", "active"),
            "intent": data.get("intent", "order"),
            # "subject": {
            #     "reference": data.get("patient_ref"),
            #     "display": "Patient"
            # },
            "authoredOn": timestamp,
            # "requester": {
            #     "reference": data.get("practitioner_ref"),
            #     "display": "Practitioner"
            # }
        }
    }

    # Use pre-built medication code from bundle service (from LLM output)
    if data.get("medication"):
        resource["resource"]["medicationCodeableConcept"] = data.get("medication")
    elif data.get("medication_name"):
        # Fallback: build from medication_name
        resource["resource"]["medicationCodeableConcept"] = {
            "coding": [
                {
                    "system": "http://snomed.info/sct",
                    "code": data.get("medication_code", ""),
                    "display": data.get("medication_name")
                }
            ],
            "text": data.get("medication_name")
        }

    if data.get("condition_ref"):
        resource["resource"]["reasonReference"] = [{
            "reference": data.get("condition_ref"),
            "display": "Condition"
        }]
    elif data.get("reason"):
        resource["resource"]["reasonCode"] = [{
            "text": data.get("reason")
        }]

    # Build dosageInstruction
    dosage_instruction = {}
    
    # Sequence number for multiple dosage instructions
    dosage_instruction["sequence"] = 1
    
    # Dosage text
    if data.get("dosage_instruction") or data.get("dosage"):
        dosage_text = data.get("dosage_instruction") or data.get("dosage")
        if isinstance(dosage_text, dict):
            dosage_text = dosage_text.get("text", str(dosage_text))
        dosage_instruction["text"] = str(dosage_text)

    if data.get("additional_instruction"):
        dosage_instruction["additionalInstruction"] = [{"text": data.get("additional_instruction")}]

    # Build timing
    timing = {}
    timing_repeat = {}
    
    # Frequency parsing - trust numeric values from LLM first
    freq = data.get("frequency")
    if freq is not None:
        if isinstance(freq, (int, float)):
            # Numeric frequency from LLM (preferred)
            timing_repeat["frequency"] = int(freq)
        elif isinstance(freq, str):
            # Parse string frequency
            freq_lower = freq.lower()
            if freq.isdigit():
                timing_repeat["frequency"] = int(freq)
            elif "twice" in freq_lower or "two times" in freq_lower or "2" in freq:
                timing_repeat["frequency"] = 2
            elif "three times" in freq_lower or "thrice" in freq_lower or "3" in freq:
                timing_repeat["frequency"] = 3
            elif "four times" in freq_lower or "4" in freq:
                timing_repeat["frequency"] = 4
            elif "once" in freq_lower or "one time" in freq_lower:
                timing_repeat["frequency"] = 1
            else:
                timing_repeat["frequency"] = 1  # Default
    
    # Period and period unit
    if data.get("period") and data.get("period_unit"):
        period_val = data.get("period")
        try:
            timing_repeat["period"] = int(period_val) if str(period_val).isdigit() else 1
        except (ValueError, TypeError):
            timing_repeat["period"] = 1
        timing_repeat["periodUnit"] = data.get("period_unit")
    
    # Add boundsDuration (treatment duration in timing)
    duration_val = data.get("duration_value") or data.get("duration")
    if duration_val is not None:
        try:
            duration_int = int(duration_val)
            timing_repeat["boundsDuration"] = {
                "value": duration_int,
                "unit": "days",
                "system": "http://unitsofmeasure.org",
                "code": "d"
            }
        except (ValueError, TypeError):
            pass
    
    # Add meal context (when) - PC = after meal, AC = before meal
    meal_context = data.get("meal_context") or data.get("when")
    if meal_context:
        meal_lower = str(meal_context).lower()
        if "after" in meal_lower or "with food" in meal_lower:
            timing_repeat["when"] = ["PC"]  # Post cibum (after meals)
        elif "before" in meal_lower or "empty stomach" in meal_lower:
            timing_repeat["when"] = ["AC"]  # Ante cibum (before meals)
        elif meal_context in ["PC", "AC", "PCM", "ACD"]:
            timing_repeat["when"] = [meal_context]
    
    if timing_repeat:
        timing["repeat"] = timing_repeat
    
    if timing:
        dosage_instruction["timing"] = timing

    # Route - add SNOMED coding for common routes
    ROUTE_CODES = {
        "oral": {"code": "26643006", "display": "Oral route"},
        "iv": {"code": "47625008", "display": "Intravenous route"},
        "intravenous": {"code": "47625008", "display": "Intravenous route"},
        "topical": {"code": "6064005", "display": "Topical route"},
        "intramuscular": {"code": "78421000", "display": "Intramuscular route"},
        "subcutaneous": {"code": "34206005", "display": "Subcutaneous route"},
    }
    
    if data.get("route"):
        route_text = str(data.get("route")).lower().strip()
        if route_text in ROUTE_CODES:
            route_info = ROUTE_CODES[route_text]
            dosage_instruction["route"] = {
                "coding": [{
                    "system": "http://snomed.info/sct",
                    "code": route_info["code"],
                    "display": route_info["display"]
                }],
                "text": data.get("route")
            }
        else:
            dosage_instruction["route"] = {"text": data.get("route")}
    
    if data.get("method"):
        dosage_instruction["method"] = {"text": data.get("method")}
    
    # Add doseAndRate with doseQuantity
    dose_value = data.get("dose_value") or data.get("doseValue")
    dose_unit = data.get("dose_unit") or data.get("doseUnit") or "tablet"
    
    if dose_value is not None:
        try:
            # UCUM codes for common units
            DOSE_UNIT_CODES = {
                "tablet": "{tbl}",
                "tablets": "{tbl}",
                "capsule": "{cap}",
                "capsules": "{cap}",
                "ml": "mL",
                "mg": "mg",
                "g": "g",
            }
            unit_code = DOSE_UNIT_CODES.get(dose_unit.lower(), dose_unit)
            
            dosage_instruction["doseAndRate"] = [{
                "doseQuantity": {
                    "value": float(dose_value),
                    "unit": dose_unit,
                    "system": "http://unitsofmeasure.org",
                    "code": unit_code
                }
            }]
        except (ValueError, TypeError):
            pass
        
    if dosage_instruction and len(dosage_instruction) > 1:  # Has more than just sequence
        resource["resource"]["dosageInstruction"] = [dosage_instruction]

    # Add dispenseRequest as per NDHM FHIR profile
    dispense_request = {}
    
    if data.get("quantity_value") or data.get("quantity"):
        qty_value = data.get("quantity_value") or data.get("quantity")
        qty_unit = data.get("quantity_unit") or "tablet"
        try:
            DOSE_UNIT_CODES = {"tablet": "{tbl}", "tablets": "{tbl}", "capsule": "{cap}", "capsules": "{cap}", "ml": "mL", "mg": "mg"}
            unit_code = DOSE_UNIT_CODES.get(qty_unit.lower(), qty_unit)
            
            dispense_request["quantity"] = {
                "value": float(qty_value),
                "unit": qty_unit,
                "system": "http://unitsofmeasure.org",
                "code": unit_code
            }
        except (ValueError, TypeError):
            pass
    
    if duration_val is not None:
        try:
            dispense_request["expectedSupplyDuration"] = {
                "value": int(duration_val),
                "unit": "days",
                "system": "http://unitsofmeasure.org",
                "code": "d"
            }
        except (ValueError, TypeError):
            pass
    
    if dispense_request:
        resource["resource"]["dispenseRequest"] = dispense_request

    return resource
