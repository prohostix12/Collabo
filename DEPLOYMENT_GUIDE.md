# 🚀 Deployment Guide: Render & Vercel

This guide provides a step-by-step walkthrough for deploying the **Collabo Platform** (Django Backend + React Frontend).

## 🛠 Prerequisites

1.  **GitHub Account**: Your code must be pushed to a GitHub repository.
2.  **Render Account**: Sign up at [render.com](https://render.com).
3.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
4.  **Stripe/Social Media Credentials**: Have your API keys ready.

---

## 🏗 Part 1: Deploy Backend to Render

Render will host our Python (Django) backend. For portability, we use a persistent SQLite database.


SQLite is self-contained. No external database provisioning is required for this setup.


### 2. Create a Web Service
1.  Go to Render Dashboard → **New** → **Web Service**.
2.  Connect your GitHub repository.
3.  **Name**: `collab-backend`
4.  **Runtime**: `Python`
5.  **Build Command**: `./build.sh` (This script is already in your `backend` folder).
6.  **Start Command**: `gunicorn influencer_platform.wsgi:application`
7.  **Environment Variables**: Add the following:
    *   `PYTHON_VERSION`: `3.11.0`
    *   `SECRET_KEY`: (Something secure, or let Render generate it).
    *   `DEBUG`: `False`

    *   `ALLOWED_HOSTS`: `collab-backend.onrender.com` (Use your actual Render URL).
    *   `CORS_ALLOWED_ORIGINS`: `https://your-frontend-url.vercel.app` (You'll update this after Vercel deployment).
    *   `REDIS_URL`: (Optional, but required for Celery tasks). Link a Render Redis instance.

### 3. Build & Deploy
Render will automatically start the build process using your `backend/build.sh`. This will:
-   Install dependencies.
-   Collect static files (using WhiteNoise).
-   Run database migrations.

---

## 🎨 Part 2: Deploy Frontend to Vercel

Vercel is optimized for React/Next.js and will host our frontend.

### 1. Import Project
1.  Go to Vercel Dashboard → **Add New** → **Project**.
2.  Connect your GitHub repository.
3.  **Root Directory**: Set this to the `frontend/` folder.

### 2. Configure Build Settings
1.  **Framework Preset**: `Create React App`.
2.  **Build Command**: `npm run build`
3.  **Output Directory**: `build`
4.  **Environment Variables**: Add the following:
    *   `REACT_APP_API_URL`: `https://collab-backend.onrender.com/api` (The URL of your Render backend).
    *   `REACT_APP_STRIPE_PUBLISHABLE_KEY`: (Your Stripe public key).

### 3. Deploy
Vercel will detect your `frontend/vercel.json` and deploy the app. Once finished, you'll get a URL like `https://collab-platform.vercel.app`.

---

## 🔗 Part 3: Connect Frontend & Backend

For the frontend to talk to the backend, we need to handle Cross-Origin Resource Sharing (CORS).

1.  **Go to Render Dashboard** → Your `collab-backend` service.
2.  **Environment Variables**:
    *   Update `CORS_ALLOWED_ORIGINS` to include your new Vercel URL:
        `https://collab-platform.vercel.app`
    *   Update `FRONTEND_URL` to the same address.
3.  **Save Changes**: Render will redeploy automatically.

---

## ⚙️ Configuration Recap

### Backend Files Already Prepared:
-   `backend/render.yaml`: Configuration blueprint for Render.
-   `backend/build.sh`: Script to install requirements and run migrations.
-   `backend/requirements.txt`: Complete list of production dependencies.
-   `backend/influencer_platform/settings.py`: Production-ready settings with WhiteNoise and SQLite support.


### Frontend Files Already Prepared:
-   `frontend/vercel.json`: Routing and build configuration for Vercel.
-   `frontend/package.json`: Main build script `npm run build`.

---

## 🏗 Troubleshooting

-   **Migrations Failed?** Check the Render logs. Ensure the `db.sqlite3` file is correctly handled by Render's persistent disk (if applicable).

-   **Static Files Missing?** Ensure WhiteNoise is in Python's `MIDDLEWARE`. (It is).
-   **Frontend API Errors?** Check the Browser Console for CORS errors. Ensure the `CORS_ALLOWED_ORIGINS` in Render matches your Vercel URL exactly (no trailing slash).
