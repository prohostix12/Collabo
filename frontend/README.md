# Collabo - Influencer Marketing Platform (Frontend)

A modern, responsive React application for connecting brands with influencers.

## 🚀 Features

### For Influencers
- **Premium Profile Dashboard** - Showcase your content and stats
- **Real-time Analytics** - Track followers, engagement, and performance
- **Auto-Connect Social Media** - Simply add your Instagram/YouTube handle
- **Collaboration Management** - Apply to campaigns and track applications
- **Portfolio Showcase** - Display your best content with video stats
- **Earnings Tracking** - Monitor your income and pending payments

### For Companies
- **Campaign Management** - Create and manage influencer campaigns
- **Influencer Discovery** - Search and filter influencers by category
- **Analytics Dashboard** - Track campaign performance and ROI
- **Collaboration Tracking** - Manage requests and approvals
- **Budget Management** - Monitor spending and payments

### General Features
- **Modern UI/UX** - Clean, professional design with smooth animations
- **Fully Responsive** - Works perfectly on mobile, tablet, and desktop
- **Real-time Notifications** - Toast notifications for all actions
- **Secure Authentication** - JWT-based auth with protected routes
- **Image Upload** - Profile pictures and portfolio images
- **Video Stats Integration** - Automatic YouTube/Instagram video stats

## 🎨 Design

- **Color Scheme**: Violet (#7C3AED), Cyan (#06B6D4), Lime (#84CC16)
- **Framework**: React 18 with Tailwind CSS
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Lucide React for modern, consistent icons
- **Charts**: Custom SVG charts with animations

## 📦 Tech Stack

- **React** 18.2.0 - UI library
- **React Router** 6.x - Navigation
- **React Query** 3.x - Data fetching and caching
- **Tailwind CSS** 3.x - Utility-first CSS
- **Framer Motion** 10.x - Animations
- **Lucide React** - Icon library
- **React Hot Toast** - Notifications
- **Axios** - HTTP client

## 🛠️ Installation

### Prerequisites
- Node.js 14+ and npm
- Backend API running on http://localhost:8000

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Rinsna/Collabo.git
   cd Collabo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   
   Create `.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:8000/api
   
   # Optional: OAuth credentials for manual social media connection
   REACT_APP_INSTAGRAM_CLIENT_ID=your_instagram_client_id
   REACT_APP_YOUTUBE_CLIENT_ID=your_youtube_client_id
   ```

4. **Start development server**
   ```bash
   npm start
   ```

   App will open at http://localhost:3000

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App (one-way operation)

## 📁 Project Structure

```
frontend/
├── public/
│   ├── images/          # Static images (carousel, about)
│   └── index.html       # HTML template
├── src/
│   ├── components/
│   │   ├── Analytics/   # Analytics dashboards
│   │   ├── Auth/        # Login, Register, ForgotPassword
│   │   ├── Campaigns/   # Campaign management
│   │   ├── Collaborations/ # Collaboration management
│   │   ├── Company/     # Company-specific components
│   │   ├── Dashboard/   # User dashboards
│   │   ├── Influencer/  # Influencer-specific components
│   │   ├── Influencers/ # Influencer search and discovery
│   │   ├── Landing/     # Landing page components
│   │   ├── Layout/      # Layout components (Footer, Navbar)
│   │   ├── Notifications/ # Toast notifications
│   │   ├── Profile/     # Profile management
│   │   └── SocialMedia/ # Social media integration
│   ├── contexts/
│   │   ├── AuthContext.js  # Authentication state
│   │   └── ToastContext.js # Notification state
│   ├── services/
│   │   └── api.js       # API client configuration
│   ├── App.js           # Main app component with routes
│   ├── index.js         # Entry point
│   └── index.css        # Global styles
├── .env                 # Environment variables
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies
└── tailwind.config.js  # Tailwind configuration
```

## 🎯 Key Features Implementation

### Auto-Connect Social Media
Users can simply add their Instagram handle or YouTube channel in their profile, and the system automatically creates social media account connections. No OAuth setup required!

**How it works:**
1. User goes to Profile tab
2. Enters Instagram handle (e.g., `@username`)
3. Clicks Save
4. Backend automatically creates social media account
5. Analytics immediately available

### Real-time Analytics
- Live follower counts from connected accounts
- Engagement rate tracking
- Performance trends and growth charts
- Top performing content analysis
- Monthly highlights and achievements

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interfaces
- Optimized images and assets

## 🔐 Authentication

The app uses JWT tokens for authentication:
- Access token stored in localStorage
- Automatic token refresh
- Protected routes with redirect to login
- Role-based access (influencer, company, admin)

## 🎨 Styling Guidelines

### Color Palette
```css
Primary: #7C3AED (Violet-600)
Secondary: #06B6D4 (Cyan-500)
Accent: #84CC16 (Lime-500)
Warning: #F97316 (Orange-500)
Background: #FAFAFA (Neutral-50)
Text: #262626 (Neutral-800)
```

### Gradients
```css
Dashboard: from-violet-50 via-cyan-50 to-lime-50
Primary Button: from-violet-600 to-cyan-500
Card Hover: from-violet-500 to-cyan-500
```

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

### Deploy to Netlify/Vercel
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variables in dashboard

### Environment Variables for Production
```env
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_INSTAGRAM_CLIENT_ID=your_production_instagram_id
REACT_APP_YOUTUBE_CLIENT_ID=your_production_youtube_id
```

## 🐛 Troubleshooting

### API Connection Issues
- Verify backend is running on http://localhost:8000
- Check REACT_APP_API_URL in .env
- Check browser console for CORS errors

### Build Errors
- Delete node_modules and package-lock.json
- Run `npm install` again
- Clear npm cache: `npm cache clean --force`

### Styling Issues
- Ensure Tailwind CSS is properly configured
- Check tailwind.config.js includes all content paths
- Rebuild: `npm run build`

## 📄 License

This project is private and proprietary.

## 👥 Contributors

- **Rinsna** - Lead Developer

## 🔗 Links

- **Repository**: https://github.com/Rinsna/Collabo
- **Backend API**: (Add your backend repo link)
- **Live Demo**: (Add your deployment link)

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using React and Tailwind CSS
