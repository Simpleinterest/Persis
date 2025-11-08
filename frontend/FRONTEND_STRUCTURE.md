# Frontend Structure Documentation

## Directory Structure

```
frontend/src/
├── components/          # React components
│   ├── common/         # Common/reusable components
│   ├── layout/         # Layout components (Header, Footer, Sidebar)
│   └── forms/          # Form components
├── pages/              # Page components
│   ├── auth/           # Authentication pages (Login, Register)
│   ├── user/           # User pages (Dashboard, AI Coach, My Coach, Settings)
│   └── coach/          # Coach pages (Dashboard, Students)
├── services/           # API and service files
│   ├── api.ts          # API service functions
│   ├── auth.ts         # Authentication service
│   └── websocket.ts    # WebSocket service
├── types/              # TypeScript type definitions
│   └── index.ts        # Type definitions
├── utils/              # Utility functions
│   ├── constants.ts    # Application constants
│   └── helpers.ts      # Helper functions
├── hooks/              # Custom React hooks
├── config/             # Configuration files
│   └── api.ts          # API configuration
├── images/             # Image assets
│   ├── logos/          # Logo images
│   └── icons/          # Icon images
├── data/               # Data files
│   └── mock/           # Mock data for development
├── App.tsx             # Main App component
├── App.css             # App styles
├── index.tsx           # Entry point
└── index.css           # Global styles
```

## API Configuration

The API URL is configured in `src/config/api.ts` and can be changed by:
1. Updating the `.env` file: `REACT_APP_API_URL=http://your-api-url`
2. Or modifying the default value in `src/config/api.ts`

## Services

### Authentication Service (`services/auth.ts`)
- `registerUser()` - Register new user
- `loginUser()` - Login user
- `registerCoach()` - Register new coach
- `loginCoach()` - Login coach
- `getCurrentUser()` - Get current user
- `getCurrentCoach()` - Get current coach
- `logout()` - Logout user/coach

### API Service (`services/api.ts`)
- User profile operations
- Coach profile operations
- Student management
- Sports management
- AI parameters management
- Video analysis
- Exercise advice

### WebSocket Service (`services/websocket.ts`)
- Socket connection management
- User-Coach chat events
- AI coach chat events
- Live video streaming events
- Video upload events

## Types

All TypeScript types are defined in `types/index.ts`:
- `User` - User model
- `Coach` - Coach model
- `AuthResponse` - Authentication response
- `ChatMessage` - Chat message
- `AIFormCorrection` - AI form correction
- `VideoAnalysis` - Video analysis result

## Constants

Application constants are defined in `utils/constants.ts`:
- Theme colors
- API endpoints
- Storage keys
- Routes
- Gender options
- Common sports
- Exercise types

## Helpers

Utility functions are in `utils/helpers.ts`:
- Date formatting
- Weight/height formatting
- BMI calculation
- Email validation
- Password validation
- Text manipulation
- File size formatting

## Next Steps

1. Create layout components (Header, Footer, Sidebar)
2. Create authentication pages (Login, Register)
3. Create user pages (Dashboard, AI Coach, My Coach, Settings)
4. Create coach pages (Dashboard, Students)
5. Implement routing
6. Add styling with theme colors
7. Add Greek mythology inspired design elements

