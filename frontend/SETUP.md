# Quick Setup Guide

## Prerequisites
- Node.js 14+ installed
- Backend API running on http://localhost:8000

## Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/Rinsna/Collabo.git
cd Collabo
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and update if needed
# Default API URL is http://localhost:8000/api
```

### 4. Start Development Server
```bash
npm start
```

The app will open at http://localhost:3000

## First Time Setup

### For Testing
1. Register as an influencer at http://localhost:3000/register
2. Fill in your profile with Instagram handle
3. Go to Analytics tab - it should work automatically!

### Environment Variables
The `.env` file should contain:
```env
REACT_APP_API_URL=http://localhost:8000/api
```

OAuth credentials are optional - the app works without them using auto-connect feature.

## Common Issues

### Port Already in Use
If port 3000 is busy:
```bash
# Kill the process using port 3000
npx kill-port 3000

# Or run on different port
PORT=3001 npm start
```

### API Connection Failed
- Ensure backend is running on http://localhost:8000
- Check REACT_APP_API_URL in .env
- Verify no CORS issues in browser console

### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Development

### File Structure
- `src/components/` - All React components
- `src/contexts/` - Context providers (Auth, Toast)
- `src/services/` - API client
- `public/` - Static assets

### Making Changes
1. Edit files in `src/`
2. Changes auto-reload in browser
3. Check console for errors

### Building for Production
```bash
npm run build
```

## Features to Test

### As Influencer
1. Register/Login
2. Complete profile with Instagram handle
3. View Analytics (should work automatically)
4. Browse campaigns
5. Apply to campaigns
6. Track collaborations

### As Company
1. Register/Login as company
2. Complete company profile
3. Create campaigns
4. Search influencers
5. View analytics
6. Manage collaborations

## Need Help?

Check the main README.md for detailed documentation or open an issue on GitHub.

---

Happy coding! 🚀
