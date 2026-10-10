# Deploy React Frontend to Vercel

Complete guide for deploying the Collabo frontend to Vercel.

## Prerequisites

- GitHub account with frontend repository pushed
- Vercel account (free tier available)
- Frontend code at: https://github.com/Rinsna/Collabo
- Backend deployed at: https://collabo-backend-y2de.onrender.com

## Step-by-Step Deployment

### 1. Sign Up / Login to Vercel

1. Go to https://vercel.com/
2. Click **"Sign Up"** or **"Login"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub repositories

### 2. Import Your Project

1. Click **"Add New..."** → **"Project"**
2. Find and select **"Collabo"** repository
3. Click **"Import"**

### 3. Configure Project

#### Framework Preset
- Vercel should auto-detect: **Create React App**
- If not, select it manually

#### Root Directory
- Leave as **"./"** (root)

#### Build and Output Settings
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `build` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### 4. Add Environment Variables

Click **"Environment Variables"** and add:

```env
REACT_APP_API_URL=https://collabo-backend-y2de.onrender.com/api
```

**Optional (if you have OAuth credentials):**
```env
REACT_APP_INSTAGRAM_CLIENT_ID=your_instagram_client_id
REACT_APP_YOUTUBE_CLIENT_ID=your_youtube_client_id
```

**Important:** 
- Variable names must start with `REACT_APP_`
- No quotes around values
- Click "Add" after each variable

### 5. Deploy

1. Click **"Deploy"**
2. Vercel will:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Build the app (`npm run build`)
   - Deploy to CDN
3. Wait 2-5 minutes for deployment

### 6. Get Your URL

After deployment completes, you'll get a URL like:
```
https://collabo-xyz123.vercel.app
```

Or with custom domain:
```
https://your-domain.com
```

### 7. Update Backend CORS Settings

Your backend needs to allow requests from your Vercel URL.

#### Update Backend Environment Variables on Render:

1. Go to https://dashboard.render.com/
2. Select your backend service: **collabo-backend-y2de**
3. Go to **"Environment"** tab
4. Update or add:

```env
CORS_ALLOWED_ORIGINS=https://collabo-xyz123.vercel.app,https://your-custom-domain.com
ALLOWED_HOSTS=collabo-backend-y2de.onrender.com,localhost,127.0.0.1
```

**Important:** Replace `collabo-xyz123.vercel.app` with your actual Vercel URL

5. Click **"Save Changes"**
6. Backend will automatically redeploy

### 8. Test Your Deployment

Visit your Vercel URL and test:

1. **Landing Page** - Should load correctly
2. **Register** - Create a test account
3. **Login** - Login with test account
4. **Dashboard** - Should load without errors
5. **API Calls** - Check browser console for errors

## Vercel Configuration Files

### vercel.json (Optional)

Create `vercel.json` in frontend root for custom configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/static/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

This handles client-side routing for React Router.

### .vercelignore (Optional)

Create `.vercelignore` to exclude files:

```
node_modules
.env
.env.local
npm-debug.log
.DS_Store
```

## Environment Variables Reference

### Required
```env
REACT_APP_API_URL=https://collabo-backend-y2de.onrender.com/api
```

### Optional (OAuth)
```env
REACT_APP_INSTAGRAM_CLIENT_ID=your_instagram_client_id
REACT_APP_YOUTUBE_CLIENT_ID=your_youtube_client_id
```

## Custom Domain Setup

### 1. Add Domain in Vercel

1. Go to your project in Vercel
2. Click **"Settings"** → **"Domains"**
3. Enter your domain (e.g., `collabo.com`)
4. Click **"Add"**

### 2. Configure DNS

Vercel will provide DNS records. Add to your domain provider:

**For root domain (collabo.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. Wait for DNS Propagation

- Usually takes 5-60 minutes
- Vercel will automatically provision SSL certificate

### 4. Update Backend CORS

Add your custom domain to backend CORS:
```env
CORS_ALLOWED_ORIGINS=https://collabo.com,https://www.collabo.com,https://collabo-xyz123.vercel.app
```

## Automatic Deployments

### Production Deployments

Every push to `main` branch triggers automatic deployment:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel will:
1. Detect the push
2. Build the app
3. Deploy to production
4. Update your live site

### Preview Deployments

Every pull request gets a unique preview URL:

1. Create a branch: `git checkout -b feature-branch`
2. Make changes and push
3. Create pull request on GitHub
4. Vercel creates preview deployment
5. Test changes before merging

## Troubleshooting

### Build Fails

**Check build logs:**
1. Go to Vercel Dashboard
2. Click on your project
3. Click on failed deployment
4. Check "Build Logs"

**Common issues:**
- Missing dependencies
- Environment variables not set
- Build errors in code

**Fix:**
```bash
# Test build locally
npm run build

# If it works locally, check Vercel environment variables
```

### API Connection Errors

**Symptoms:**
- Network errors in console
- "Failed to fetch" errors
- CORS errors

**Check:**
1. `REACT_APP_API_URL` is set correctly in Vercel
2. Backend CORS includes your Vercel URL
3. Backend is running on Render

**Fix:**
```bash
# Verify API URL
echo $REACT_APP_API_URL

# Test backend directly
curl https://collabo-backend-y2de.onrender.com/api/

# Check CORS in backend settings.py
CORS_ALLOWED_ORIGINS = [
    'https://your-vercel-url.vercel.app',
]
```

### Blank Page After Deployment

**Cause:** Client-side routing not configured

**Fix:** Add `vercel.json`:
```json
{
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### Environment Variables Not Working

**Check:**
1. Variables start with `REACT_APP_`
2. No quotes around values
3. Redeploy after adding variables

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Verify all variables are set
3. Click "Redeploy" on latest deployment

### Images Not Loading

**Check:**
1. Images are in `public/` folder
2. Paths are correct (use `/images/...` not `./images/...`)
3. Images are committed to git

**Fix:**
```jsx
// Correct
<img src="/images/logo.png" alt="Logo" />

// Wrong
<img src="./images/logo.png" alt="Logo" />
```

## Performance Optimization

### 1. Enable Vercel Analytics

1. Go to project settings
2. Click "Analytics"
3. Enable Web Analytics
4. Monitor performance metrics

### 2. Optimize Images

Use Vercel Image Optimization:
```jsx
import Image from 'next/image'

// If using Next.js
<Image src="/images/hero.jpg" width={800} height={600} />
```

For Create React App, optimize images before uploading.

### 3. Enable Compression

Vercel automatically enables:
- Gzip compression
- Brotli compression
- HTTP/2

### 4. Use CDN

Vercel automatically serves from global CDN:
- Fast loading worldwide
- Automatic caching
- Edge network

## Monitoring

### 1. Deployment Status

- Green checkmark: Successful
- Red X: Failed
- Yellow: Building

### 2. Real-time Logs

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# View logs
vercel logs
```

### 3. Analytics

Monitor in Vercel Dashboard:
- Page views
- Unique visitors
- Performance metrics
- Error rates

## Updating Your App

### Deploy New Changes

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main
```

Vercel automatically deploys.

### Rollback Deployment

1. Go to Vercel Dashboard
2. Click "Deployments"
3. Find previous working deployment
4. Click "..." → "Promote to Production"

### Manual Redeploy

1. Go to Vercel Dashboard
2. Click "Deployments"
3. Click "..." on latest deployment
4. Click "Redeploy"

## Cost

### Free Tier Includes:
- Unlimited deployments
- 100GB bandwidth/month
- Automatic HTTPS
- Global CDN
- Preview deployments

### Upgrade When Needed:
- **Pro ($20/month)**: More bandwidth, team features
- **Enterprise**: Custom pricing, SLA, support

## Security Checklist

- [ ] Environment variables set in Vercel (not in code)
- [ ] HTTPS enabled (automatic)
- [ ] CORS configured in backend
- [ ] No sensitive data in repository
- [ ] API keys secured
- [ ] Custom domain with SSL (optional)

## Integration with Backend

### Current Setup:
- **Frontend**: https://your-vercel-url.vercel.app
- **Backend**: https://collabo-backend-y2de.onrender.com
- **API Endpoint**: https://collabo-backend-y2de.onrender.com/api

### CORS Configuration:

Backend must allow frontend origin:
```python
# backend/influencer_platform/settings.py
CORS_ALLOWED_ORIGINS = [
    'https://your-vercel-url.vercel.app',
    'https://your-custom-domain.com',
]
```

## Support

- **Vercel Docs**: https://vercel.com/docs
- **React Deployment**: https://create-react-app.dev/docs/deployment/
- **GitHub Issues**: https://github.com/Rinsna/Collabo/issues

---

Your React frontend is now live on Vercel! 🚀

**Frontend**: https://your-vercel-url.vercel.app
**Backend**: https://collabo-backend-y2de.onrender.com
