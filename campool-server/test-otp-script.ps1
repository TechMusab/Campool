# Test OTP Endpoint Script
# Run this to continuously test the OTP endpoint and check for errors

Write-Host "🧪 Testing OTP Endpoint" -ForegroundColor Cyan
Write-Host "URL: https://campool-lm5p.vercel.app/api/auth/request-otp" -ForegroundColor Gray
Write-Host ""

# Function to test OTP
function Test-OTPEndpoint {
    param (
        [string]$Email = "test@nu.edu.pk"
    )
    
    Write-Host "📧 Requesting OTP for: $Email" -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "https://campool-lm5p.vercel.app/api/auth/request-otp" `
            -Method POST `
            -ContentType "application/json" `
            -Body (@{email=$Email} | ConvertTo-Json) `
            -ErrorAction Stop
        
        Write-Host "✅ SUCCESS" -ForegroundColor Green
        Write-Host "Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ FAILED" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.ErrorDetails.Message) {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
        return $false
    }
}

# Function to test health endpoint
function Test-Health {
    Write-Host "🏥 Testing Health Endpoint..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "https://campool-lm5p.vercel.app/health" `
            -Method GET `
            -ErrorAction Stop
        
        Write-Host "✅ Health Check OK" -ForegroundColor Green
        Write-Host "Status: $($response.status)" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Health Check Failed" -ForegroundColor Red
        return $false
    }
}

# Function to test diagnostic endpoint
function Test-Diagnostic {
    Write-Host "🔍 Testing Diagnostic Endpoint..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "https://campool-lm5p.vercel.app/diagnostic" `
            -Method GET `
            -ErrorAction Stop
        
        Write-Host "✅ Diagnostic OK" -ForegroundColor Green
        Write-Host "MongoDB State: $($response.mongodb.connectionState)" -ForegroundColor Green
        Write-Host "Mode: $($response.mode)" -ForegroundColor Green
        
        if ($response.mongodb.connectionState -eq 1) {
            Write-Host "✅ MongoDB Connected!" -ForegroundColor Green
        } elseif ($response.mongodb.connectionState -eq 2) {
            Write-Host "⚠️ MongoDB Connecting..." -ForegroundColor Yellow
        } else {
            Write-Host "❌ MongoDB Disconnected" -ForegroundColor Red
        }
        
        return $true
    }
    catch {
        Write-Host "❌ Diagnostic Failed" -ForegroundColor Red
        return $false
    }
}

# Main test loop
Write-Host "Starting tests..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Health
Test-Health
Write-Host ""

# Test 2: Diagnostic
Test-Diagnostic
Write-Host ""

# Test 3: OTP Request
$otpSuccess = Test-OTPEndpoint
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($otpSuccess) {
    Write-Host "✅ OTP Endpoint is working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Check Vercel logs for OTP code" -ForegroundColor White
    Write-Host "2. Verify the OTP appears in console" -ForegroundColor White
    Write-Host "3. Test the verify-otp endpoint" -ForegroundColor White
} else {
    Write-Host "❌ OTP Endpoint is failing!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Check Vercel deployment logs" -ForegroundColor White
    Write-Host "2. Verify environment variables" -ForegroundColor White
    Write-Host "3. Check MongoDB connection" -ForegroundColor White
    Write-Host "4. Look for bcrypt/Express errors" -ForegroundColor White
}

Write-Host ""

