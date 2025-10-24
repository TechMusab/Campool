import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'https://campool-l1un.vercel.app';

export async function fetchStats(token: string, userId: string) {
  const res = await axios.get(`${API_BASE}/stats/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data as { userId: string; ridesTaken: number; ridesOffered: number; moneySaved: number; co2SavedKg: number };
} 