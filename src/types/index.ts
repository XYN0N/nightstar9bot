export interface User {
  id: number;
  username: string;
  photoUrl: string;
  stars: number;
  totalWins: number;
  totalLosses: number;
  totalEarnings: number;
  badges: string[];
}

export interface Game {
  id: string;
  player1: User;
  player2: User;
  betAmount: number;
  status: 'waiting' | 'playing' | 'finished';
  winner?: User;
  coinSide?: 'heads' | 'tails';
}

export interface LeaderboardEntry {
  user: User;
  rank: number;
}