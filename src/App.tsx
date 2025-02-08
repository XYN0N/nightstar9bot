import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Challenges from './pages/Challenges';
import Game from './pages/Game';
import Recharge from './pages/Recharge';
import Leaderboard from './pages/Leaderboard';
import AdminPanel from './pages/AdminPanel';
import Layout from './components/Layout';
import axios from 'axios';

const queryClient = new QueryClient();

function App() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isTelegram, setIsTelegram] = React.useState(false);

  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if we're in Telegram
        const twa = window.Telegram?.WebApp;
        if (!twa) {
          throw new Error('This app is only available through Telegram.');
        }

        setIsTelegram(true);

        // Initialize Telegram WebApp
        twa.ready();
        
        // Get initData
        const initData = twa.initData;
        if (!initData) {
          throw new Error('No Telegram data available. Please open this app through Telegram.');
        }

        // Set up axios interceptor
        axios.interceptors.request.use((config) => {
          if (config.headers) {
            config.headers['X-Telegram-Init-Data'] = initData;
          }
          return config;
        });

        // Initialize user session
        const response = await axios.post('/api/auth/initialize');
        if (!response.data) {
          throw new Error('Failed to initialize user profile');
        }

        // Store user data
        queryClient.setQueryData('userData', response.data);
        
        setIsLoading(false);
      } catch (e: any) {
        console.error('Error initializing app:', e);
        setError(e.response?.data?.error || e.message || 'Unable to initialize app. Please try again.');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (!isTelegram) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold mb-4">⭐️ StarNight</h1>
          <p className="text-xl mb-6">This app is only available through Telegram.</p>
          <a 
            href="https://t.me/starnight9bot"
            target="_blank" 
            rel="noopener noreferrer"
            className="px-6 py-3 bg-blue-500 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Open in Telegram
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto"></div>
          <p className="mt-4">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold mb-4">⭐️ Error</h1>
          <p className="text-xl mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-500 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="profile" element={<Profile />} />
            <Route path="challenges" element={<Challenges />} />
            <Route path="game/:gameId" element={<Game />} />
            <Route path="recharge" element={<Recharge />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;