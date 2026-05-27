# Railway Database + Auth Setup Guide

## Step 1: Add PostgreSQL to Railway

1. Go to [railway.app](https://railway.app) → Your CourseForge project
2. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway creates the database and auto-injects `DATABASE_URL` into your backend service

## Step 2: Add Environment Variables

Click your **backend service** (courseforge) → **Variables** tab → **"New Variable"**:

| Variable | Value | Note |
|----------|-------|------|
| `DATABASE_URL` | *auto-filled by Railway* | From the PostgreSQL addon |
| `JWT_SECRET` | `courseforge-jwt-secret-change-me-64-char-long!!` | Generate your own 32+ char secret |
| `PORT` | `8000` | Already set by Railway |

**Generate a proper JWT secret:**
```bash
# Run this locally to generate a secure secret
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

## Step 3: Update Backend Code

Your backend code already has the database models and auth. Just make sure these files are in `backend/`:

```
backend/
  main.py              ← API routes (auth, courses, progress, transcripts)
  models.py            ← Database models (User, Course, Lesson, Progress, etc.)
  database.py          ← PostgreSQL connection
  auth.py              ← JWT + password hashing
  transcript_service.py ← YouTube transcript extraction
  requirements.txt     ← Dependencies
```

## Step 4: Deploy Backend

1. Commit and push to GitHub:
```bash
git add .
git commit -m "Add database + auth"
git push origin main
```

2. Railway auto-deploys. Check logs for:
```
Tables created successfully
```

## Step 5: Test Auth API

Test with curl or browser:

### Register
```bash
curl -X POST https://courseforge-production-9253.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

Expected: `{"id":"...","name":"Test User","email":"test@example.com","role":"user"}`

### Login
```bash
curl -X POST https://courseforge-production-9253.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Expected: `{"token":"...","user":{"id":"...","name":"Test User",...}}`

### Me (with token)
```bash
curl https://courseforge-production-9253.up.railway.app/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Step 6: Add Frontend Environment Variable

Click your **frontend service** → **Variables** tab:

| Variable | Value |
|----------|-------|
| `VITE_API_BASE` | `https://courseforge-production-9253.up.railway.app` |

This tells the frontend where your backend API lives.

## Step 7: Deploy Frontend

Push frontend changes (AuthModal, useAuth, authApi) to GitHub. Railway auto-deploys.

## Verification Checklist

- [ ] PostgreSQL shows as "Connected" in Railway
- [ ] Backend health check passes: `/api/health`
- [ ] Can register a user: `/api/auth/register`
- [ ] Can log in: `/api/auth/login`
- [ ] Token returned on login
- [ ] Frontend shows "Sign In" button when not logged in
- [ ] Frontend shows user name + "Log Out" when logged in
- [ ] Creating a course while logged in saves to database
- [ ] Courses persist after logout/login
- [ ] Guest mode still works (localStorage fallback)

## Troubleshooting

### "relation does not exist" error
Tables weren't created. Check backend logs for startup errors.

### "JWT_SECRET not set"
Add `JWT_SECRET` environment variable in Railway.

### CORS errors in browser
Check `main.py` CORS settings include your frontend URL.

### Frontend can't connect to backend
Verify `VITE_API_BASE` is set correctly on the frontend service.
