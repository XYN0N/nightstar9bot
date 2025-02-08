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
    </div>
  );
}

export default Home;