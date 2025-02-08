import React from 'react';
import { Star } from 'lucide-react';
import { STAR_PACKAGES, GOOGLE_WALLET_API_KEY } from '../config/telegram';
import { WebApp } from '@twa-dev/sdk';

function Recharge() {
  const handlePurchase = async (stars: number, price: number) => {
    try {
      // Create Google Pay button
      const button = document.createElement('button');
      button.className = 'gpay-button black long';
      
      // Configure Google Pay
      const paymentClient = new google.payments.api.PaymentsClient({
        environment: 'PRODUCTION',
        paymentDataCallbacks: {
          onPaymentAuthorized: async (paymentData: any) => {
            try {
              // Process the payment on your backend
              const response = await fetch('/api/payment/process', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  paymentData,
                  stars,
                  price,
                  telegramInitData: WebApp.initData
                }),
              });

              if (!response.ok) {
                throw new Error('Payment processing failed');
              }

              // Show success message
              WebApp.showPopup({
                title: 'Success!',
                message: `You've purchased ${stars} stars!`,
                buttons: [{ type: 'ok' }]
              });

              // Refresh user data
              // You might want to trigger a refetch of user data here

            } catch (error) {
              console.error('Payment processing error:', error);
              WebApp.showPopup({
                title: 'Error',
                message: 'Failed to process payment. Please try again.',
                buttons: [{ type: 'ok' }]
              });
              return {
                transactionState: 'ERROR'
              };
            }

            return {
              transactionState: 'SUCCESS'
            };
          }
        }
      });

      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['MASTERCARD', 'VISA']
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'stripe',
              'stripe:version': '2020-08-27',
              'stripe:publishableKey': GOOGLE_WALLET_API_KEY
            }
          }
        }],
        merchantInfo: {
          merchantId: '12345678901234567890',
          merchantName: 'StarNight'
        },
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: price.toString(),
          currencyCode: 'EUR',
          countryCode: 'US'
        }
      };

      const {error, paymentData} = await paymentClient.loadPaymentData(paymentDataRequest);
      
      if (error) {
        throw error;
      }

      // Payment successful
      console.log('Payment successful:', paymentData);
      
    } catch (error) {
      console.error('Payment error:', error);
      WebApp.showPopup({
        title: 'Error',
        message: 'Payment failed. Please try again.',
        buttons: [{ type: 'ok' }]
      });
    }
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