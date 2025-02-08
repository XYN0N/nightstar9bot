import React from 'react';
import { Trophy } from 'lucide-react';
import { useQuery } from 'react-query';
import { getLeaderboard } from '../api/user';

const MEDALS = ['🥇', '🥈', '🥉'];

function Leaderboard() {
  const { data: leaderboard } = useQuery('leaderboard', getLeaderboard);

  if (!leaderboard) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-gray-300">Top players by earnings</p>
      </div>

      <div className="space-y-4">
        {leaderboard.map((entry, index) => (
          <div
            key={entry.user.id}
            className="flex items-center gap-4 p-4 bg-white/10 rounded-lg"
          >
            <div className="text-2xl font-bold w-8">
              {index < 3 ? MEDALS[index] : index + 1}
            </div>
            <img
              src={entry.user.photoUrl}
              alt={entry.user.username}
              className="w-12 h-12 rounded-full"
            />
            <div className="flex-1">
              <p className="font-semibold">{entry.user.username}</p>
              <p className="text-sm text-gray-300">
                {entry.user.totalWins} wins • {entry.user.totalEarnings} ⭐️ earned
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Leaderboard;