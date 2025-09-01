# UI Components & Design System

## Current Component Library

### Layout Components
- `Layout` - Main app wrapper with navigation header
- `ProtectedRoute` - Route guards for authentication/verification
- `AuthProvider` - Context provider for authentication state

### Authentication Components
- `Auth` - Login/signup form with toggle
- `VerifyEmail` - Email confirmation with resend functionality
- `AuthCallback` - OAuth token capture and redirect handling

### Page Components
- `Landing` - Marketing homepage
- `Setup` - Google OAuth connection and account setup
- `Dashboard` - Analytics data visualization
- `Chat` - AI assistant interface (planned)

### UI Elements
- Navigation header with responsive menu
- Form inputs with validation states
- Loading spinners and states
- Error/success message displays

## Design System

### Typography
- Tailwind CSS typography classes
- Responsive font sizes
- Consistent heading hierarchy

### Color Palette
- Primary: Blue (#3B82F6) for CTAs and links
- Success: Green (#10B981) for connected states
- Error: Red (#EF4444) for errors and warnings
- Gray scale for text and backgrounds

### Layout Grid
- Max-width containers for content areas
- Responsive breakpoints using Tailwind
- Consistent spacing with px-4, py-6 patterns

## Charts & Data Visualization

### Current Implementation
- Recharts library for analytics visualizations
- Line charts for traffic trends
- Metric cards for KPI display
- Responsive chart containers

### Planned Enhancements
- Interactive chart filters
- Custom tooltip designs
- Export functionality
- Mobile-optimized charts

## Component Standards

### File Structure
```
src/
  components/
    Layout.tsx
    ProtectedRoute.tsx
    AuthProvider.tsx
  pages/
    Dashboard.tsx
    Setup.tsx
    Auth.tsx
```

### Naming Conventions
- PascalCase for component files
- Descriptive, action-based naming
- Props interfaces with component name + Props suffix

### State Management
- React hooks (useState, useEffect)
- Context API for global state (AuthProvider)
- Custom hooks for data fetching

## Future Component Needs

### SEMrush Dashboard Components
- Keyword research tables
- Competitor analysis charts
- SERP position tracking
- Backlink analysis widgets

### Chatbot Components
- Message bubbles
- Input with suggestions
- File upload interface
- Export conversation functionality

### Mobile Optimization
- Touch-friendly navigation
- Responsive data tables
- Mobile-first chart designs
- App-like user experience