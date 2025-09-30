# Campool Server

- Copy `.env.example` to `.env` and set values.
- Install deps: `npm install`
- Run dev: `npm run dev`
- Health check: GET http://localhost:4000/health

## Env
- `MONGO_URI` (e.g., `mongodb://127.0.0.1:27017/campool`)
- `PORT` (default 4000)
- `JWT_SECRET` (required in production)

## Auth Endpoints
- POST `/api/auth/signup`
  - body: `{ name, email, password, studentId }`
  - constraints: email must be university domain; password is hashed
  - responses: `201 { id, name, email, studentId, createdAt }`, `409` if duplicate
- POST `/api/auth/login`
  - body: `{ email, password }`
  - responses: `200 { token, user }`, `401` invalid credentials 