import { Link } from 'react-router-dom';
import { User, Swords, CreditCard } from 'lucide-react';

function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Welcome to StarNight</h1>
        <p className="text-gray-300">Challenge players and win stars!</p>
      </div>

      <div className="grid gap-4">
        <Link
          to="/profile"
          className="flex items-center gap-4 p-6 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
        >
          <div className="p-3 bg-blue-500 rounded-lg">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Profile</h2>
            <p className="text-gray-300">View your stats and badges</p>
          </div>
        </Link>

        <Link
          to="/challenges"
          className="flex items-center gap-4 p-6 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
        >
          <div className="p-3 bg-red-500 rounded-lg">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Challenges</h2>
            <p className="text-gray-300">Find opponents and bet stars</p>
          </div>
        </Link>

        <Link
          to="/recharge"
          className="flex items-center gap-4 p-6 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
        >
          <div className="p-3 bg-green-500 rounded-lg">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Recharge</h2>
            <p className="text-gray-300">Buy more stars to play</p>
          </div>
        </Link>
      </div>

      <div className="mt-8 p-6 bg-white/10 rounded-xl">
        <h2 className="text-xl font-semibold mb-4">Game Rules</h2>
        <div className="space-y-4 text-gray-300">
          <p>🎮 <strong>How to Play:</strong></p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Challenge other players by betting your stars</li>
            <li>The game flips a coin to determine the winner</li>
            <li>Winner takes all the stars from the bet</li>
            <li>Minimum bet is 15 stars</li>
            <li>You can earn free stars every 3 hours</li>
            <li>Invite friends to earn bonus stars</li>
          </ul>
          <p>🏆 <strong>Leaderboard:</strong></p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Players are ranked by total earnings</li>
            <li>Win more games to climb the rankings</li>
            <li>Top players get special badges</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Home;