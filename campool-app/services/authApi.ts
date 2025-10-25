import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'https://campool-t7zh.vercel.app';

export async function requestOtp(email: string) {
  const res = await axios.post(`${API_BASE}/api/auth/request-otp`, { email });
  return res.data;
}

export async function verifyOtp(email: string, otp: string) {
  const res = await axios.post(`${API_BASE}/api/auth/verify-otp`, { email, otp });
  return res.data;
}

