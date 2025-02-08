import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import { earnStars, getUserData } from '../api/user';
import { User } from '../types';
import WebApp from '@twa-dev/sdk';
import { Star } from 'lucide-react';

const Stars = () => {
  const queryClient = useQueryClient();
  const { data: user } = useQuery('userData', getUserData);
  const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null);

  const earnStarsMutation = useMutation(
    () => earnStars('click'),
    {
      onSuccess: (updatedUser) => {
        queryClient.setQueryData('userData', updatedUser);
        WebApp.showPopup({
          title: 'Stars Earned!',
          message: 'You earned 100 stars. Come back in 3 hours for more!',
          buttons: [{ type: 'ok' }]
        });
        setNextClaimTime(new Date(Date.now() + 3 * 60 * 60 * 1000)); // 3 hours from now
      },
      onError: (error: any) => {
        const nextTime = error.response?.data?.nextClaimTime;
        if (nextTime) {
          setNextClaimTime(new Date(nextTime));
        }
        WebApp.showPopup({
          title: 'Not Yet Available',
          message: `You can claim more stars in ${Math.ceil((nextClaimTime!.getTime() - Date.now()) / (1000 * 60))} minutes`,
          buttons: [{ type: 'ok' }]
        });
      }
    }
  );

  const handleClaimStars = () => {
    if (nextClaimTime && nextClaimTime > new Date()) {
      WebApp.showPopup({
        title: 'Not Yet Available',
        message: `You can claim more stars in ${Math.ceil((nextClaimTime.getTime() - Date.now()) / (1000 * 60))} minutes`,
        buttons: [{ type: 'ok' }]
      });
      return;
    }
    earnStarsMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Earn Stars</h1>
        <p className="text-gray-300">Complete tasks to earn stars!</p>
      </div>

      <div className="grid gap-4">
        <button
          onClick={handleClaimStars}
          disabled={earnStarsMutation.isLoading}
          className="p-8 bg-white/10 rounded-xl hover:bg-white/20 transition-colors relative overflow-hidden"
        >
          <div className="flex flex-col items-center gap-3">
            <Star className="w-16 h-16 text-yellow-400 animate-pulse" />
            <div className="text-center">
              <p className="text-lg font-semibold">Free Stars</p>
              <p className="text-sm text-gray-300">Claim 100 stars every 3 hours</p>
            </div>
          </div>
          {earnStarsMutation.isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Stars;