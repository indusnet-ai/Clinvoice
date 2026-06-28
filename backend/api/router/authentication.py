from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


from sqlalchemy.orm import Session
from db import database, models
from api.utils import JWTtoken
from api.utils.hashing import Hash
from fastapi.security import OAuth2PasswordRequestForm


router = APIRouter(
    tags = ['Login']
)

@router.post('/login')
#def login(request:schemas.login, db: Session = Depends(database.get_db)):
async def login(request:OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(database.get_db)):
   
    result = await db.execute(
    select(models.User).filter(models.User.email == request.username)
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail = f'Invalid credentials')
    if not Hash.verify(request.password,user.password):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail = f'Invalid password')
    
    access_token = JWTtoken.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
    

    