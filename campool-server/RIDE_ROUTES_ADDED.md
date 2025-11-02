# Ride Routes Added to Minimal Mode

## ✅ Changes Made

**File:** `src/index-minimal.js`

Added ride routes to the minimal deployment:

```javascript
mounted.push(safeMount('/api', () => require('./routes/rideRoutes')));
```

---

## 📋 Available Endpoints

### Auth (Working)
- ✅ POST /api/auth/request-otp
- ✅ POST /api/auth/verify-otp
- ✅ POST /api/auth/signup
- ✅ POST /api/auth/login

### Rides (Now Added)
- ✅ GET /rides/search
- ✅ POST /rides/create (requires auth)
- ✅ POST /rides (alias for create, requires auth)
- ✅ GET /rides/:id
- ✅ GET /rides/:id/messages (requires auth)
- ✅ POST /rides/test (requires auth)
- ✅ PUT /rides/status (requires auth)
- ✅ POST /rides/join (requires auth)
- ✅ POST /rides/respond-join (requires auth)
- ✅ GET /rides/:id/status (requires auth)
- ✅ GET /rides/recent (requires auth)
- ✅ GET /rides/history (requires auth)

### Diagnostics
- ✅ GET /health
- ✅ GET /diagnostic
- ✅ GET /test

---

## 🚀 Next Steps

### 1. Commit and Deploy
```bash
cd campool-server
git add src/index-minimal.js
git commit -m "Add ride routes to minimal mode"
git push origin main
```

### 2. Wait for Deployment
- Check Vercel dashboard
- Wait for deployment to complete

### 3. Test Ride Endpoints

**Search Rides (No auth required):**
```powershell
Invoke-RestMethod -Uri "https://campool-lm5p.vercel.app/rides/search" -Method GET
```

**Create Ride (Auth required):**
```powershell
$token = "your_jwt_token_here"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$body = @{
    startPoint = "Campus"
    destination = "Mall"
    date = "2025-12-01T10:00:00.000Z"
    time = "10:00"
    seats = 3
    costPerSeat = 100
    distanceKm = 15
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://campool-lm5p.vercel.app/rides/create" `
    -Method POST -Headers $headers -Body $body
```

---

## ⚠️ Important Notes

### Authentication Required
Most ride endpoints require authentication via JWT token:
```
Authorization: Bearer <your_jwt_token>
```

**To get a token:**
1. Sign up via `/api/auth/signup`
2. Or log in via `/api/auth/login`
3. Copy the `token` from response

---

### Deprecated Options
Ride controller still has deprecated Mongoose options:
- `useNewUrlParser: true`
- `useUnifiedTopology: true`
- `bufferCommands: false`
- `bufferMaxEntries: 0`
- `serverSelectionRetryDelayMS: 3000`

These are **warnings only** in Mongoose 8, but should be removed eventually. They won't cause crashes.

---

## 🐛 If Ride Creation Fails

Check Vercel logs for errors:

1. **"Route not found"** → Routes not mounted (should be fixed now)
2. **"Missing authorization"** → Need JWT token
3. **"Database connection failed"** → MongoDB issue
4. **"Missing field"** → Required fields missing
5. **"Validation error"** → Data format invalid

---

## 📊 Testing Checklist

After deployment:

- [ ] Search rides works (no auth)
- [ ] Create ride fails without auth (expected)
- [ ] Create ride works with auth
- [ ] Get ride by ID works
- [ ] No "Route not found" errors
- [ ] No crashes in logs

---

**Ride routes are now ready to test!** 🚀

