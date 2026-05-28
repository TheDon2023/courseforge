# CourseForge Setup Checklist

## Prerequisites

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm or yarn installed
- [ ] Python 3.10+ installed (`python3 --version`) - for backend only
- [ ] Git installed (optional, for cloning)

## Step 1: Get the Code

- [ ] Download and extract CourseForge-Full-App.zip
- [ ] Or clone from GitHub (if applicable)

## Step 2: Frontend Setup

```bash
cd CourseForge-Full-App/frontend
```

- [ ] Install dependencies: `npm install`
- [ ] (Optional) Copy `.env.example` to `.env` and edit if using backend
- [ ] Start dev server: `npm run dev`
- [ ] Open browser to `http://localhost:5173`

## Step 3: Backend Setup (Optional - for transcript extraction)

```bash
cd CourseForge-Full-App/backend
```

- [ ] Create virtual environment: `python3 -m venv venv`
- [ ] Activate: `source venv/bin/activate` (Mac/Linux) or `venv\Scripts\activate` (Windows)
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Start server: `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`
- [ ] Test health: `curl http://localhost:8000/api/health`

## Step 4: Get Free API Keys

### YouTube Data API v3
- [ ] Go to [console.cloud.google.com](https://console.cloud.google.com/apis/credentials)
- [ ] Create a project (or use existing)
- [ ] Enable "YouTube Data API v3"
- [ ] Create API Key (Credentials > Create Credentials > API Key)
- [ ] Copy the key

### OpenRouter (for AI generation)
- [ ] Go to [openrouter.ai/keys](https://openrouter.ai/keys)
- [ ] Sign up (free)
- [ ] Create an API key
- [ ] Copy the key (starts with `sk-or-v1-`)

### Kimi (optional alternative AI)
- [ ] Go to [platform.moonshot.cn](https://platform.moonshot.cn/)
- [ ] Sign up (free tier available)
- [ ] Create API key
- [ ] Copy the key

## Step 5: Configure the App

- [ ] Open the app in browser
- [ ] Click the **gear icon** (Settings) in top right
- [ ] Paste YouTube API key
- [ ] Paste OpenRouter API key
- [ ] (Optional) Paste Kimi API key
- [ ] Click **Save Keys**
- [ ] Test connections with "Test" buttons

## Step 6: Create Your First Course

- [ ] Click **Create New Course** on Dashboard
- [ ] Enter a YouTube channel: `@freecodecamp`
- [ ] Or enter a playlist URL: `https://youtube.com/playlist?list=PL...`
- [ ] Click **Search** then **Create Course**
- [ ] Wait for generation (10-30 seconds)

## Step 7: Use the Course

- [ ] Click on the course card to open it
- [ ] Click any lesson to open the Lesson Player
- [ ] Click **Generate Lesson Guide + Quiz** for AI content
- [ ] Click **AI Tutor** to chat about the lesson
- [ ] Click **Notes** to take personal notes
- [ ] Mark lessons complete with the checkbox
- [ ] Take the quiz and see your score

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "No AI API key found" | Add OpenRouter key in Settings |
| "API quota exceeded" | Wait a minute and retry; or add Kimi key as backup |
| "All models failed" | Check your OpenRouter key is valid (starts with `sk-or-v1-`) |
| "Playlist not found" | Make sure the playlist URL has `?list=PL...` |
| Backend not connecting | Verify `VITE_TRANSCRIPT_API_BASE` points to correct URL |
| Blank page after deploy | Ensure HashRouter is used (check `main.tsx`) |

## Verification

- [ ] Dashboard loads with "Create New Course" button
- [ ] Can open Settings and save API keys
- [ ] Can create course from @freecodecamp
- [ ] Lesson player shows YouTube video
- [ ] Can generate lesson guide (with API key)
- [ ] Quiz shows 10 questions
- [ ] AI Tutor responds to messages
- [ ] Progress persists after page refresh
- [ ] (Optional) Backend health check passes
