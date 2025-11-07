# Campool

Monorepo for Campool: React Native (Expo) mobile app and Node.js/Express/MongoDB backend.

## Structure
- `campool-app`: Expo React Native app
- `campool-server`: Node.js + Express + MongoDB server

## Prerequisites
- Node.js LTS, npm
- MongoDB running locally (or connection string)

## Environment
Create `campool-server/.env` (either `MONGO_URI` or `MONGODB_URI` is accepted):
```
MONGO_URI=mongodb://127.0.0.1:27017/campool
JWT_SECRET=replace_with_a_long_random_secret
PORT=4000
SOCKET_PATH=/socket.io
GOOGLE_MAPS_API_KEY=
```
> Tip: hosting providers often expose the connection string as `MONGODB_URI`; the server now falls back to that automatically if `MONGO_URI` is not set.
Optionally set frontend base URL:
- Windows PowerShell: `$env:EXPO_PUBLIC_API_BASE="http://localhost:4000"; npm start`
- Or edit `campool-app/app.json` → `expo.extra.EXPO_PUBLIC_API_BASE`

## Install & Run
- Backend
  - `cd campool-server`
  - `npm install`
  - `npm run dev`
- Frontend
  - `cd campool-app`
  - `npm install`
  - `npm start`

## Features
- Auth (signup/login with university email, JWT)
- Rides (post/search, cost per seat, totals)
- Chat (Socket.IO, message history, typing)
- Ratings & Reviews (driver averages)
- Eco Dashboard (CO₂ and savings stats)

## Scripts
- Server: `npm run dev` (nodemon), `npm start`
- App: `npm start`, `npm run android`, `npm run ios`, `npm run web`

## Notes
- Ensure MongoDB is running and `.env` is set.
- Update `EXPO_PUBLIC_API_BASE` if your server is not localhost.

