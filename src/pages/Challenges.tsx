import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, X, Users } from 'lucide-react';
import { useMutation, useQuery } from 'react-query';
import { findMatch, getActiveLobbies } from '../api/game';
import { getUserData } from '../api/user';
import WebApp from '@twa-dev/sdk';

const BET_AMOUNTS = [15, 50, 100];

function Challenges() {
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = React.useState<number | null>(null);
  const [searching, setSearching] = React.useState(false);
  const { data: user } = useQuery('userData', getUserData);
  const { data: activeLobbies } = useQuery('activeLobbies', getActiveLobbies, {
    refetchInterval: 10000, // Refresh lobbies every 10 seconds
  });

  const matchMutation = useMutation(findMatch, {
    onSuccess: (game) => {
      navigate(`/game/${game.id}`);
    },
    onError: (error: any) => {
      setSearching(false);
      WebApp.showPopup({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to find match',
        buttons: [{ type: 'ok' }]
      });
    }
  });

  const handleFindMatch = () => {
    if (!selectedAmount) return;

    if (!user || user.stars < selectedAmount) {
      WebApp.showPopup({
        title: 'Insufficient Stars',
        message: 'You don\'t have enough stars for this bet',
        buttons: [{ type: 'ok' }]
      });
      return;
    }

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

      <div className="p-4 bg-white/10 rounded-lg">
        <p className="text-center">Your Stars: <span className="font-bold text-yellow-400">{user?.stars || 0}</span></p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {BET_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => setSelectedAmount(amount)}
            disabled={searching || (user?.stars || 0) < amount}
            className={`p-6 rounded-xl flex flex-col items-center gap-2 transition-colors ${
              selectedAmount === amount
                ? 'bg-yellow-400 text-black'
                : 'bg-white/10 hover:bg-white/20'
            } ${
              searching || (user?.stars || 0) < amount 
                ? 'opacity-50 cursor-not-allowed' 
                : ''
            }`}
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
          disabled={!selectedAmount || (user?.stars || 0) < (selectedAmount || 0)}
          className="w-full p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Find Match
        </button>
      )}

      <div className="p-6 bg-white/10 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold">Active Lobbies</h2>
        </div>
        <div className="space-y-3">
          {activeLobbies?.length === 0 ? (
            <p className="text-center text-gray-400">No active lobbies found</p>
          ) : (
            activeLobbies.map((lobby: any) => (
              <div key={lobby.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="font-semibold">{lobby.player1.username}</p>
                  <p className="text-sm text-gray-400">{lobby.betAmount} ⭐</p>
                </div>
                <button 
                  className="px-4 py-2 bg-blue-500 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                  onClick={() => navigate(`/game/${lobby.id}`)}
                >
                  Join
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Challenges;