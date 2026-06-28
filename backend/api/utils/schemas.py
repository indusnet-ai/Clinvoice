from pydantic import BaseModel

class User(BaseModel):
    name: str
    email : str
    password : str

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None

class TranscriptResponse(BaseModel):
    transcript_id: str
    transcript: str

class SummaryResponse(BaseModel):
    summary: str

class MedicalReportResponse(BaseModel):
    medical_report: str

class MessageResponse(BaseModel):
    message: str
    Transcript_Id: str = None