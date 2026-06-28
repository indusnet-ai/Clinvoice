from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db import models
from api.utils import schemas
from api.utils.hashing import Hash
from fastapi import HTTPException, status
from api.utils.api_key import generate_api_key

async def get_key(db: AsyncSession,current_user: schemas.User):
    
    result = await db.execute(
    select(models.User).filter(models.User.email == current_user.username)
    )
    user_to_verify = result.scalars().first()
    
    if user_to_verify:

            # Generate new API key
            api_key = generate_api_key(user_to_verify.name, user_to_verify.email)
    
            # Create new APIKey object
            new_api_key = models.APIKey(
            key=api_key,
            user_id=user_to_verify.id
            )
    
            # Add to database and commit
            db.add(new_api_key)
            await db.commit()
            await db.refresh(new_api_key)
    
            return {"api_key": api_key}
  
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"User not found in the database"
        )

async def view_api_keys(db: AsyncSession,current_user: schemas.User):
    result = await db.execute(
    select(models.User).filter(models.User.email == current_user.username)
    )
    user = result.scalars().first()
       
    if user:
            result = await db.execute(
            select(models.APIKey).filter(models.APIKey.user_id == user.id)
            )
            api_keys = result.scalars().all()
            

            if not api_keys:
                return {"message": "No API keys found. Please create api key first"}
            
            key_list = [api_key.key for api_key in api_keys]
    
            return {"api_keys": key_list}
        
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"User not found"
        )


    
    