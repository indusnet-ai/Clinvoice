from sqlalchemy.orm import Session
from db import models
from api.utils import schemas
from api.utils.hashing import Hash
from fastapi import HTTPException, status

async def create_user(request: schemas.User, db: Session): 
    existing_user = await db.query(models.User).filter(models.User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with email {request.email} already exists"
        )

    new_user = models.User(name=request.name, email=request.email, password=Hash.bcrypt(request.password))
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user
    
async def destroy(name, email, password, db: Session):
    # First find the user by name and email only
    user_to_delete = await db.query(models.User).filter(
        models.User.name == name, 
        models.User.email == email
    ).first()
    
    if user_to_delete:
        # Verify the password against the hashed password stored in the database
        if Hash.verify(password,user_to_delete.password):
            db.delete(user_to_delete)
            db.commit()
            return f"User with name {name} and email {email} deleted"
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"User with name {name} and email {email} does not exist"
        )
    
