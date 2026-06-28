from fastapi import APIRouter, Depends, HTTPException, Security, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy.orm import Session
import logging
from fastapi.responses import PlainTextResponse
from typing import Dict, Any
from db.models import Transcript

from db import models

#from db.database import get_db
#from db.models import User
from db.database import get_db

from api.utils.api_auth import get_api_key
from api.repository.generation_registry import extract_dental_medical_report_v1_1 as repo_extract_dental_medical_report

router = APIRouter()
logger = logging.getLogger(__name__)

tags=["Dental"]
summary="Medical report API"
#response_model=MedicalReportResponse
description = """
This endpoint generates dental medical report for a given medical transcript.

**How to use:**
- Provide a `transcript_id` as a query parameter.
- The response will be a JSON object mapping medicines and complaints to a dental medical report.
"""
responses = {
            status.HTTP_200_OK : {
                "description" : " Dental Medical report available",
                "content" : {
                    "text/plain" : {
                        "example" : {
    "chiefComplaints": "Recurring pain in upper left jaw; Pain worsens with sweets and hot liquids",
    "extraOralExamination": {
        "note": "Mild swelling around the upper left cheek",
        "findings": "Swelling near zygomatic area; Left cheek tender to touch"
    },
    "intraOralExamination": {
        "oralHygiene": "Poor",
        "gingivalHealth": "inflammation",
        "cariesStatus": "present",
        "observations": "Moderate plaque buildup; Localized tartar around upper left molars",
        "note": "Gingiva inflamed and bleeds on probing"
    },
    "clinicalFindings": {
        "teeths": [
            {
                "number": 26,
                "note": "D"
            },
            {
                "number": 27,
                "note": "D"
            }
        ],
        "teethAttrition": [41],
        "teethAbrasion": [31],
        "teethErosions": [21, 22],
        "teethTendernessOnPercussion": [],
        "molarRelation": "Class I",
        "carineRelation": "Class I",
        "mobilityOfTeeth": [
            {
                "grade": 1,
                "teeth": []
            },
            {
                "grade": 2,
                "teeth": []
            },
            {
                "grade": 3,
                "teeth": []
            }
        ]
    },
    "investigationsAndDiagnosis": {
        "investigationRequired": ["RGV", "CBCT", "Blood Tests"],
        "results": "",
        "finalDiagnosis": "",
        "treatmentPlan": "Full-mouth scaling and polishing; Composite restorations; Possible root canal treatment for tooth 26"
    },
    "medication": [
        {
            "medicineName": "Amoxicillin",
            "dosage": "500mg",
            "frequency": "3",
            "timing": "daily",
            "duration": "5 days",
            "quantity": "",
            "remarks": ""
        },
        {
            "medicineName": "Metronidazole",
            "dosage": "400mg",
            "frequency": "3",
            "timing": "daily",
            "duration": "5 days",
            "quantity": "",
            "remarks": ""
        },
        {
            "medicineName": "Ibuprofen",
            "dosage": "400mg",
            "frequency": "4",
            "timing": "before meals",
            "duration": "1 day",
            "quantity": "",
            "remarks": ""
        },
        {
            "medicineName": "Chlorhexidine mouthwash",
            "dosage": "",
            "frequency": "2",
            "timing": "after brushing",
            "duration": "",
            "quantity": "",
            "remarks": "Wait 30 minutes after brushing"
        }
    ],
    "nextFollowupDate": "29-06-2025"
}}}},status.HTTP_401_UNAUTHORIZED: {
        "description": "API Key is missing or invalid. Please provide a valid API key.",
    },
    status.HTTP_404_NOT_FOUND: {
        "description": "Transcript not found. The provided `transcript_id` does not exist.",
    },
    status.HTTP_500_INTERNAL_SERVER_ERROR: {
        "description": "An unexpected server error occurred.",
    },
        }

@router.get(
        '/v1.1/dental_medical_report',
        response_class=PlainTextResponse,
        tags = tags,
        summary = summary,
        description = description,
        responses = responses)

async def extract_dental_medical_report(
    request : Request,
    transcript_id: str, 
    db: AsyncSession = Depends(get_db),
    api_key_record: models.APIKey = Security(get_api_key)
    ) :
    """
    Generates dental medical report for a specific transcript ID.

    :param transcript_id: The unique identifier for the transcript.
    :param db: The asynchronous database session.
    :param api_key_record: The authenticated API key record.
    :return: A dictionary of medicines and complaints mapped to a dental medical report.
    """
    try:
        #dental_medical_report = await dental_medical_report.extract_dental_medical_report(transcript_id, db, api_key_record)
        #return {"dental_medical_report": dental_medical_report}
        return await repo_extract_dental_medical_report(request,transcript_id,db,api_key_record)

    except HTTPException as e:
        # Re-raise HTTPException to be handled by FastAPI's exception handler
        raise e
    except Exception as e:
        # Log the unexpected error and return a generic 500 error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing the request.",
        )
    