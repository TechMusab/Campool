# Testing OTP Endpoint

## ✅ Deployment Status

Your minimal deployment is **LIVE** at: https://campool-lm5p.vercel.app/

Root endpoint returned:
```json
{
  "message": "Campool API Server (MINIMAL MODE - Auth Only)",
  "status": "running",
  "endpoints": {
    "auth": [
      "POST /api/auth/request-otp",
      "POST /api/auth/verify-otp",
      "POST /api/auth/signup",
      "POST /api/auth/login"
    ]
  },
  "timestamp": "2025-11-02T05:26:46.123Z"
}
```

---

## 🧪 Test OTP Endpoint

### 1. Request OTP

**curl Command:**
```bash
curl -X POST https://campool-lm5p.vercel.app/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@nu.edu.pk"}'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "expiresInMs": 120000
}
```

**Check Console Logs:**
The OTP will be printed in Vercel logs:
```
📧 ===== OTP EMAIL (NO SMTP CONFIGURED) =====
📧 To: test@nu.edu.pk
📧 OTP Code: 123456
📧 Expires in: 2 minutes
📧 ===========================================
```

---

### 2. Verify OTP

**curl Command:**
```bash
curl -X POST https://campool-lm5p.vercel.app/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@nu.edu.pk","otp":"123456"}'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

---

### 3. Complete Signup

**curl Command:**
```bash
curl -X POST https://campool-lm5p.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@nu.edu.pk",
    "password": "Test1234",
    "studentId": "STU001",
    "whatsappNumber": "+923001234567",
    "otp": "123456"
  }'
```

**Expected Response (Success):**
```json
{
  "id": "...",
  "name": "Test User",
  "email": "test@nu.edu.pk",
  "studentId": "STU001",
  "status": "verified",
  "createdAt": "2025-11-02T..."
}
```

---

### 4. Login

**curl Command:**
```bash
curl -X POST https://campool-lm5p.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@nu.edu.pk",
    "password": "Test1234"
  }'
```

**Expected Response (Success):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@nu.edu.pk",
    "studentId": "STU001"
  }
}
```

---

## 📋 Testing Checklist

- [ ] Root endpoint works (`/`)
- [ ] Health check works (`/health`)
- [ ] Diagnostic works (`/diagnostic`)
- [ ] Request OTP works (`/api/auth/request-otp`)
- [ ] Verify OTP works (`/api/auth/verify-otp`)
- [ ] Signup works (`/api/auth/signup`)
- [ ] Login works (`/api/auth/login`)
- [ ] No crashes in Vercel logs
- [ ] MongoDB connects successfully
- [ ] OTP appears in console logs

---

## 🔍 View Vercel Logs

To see OTP codes in console:

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click "Functions" tab
4. Click on a function invocation
5. View the logs

You should see:
```
📧 ===== OTP EMAIL (NO SMTP CONFIGURED) =====
📧 To: test@nu.edu.pk
📧 OTP Code: 123456
📧 ===========================================
```

---

## 🎯 Quick Test

**Test in one command:**
```bash
# Request OTP
curl -X POST https://campool-lm5p.vercel.app/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@nu.edu.pk"}'
```

**Then check Vercel logs for the OTP code!**

---

## ✅ Success Indicators

Your minimal deployment is working if:
1. ✅ All endpoints return 200 status
2. ✅ No FUNCTION_INVOCATION_FAILED errors
3. ✅ OTP codes appear in logs
4. ✅ Users can sign up and log in
5. ✅ MongoDB connection is stable

---

## 🚨 Common Issues

### Issue: "Database connection failed"
**Check:** MongoDB Atlas IP whitelist includes Vercel IPs (0.0.0.0/0 for testing)

### Issue: "Missing field: email"
**Check:** Send email in request body: `{"email":"test@nu.edu.pk"}`

### Issue: "OTP expired"
**Check:** OTP expires in 2 minutes, request new one

### Issue: "Too many requests"
**Check:** Rate limit is 5 OTPs per hour per email

---

**Try the curl commands above and let me know the results!** 🚀

