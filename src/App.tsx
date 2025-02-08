import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { WebApp } from '@twa-dev/sdk';
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

  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize Telegram WebApp
        WebApp.ready();
        
        // Set up axios interceptor to include Telegram user data
        axios.interceptors.request.use((config) => {
          const initData = WebApp.initData;
          if (initData) {
            config.headers['X-Telegram-Init-Data'] = initData;
            // Try to parse user data from initData
            try {
              const data = Object.fromEntries(new URLSearchParams(initData));
              if (data.user) {
                const user = JSON.parse(data.user);
                config.headers['X-Telegram-User-ID'] = user.id;
              }
            } catch (e) {
              console.error('Error parsing Telegram init data:', e);
            }
          }
          return config;
        });

        // Initialize user profile
        const response = await axios.post('/api/auth/initialize');
        if (!response.data) {
          throw new Error('Failed to initialize user profile');
        }
        
        setIsLoading(false);
      } catch (e: any) {
        console.error('Error initializing app:', e);
        setError(e.response?.data?.error || 'Unable to initialize app. Please try again.');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

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
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;