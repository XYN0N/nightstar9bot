import { Star, Gift } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import { earnStars, getUserData } from '../api/user';
import { User } from '../types';
import WebApp from '@twa-dev/sdk';

export default function Recharge() {
  const queryClient = useQueryClient();
  const { data: user } = useQuery('userData', getUserData);
  
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
      },
      onError: (error: any) => {
        const nextClaimTime = error.response?.data?.nextClaimTime;
        let timeLeft = '';
        if (nextClaimTime) {
          const minutes = Math.ceil((new Date(nextClaimTime).getTime() - Date.now()) / (1000 * 60));
          if (minutes > 60) {
            timeLeft = `${Math.floor(minutes / 60)} hours and ${minutes % 60} minutes`;
          } else {
            timeLeft = `${minutes} minutes`;
          }
        }

        WebApp.showPopup({
          title: 'Not Yet Available',
          message: timeLeft ? `You can claim more stars in ${timeLeft}` : 'You can claim stars every 3 hours',
          buttons: [{ type: 'ok' }]
        });
      }
    }
  );

  const handleCopyReferralLink = async () => {
    if (user?.referralCode) {
      try {
        const referralLink = `https://t.me/starnight9bot?start=ref_${user.referralCode}`;
        await navigator.clipboard.writeText(referralLink);
        WebApp.showPopup({
          title: 'Success!',
          message: 'Referral link copied to clipboard',
          buttons: [{ type: 'ok' }]
        });
      } catch (error) {
        WebApp.showPopup({
          title: 'Error',
          message: 'Failed to copy referral link',
          buttons: [{ type: 'ok' }]
        });
      }
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