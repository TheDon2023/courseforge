"""
transcript_service.py — YouTube transcript extraction.
Kept as a separate module for clean separation.
"""

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
)
from typing import List, Dict


def extract_transcripts_batch(videos: list) -> list:
    """Extract transcripts for multiple videos sequentially."""
    results = []
    for v in videos:
        result = extract_single(v.get("videoId", v.get("video_id", "")))
        result["lessonId"] = v.get("lessonId", "")
        result["videoId"] = v.get("videoId", v.get("video_id", ""))
        result["title"] = v.get("title", "")
        results.append(result)
    return results


def extract_single(video_id: str) -> dict:
    try:
        segments = YouTubeTranscriptApi().fetch(video_id, languages=["en", "en-US"])
        transcript = " ".join(s.text.replace("\n", " ").strip() for s in segments if s.text)

        return {
            "transcript": transcript,
            "segments": [{"text": s.text, "start": s.start, "duration": s.duration} for s in segments],
            "transcriptStatus": "available",
            "language": "en",
            "source": "youtube-transcript-api",
            "error": None,
        }
    except TranscriptsDisabled:
        return _empty_result("Transcripts are disabled for this video.", "missing")
    except NoTranscriptFound:
        return _empty_result("No transcript found for this video.", "missing")
    except VideoUnavailable:
        return _empty_result("Video is unavailable or private.", "failed")
    except Exception as exc:
        return _empty_result(str(exc), "failed")


def _empty_result(error_msg: str, status: str) -> dict:
    return {
        "transcript": "",
        "segments": [],
        "transcriptStatus": status,
        "language": None,
        "source": "none",
        "error": error_msg,
    }
