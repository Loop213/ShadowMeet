# ShadowDate

Production-oriented anonymous dating and random chat platform built with React, Vite, Tailwind CSS, Zustand, Node.js, Express, MongoDB, Socket.IO, Redis-ready matchmaking, Cloudinary, GIPHY, and WebRTC.

## Highlights

- Automatic anonymous usernames like `CoolTiger4821`
- Guest mode plus password and email OTP auth with JWT sessions
- Omegle-style random matchmaking with interest tags and skip/next flow
- Global live chat plus private 1:1 chat
- GIF, sticker, and image messaging
- Anonymous profile editing with bio and interests
- Voice and video calling with Socket.IO signaling plus WebRTC media
- Auto-delete stranger chats when a session ends
- Admin-only privacy console for real identities, IPs, bans, analytics, reports, and chat review
- Redis-ready Socket.IO adapter for horizontal scaling
- Cloudinary direct uploads for media payloads
- AI-style moderation hook for abusive content screening

## Monorepo Structure

```text
/client
  /src
    /components
    /hooks
    /pages
    /services
    /store
/server
  /src
    /config
    /controllers
    /middlewares
    /models
    /routes
    /services
    /sockets
    /utils
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start infrastructure locally:

```bash
docker compose up -d mongo redis
```

3. Create env files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

4. Update secrets and API keys in both env files:

- `server/.env`
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `REDIS_URL`
  - `CLOUDINARY_*`
  - `GIPHY_API_KEY`
  - `SMTP_*`
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`
- `client/.env`
  - `VITE_API_URL`
  - `VITE_SOCKET_URL`
  - `VITE_GIPHY_API_KEY`

5. Seed an admin account:

```bash
npm run seed:admin -w server
```

6. Start the app:

```bash
npm run dev
```

Frontend runs at `http://localhost:5173` and backend runs at `http://localhost:5000` by default.

## Environment Variables

### Server

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/dating-app
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
TURN_URL=turn:turn.example.com:3478
TURN_USERNAME=turn-user
TURN_PASSWORD=turn-pass
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
GIPHY_API_KEY=your-giphy-api-key
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-user
SMTP_PASS=your-pass
SMTP_FROM=no-reply@example.com
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
```

### Client

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_GIPHY_API_KEY=your-giphy-api-key
```

## API Overview

### Auth

- `POST /api/auth/register`
  - body: `{ "email": "user@example.com", "password": "Secret123!" }`
- `POST /api/auth/login`
  - body: `{ "email": "user@example.com", "password": "Secret123!" }`
- `POST /api/auth/guest`
  - body: `{ "interests": ["music", "coding"], "preferredLanguage": "en" }`
- `POST /api/auth/request-otp`
  - body: `{ "email": "user@example.com" }`
- `POST /api/auth/verify-otp`
  - body: `{ "email": "user@example.com", "otp": "123456" }`
- `GET /api/auth/me`

### Users

- `GET /api/users/discover`
- `GET /api/users/online`
- `PATCH /api/users/me`
  - body: `{ "bio": "Night owl", "interests": ["music", "travel"], "avatarUrl": "" }`

### Messages

- `GET /api/messages/global`
- `GET /api/messages/private/:userId`
- `POST /api/messages`
  - body: `{ "chatScope": "private", "receiverId": "<userId>", "messageType": "text", "content": "Hey" }`
- `POST /api/messages/:messageId/reactions`
  - body: `{ "emoji": "❤️" }`

### Uploads

- `GET /api/uploads/cloudinary-signature`
- `GET /api/uploads/giphy`

### Admin

- `GET /api/admin/users`
- `GET /api/admin/analytics`
- `GET /api/admin/chat-logs`
- `GET /api/admin/reports`
- `PATCH /api/admin/users/:userId/ban`
  - body: `{ "isBanned": true, "bannedReason": "Community safety review" }`

### Sessions

- `GET /api/sessions/history`
- `POST /api/sessions/report`
  - body: `{ "reportedUserId": "<userId>", "sessionId": "<sessionId>", "reason": "abuse" }`

## Socket.IO Events

- `send_message`
- `session_message`
- `receive_message`
- `typing`
- `message_seen`
- `find_partner`
- `match_found`
- `skip_partner`
- `disconnect_partner`
- `queue_status`
- `report_user`
- `block_user`
- `call_user`
- `incoming_call`
- `accept_call`
- `reject_call`
- `offer`
- `answer`
- `ice_candidate`
- `webrtc_ice_candidate`
- `end_call`
- `presence:update`

## WebRTC Call Flow

1. User enters guest mode or authenticated mode and connects to Socket.IO.
2. Frontend emits `find_partner` with interests and desired mode.
3. Matchmaking service pairs compatible queued users and creates a `ChatSession`.
4. Both users receive `match_found` with the stranger payload and session metadata.
5. Chat messages flow through `session_message` and are deleted when the session ends, unless flagged.
6. Either user can start voice/video with `call_user`, or use signaling aliases `offer`, `answer`, and `ice_candidate`.
7. Both peers exchange ICE candidates and media flows peer-to-peer.
8. `skip_partner`, `disconnect_partner`, `block_user`, or `report_user` ends the session and clears session chat.

## Deployment Notes

- Frontend: deploy `client` to Vercel
- Backend: deploy `server` to Render, Railway, or AWS
- Database: MongoDB Atlas
- Redis: Upstash Redis, Redis Cloud, or managed Redis on your host
- TURN: coturn on a public host for reliable NAT traversal in production
- HTTPS is required for camera/microphone access and production WebRTC
- Set `CLIENT_URL` to the deployed frontend origin
- Use secure secrets and production SMTP or transactional email

## Verification

- `npm run build -w client`
- `npm run build -w server`

## Next Production Steps

- Add refresh tokens or rotating session revocation
- Persist push notifications with FCM or OneSignal
- Add TURN servers for stricter NAT traversal
- Extend moderation with a real ML or LLM abuse classifier
- Add E2E tests for auth, chat, and call flows
