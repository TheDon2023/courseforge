"""
CourseForge Backend â€” FastAPI + PostgreSQL + Auth

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
from pydantic import BaseModel, EmailStr, Field
from sqlmodel import Session, select
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import os

from database import create_db_and_tables, get_session
from models import User, Course, Lesson, Progress, TranscriptJob, Subscription
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_user,
)
from transcript_service import extract_transcripts_batch

# â”€â”€â”€ FastAPI app â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app = FastAPI(title="CourseForge API", version="2.0.0")

# CORS â€” allow Railway frontend + local dev
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


# â”€â”€â”€ Startup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.on_event("startup")
def on_startup():
    create_db_and_tables()


# â”€â”€â”€ Health â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "courseforge-api", "version": "2.0.0"}


# â”€â”€â”€ Auth DTOs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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


# â”€â”€â”€ Auth Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    # JWT is stateless â€” logout is handled client-side by deleting the token
    return {"message": "Logged out successfully."}


# â”€â”€â”€ Course DTOs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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


# â”€â”€â”€ Course Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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


# â”€â”€â”€ Progress Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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


# â”€â”€â”€ Transcript Routes (existing) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class TranscriptStartRequest(BaseModel):
    # Accept both backend snake_case and frontend camelCase
    course_id: Optional[str] = None
    courseId: Optional[str] = None
    videos: List[Any] = Field(default_factory=list)


_TRANSCRIPT_JOBS: Dict[str, Dict[str, Any]] = {}


def _extract_video_id_from_any(value: Optional[str]) -> Optional[str]:
    if not value:
        return None

    value = value.strip()

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


def _normalize_transcript_video_item(item: Any) -> Dict[str, Any]:
    if isinstance(item, str):
        video_id = _extract_video_id_from_any(item)
        return {
            "lesson_id": None,
            "video_id": video_id,
            "title": None,
            "url": item if item.startswith("http") else (
                f"https://www.youtube.com/watch?v={video_id}" if video_id else None
            ),
        }

    if not isinstance(item, dict):
        return {
            "lesson_id": None,
            "video_id": None,
            "title": None,
            "url": None,
        }

    raw_video_id = (
        item.get("video_id")
        or item.get("videoId")
        or item.get("id")
        or item.get("youtubeId")
    )

    raw_url = (
        item.get("url")
        or item.get("sourceUrl")
        or item.get("source_url")
        or item.get("video_url")
        or item.get("videoUrl")
        or item.get("youtubeUrl")
    )

    video_id = raw_video_id or _extract_video_id_from_any(raw_url)

    return {
        "lesson_id": item.get("lesson_id") or item.get("lessonId"),
        "video_id": video_id,
        "title": item.get("title"),
        "url": raw_url or (f"https://www.youtube.com/watch?v={video_id}" if video_id else None),
    }


def _build_youtube_transcript_api():
    """
    Build YouTubeTranscriptApi with optional proxy support.

    Railway/cloud IPs are often blocked by YouTube. If proxy variables
    are present, use them. Never return or log proxy credentials.
    """
    from youtube_transcript_api import YouTubeTranscriptApi

    webshare_user = os.getenv("WEBSHARE_PROXY_USERNAME")
    webshare_pass = os.getenv("WEBSHARE_PROXY_PASSWORD")
    proxy_http = os.getenv("TRANSCRIPT_PROXY_HTTP")
    proxy_https = os.getenv("TRANSCRIPT_PROXY_HTTPS")

    if webshare_user and webshare_pass:
        try:
            from youtube_transcript_api.proxies import WebshareProxyConfig
            return YouTubeTranscriptApi(
                proxy_config=WebshareProxyConfig(
                    proxy_username=webshare_user,
                    proxy_password=webshare_pass,
                )
            )
        except Exception:
            # Fall through to generic/direct mode without exposing credentials.
            pass

    if proxy_http or proxy_https:
        try:
            from youtube_transcript_api.proxies import GenericProxyConfig
            return YouTubeTranscriptApi(
                proxy_config=GenericProxyConfig(
                    http_url=proxy_http,
                    https_url=proxy_https or proxy_http,
                )
            )
        except Exception:
            # Fall through to direct mode without exposing credentials.
            pass

    return YouTubeTranscriptApi()

def _extract_one_transcript_for_job(video: Dict[str, Any]) -> Dict[str, Any]:
    video_id = video.get("video_id")

    if not video_id:
        return {
            "ok": False,
            "lesson_id": video.get("lesson_id"),
            "video_id": None,
            "title": video.get("title"),
            "error": "missing_video_id",
            "detail": "Could not determine video ID from video item.",
        }

    try:
        segments = []

        try:
            ytt_api = _build_youtube_transcript_api()
            fetched = ytt_api.fetch(video_id, languages=["en"])
            segments = normalize_fetched_transcript(fetched)
        except Exception as transcript_error:
            error_text = str(transcript_error)

            error_category = "transcript_unavailable"
            if (
                "blocking requests from your IP" in error_text
                or "RequestBlocked" in error_text
                or "IpBlocked" in error_text
                or "cloud provider" in error_text
            ):
                error_category = "youtube_ip_blocked"

            return {
                "ok": False,
                "lesson_id": video.get("lesson_id"),
                "lessonId": video.get("lesson_id"),
                "video_id": video_id,
                "videoId": video_id,
                "title": video.get("title"),
                "error": error_category,
                "detail": error_text,
                "proxy_configured": bool(
                    os.getenv("WEBSHARE_PROXY_USERNAME")
                    or os.getenv("TRANSCRIPT_PROXY_HTTP")
                    or os.getenv("TRANSCRIPT_PROXY_HTTPS")
                ),
            }

        text = " ".join(
            segment["text"].replace("\n", " ").strip()
            for segment in segments
            if segment.get("text")
        ).strip()

        if not text:
            return {
                "ok": False,
                "lesson_id": video.get("lesson_id"),
            "lessonId": video.get("lesson_id"),
            "video_id": video_id,
            "videoId": video_id,
                "title": video.get("title"),
                "error": "empty_transcript",
                "detail": "Transcript extraction returned no text.",
                "segments": segments,
            }

        return {
            "ok": True,
            "available": True,
            "source": "youtube_transcript_api",
            "lesson_id": video.get("lesson_id"),
            "lessonId": video.get("lesson_id"),
            "video_id": video_id,
            "videoId": video_id,
            "title": video.get("title"),
            "segment_count": len(segments),
            "character_count": len(text),
            "word_count": len(text.split()),
            "text": text,
            "transcript": text,
            "transcriptText": text,
            "transcript_text": text,
            "segments": segments,
        }

    except Exception as e:
        return {
            "ok": False,
            "lesson_id": video.get("lesson_id"),
            "lessonId": video.get("lesson_id"),
            "video_id": video_id,
            "videoId": video_id,
            "title": video.get("title"),
            "error": "transcript_extraction_failed",
            "detail": str(e),
        }


@app.post("/api/transcripts/start")
def start_transcript_job(body: TranscriptStartRequest):
    course_id = body.course_id or body.courseId

    if not course_id:
        raise HTTPException(status_code=422, detail="course_id or courseId is required.")

    if not body.videos or not isinstance(body.videos, list):
        raise HTTPException(status_code=422, detail="videos must be a non-empty array.")

    job_id = str(uuid.uuid4())

    normalized_videos = [_normalize_transcript_video_item(v) for v in body.videos]
    results = [_extract_one_transcript_for_job(v) for v in normalized_videos]

    success_count = len([r for r in results if r.get("ok") is True])
    failed_count = len(results) - success_count

    job_record = {
        "jobId": job_id,
        "job_id": job_id,
        "courseId": course_id,
        "course_id": course_id,
        "status": "complete",
        "stage": "complete",
        "progress": 100,
        "completed": len(results),
        "total": len(results),
        "success_count": success_count,
        "failed_count": failed_count,
        "transcript_count": success_count,
        "available_count": success_count,
        "result": results,
        "results": results,
        "transcripts": [r for r in results if r.get("ok") is True],
    }

    _TRANSCRIPT_JOBS[job_id] = job_record
    return job_record


@app.get("/api/transcripts/status/{job_id}")
def get_transcript_status(job_id: str):
    job = _TRANSCRIPT_JOBS.get(job_id)

    if not job:
        return {
            "jobId": job_id,
            "job_id": job_id,
            "status": "not_found",
            "progress": 0,
            "result": [],
            "results": [],
            "detail": "Transcript job not found. Jobs are stored in memory on this deployment instance.",
        }

    return job


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

from typing import Optional, List, Dict, Any, Dict, Any
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
            "available": True,
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


