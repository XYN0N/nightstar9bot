import { Star, Gift } from 'lucide-react';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { User } from '../types';

function Recharge() {
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

  const handleCopyReferralLink = () => {
    if (userData?.referralCode) {
      const referralLink = `https://t.me/nightstar9/app?startapp=ref_${userData.referralCode}`;
      navigator.clipboard.writeText(referralLink);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Earn Stars</h1>
        <p className="text-gray-300">Complete tasks to earn stars!</p>
      </div>

      <div className="grid gap-4">
        <button
          onClick={() => earnStarsMutation.mutate()}
          className="p-8 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
        >
          <div className="flex flex-col items-center gap-3">
            <Star className="w-16 h-16 text-yellow-400 animate-pulse" />
            <div className="text-center">
              <p className="text-lg font-semibold">Daily Reward</p>
              <p className="text-sm text-gray-300">Click to claim your daily stars</p>
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