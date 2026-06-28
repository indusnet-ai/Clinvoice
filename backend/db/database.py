from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel

from typing import List, Optional
import os

from fastapi import FastAPI, Depends, HTTPException

from config import Settings
app = FastAPI()
from dotenv import load_dotenv
load_dotenv()

settings = Settings()
DATABASE_URL = settings.DATABASE_URL
#engine = create_engine(DATABASE_URL, connect_args = {"check_same_thread": False})

async_engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    # Connection pool settings to prevent stale connection errors
    pool_pre_ping=True,    # Test connection before using (auto-discard dead connections)
    pool_recycle=300,      # Recycle connections every 5 minutes
    pool_size=5,           # Number of connections in the pool
    max_overflow=10,       # Max extra connections beyond pool_size
)


AsyncSessionLocal = sessionmaker(autocommit = False, autoflush = False, bind = async_engine,class_=AsyncSession,expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            # No need to explicitly close/rolllback for async with
            # The 'async with' context manager handles closing the session
            pass