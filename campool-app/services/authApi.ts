import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'https://campool-lm5p.vercel.app';

export async function requestOtp(email: string) {
  console.log('🔍 Requesting OTP from:', `${API_BASE}/api/auth/request-otp`);
  console.log('🔍 Email:', email);
  
  try {
    const res = await axios.post(`${API_BASE}/api/auth/request-otp`, { email }, {
      timeout: 30000, // 30 second timeout
    });
    console.log('✅ OTP request successful:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ OTP request failed:', error);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    } else if (error.request) {
      console.error('❌ No response received:', error.request);
    } else {
      console.error('❌ Error setting up request:', error.message);
    }
    throw error;
  }
}

export async function verifyOtp(email: string, otp: string) {
  const res = await axios.post(`${API_BASE}/api/auth/verify-otp`, { email, otp });
  return res.data;
}

