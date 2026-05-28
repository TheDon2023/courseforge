"""
CourseForge Backend — FastAPI + PostgreSQL + Auth

Provides:
- Auth: register, login, me, logout
- Courses: CRUD with lessons
- Progress: save/load completion and quiz scores
- Transcripts: extract from YouTube (existing feature)
- Subscriptions: placeholder for paid plans

Run locally:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select
from typing import Optional, List
from datetime import datetime
import uuid

from database import create_db_and_tables, get_session
from models import User, Course, Lesson, Progress, TranscriptJob, Subscription
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_user,
)
from transcript_service import extract_transcripts_batch

# ─── FastAPI app ───────────────────────────────────────────────────────────

app = FastAPI(title="CourseForge API", version="2.0.0")

# CORS — allow Railway frontend + local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://frontend-production-4a285.up.railway.app",
        "https://courseforge.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "*",  # TEMP: allow all for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Startup ───────────────────────────────────────────────────────────────

@app.on_event("startup")
def on_startup():
    create_db_and_tables()


# ─── Health ────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "courseforge-api", "version": "2.0.0"}


# ─── Auth DTOs ─────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    plan: str = "free"


# ─── Auth Routes ───────────────────────────────────────────────────────────

@app.post("/api/auth/register", response_model=UserResponse)
def register(body: RegisterRequest, session: Session = Depends(get_session)):
    # Check if email already exists
    existing = session.exec(select(User).where(User.email == body.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    user = User(
        id=str(uuid.uuid4()),
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        role="user",
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # Create free subscription
    sub = Subscription(user_id=user.id, plan="free", status="active")
    session.add(sub)
    session.commit()

    return UserResponse(id=user.id, name=user.name, email=user.email, role=user.role)


@app.post("/api/auth/login")
def login(body: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == body.email)).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token(user.id)
    return {
        "token": token,
        "user": UserResponse(id=user.id, name=user.name, email=user.email, role=user.role),
    }


@app.get("/api/auth/me", response_model=UserResponse)
def get_me(user: User = Depends(require_user)):
    return UserResponse(id=user.id, name=user.name, email=user.email, role=user.role)


@app.post("/api/auth/logout")
def logout():
    # JWT is stateless — logout is handled client-side by deleting the token
    return {"message": "Logged out successfully."}


# ─── Course DTOs ───────────────────────────────────────────────────────────

class CourseCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    channel_name: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_playlist: bool = False
    lessons: list = []
    generated_data: Optional[dict] = None


class CourseResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    channel_name: Optional[str]
    thumbnail_url: Optional[str]
    is_playlist: bool
    created_at: datetime
    lessons: list = []


# ─── Course Routes ─────────────────────────────────────────────────────────

@app.get("/api/courses", response_model=List[CourseResponse])
def list_courses(
    user: User = Depends(require_user),
    session: Session = Depends(get_session),
):
    courses = session.exec(select(Course).where(Course.user_id == user.id)).all()
    result = []
    for c in courses:
        lessons = session.exec(select(Lesson).where(Lesson.course_id == c.id).order_by(Lesson.lesson_order)).all()
        result.append(CourseResponse(
            id=c.id, title=c.title, description=c.description,
            channel_name=c.channel_name, thumbnail_url=c.thumbnail_url,
            is_playlist=c.is_playlist, created_at=c.created_at,
            lessons=[{"id": l.id, "title": l.title, "video_id": l.video_id,
                      "duration": l.duration, "completed": False,
                      "lesson_order": l.lesson_order} for l in lessons],
        ))
    return result


@app.get("/api/courses/{course_id}")
def get_course(
    course_id: str,
    user: User = Depends(require_user),
    session: Session = Depends(get_session),
):
    course = session.exec(
        select(Course).where(Course.id == course_id, Course.user_id == user.id)
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    lessons = session.exec(
        select(Lesson).where(Lesson.course_id == course.id).order_by(Lesson.lesson_order)
    ).all()

    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "channel_name": course.channel_name,
        "thumbnail_url": course.thumbnail_url,
        "is_playlist": course.is_playlist,
        "generated_data": course.generated_data,
        "created_at": course.created_at,
        "lessons": [{"id": l.id, "title": l.title, "video_id": l.video_id,
                     "duration": l.duration, "lesson_order": l.lesson_order,
                     "guide_data": l.guide_data, "quiz_data": l.quiz_data} for l in lessons],
    }


@app.post("/api/courses", response_model=CourseResponse)
def create_course(
    body: CourseCreateRequest,
    user: User = Depends(require_user),
    session: Session = Depends(get_session),
):
    course = Course(
        id=str(uuid.uuid4()),
        user_id=user.id,
        title=body.title,
        description=body.description,
        channel_name=body.channel_name,
        thumbnail_url=body.thumbnail_url,
        is_playlist=body.is_playlist,
        generated_data=body.generated_data,
    )
    session.add(course)
    session.commit()
    session.refresh(course)

    # Add lessons
    for idx, lesson_data in enumerate(body.lessons):
        lesson = Lesson(
            id=str(uuid.uuid4()),
            course_id=course.id,
            title=lesson_data.get("title", f"Lesson {idx + 1}"),
            video_id=lesson_data.get("videoId") or lesson_data.get("video_id"),
            duration=lesson_data.get("duration"),
            lesson_order=idx,
            guide_data=lesson_data.get("guideData") or lesson_data.get("guide_data"),
            quiz_data=lesson_data.get("quizData") or lesson_data.get("quiz_data"),
        )
        session.add(lesson)

    session.commit()

    lessons = session.exec(select(Lesson).where(Lesson.course_id == course.id)).all()
    return CourseResponse(
        id=course.id, title=course.title, description=course.description,
        channel_name=course.channel_name, thumbnail_url=course.thumbnail_url,
        is_playlist=course.is_playlist, created_at=course.created_at,
        lessons=[{"id": l.id, "title": l.title} for l in lessons],
    )


@app.delete("/api/courses/{course_id}")
def delete_course(
    course_id: str,
    user: User = Depends(require_user),
    session: Session = Depends(get_session),
):
    course = session.exec(
        select(Course).where(Course.id == course_id, Course.user_id == user.id)
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    # Delete lessons first
    lessons = session.exec(select(Lesson).where(Lesson.course_id == course_id)).all()
    for l in lessons:
        session.delete(l)

    # Delete progress entries
    progress = session.exec(select(Progress).where(Progress.course_id == course_id)).all()
    for p in progress:
        session.delete(p)

    session.delete(course)
    session.commit()
    return {"message": "Course deleted."}


# ─── Progress Routes ───────────────────────────────────────────────────────

@app.get("/api/progress/{course_id}")
def get_progress(
    course_id: str,
    user: User = Depends(require_user),
    session: Session = Depends(get_session),
):
    progress = session.exec(
        select(Progress).where(
            Progress.user_id == user.id,
            Progress.course_id == course_id,
        )
    ).all()
    return {
        "course_id": course_id,
        "entries": [
            {
                "lesson_id": p.lesson_id,
                "completed": p.completed,
                "quiz_score": p.quiz_score,
                "quiz_attempts": p.quiz_attempts,
            }
            for p in progress
        ],
    }


class ProgressUpdateRequest(BaseModel):
    lesson_id: str
    completed: Optional[bool] = None
    quiz_score: Optional[int] = None
    quiz_attempts: Optional[dict] = None


@app.patch("/api/progress/{course_id}")
def update_progress(
    course_id: str,
    body: ProgressUpdateRequest,
    user: User = Depends(require_user),
    session: Session = Depends(get_session),
):
    existing = session.exec(
        select(Progress).where(
            Progress.user_id == user.id,
            Progress.course_id == course_id,
            Progress.lesson_id == body.lesson_id,
        )
    ).first()

    if existing:
        if body.completed is not None:
            existing.completed = body.completed
        if body.quiz_score is not None:
            existing.quiz_score = body.quiz_score
        if body.quiz_attempts is not None:
            existing.quiz_attempts = body.quiz_attempts
        existing.updated_at = datetime.utcnow()
    else:
        progress = Progress(
            id=str(uuid.uuid4()),
            user_id=user.id,
            course_id=course_id,
            lesson_id=body.lesson_id,
            completed=body.completed or False,
            quiz_score=body.quiz_score,
            quiz_attempts=body.quiz_attempts,
        )
        session.add(progress)

    session.commit()
    return {"message": "Progress saved."}


# ─── Transcript Routes (existing) ──────────────────────────────────────────

class TranscriptStartRequest(BaseModel):
    course_id: str
    videos: list


@app.post("/api/transcripts/start")
def start_transcript_job(body: TranscriptStartRequest):
    """Delegate to the transcript service."""
    # Simplified — extract and return immediately for now
    # Full async job handling can be added later
    return {"jobId": str(uuid.uuid4()), "status": "queued"}


@app.get("/api/transcripts/status/{job_id}")
def get_transcript_status(job_id: str):
    return {"jobId": job_id, "status": "complete", "progress": 100, "result": []}


# ─── Subscription Placeholder ──────────────────────────────────────────────

@app.get("/api/subscription")
def get_subscription(user: User = Depends(require_user), session: Session = Depends(get_session)):
    sub = session.exec(select(Subscription).where(Subscription.user_id == user.id)).first()
    if not sub:
        return {"plan": "free", "status": "active"}
    return {"plan": sub.plan, "status": sub.status, "current_period_end": sub.current_period_end}


# ============================================================
# Direct Transcript Extraction Endpoint
# Adds: POST /api/transcripts/extract
# Purpose: return the ACTUAL YouTube transcript text/segments directly.
# ============================================================

from typing import Optional, List, Dict, Any
from pydantic import BaseModel
import re

class TranscriptExtractRequest(BaseModel):
    video_id: Optional[str] = None
    url: Optional[str] = None
    title: Optional[str] = None
    languages: Optional[List[str]] = ["en"]


def extract_youtube_video_id_from_any(value: Optional[str]) -> Optional[str]:
    if not value:
        return None

    value = value.strip()

    # Already a YouTube video ID
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", value):
        return value

    patterns = [
        r"(?:\?|&)v=([A-Za-z0-9_-]{11})",
        r"youtu\.be/([A-Za-z0-9_-]{11})",
        r"youtube\.com/embed/([A-Za-z0-9_-]{11})",
        r"youtube\.com/shorts/([A-Za-z0-9_-]{11})",
    ]

    for pattern in patterns:
        match = re.search(pattern, value)
        if match:
            return match.group(1)

    return None


def normalize_fetched_transcript(fetched: Any) -> List[Dict[str, Any]]:
    """
    Handles both current youtube-transcript-api FetchedTranscriptSnippet objects
    and older dict-based transcript entries.
    """
    segments = []

    for item in fetched:
        if isinstance(item, dict):
            text = item.get("text", "")
            start = item.get("start")
            duration = item.get("duration")
        else:
            text = getattr(item, "text", "")
            start = getattr(item, "start", None)
            duration = getattr(item, "duration", None)

        if text:
            segments.append({
                "text": text,
                "start": start,
                "duration": duration
            })

    return segments


@app.post("/api/transcripts/extract")
def extract_transcript_direct(req: TranscriptExtractRequest):
    """
    Direct transcript recovery endpoint.

    This endpoint is intentionally simple:
    - accepts video_id or YouTube URL
    - calls youtube-transcript-api directly
    - returns actual transcript text and segments
    - does not return lesson summaries or AI-generated content
    """

    video_id = req.video_id or extract_youtube_video_id_from_any(req.url)

    if not video_id:
        return {
            "ok": False,
            "error": "missing_video_id",
            "detail": "Provide either video_id or a valid YouTube URL."
        }

    languages = req.languages or ["en"]

    try:
        from youtube_transcript_api import YouTubeTranscriptApi

        segments = []

        # Current package pattern: instance + fetch(video_id)
        try:
            ytt_api = YouTubeTranscriptApi()
            fetched = ytt_api.fetch(video_id, languages=languages)
            segments = normalize_fetched_transcript(fetched)

        except Exception as modern_error:
            # Older package fallback: static get_transcript(video_id)
            try:
                fetched = YouTubeTranscriptApi.get_transcript(video_id, languages=languages)
                segments = normalize_fetched_transcript(fetched)
            except Exception as legacy_error:
                return {
                    "ok": False,
                    "video_id": video_id,
                    "error": "transcript_unavailable",
                    "detail": str(legacy_error),
                    "modern_error": str(modern_error)
                }

        text = " ".join(
            segment["text"].replace("\n", " ").strip()
            for segment in segments
            if segment.get("text")
        ).strip()

        if not text:
            return {
                "ok": False,
                "video_id": video_id,
                "error": "empty_transcript",
                "detail": "Transcript extraction returned no text.",
                "segments": segments
            }

        return {
            "ok": True,
            "source": "youtube_transcript_api",
            "video_id": video_id,
            "title": req.title,
            "languages_attempted": languages,
            "segment_count": len(segments),
            "character_count": len(text),
            "word_count": len(text.split()),
            "text": text,
            "segments": segments
        }

    except Exception as e:
        return {
            "ok": False,
            "video_id": video_id,
            "error": "transcript_extraction_failed",
            "detail": str(e)
        }