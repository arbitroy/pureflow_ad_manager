# PURE FLOW

PURE FLOW is a streamlined web application for marketing staff to manage social media ad campaigns with geo-targeting capabilities and performance analytics.

## Tech Stack

- **Framework**: Next.js 14 with App Router and TypeScript
- **UI Components**: Custom components with PURE FLOW branding
- **Animations**: Framer Motion
- **Visualization**: Chart.js
- **Maps**: Google Maps JavaScript API
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm or yarn
- Google Maps API key (for geo-fencing features)
- Meta Developer account (for Facebook/Instagram integration)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd pure-flow
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with your API keys:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
JWT_SECRET=your_jwt_secret
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                 # App Router structure
│   ├── (auth)/          # Auth layout group
│   ├── (dashboard)/     # Dashboard layout group (main pages)
│   │   ├── layout.tsx   # Dashboard layout with navbar
│   │   ├── page.tsx     # Home/dashboard page
│   │   ├── campaigns/   # Campaigns routes
│   │   ├── geo-fencing/ # Geo-fencing routes
│   │   └── analytics/   # Analytics routes
│   ├── login/           # Login route
│   ├── api/             # API routes
│   ├── globals.css      # Global styles
│   └── layout.tsx       # Root layout
├── components/          # Reusable components
├── contexts/            # React contexts (auth, etc.)
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── theme/               # Theme configuration
├── types/               # TypeScript types/interfaces
├── middleware.ts        # Auth protection middleware
└── next.config.js       # Next.js configuration
```

## Features

### 1. Ad Distribution

- Integration with Meta Marketing API for Facebook/Instagram
- Create, schedule, and manage ad campaigns
- Unified dashboard for monitoring campaign status

### 2. Geo-Fencing

- Browser-based geolocation targeting
- Google Maps integration for defining target areas
- Simple radius and polygon-based targeting

### 3. Analytics Dashboard

- Track impressions, clicks, conversions, and ROI
- Visual charts for performance metrics
- Basic export functionality for reports

## Authentication

For demo purposes, you can log in with:
- Email: `demo@pureflow.com`
- Password: `password`

## Color Scheme

- Blue (`#3e91ff`) and orange/red (`#ff762e`) as primary colors
- Dark navy/purple backgrounds (`#121025`, `#1a192c`)
- White text for contrast

## App Router Specifics

This project uses the Next.js App Router architecture which includes:

- Folder-based routing with special files (page.tsx, layout.tsx)
- Route groups with parentheses (e.g., (dashboard))
- Server Components by default with Client Components marked using 'use client'
- API routes defined in app/api with HTTP method handlers

## License

© 2025 PURE FLOW