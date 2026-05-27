# CourseForge

Turn any YouTube channel or playlist into an interactive AI-powered course.

## What It Does

CourseForge takes a YouTube channel URL (e.g., `@freecodecamp`) or playlist URL and automatically generates a structured learning course with:

- **Organized modules and lessons** from video content
- **AI-generated lesson guides** with overviews, key concepts, terminology, and examples
- **10-question quizzes** per lesson with difficulty levels (beginner, intermediate, applied)
- **AI Tutor chat** for asking questions about any lesson
- **Progress tracking** with completion, notes, and quiz scores
- **Transcript extraction** for richer AI context (via Python backend)

## Tech Stack

**Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
**Backend:** Python FastAPI + youtube-transcript-api
**AI Providers:** OpenRouter (fallback model loop) + Kimi (optional)
**Data Storage:** localStorage (client-side, no database required)

## Quick Start

```bash
# 1. Install frontend dependencies
cd frontend
npm install

# 2. Start the dev server
npm run dev

# 3. In a separate terminal, start the backend
cd ../backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 4. Open http://localhost:5173
```

## API Keys (Free)

CourseForge works in demo mode without API keys. For full features, get these free keys:

| Key | Purpose | Get It At |
|-----|---------|-----------|
| YouTube Data API v3 | Channel/playlist video discovery | [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) |
| OpenRouter | AI lesson guide + quiz generation | [openrouter.ai/keys](https://openrouter.ai/keys) |
| Kimi (optional) | Alternative AI provider | [platform.moonshot.cn](https://platform.moonshot.cn/) |

Add keys in the app via the Settings (gear icon).

## Project Structure

```
CourseForge-Full-App/
  frontend/           # React SPA
    src/
      pages/          # Dashboard, CourseDetail, LessonPlayer, Home
      components/     # UI components (course cards, quiz, AI tutor, etc.)
      lib/            # CourseStore, AiProvider, storage, api helpers
      hooks/          # useTheme, useMobile
      types/          # TypeScript type definitions
  backend/            # Python FastAPI transcript service
    main.py           # API endpoints for transcript extraction
    requirements.txt  # Python dependencies
  README.md           # This file
  DEPLOYMENT_GUIDE.md # How to deploy
  SETUP_CHECKLIST.md  # Step-by-step setup
  .env.example        # Environment variable template
  LICENSE.txt         # MIT License
```

## Features

- YouTube channel and playlist support
- Multi-model AI fallback (5 free OpenRouter models)
- Generic question filtering (24 patterns blocked)
- Quality enforcement template in AI prompts
- Title-based video matching (prevents wrong video assignment)
- Onboarding overlay for first-time users
- Dark/light theme toggle
- Export/import course data
- Keyboard shortcuts (Q for quiz, N for notes, T for tutor)

## License

MIT License — see LICENSE.txt
