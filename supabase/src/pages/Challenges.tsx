import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, X } from 'lucide-react';
import { useMutation } from 'react-query';
import { findMatch } from '../api/game';

const BET_AMOUNTS = [15, 50, 100];

function Challenges() {
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = React.useState<number | null>(null);
  const [searching, setSearching] = React.useState(false);

  const matchMutation = useMutation(findMatch, {
    onSuccess: (game) => {
      navigate(`/game/${game.id}`);
    },
    onError: () => {
      setSearching(false);
    }
  });

  const handleFindMatch = () => {
    if (!selectedAmount) return;
    setSearching(true);
    matchMutation.mutate(selectedAmount);
  };

  const handleCancel = () => {
    matchMutation.reset();
    setSearching(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Challenge Players</h1>
        <p className="text-gray-300">Select bet amount and find opponents</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {BET_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => setSelectedAmount(amount)}
            disabled={searching}
            className={`p-6 rounded-xl flex flex-col items-center gap-2 transition-colors ${
              selectedAmount === amount
                ? 'bg-yellow-400 text-black'
                : 'bg-white/10 hover:bg-white/20'
            } ${searching ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Star
              className={`w-8 h-8 ${
                selectedAmount === amount ? 'fill-black' : 'fill-yellow-400'
              }`}
            />
            <span className="text-xl font-bold">{amount}</span>
          </button>
        ))}
      </div>

      {searching ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            <p>Searching for opponent...</p>
          </div>
          <button
            onClick={handleCancel}
            className="w-full p-4 bg-red-500/20 text-red-300 rounded-lg font-semibold hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Cancel Search
          </button>
        </div>
      ) : (
        <button
          onClick={handleFindMatch}
          disabled={!selectedAmount}
          className="w-full p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Find Match
        </button>
      )}
    </div>
  );
}

export default Challenges;