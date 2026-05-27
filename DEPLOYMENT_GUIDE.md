# CourseForge Deployment Guide

## Option 1: Deploy Frontend Only (Static Hosting)

The frontend is a static SPA that works without the backend (uses demo mode + descriptions).

### Kimi (Recommended for Quick Deploy)

1. Build the frontend:
```bash
cd frontend
npm install
npm run build
```

2. The `dist/` folder contains the static site. Deploy this folder.

### Vercel / Netlify

1. Connect your GitHub repo to Vercel or Netlify
2. Build command: `cd frontend && npm install && npm run build`
3. Publish directory: `frontend/dist`

### Railway (Frontend + Backend)

1. Create a `railway.json` in the project root:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100
  }
}
```

2. Set environment variable: `VITE_TRANSCRIPT_API_BASE=https://your-backend-url.railway.app`
3. Deploy frontend separately with the env var pointing to the backend.

## Option 2: Deploy Backend (Transcript Service)

### Railway

```bash
cd backend
# Push to GitHub, connect repo in Railway dashboard
# Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
# Healthcheck: /api/health
```

### Render

1. Create new Web Service
2. Connect GitHub repo
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Set `PORT=10000` environment variable

### Fly.io

```bash
cd backend
fly launch
fly deploy
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_TRANSCRIPT_API_BASE` | No* | URL of Python backend (e.g., `https://api.example.com`) |
| `PORT` | Backend only | Port for FastAPI server (default: 8000) |

*Required only if you want transcript extraction. Without it, the app falls back to using video descriptions.

## Frontend Environment Variables

Create `frontend/.env`:
```env
VITE_TRANSCRIPT_API_BASE=http://localhost:8000
```

## Post-Deploy Checklist

- [ ] Frontend loads without errors
- [ ] Settings panel opens (gear icon)
- [ ] Can add YouTube API key
- [ ] Can add OpenRouter API key
- [ ] Can create a course from @freecodecamp
- [ ] Lesson player shows video
- [ ] Can generate lesson guide + quiz
- [ ] AI Tutor responds
- [ ] Backend health check passes (if deployed)
