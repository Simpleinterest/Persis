# Persis API Documentation

## Base URL
```
http://localhost:5001
```

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

Tokens are valid for 30 days (1 month).

## API Endpoints

### Authentication Routes

#### User Registration
```
POST /api/auth/user/register
```
**Body:**
```json
{
  "userName": "string (required, 3-50 chars)",
  "passWord": "string (required, min 6 chars)",
  "profile": {
    "fullName": "string (optional)",
    "email": "string (optional)",
    "phoneNumber": "string (optional)",
    "bio": "string (optional, max 500 chars)",
    "avatar": "string (optional)"
  },
  "bodyWeight": "number (optional)",
  "height": "number (optional)",
  "gender": "string (optional: Male, Female, Other, Prefer not to say)",
  "sports": ["string"] (optional),
  "age": "number (optional, 0-150)"
}
```
**Response:**
```json
{
  "message": "User registered successfully",
  "token": "JWT_TOKEN",
  "user": { ... }
}
```

#### User Login
```
POST /api/auth/user/login
```
**Body:**
```json
{
  "userName": "string",
  "passWord": "string"
}
```
**Response:**
```json
{
  "message": "Login successful",
  "token": "JWT_TOKEN",
  "user": { ... }
}
```

#### Get Current User
```
GET /api/auth/user/me
```
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "user": { ... }
}
```

#### Coach Registration
```
POST /api/auth/coach/register
```
**Body:**
```json
{
  "userName": "string (required, 3-50 chars)",
  "passWord": "string (required, min 6 chars)",
  "sports": ["string"] (optional),
  "profile": {
    "fullName": "string (optional)",
    "email": "string (optional)",
    "phoneNumber": "string (optional)",
    "bio": "string (optional)",
    "avatar": "string (optional)",
    "specialization": "string (optional)"
  }
}
```
**Response:**
```json
{
  "message": "Coach registered successfully",
  "token": "JWT_TOKEN",
  "coach": { ... }
}
```

#### Coach Login
```
POST /api/auth/coach/login
```
**Body:**
```json
{
  "userName": "string",
  "passWord": "string"
}
```
**Response:**
```json
{
  "message": "Login successful",
  "token": "JWT_TOKEN",
  "coach": { ... }
}
```

#### Get Current Coach
```
GET /api/auth/coach/me
```
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "coach": { ... }
}
```

### User Routes (Protected)

#### Get User Profile
```
GET /api/user/profile
```
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "user": { ... }
}
```

#### Update User Profile
```
PUT /api/user/profile
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "userName": "string (optional)",
  "passWord": "string (optional)",
  "profile": { ... } (optional),
  "bodyWeight": "number (optional)",
  "height": "number (optional)",
  "gender": "string (optional)",
  "sports": ["string"] (optional),
  "age": "number (optional)",
  "coachId": "string (optional)"
}
```
**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

#### Request Coach
```
POST /api/user/request-coach/:coachId
```
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "message": "Successfully requested and added to coach"
}
```

#### Remove Coach
```
DELETE /api/user/coach
```
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "message": "Coach removed successfully"
}
```

### Coach Routes (Protected)

#### Get Coach Profile
```
GET /api/coach/profile
```
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "coach": { ... }
}
```

#### Update Coach Profile
```
PUT /api/coach/profile
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "userName": "string (optional)",
  "passWord": "string (optional)",
  "profile": { ... } (optional),
  "sports": ["string"] (optional)
}
```
**Response:**
```json
{
  "message": "Profile updated successfully",
  "coach": { ... }
}
```

#### Get All Students
```
GET /api/coach/students
```
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "students": [ ... ]
}
```

#### Get Student Details
```
GET /api/coach/students/:studentId
```
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "student": { ... }
}
```

#### Add Student
```
POST /api/coach/students/:studentId
```
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "message": "Student added successfully"
}
```

#### Remove Student
```
DELETE /api/coach/students/:studentId
```
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "message": "Student removed successfully"
}
```

#### Get Sports
```
GET /api/coach/sports
```
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "sports": ["string"]
}
```

#### Add Sports
```
POST /api/coach/sports
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "sports": ["string"]
}
```
**Response:**
```json
{
  "message": "Sports added successfully",
  "sports": ["string"]
}
```

#### Remove Sport
```
DELETE /api/coach/sports
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "sport": "string"
}
```
**Response:**
```json
{
  "message": "Sport removed successfully",
  "sports": ["string"]
}
```

#### Get Student AI Parameters
```
GET /api/coach/students/:studentId/ai-parameters
```
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "parameters": "string"
}
```

#### Update Student AI Parameters
```
PUT /api/coach/students/:studentId/ai-parameters
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "parameters": "string"
}
```
**Response:**
```json
{
  "message": "AI parameters updated successfully",
  "aiParameters": { ... }
}
```

### AI Routes (Protected)

#### Analyze Video
```
POST /api/ai/analyze-video
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "videoDescription": "string",
  "exercise": "string"
}
```
**Response:**
```json
{
  "success": true,
  "analysis": "string",
  "exercise": "string",
  "timestamp": "string"
}
```

#### Get Exercise Advice
```
POST /api/ai/advice
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "exercise": "string",
  "question": "string"
}
```
**Response:**
```json
{
  "success": true,
  "advice": "string",
  "exercise": "string",
  "timestamp": "string"
}
```

## WebSocket Events

### Connection
Connect with authentication token:
```javascript
const socket = io('http://localhost:5001', {
  auth: {
    token: 'JWT_TOKEN'
  }
});
```

### Events

#### User-Coach Chat
- `join-conversation` - Join conversation with coach/user
  - Data: `{ otherUserId: string }`
- `leave-conversation` - Leave conversation
  - Data: `{ conversationId: string }`
- `send-message` - Send message
  - Data: `{ message: string; conversationId: string; receiverId?: string }`
- `receive-message` - Receive message
  - Data: `ChatMessage`
- `message-sent` - Message sent confirmation
- `message-error` - Message error

#### AI Coach Chat
- `join-ai-chat` - Join AI chat room
  - Data: `{ userId: string }`
- `leave-ai-chat` - Leave AI chat room
  - Data: `{ userId: string }`
- `send-ai-message` - Send message to AI coach
  - Data: `{ userId: string; message: string }`
- `receive-ai-message` - Receive AI response
  - Data: `{ userId: string; message: string; from: 'ai' }`

#### Live Video Streaming
- `start-live-stream` - Start live video stream
  - Data: `{ userId: string }`
- `stop-live-stream` - Stop live video stream
  - Data: `{ userId: string }`
- `video-frame` - Send video frame
  - Data: `{ userId: string; videoData: string; frameNumber?: number; exercise?: string; frameDescription?: string }`
- `form-correction` - Receive AI form correction
  - Data: `{ userId: string; exercise: string; correction: string; timestamp: Date; severity: 'info' | 'warning' | 'error' }`
- `stream-status` - Stream status update
  - Data: `{ userId: string; status: 'active' | 'inactive' }`

#### Video Upload
- `upload-video` - Upload video for analysis
  - Data: `{ userId: string; videoData: string; fileName: string; exercise?: string; videoDescription?: string }`
- `video-uploaded` - Video uploaded confirmation
  - Data: `{ userId: string; videoId: string }`
- `video-analysis` - Video analysis result
  - Data: `{ userId: string; videoId: string; analysis: string; exercise: string }`

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Environment Variables

Required environment variables:
```
MONGODB_URI=mongodb+srv://...
XAI_API_KEY=xai-...
JWT_SECRET=your-secret-key
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

