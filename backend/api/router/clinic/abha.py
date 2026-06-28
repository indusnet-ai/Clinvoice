"""
ABHA Aadhaar code stubs (state + district pickers used in onboarding).

The reference frontend usually points at https://abha-api.clinvoice.com.
For local dev we ship a static list of Indian states + a few districts each so
the onboarding wizard's State/District dropdowns work without an external API.

Endpoints:
  POST /abha_state_code                       -> list of states
  POST /abha_district_code?stateCode=29       -> list of districts for that state
"""
from typing import Any, List, Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter(tags=["ABHA"])


# 28 states + 8 UTs — official short codes (lgdcode-style).
_STATES: List[dict[str, Any]] = [
    {"state_name": "Andhra Pradesh", "state_code": 28},
    {"state_name": "Arunachal Pradesh", "state_code": 12},
    {"state_name": "Assam", "state_code": 18},
    {"state_name": "Bihar", "state_code": 10},
    {"state_name": "Chhattisgarh", "state_code": 22},
    {"state_name": "Goa", "state_code": 30},
    {"state_name": "Gujarat", "state_code": 24},
    {"state_name": "Haryana", "state_code": 6},
    {"state_name": "Himachal Pradesh", "state_code": 2},
    {"state_name": "Jharkhand", "state_code": 20},
    {"state_name": "Karnataka", "state_code": 29},
    {"state_name": "Kerala", "state_code": 32},
    {"state_name": "Madhya Pradesh", "state_code": 23},
    {"state_name": "Maharashtra", "state_code": 27},
    {"state_name": "Manipur", "state_code": 14},
    {"state_name": "Meghalaya", "state_code": 17},
    {"state_name": "Mizoram", "state_code": 15},
    {"state_name": "Nagaland", "state_code": 13},
    {"state_name": "Odisha", "state_code": 21},
    {"state_name": "Punjab", "state_code": 3},
    {"state_name": "Rajasthan", "state_code": 8},
    {"state_name": "Sikkim", "state_code": 11},
    {"state_name": "Tamil Nadu", "state_code": 33},
    {"state_name": "Telangana", "state_code": 36},
    {"state_name": "Tripura", "state_code": 16},
    {"state_name": "Uttar Pradesh", "state_code": 9},
    {"state_name": "Uttarakhand", "state_code": 5},
    {"state_name": "West Bengal", "state_code": 19},
    {"state_name": "Andaman and Nicobar Islands", "state_code": 35},
    {"state_name": "Chandigarh", "state_code": 4},
    {"state_name": "Dadra and Nagar Haveli and Daman and Diu", "state_code": 26},
    {"state_name": "Delhi", "state_code": 7},
    {"state_name": "Jammu and Kashmir", "state_code": 1},
    {"state_name": "Ladakh", "state_code": 37},
    {"state_name": "Lakshadweep", "state_code": 31},
    {"state_name": "Puducherry", "state_code": 34},
]

# A small representative set of districts per state. Extend as needed.
_DISTRICTS: dict[int, List[dict[str, Any]]] = {
    29: [  # Karnataka
        {"district_name": "Bangalore Urban", "district_code": 572},
        {"district_name": "Bangalore Rural", "district_code": 573},
        {"district_name": "Mysuru", "district_code": 580},
        {"district_name": "Mangaluru", "district_code": 581},
        {"district_name": "Hubballi-Dharwad", "district_code": 582},
    ],
    33: [  # Tamil Nadu
        {"district_name": "Chennai", "district_code": 600},
        {"district_name": "Coimbatore", "district_code": 641},
        {"district_name": "Madurai", "district_code": 625},
        {"district_name": "Tiruchirappalli", "district_code": 620},
        {"district_name": "Salem", "district_code": 636},
    ],
    27: [  # Maharashtra
        {"district_name": "Mumbai", "district_code": 400},
        {"district_name": "Pune", "district_code": 411},
        {"district_name": "Nagpur", "district_code": 440},
        {"district_name": "Nashik", "district_code": 422},
    ],
    7: [  # Delhi
        {"district_name": "New Delhi", "district_code": 110},
        {"district_name": "North Delhi", "district_code": 111},
        {"district_name": "South Delhi", "district_code": 112},
        {"district_name": "East Delhi", "district_code": 113},
    ],
    32: [  # Kerala
        {"district_name": "Thiruvananthapuram", "district_code": 695},
        {"district_name": "Kochi", "district_code": 682},
        {"district_name": "Kozhikode", "district_code": 673},
    ],
    36: [  # Telangana
        {"district_name": "Hyderabad", "district_code": 500},
        {"district_name": "Warangal", "district_code": 506},
    ],
    24: [  # Gujarat
        {"district_name": "Ahmedabad", "district_code": 380},
        {"district_name": "Surat", "district_code": 395},
        {"district_name": "Vadodara", "district_code": 390},
    ],
}


class AbhaStateBody(BaseModel):
    stateCode: Optional[int] = None


@router.post("/abha_state_code")
async def abha_state_code(_: AbhaStateBody | None = None):
    return _STATES


@router.post("/abha_district_code")
async def abha_district_code(stateCode: int = Query(..., description="ABHA state code")):
    return _DISTRICTS.get(stateCode, [
        {"district_name": "Other", "district_code": 999},
    ])
