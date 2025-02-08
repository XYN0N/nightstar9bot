import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { Trophy, Star, TrendingDown, TrendingUp } from 'lucide-react';
import { getUserData } from '../api/user';

const BADGE_LEVELS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

function Profile() {
  const { data: user } = useQuery('userData', getUserData);

  if (!user) return null;

  const earnedBadges = Math.floor(user.totalEarnings / 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {user.photoUrl ? (
          <img
            src={user.photoUrl}
            alt={user.username}
            className="w-20 h-20 rounded-full"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold">
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{user.username}</h1>
            {user.isPremium && (
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                Premium
              </span>
            )}
          </div>
          <p className="text-gray-300">Level {earnedBadges}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/10 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-green-400">
            <TrendingUp className="w-5 h-5" />
            <span className="font-semibold">Earnings</span>
          </div>
          <p className="text-2xl font-bold mt-1">{user.totalEarnings} ⭐️</p>
        </div>

        <div className="bg-white/10 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <TrendingDown className="w-5 h-5" />
            <span className="font-semibold">Losses</span>
          </div>
          <p className="text-2xl font-bold mt-1">{user.totalLosses} ⭐️</p>
        </div>
      </div>

      <div className="bg-white/10 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h2 className="text-xl font-semibold">Badges</h2>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {BADGE_LEVELS.map((level) => (
            <div
              key={level}
              className={`aspect-square rounded-lg flex items-center justify-center ${
                user.totalEarnings >= level
                  ? 'bg-yellow-400 text-black'
                  : 'bg-white/5'
              }`}
            >
              <Star className="w-6 h-6" />
            </div>
          ))}
        </div>
      </div>

      <Link
        to="/leaderboard"
        className="block w-full p-4 bg-white/10 rounded-lg text-center font-semibold hover:bg-white/20 transition-colors"
      >
        View Leaderboard
      </Link>
    </div>
  );
}

export default Profile;