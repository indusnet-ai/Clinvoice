from typing import Dict, Any

# =============================================================================
# Medical Report (V1) - Flattened structure
# =============================================================================
MEDICAL_REPORT_EXAMPLE = {
    "Vitals": {
        "SPO2": "98%",
        "Respiration": "18 bpm",
        "Temperature": "98.6 F",
        "Pulse": "72 bpm",
        "Weight": "70 kg",
        "Height": "175 cm",
        "BP": "120/80 mmHg"
    },
    "ChiefComplaints": "Persistent dry cough for 2 weeks, low-grade fever, and mild shortness of breath during exertion.",
    "HistoryOfPresentIllness": "Patient reports symptoms started 14 days ago after exposure to a cold environment. Cough is non-productive and worse at night. Fever is intermittent.",
    "PastMedicalHistory": "Known case of hypertension for 5 years, well-controlled on Amlodipine. No history of asthma or allergies.",
    "PhysicalExamination": "Chest: Occasional scattered wheeze. CVS: S1 S2 heard, no murmurs. Abdomen: Soft, non-tender.",
    "DiagnosisAndTreatmentAdvice": "Likely viral bronchitis. Advised rest, increased fluid intake, and steam inhalation.",
    "Prescription": [
        {
            "MedicineName": "Paracetamol",
            "Dosage": "500mg",
            "Frequency": "1-0-1",
            "When": "After food",
            "DurationCount": "3",
            "DurationLimit": "Days",
            "Quantity": "6",
            "Remarks": "For fever/body ache"
        },
        {
            "MedicineName": "Levosalbutamol Syrup",
            "Dosage": "5ml",
            "Frequency": "0-0-1",
            "When": "Before bed",
            "DurationCount": "5",
            "DurationLimit": "Days",
            "Quantity": "1 bottle",
            "Remarks": "For cough"
        }
    ],
    "Investigations": [
        {
            "TestCategories": "radiology",
            "SubCategory": "Chest X-ray",
            "Laboratory": "Hospital Radiology Dept",
            "Remarks": "To rule out pneumonia"
        },
        {
            "TestCategories": "pathology",
            "SubCategory": "Complete Blood Count (CBC)",
            "Laboratory": "Hospital Lab",
            "Remarks": "To check for infection markers"
        }
    ],
    "DietPlan": "Warm fluids, avoid cold drinks and allergens. Include protein-rich foods.",
    "FollowUp": "Review after 5 days or immediately if breathlessness increases."
}

# =============================================================================
# Dental Medical Report (V1.1) - Flattened structure
# =============================================================================
DENTAL_REPORT_EXAMPLE = {
    "ChiefComplaints": "Severe pain in the lower right back tooth region for 3 days. Difficulty in chewing.",
    "PastMedicalHistory": "Type 2 Diabetes Mellitus - on Metformin 500mg. Last HbA1c: 6.8.",
    "PastDentalHistory": "Extraction done in 2021 for upper left molar.",
    "ExtraOralExamination": "Mild swelling noted on the right cheek area. No lymphadenopathy.",
    "OralHygiene": "Fair",
    "GingivalHealth": "Inflammation",
    "CariesStatus": "Present",
    "IntraoralNotes": "Deep carious lesion on 46. Generalized mild plaque accumulation.",
    "ToothChart": { "46": "D" },
    "Attrition": "Mild generalized",
    "Abrasion": "Noted on 14, 24",
    "Erosions": "Negative",
    "TendernessOnPercussion": "Positive on 46",
    "MolarRelation": "Class I",
    "MobilityOfTeeth": "Grade I mobility on 46",
    "InvestigationRequired": ["RVG"],
    "InvestigationResults": "Radiograph shows radiolucency involving pulp in 46.",
    "FinalDiagnosis": "Symptomatic Irreversible Pulpitis - 46.",
    "TreatmentPlan": "Root Canal Treatment for 46 followed by a ceramic crown.",
    "Prescription": [
        {
            "MedicineName": "Amoxicillin",
            "Dosage": "500mg",
            "Frequency": "1-1-1",
            "Timing": "After food",
            "Duration": "5 Days",
            "Quantity": "15",
            "Remarks": "Antibiotic cover"
        }
    ],
    "FollowUp": {
        "Count": "2",
        "DurationLimit": "Days",
        "Date": "",
        "Remarks": "Review for RCT"
    }
}

# =============================================================================
# SOAP Notes (V1)
# =============================================================================
SOAP_NOTES_EXAMPLE = {
    "Subjective": {
        "CC": "Follow-up for hypertension and new onset of bilateral knee pain.",
        "HPI": "65 y/o male with chronic HTN. Reports 2-week h/o bilateral knee pain, R > L. Pain is dull, aching, worse with stairs. No recent trauma.",
        "PMH": ["Hypertension (5 yrs)", "Type 2 Diabetes (3 yrs)"],
        "PSH": ["Appendectomy (1995)"],
        "SocHx": "Retired teacher, non-smoker, occasional alcohol.",
        "FamHx": "Father had MI at 60.",
        "Meds": ["Lisinopril 20mg daily", "Metformin 500mg BID"],
        "Allergies": ["Penicillin: Rash"],
        "ROS": {
            "General": "Negative",
            "HEENT": "Negative",
            "CV": "Negative",
            "Resp": "Negative",
            "GI": "Negative",
            "GU": "Negative",
            "Neuro": "Negative",
            "MSK": "Bilateral knee pain",
            "Skin": "Negative",
            "Psych": "Negative"
        }
    },
    "Objective": {
        "Vitals": {
            "Temp": "98.4", "BP": "138/88", "HR": "76", "RR": "16", "SpO2": "99", "Wt": "85kg"
        },
        "PhysicalExam": {
            "General": "Well-appearing, in no acute distress.",
            "CV": "RRR, S1 S2 normal.",
            "Resp": "CTAB.",
            "MSK": "Bilateral knee crepitus, mild effusion on R knee. No erythema.",
            "Neuro": "Grossly intact."
        },
        "ImagingLabs": ["X-ray knees ordered", "HbA1c last month: 7.1"]
    },
    "Assessment": {
        "Diagnosis": ["1. Osteoarthritis of knees", "2. Hypertension - stable"],
        "DDx": ["Anserine bursitis", "Meniscal tear"]
    },
    "Plan": {
        "Treatment": ["Naproxen 500mg BID PRN pain", "Physical therapy referral"],
        "Testing": ["Bilateral knee X-rays (weight-bearing)"],
        "FollowUp": "Review X-ray results in 1 week."
    }
}

# =============================================================================
# Translation (V1)
# =============================================================================
TRANSLATION_EXAMPLE = {
    "Subjective": {
        "CC": "தொடர்ச்சியான தலைவலி மற்றும் காய்ச்சல் (Persistent headache and fever)",
        "HPI": "நோயாளிக்கு 3 நாட்களாக தலைவலி மற்றும் காய்ச்சல் உள்ளது. மருந்துகள் எடுத்தும் பலன் இல்லை. (Patient has headache and fever for 3 days. Medications haven't helped.)",
        "Meds": ["பாரசிட்டமால் 500mg (Paracetamol 500mg)"],
        "ROS": {
            "General": "காய்ச்சல் (Fever)",
            "HEENT": "தலைவலி (Headache)",
            "GI": "சாதாரண நிலை (Negative)"
        }
    },
    "Objective": {
        "Vitals": {
            "Temp": "101 F",
            "BP": "120/80 mmHg"
        },
        "PhysicalExam": {
            "General": "சோர்வாக உள்ளார் (Patient looks tired)"
        }
    },
    "Assessment": {
        "Diagnosis": ["வைரஸ் காய்ச்சல் (Viral Fever)"],
        "DDx": ["ஒற்றைத் தலைவலி (Migraine)"]
    },
    "Plan": {
        "Treatment": ["ஓய்வு எடுக்கவும் (Take rest)", "அதிக தண்ணீர் குடிக்கவும் (Drink plenty of water)"],
        "Testing": ["இரத்தப் பரிசோதனை (Blood Test)"],
        "FollowUp": "3 நாட்களுக்குப் பிறகு வரவும் (Review after 3 days)"
    }
}

# =============================================================================
# Clinical Summary (Analytics V1)
# =============================================================================
CLINICAL_SUMMARY_EXAMPLE = {
    "summary": "42-year-old male with a history of poorly controlled T2DM and hypertension. Initially presented with HbA1c of 9.2%; titrated from Metformin 500mg to 1g BD over 3 visits. BP has improved from 150/95 to 142/90 following Amlodipine uptitration. Patient reports persistent fatigue.",
    "medication_changes": [
        { "name": "Metformin", "change": "Increased", "details": "Titrated from 500mg to 1g BD" },
        { "name": "Amlodipine", "change": "Added", "details": "Started at 5mg for BP management" }
    ],
    "vital_trends": {
        "BP": [
            { "date": "12 Feb 2025", "value": "150/95" },
            { "date": "28 Apr 2025", "value": "142/90" }
        ],
        "HbA1c": [
            { "date": "12 Feb 2025", "value": "9.2%" },
            { "date": "28 Apr 2025", "value": "7.8%" }
        ]
    },
    "clinical_alerts": [
        { "severity": "High", "message": "Persistent diastolic hypertension despite medication titration." },
        { "severity": "Medium", "message": "Persistent fatigue reported across multiple visits; evaluate for anemia." }
    ],
    "pending_actions": ["Review lipid panel results", "Verify adherence to physiotherapy"]
}

# =============================================================================
# Upload Audio (V1)
# =============================================================================
UPLOAD_AUDIO_EXAMPLE = {
    "message": "Processing completed successfully.",
    "Transcript_Id": "transcript_20260508101530_a1b2c3",
    "credits_used": 54
}

# =============================================================================
# Standard Error Responses
# =============================================================================
ERROR_401_EXAMPLE = {
    "detail": "Invalid API key"
}

ERROR_404_EXAMPLE = {
    "detail": "Transcript not found"
}

ERROR_500_EXAMPLE = {
    "detail": "An unexpected error occurred during processing."
}

# =============================================================================
# Standard Response Wrapper
# =============================================================================
def wrap_example(result: Any, credits_used: int = 45):
    return {
        "result": result,
        "credits_used": credits_used
    }

# Common responses for all V1 generation endpoints
def get_v1_responses(success_example: Dict[str, Any], is_flat: bool = False):
    example_val = success_example if is_flat else wrap_example(success_example)
    return {
        200: {
            "description": "Successful operation",
            "content": {
                "application/json": {
                    "example": example_val
                }
            }
        },
        401: {
            "description": "Unauthorized - Invalid API Key",
            "content": { "application/json": { "example": ERROR_401_EXAMPLE } }
        },
        404: {
            "description": "Not Found - Resource missing",
            "content": { "application/json": { "example": ERROR_404_EXAMPLE } }
        },
        500: {
            "description": "Internal Server Error",
            "content": { "application/json": { "example": ERROR_500_EXAMPLE } }
        }
    }
