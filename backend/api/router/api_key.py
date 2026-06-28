from fastapi import APIRouter, Depends, HTTPException, status
from api.utils import schemas
from db import database,models
from sqlalchemy.ext.asyncio import AsyncSession


from sqlalchemy.orm import Session
from api.utils.api_key import generate_api_key
from api.repository import api_key
from api.utils.hashing import Hash
from api.utils import oauth2

router = APIRouter(
    tags = ['Api Key']
    
)

@router.get('/create_api_key',
            summary = "Create API key")
async def view_all(db : AsyncSession= Depends(database.get_db),current_user: schemas.User = Depends(oauth2.get_current_user)):
    return api_key.get_key(db,current_user)

@router.get('/view_api_keys',
            summary = "View API keys")
async def view_keys(db: AsyncSession = Depends(database.get_db),current_user: schemas.User = Depends(oauth2.get_current_user)):
    return api_key.view_api_keys(db,current_user)
    


    

    
    



