# Deployment Progress Guide

## 🚀 Current Status: MINIMAL MODE

**Current Entry Point:** `src/index-minimal.js`  
**Deployed Routes:** Auth only (OTP, Signup, Login)

---

## ✅ Working Endpoints

### Authentication
- ✅ `POST /api/auth/request-otp` - Request OTP email
- ✅ `POST /api/auth/verify-otp` - Verify OTP code
- ✅ `POST /api/auth/signup` - Complete signup
- ✅ `POST /api/auth/login` - User login

### Diagnostics
- ✅ `GET /health` - Health check
- ✅ `GET /diagnostic` - System diagnostics
- ✅ `GET /test` - Simple test endpoint
- ✅ `GET /` - Root info

---

## 📋 How to Add Routes Gradually

### Step 1: Test Current Minimal Setup

**Current Configuration:**
- `vercel.json` → Points to `src/index-minimal.js`
- Only auth routes loaded
- All other routes skipped

**Test Commands:**
```bash
# Locally
cd campool-server
npm run dev  # Uses server.js which imports index.js

# On Vercel
# Already deployed with index-minimal.js
```

---

### Step 2: Add Next Route (Rides)

**Edit:** `src/index-minimal.js`

**Find:**
```javascript
const mounted = [];
mounted.push(safeMount('/api/auth', () => require('./routes/authRoutes')));
```

**Add After:**
```javascript
const mounted = [];
mounted.push(safeMount('/api/auth', () => require('./routes/authRoutes')));
mounted.push(safeMount('/api', () => require('./routes/rideRoutes'))); // ADD THIS
```

**Test:**
```bash
# Locally
npm run dev

# Deploy
git add src/index-minimal.js
git commit -m "Add rides routes"
git push origin main
```

**Test Endpoints:**
- `GET /rides/search`
- `POST /rides/create`
- `GET /rides/:id`

---

### Step 3: Add Ratings

**Edit:** `src/index-minimal.js`

**Add:**
```javascript
mounted.push(safeMount('/api', () => require('./routes/ratingRoutes')));
```

**Test:**
- `POST /ratings/add`
- `GET /ratings/driver/:driverId`

---

### Step 4: Add Dashboard

**Edit:** `src/index-minimal.js`

**Add:**
```javascript
mounted.push(safeMount('/api/dashboard', () => require('./routes/dashboardRoutes')));
```

**Test:**
- `GET /dashboard/dashboard`
- `GET /dashboard/recent`

---

### Step 5: Add Stats

**Edit:** `src/index-minimal.js`

**Add:**
```javascript
mounted.push(safeMount('/api', () => require('./routes/statsRoutes')));
```

**Test:**
- `GET /stats/:userId`

---

### Step 6: Add Users

**Edit:** `src/index-minimal.js`

**Add:**
```javascript
mounted.push(safeMount('/api/users', () => require('./routes/userRoutes')));
```

**Test:**
- `GET /users/profile`
- `PUT /users/profile`

---

### Step 7: Add Chat (Last)

**Edit:** `src/index-minimal.js`

**Add:**
```javascript
mounted.push(safeMount('/api', () => require('./routes/chat')));
```

**Test:**
- `GET /chat/:rideId/messages`
- `POST /chat/:rideId/read`

---

## 🔄 Switching Between Modes

### Use Minimal Version (Current)

**vercel.json:**
```json
{
    "builds": [{
        "src": "src/index-minimal.js",
        "use": "@vercel/node"
    }],
    "routes": [{
        "src": "/(.*)",
        "dest": "/src/index-minimal.js"
    }]
}
```

---

### Use Full Version

**vercel.json:**
```json
{
    "builds": [{
        "src": "src/index.js",
        "use": "@vercel/node"
    }],
    "routes": [{
        "src": "/(.*)",
        "dest": "/src/index.js"
    }]
}
```

---

## 📝 Testing Checklist

After each addition:

- [ ] Deploy to Vercel
- [ ] Check `/health` endpoint
- [ ] Check `/diagnostic` endpoint
- [ ] Test new endpoint
- [ ] Verify old endpoints still work
- [ ] Check Vercel logs for errors
- [ ] Monitor for crashes

---

## 🐛 If Something Breaks

### Quick Rollback

**Option 1: Revert to Minimal**
```bash
git checkout vercel.json
# Edit to use index-minimal.js
```

**Option 2: Remove Problematic Route**
```javascript
// Comment out problematic route
// mounted.push(safeMount('/api', () => require('./routes/problematic')));
```

**Option 3: Check Logs**
```bash
# Vercel Dashboard → Functions → View Logs
```

---

## 📊 Current File Status

| File | Status | Purpose |
|------|--------|---------|
| `src/index.js` | ⏸️ Backup | Full version (not deployed) |
| `src/index-minimal.js` | 🚀 Active | Minimal auth only (deployed) |
| `vercel.json` | 📝 Using minimal | Points to index-minimal.js |

---

## 🎯 End Goal

Eventually `index-minimal.js` will have all routes:
```javascript
mounted.push(safeMount('/api/auth', () => require('./routes/authRoutes')));
mounted.push(safeMount('/api', () => require('./routes/rideRoutes')));
mounted.push(safeMount('/api', () => require('./routes/ratingRoutes')));
mounted.push(safeMount('/api', () => require('./routes/statsRoutes')));
mounted.push(safeMount('/api/dashboard', () => require('./routes/dashboardRoutes')));
mounted.push(safeMount('/api/users', () => require('./routes/userRoutes')));
mounted.push(safeMount('/api', () => require('./routes/chat')));
```

Then you can switch back to `index.js` in `vercel.json`.

---

## ✅ Success Criteria

App is stable when:
- ✅ No crashes
- ✅ All auth endpoints work
- ✅ MongoDB connects successfully
- ✅ OTP emails send (or log to console)
- ✅ Users can sign up and log in

Then add next routes one by one!

