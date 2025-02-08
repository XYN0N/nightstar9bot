import React from 'react';
import { Star, Gift } from 'lucide-react';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { User } from '../types';

function Recharge() {
  const [clickCount, setClickCount] = React.useState(0);
  const queryClient = useQueryClient();
  const userData = queryClient.getQueryData<User>('userData');

  const earnStarsMutation = useMutation(
    async () => {
      const response = await axios.post('/api/stars/earn', { type: 'click' });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('userData');
      }
    }
  );

  const handleStarClick = () => {
    setClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 10) {
        earnStarsMutation.mutate();
        return 0;
      }
      return newCount;
    });
  };

  const handleCopyReferralLink = () => {
    if (userData?.id) {
      const referralLink = `https://t.me/nightstar9/app?startapp=refUser_${userData.id}`;
      navigator.clipboard.writeText(referralLink);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Earn Stars</h1>
        <p className="text-gray-300">Click to earn stars!</p>
      </div>

      <div className="grid gap-4">
        <button
          onClick={handleStarClick}
          className="p-8 bg-white/10 rounded-xl hover:bg-white/20 transition-colors relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent" 
               style={{ width: `${(clickCount / 10) * 100}%` }} />
          <div className="relative flex flex-col items-center gap-3">
            <Star className="w-16 h-16 text-yellow-400 animate-pulse" />
            <div className="text-center">
              <p className="text-lg font-semibold">Click to Earn Stars</p>
              <p className="text-sm text-gray-300">{10 - clickCount} clicks until next star</p>
            </div>
          </div>
        </button>

        <div className="p-6 bg-white/10 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <Gift className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-semibold">Invite Friends</h2>
          </div>
          <p className="text-sm text-gray-300 mb-4">
            Share your referral link and earn 100 stars for each friend who joins!
          </p>
          <button 
            onClick={handleCopyReferralLink}
            className="w-full p-4 bg-emerald-500/20 text-emerald-300 rounded-lg font-semibold hover:bg-emerald-500/30 transition-colors"
          >
            Copy Referral Link
          </button>
        </div>
      </div>
    </div>
  );
}

export default Recharge;