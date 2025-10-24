import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'https://campool-l1un.vercel.app';

export async function addRating(token: string, payload: { rideId: string; driverId: string; rating: number; review?: string }) {
  const res = await axios.post(`${API_BASE}/ratings/add`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getDriverRatings(driverId: string, params?: { page?: number; limit?: number }) {
  const res = await axios.get(`${API_BASE}/ratings/driver/${driverId}`, { params });
  return res.data;
} 