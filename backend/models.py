"""
models.py — All database models for CourseForge.
Uses SQLModel (Pydantic + SQLAlchemy).
"""

from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import JSON, String
from datetime import datetime
from typing import Optional, List
import uuid


# ─── User ──────────────────────────────────────────────────────────────────

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(default="")
    email: str = Field(sa_column=Column(String, unique=True, index=True), nullable=False)
    password_hash: str = Field(default="", nullable=False)
    role: str = Field(default="user")  # "user" | "admin"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    courses: List["Course"] = Relationship(back_populates="user")
    progress: List["Progress"] = Relationship(back_populates="user")


# ─── Course ────────────────────────────────────────────────────────────────

class Course(SQLModel, table=True):
    __tablename__ = "courses"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="users.id", nullable=False)
    title: str = Field(default="", nullable=False)
    description: Optional[str] = Field(default=None)
    source_youtube_url: Optional[str] = Field(default=None)
    source_video_id: Optional[str] = Field(default=None)
    thumbnail_url: Optional[str] = Field(default=None)
    transcript_text: Optional[str] = Field(default=None)
    generated_data: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    channel_name: Optional[str] = Field(default=None)
    is_playlist: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional[User] = Relationship(back_populates="courses")
    lessons: List["Lesson"] = Relationship(back_populates="course")
    progress: List["Progress"] = Relationship(back_populates="course")


# ─── Lesson ────────────────────────────────────────────────────────────────

class Lesson(SQLModel, table=True):
    __tablename__ = "lessons"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    course_id: str = Field(foreign_key="courses.id", nullable=False)
    title: str = Field(default="", nullable=False)
    summary: Optional[str] = Field(default=None)
    video_id: Optional[str] = Field(default=None)
    video_start: Optional[int] = Field(default=None)
    video_end: Optional[int] = Field(default=None)
    guide_data: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    quiz_data: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    assignment_data: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    lesson_order: int = Field(default=0)
    duration: Optional[str] = Field(default=None)
    transcript_status: str = Field(default="not_requested")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    course: Optional[Course] = Relationship(back_populates="lessons")


# ─── Progress ──────────────────────────────────────────────────────────────

class Progress(SQLModel, table=True):
    __tablename__ = "progress"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="users.id", nullable=False)
    course_id: str = Field(foreign_key="courses.id", nullable=False)
    lesson_id: Optional[str] = Field(default=None)
    completed: bool = Field(default=False)
    quiz_score: Optional[int] = Field(default=None)
    quiz_attempts: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional[User] = Relationship(back_populates="progress")
    course: Optional[Course] = Relationship(back_populates="progress")


# ─── TranscriptJob ─────────────────────────────────────────────────────────

class TranscriptJob(SQLModel, table=True):
    __tablename__ = "transcript_jobs"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: Optional[str] = Field(default=None, foreign_key="users.id")
    youtube_url: Optional[str] = Field(default=None)
    video_id: Optional[str] = Field(default=None)
    status: str = Field(default="queued")  # queued | running | complete | failed
    progress: int = Field(default=0)
    result: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    error: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ─── Subscription ──────────────────────────────────────────────────────────

class Subscription(SQLModel, table=True):
    __tablename__ = "subscriptions"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="users.id", nullable=False)
    provider: Optional[str] = Field(default=None)  # stripe | manual
    plan: str = Field(default="free")  # free | pro | enterprise
    status: str = Field(default="active")  # active | inactive | cancelled
    current_period_end: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
