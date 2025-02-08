import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { getActiveLobbies, joinLobby } from '../api';
import WebApp from '@twa-dev/sdk';

const Matchmaking = () => {
  const navigate = useNavigate();
  const [lobbies, setLobbies] = useState([]);
  const { data: activeLobbies } = useQuery('activeLobbies', getActiveLobbies, {
    refetchInterval: 10000, // Refresh lobbies every 10 seconds
  });

  useEffect(() => {
    if (activeLobbies) {
      setLobbies(activeLobbies);
    }
  }, [activeLobbies]);

  const handleJoin = (lobbyId) => {
    joinLobby(lobbyId)
      .then(() => {
        navigate(`/game/${lobbyId}`);
      })
      .catch((error) => {
        WebApp.showPopup({
          title: 'Error',
          message: error.response?.data?.error || 'Failed to join lobby',
          buttons: [{ type: 'ok' }]
        });
      });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Active Lobbies</h1>
        <p className="text-gray-300">Join an active lobby to start playing</p>
      </div>

      <div className="space-y-4">
        {lobbies.length === 0 ? (
          <p className="text-center text-gray-400">No active lobbies found</p>
        ) : (
          lobbies.map((lobby) => (
            <div key={lobby.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <p className="font-semibold">{lobby.name}</p>
                <p className="text-sm text-gray-400">{lobby.betAmount} ⭐</p>
              </div>
              <button
                className="px-4 py-2 bg-blue-500 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                onClick={() => handleJoin(lobby.id)}
              >
                Join
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Matchmaking;