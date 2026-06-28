import datetime
import base64
import os
from typing import Dict, Any

def create_signature_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a full FHIR Signature element.
    """
    when = data.get("when") or (datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S") + "+10:00")
    
    signature = {
        "type": [{
            "system": "urn:iso-astm:E1762-95:2013",
            "code": data.get("sig_type_code", "1.2.840.10065.1.12.1.1"),
            "display": data.get("sig_type_display", "Author's Signature")
        }],
        "when": when,
        "who": {
            "reference": data.get("who_reference"),
            "display": data.get("who_display", "Practitioner")
        },
        "sigFormat": data.get("signature_format", "image/jpeg")
    }
    
    sig_data_b64 = None
    signature_file_path = data.get("signature_file_path")
    signature_data = data.get("signature_data")
    
    if signature_file_path and os.path.exists(signature_file_path):
        try:
            with open(signature_file_path, "rb") as f:
                file_bytes = f.read()
                sig_data_b64 = base64.b64encode(file_bytes).decode('utf-8')
        except Exception as e:
            print(f"Warning: Could not read signature file {signature_file_path}: {e}")
    elif signature_data:
        sig_data_b64 = signature_data
        if sig_data_b64.startswith('data:'):
            sig_data_b64 = sig_data_b64.split(',')[1] if ',' in sig_data_b64 else sig_data_b64
    
    if sig_data_b64:
        signature["data"] = sig_data_b64
    
    return signature

