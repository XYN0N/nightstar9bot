import axios from 'axios';
import { User, LeaderboardEntry } from '../types';

// Get the API URL based on environment
const getAPIURL = () => {
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  return 'http://localhost:3000';
};

const api = axios.create({
  baseURL: getAPIURL(),
  withCredentials: true
});

export async function getUserData(): Promise<User> {
  try {
    const response = await api.post('/api/auth/initialize');
    return response.data;
  } catch (error) {
    if (import.meta.env.DEV) {
      // Return mock data in development
      return {
        id: 1,
        username: 'Test User',
        photoUrl: '',
        stars: 100,
        totalWins: 0,
        totalLosses: 0,
        totalEarnings: 0,
        badges: [],
        isPremium: false,
        referralCode: 'TEST123'
      };
    }
    throw error;
  }
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await api.get('/api/leaderboard');
  return response.data;
}

export async function earnStars(type: 'click' | 'referral'): Promise<User> {
  const response = await api.post('/api/stars/earn', { type });
  return response.data;
}