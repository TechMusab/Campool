import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'https://campool-l1un.vercel.app';

export async function fetchMessages(token: string, rideId: string, params?: { page?: number; limit?: number; before?: string }) {
  const res = await axios.get(`${API_BASE}/chat/${rideId}/messages`, {
    params,
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function markRead(token: string, rideId: string, payload: { lastSeenAt?: string; lastMessageId?: string }) {
  const res = await axios.post(`${API_BASE}/chat/${rideId}/read`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
} 