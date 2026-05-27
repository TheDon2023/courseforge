"""
database.py — PostgreSQL connection using SQLModel.
Railway provides DATABASE_URL as an environment variable.
"""

import os
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.pool import NullPool

# Railway provides DATABASE_URL. Fallback to local for development.
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/courseforge"
)

# SQLAlchemy engine — NullPool for Railway's serverless-ish behavior
engine = create_engine(DATABASE_URL, poolclass=NullPool, echo=False)


def create_db_and_tables():
    """Create all tables if they don't exist. Call once at startup."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Generator for database sessions. Use as FastAPI dependency."""
    with Session(engine) as session:
        yield session
