# React Frontend Setup

## Quick Start Commands

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Setup
```bash
# Create .env file
echo REACT_APP_API_URL=http://localhost:8000/api > .env
```

### 3. Start Development Server
```bash
npm start
```

The app will open at http://localhost:3000

## Project Structure

```
src/
├── components/
│   ├── Auth/           # Login, Register
│   ├── Dashboard/      # Role-specific dashboards
│   ├── Profile/        # Profile management
│   ├── Campaigns/      # Campaign components
│   ├── Collaborations/ # Collaboration management
│   ├── Influencers/    # Influencer search
│   └── Layout/         # Navigation, layout
├── contexts/
│   └── AuthContext.js  # Authentication state
├── services/
│   └── api.js          # API client with interceptors
├── App.js              # Main app component
└── index.js            # Entry point
```

## Features

### Authentication
- JWT-based authentication
- Role-based routing
- Automatic token refresh
- Protected routes

### Dashboards
- **Influencer Dashboard**: Profile, campaigns, collaborations, earnings
- **Company Dashboard**: Profile, campaign management, influencer search
- **Admin Dashboard**: Platform overview and management

### Key Components
- `AuthContext` - Global authentication state
- `ProtectedRoute` - Route protection by user type
- `Layout` - Common navigation and layout
- Profile management for influencers and companies
- Campaign creation and management
- Collaboration request handling
- Payment integration (Stripe ready)

## Dependencies

### Core
- React 18
- React Router DOM
- React Query (data fetching)
- React Hook Form (forms)
- Axios (HTTP client)

### UI
- Tailwind CSS (styling)
- Lucide React (icons)
- React Hot Toast (notifications)

### Payment
- Stripe JS & React Stripe JS (ready for integration)

## Environment Variables

Create `.env` in frontend directory:
```
REACT_APP_API_URL=http://localhost:8000/api
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## API Integration

The app uses Axios with interceptors for:
- Automatic JWT token attachment
- Token refresh on 401 errors
- Request/response logging
- Error handling

## Styling

Uses Tailwind CSS with custom configuration:
- Primary color scheme (blue)
- Responsive design
- Component-based styling
- Utility-first approach