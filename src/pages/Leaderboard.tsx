import { Trophy } from 'lucide-react';
import { useQuery } from 'react-query';
import { getLeaderboard } from '../api/user';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const { data: leaderboard, isLoading, error } = useQuery('leaderboard', getLeaderboard, {
    refetchInterval: 30000,
    retry: 3,
    staleTime: 60000,
    onError: (error) => {
      console.error('Leaderboard error:', error);
    }
  });

  console.log("Leaderboard data:", leaderboard); // DEBUG

  if (error) {
    return (
      <div className="space-y-6 bg-gray-900 p-4 rounded-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 text-white">Leaderboard</h1>
          <div className="p-8 bg-gray-800 rounded-lg">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
            <p className="text-red-400">Failed to load leaderboard. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 bg-gray-900 p-4 rounded-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 text-white">Leaderboard</h1>
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            <p className="text-gray-300">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="space-y-6 bg-gray-900 p-4 rounded-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 text-white">Leaderboard</h1>
          <div className="p-8 bg-gray-800 rounded-lg">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
            <p className="text-gray-300">No games played yet. Be the first to play!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-900 p-4 rounded-lg">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 text-white">Leaderboard</h1>
        <p className="text-gray-300">Top players by earnings</p>
      </div>

      <div className="space-y-4">
        {leaderboard.map((entry, index) => (
          <div
            key={entry?.user?.id || index} // Evita crash se user è undefined
            className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg"
          >
            <div className="text-2xl font-bold w-8 text-white">
              {index < 3 ? MEDALS[index] : index + 1}
            </div>
            {entry?.user?.photoUrl ? (
              <img
                src={entry.user.photoUrl}
                alt={entry.user.username}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-lg font-bold text-white">
                {entry?.user?.username?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-white">{entry?.user?.username || "Unknown"}</p>
                {entry?.user?.isPremium && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">Premium</span>
                )}
              </div>
              <p className="text-sm text-gray-300">
                {entry?.user?.totalWins || 0} wins • {entry?.user?.totalEarnings || 0} ⭐️ earned
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
