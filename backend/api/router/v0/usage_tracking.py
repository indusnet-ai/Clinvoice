from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from typing import Dict, Any
from db.models import APICallLog, APIKey
from api.utils.api_auth import get_api_key

import logging

from db.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter()

tags=["Metrics"]
summary="Usage report"
#response_model=MedicalReportResponse
description = """
Generates usage report for the api key.
"""

@router.get("/usage",
            tags = tags,
            summary = summary,
            description = description, 
            response_model=Dict[str, Any])

async def get_my_usage_summary(
    db: AsyncSession = Depends(get_db),
    api_key: APIKey = Depends(get_api_key)
):
    """
    Get the total cost, audio duration, input tokens, and output tokens
    for the currently logged-in user.
    """
    try:
        # Get the ID of the authenticated API key
        api_key_id = api_key.id
        
        # Aggregate total usage metrics for the given API key
        total_usage_query = await db.execute(
            select(
                func.count(APICallLog.id).label('total_calls'),
                func.sum(APICallLog.input_tokens).label('total_input_tokens'),
                func.sum(APICallLog.output_tokens).label('total_output_tokens'),
                func.sum(APICallLog.cost).label('total_cost')
            ).filter(APICallLog.api_key_id == api_key_id)
        )
        total_usage_data = total_usage_query.one()

        # Aggregate usage per endpoint and model used
        endpoint_usage_query = await db.execute(
            select(
                APICallLog.endpoint,
                APICallLog.model_used,
                func.count(APICallLog.id).label('call_count'),
                func.sum(APICallLog.input_tokens).label('input_tokens_sum'),
                func.sum(APICallLog.output_tokens).label('output_tokens_sum'),
                func.sum(APICallLog.cost).label('cost_sum')
            ).filter(APICallLog.api_key_id == api_key_id)
            .group_by(APICallLog.endpoint, APICallLog.model_used)
            .order_by(APICallLog.endpoint)
        )
        endpoint_usage_data = endpoint_usage_query.all()

        return {
            
            "total_usage": {
                "total_calls": int(total_usage_data.total_calls) if total_usage_data.total_calls else 0,
                "total_input_tokens": float(total_usage_data.total_input_tokens) if total_usage_data.total_input_tokens else 0,
                "total_output_tokens": float(total_usage_data.total_output_tokens) if total_usage_data.total_output_tokens else 0,
                "total_cost": float(total_usage_data.total_cost) if total_usage_data.total_cost else 0.0
            },
            "endpoint_breakdown": [
                {
                    "endpoint": row.endpoint,
                    "model_used": row.model_used,
                    "call_count": int(row.call_count),
                    "input_tokens_sum": float(row.input_tokens_sum) if row.input_tokens_sum else 0,
                    "output_tokens_sum": float(row.output_tokens_sum) if row.output_tokens_sum else 0,
                    "cost_sum": float(row.cost_sum) if row.cost_sum else 0.0
                } for row in endpoint_usage_data
            ]
        }

    except Exception as e:
        logger.error(f"Error fetching API usage data: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching usage data."
        )