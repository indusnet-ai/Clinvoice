"""
FHIR Condition Resource Creator

Comprehensive condition creator supporting:
- Clinical Status: active, recurrence, relapse, inactive, remission, resolved
- Verification Status: unconfirmed, provisional, differential, confirmed, refuted, entered-in-error
- Category: encounter-diagnosis, problem-list-item
- Severity: mild, moderate, severe
"""

import uuid
import datetime
from typing import Dict, Any


# Clinical status mapping
CLINICAL_STATUS_MAP = {
    "active": "Active",
    "recurrence": "Recurrence",
    "relapse": "Relapse",
    "inactive": "Inactive",
    "remission": "Remission",
    "resolved": "Resolved",
}

# Verification status mapping
VERIFICATION_STATUS_MAP = {
    "unconfirmed": "Unconfirmed",
    "provisional": "Provisional",
    "differential": "Differential",
    "confirmed": "Confirmed",
    "refuted": "Refuted",
    "entered-in-error": "Entered in Error",
}

# Category mapping (official FHIR categories only)
CATEGORY_MAP = {
    "encounter-diagnosis": ("encounter-diagnosis", "Encounter Diagnosis"),
    "problem-list-item": ("problem-list-item", "Problem List Item"),
    # Common aliases mapped to official values
    "diagnosis": ("encounter-diagnosis", "Encounter Diagnosis"),
    "history": ("problem-list-item", "Problem List Item"),
    "chief-complaint": ("encounter-diagnosis", "Encounter Diagnosis"),
    "problem": ("problem-list-item", "Problem List Item"),
}

# Severity mapping
SEVERITY_MAP = {
    "mild": ("24484000", "Mild"),
    "moderate": ("6736007", "Moderate"),
    "severe": ("24112005", "Severe"),
}


def create_condition_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR Condition resource.
    """
    condition_id = str(uuid.uuid4())
    timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "+05:30"

    resource = {
        "fullUrl": f"urn:uuid:{condition_id}",
        "resource": {
            "resourceType": "Condition",
            "id": condition_id,
            "meta": {
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/Condition"]
            },
            "recordedDate": data.get("recordedDate") or timestamp
        }
    }

    # Clinical Status
    clinical_status = data.get("clinicalStatus", "active").lower()
    if clinical_status in CLINICAL_STATUS_MAP:
        resource["resource"]["clinicalStatus"] = {
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                "code": clinical_status,
                "display": CLINICAL_STATUS_MAP[clinical_status]
            }]
        }

    # Verification Status
    verification_status = data.get("verificationStatus", "confirmed").lower()
    if verification_status in VERIFICATION_STATUS_MAP:
        resource["resource"]["verificationStatus"] = {
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                "code": verification_status,
                "display": VERIFICATION_STATUS_MAP[verification_status]
            }]
        }

    # Category
    category = data.get("category", "").lower()
    if category and category in CATEGORY_MAP:
        cat_code, cat_display = CATEGORY_MAP[category]
        resource["resource"]["category"] = [{
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/condition-category",
                "code": cat_code,
                "display": cat_display
            }]
        }]

    # Code (using Claude-provided SNOMED codes)
    code = data.get("code", "")
    display = data.get("display", "")
    text = data.get("text", display)
    
    resource["resource"]["code"] = {
        "coding": [{
            "system": "http://snomed.info/sct",
            "code": str(code) if code else "",
            "display": display or text
        }],
        "text": text or display
    }

    # Severity
    severity = data.get("severity", "").lower()
    if severity and severity in SEVERITY_MAP:
        snomed_code, display = SEVERITY_MAP[severity]
        resource["resource"]["severity"] = {
            "coding": [{
                "system": "http://snomed.info/sct",
                "code": snomed_code,
                "display": display
            }]
        }

    # Onset
    if data.get("onsetDateTime"):
        resource["resource"]["onsetDateTime"] = data.get("onsetDateTime")
    elif data.get("onsetString"):
        resource["resource"]["onsetString"] = data.get("onsetString")

    # Note
    if data.get("note"):
        resource["resource"]["note"] = [{"text": data.get("note")}]

    return resource
