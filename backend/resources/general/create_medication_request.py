import uuid
import datetime
import re
from typing import Dict, Any


def create_medication_request_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR MedicationRequest resource with full dosage timing support.
    Preserves 1-0-1 pattern and all timing fields.
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
            "authoredOn": timestamp,
        }
    }

    # Medication code
    code = data.get("code", "")
    display = data.get("display", "")
    text = data.get("text", display)
    
    resource["resource"]["medicationCodeableConcept"] = {
        "coding": [{
            "system": "http://snomed.info/sct",
            "code": str(code) if code else "",
            "display": display
        }],
        "text": text
    }

    # Reason for medication
    if data.get("reason"):
        resource["resource"]["reasonCode"] = [{"text": data.get("reason")}]

    # Build dosage instruction
    dosage = data.get("dosage", {})
    if isinstance(dosage, str):
        dosage = {"text": dosage}
    
    dosage_instruction = {}
    
    # Text description
    if dosage.get("text"):
        dosage_instruction["text"] = dosage.get("text")
    
    # Additional Instruction (1-0-1 pattern)
    additional_instruction = dosage.get("additionalInstruction", "")
    if additional_instruction:
        dosage_instruction["additionalInstruction"] = [{
            "text": additional_instruction
        }]
    
    # Timing
    timing = {}
    repeat = {}
    
    if dosage.get("frequency"):
        try:
            repeat["frequency"] = int(dosage.get("frequency"))
        except (ValueError, TypeError):
            repeat["frequency"] = 1
    
    if dosage.get("period"):
        try:
            repeat["period"] = int(dosage.get("period"))
        except (ValueError, TypeError):
            repeat["period"] = 1
    
    if dosage.get("periodUnit"):
        repeat["periodUnit"] = dosage.get("periodUnit")
    
    # Duration
    if dosage.get("duration"):
        duration_str = str(dosage.get("duration"))
        duration_match = re.match(r'(\d+)\s*(\w+)', duration_str)
        if duration_match:
            repeat["boundsDuration"] = {
                "value": int(duration_match.group(1)),
                "unit": duration_match.group(2)
            }
    
    # When
    when = dosage.get("when", [])
    if when:
        if isinstance(when, str):
            when = [when]
        repeat["when"] = when
    
    if repeat:
        timing["repeat"] = repeat
    
    # Timing code - meal context
    meal_context = dosage.get("mealContext", "")
    if meal_context:
        timing["code"] = {"text": meal_context}
    
    if timing:
        dosage_instruction["timing"] = timing
    
    # As needed
    dosage_instruction["asNeededBoolean"] = bool(dosage.get("asNeeded"))
    
    # Route
    if dosage.get("route"):
        dosage_instruction["route"] = {"text": dosage.get("route")}
    
    # Method
    if dosage.get("method"):
        dosage_instruction["method"] = {"text": dosage.get("method")}
    
    # Dose quantity
    if dosage.get("doseValue") or dosage.get("doseUnit"):
        dosage_instruction["doseAndRate"] = [{
            "doseQuantity": {
                "value": dosage.get("doseValue"),
                "unit": dosage.get("doseUnit", "")
            }
        }]
    
    if dosage_instruction:
        dosage_instruction["sequence"] = 1
        resource["resource"]["dosageInstruction"] = [dosage_instruction]

    # Note
    if data.get("note"):
        resource["resource"]["note"] = [{"text": data.get("note")}]

    return resource
