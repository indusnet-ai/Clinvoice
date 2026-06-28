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
from api.repository.generation_registry import extract_medical_report as repo_extract_medical_report

router = APIRouter()
logger = logging.getLogger(__name__)

tags=["OPD"]
summary="Medical report API"
#response_model=MedicalReportResponse
description = """
This endpoint generates medical report for a given medical transcript.

**How to use:**
- Provide a `transcript_id` as a query parameter.
- The response will be a JSON object mapping medicines and complaints to a medical report.
"""
responses = {
            status.HTTP_200_OK : {
                "description" : " Medical report generated successfully",
                "content" : {
                    "text/plain" : {
                        "example" : {
  "Vitals": {
    "SPO2": "",
    "Respiration": "",
    "Temperature": "",
    "Pulse": "",
    "Weight": "",
    "Height": "",
    "BP": ""
  },
  "ClinicalNotes": {
    "FollowUp": {
      "OPD_ID": "",
      "Count": "3",
      "DurationLimit": "days",
      "Date": "",
      "Remarks": "if your symptoms get worse or do not improve, please come back soon"
    },
    "DietPlan": {
      "OPD_ID": "",
      "DietPlan": "balanced diet with plenty of water, include more greens, vegetables, fruits and lean proteins"
    },
    "DiagnosisReport": {
      "OPD_ID": "",
      "TestCategories": "pathology",
      "SubCategory": "Complete Blood Count (CBC)",
      "Laboratory": "local lab",
      "Remarks": "to check any infections or vitamin issues"
    },
    "TreatmentAdvice": {
      "OPD_ID": "",
      "Advice": "resting, drinking plenty of water and staying off screen as much as you can"
    },
    "PastTreatmentHistory": {
      "OPD_ID": "",
      "History": "tried over the counter pain medicines but it did not help much"
    },
    "ChiefComplaintsBasic": {
      "OPD_ID": "",
      "ComplaintName": "headache, nausea, fatigue"
    },
    "ChiefComplaintDetails": {
      "OPD_ID": "",
      "Count": "6",
      "DurationLimit": "days",
      "Remarks": "constant headache, feels nauseous and very tired, symptoms getting worse"
    },
    "HospitalID": ""
  },
  "Prescription": [
    {
      "MedicineName": "paracetamol",
      "Frequency": "1 0 1",
      "Dosage": "500mg",
      "DurationCount": "3",
      "DurationLimit": "days",
      "Quantity": "6",
      "When": "after meal",
      "Remarks": "for headache",
      "OPD_ID": "",
      "HospitalID": ""
    },
    {
      "MedicineName": "dolo",
      "Frequency": "1 0 1",
      "Dosage": "500mg", 
      "DurationCount": "3",
      "DurationLimit": "days",
      "Quantity": "6",
      "When": "after meal",
      "Remarks": "for fever",
      "OPD_ID": "",
      "HospitalID": ""
    }
  ]
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
        '/v2/medical_report',
        response_class=PlainTextResponse,
        tags = tags,
        summary = summary,
        description = description,
        responses = responses)
async def extract_medical_report(
  request : Request,
  transcript_id: str, 
  db: AsyncSession = Depends(get_db),
  api_key_record: models.APIKey = Security(get_api_key)
  ):

  """
    Generates medical report for a specific transcript ID.

    :param transcript_id: The unique identifier for the transcript.
    :param db: The asynchronous database session.
    :param api_key_record: The authenticated API key record.
    :return: A dictionary of medical report mapped to medicines and complaints.
    """

  try:
      #medical_report = await medical_report.extract_medical_report(transcript_id, db, api_key_record)
      #return {"medical_report": medical_report}
      return await repo_extract_medical_report(request,transcript_id,db,api_key_record)

  except HTTPException as e:
      # Re-raise HTTPException to be handled by FastAPI's exception handler
      raise e
  except Exception as e:
      # Log the unexpected error and return a generic 500 error
      raise HTTPException(
          status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
          detail="An unexpected error occurred while processing the request.",
      )

    