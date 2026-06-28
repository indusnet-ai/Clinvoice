import uuid
import datetime
from typing import Dict, Any, List

def create_provenance_resource(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a FHIR Provenance resource.
    """
    provenance_id = str(uuid.uuid4())
    
    resource = {
        "fullUrl": f"urn:uuid:{provenance_id}",
        "resource": {
            "resourceType": "Provenance",
            "id": provenance_id,
            "target": [{"reference": data.get("target_ref")}],
            "recorded": datetime.datetime.utcnow().isoformat() + "Z",
            "agent": [],
        },
    }

    if data.get("agent_refs"):
        for agent_ref in data.get("agent_refs"):
            resource["resource"]["agent"].append({"who": {"reference": agent_ref}})

    if data.get("signature"):
        resource["resource"]["signature"] = data.get("signature")
        
    return resource
