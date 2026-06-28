from fastapi import APIRouter
from fastapi import Depends, HTTPException, status
from api.utils import schemas
from sqlalchemy.orm import Session
from db import database

from api.repository import user

router = APIRouter(
    tags = ['User']
)

@router.post('/create_account',
             summary = "Create account")
def create(request: schemas.User, db: Session = Depends(database.get_db)):
    return user.create_user(request, db)



@router.delete('/delete_account',
               summary = " Delete account")
def destroy(name, email, password, db: Session = Depends(database.get_db)):
    return user.destroy(name,email,password,db)