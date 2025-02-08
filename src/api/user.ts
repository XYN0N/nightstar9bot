import axios from 'axios';
import { User } from '../types';

export async function getUserData(): Promise<User> {
  const response = await axios.get('/api/user');
  return response.data;
}

export async function getLeaderboard() {
  const response = await axios.get('/api/leaderboard');
  return response.data;
}