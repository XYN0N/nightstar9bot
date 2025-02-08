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
  const { data: activeLobbies = [] } = useQuery('activeLobbies', getActiveLobbies, {
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
        <p className="text-center">