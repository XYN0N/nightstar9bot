import React from 'react';
import { Star } from 'lucide-react';
import { STAR_PACKAGES } from '../config/telegram';

function Recharge() {
  const handlePurchase = (stars: number, price: number) => {
    // Telegram payment logic will be implemented here
    console.log(`Purchasing ${stars} stars for €${price}`);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Recharge Stars</h1>
        <p className="text-gray-300">Purchase stars to play more games</p>
      </div>

      <div className="grid gap-4">
        {STAR_PACKAGES.map(({ stars, price }) => (
          <button
            key={stars}
            onClick={() => handlePurchase(stars, price)}
            className="p-6 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                <span className="text-2xl font-bold">{stars}</span>
              </div>
              <span className="text-xl font-semibold">€{price}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Recharge;