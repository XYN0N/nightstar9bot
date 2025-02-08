import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import { WebApp } from '@twa-dev/sdk';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5000
    }
  }
});

function AuthenticatedApp() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize WebApp
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.ready();
          window.Telegram.WebApp.expand();

          // Set up axios interceptor for Telegram data
          axios.interceptors.request.use((config) => {
            if (config.headers) {
              config.headers['X-Telegram-Init-Data'] = window.Telegram.WebApp.initData;
              if (window.Telegram.WebApp.initDataUnsafe?.user) {
                config.headers['X-Telegram-User'] = JSON.stringify(window.Telegram.WebApp.initDataUnsafe.user);
              }
            }
            return config;
          });

          // Initialize user session
          const response = await axios.post('/api/auth/initialize');
          if (response.data) {
            queryClient.setQueryData('userData', response.data);
            setIsLoading(false);
            navigate('/home', { replace: true });
            return;
          }
        }

        setError('Please open this app through Telegram');
        setIsLoading(false);
      } catch (e: any) {
        console.error('Error initializing app:', e);
        const errorMessage = e.response?.data?.error || e.message || 'Unable to initialize app';
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [navigate]);

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
          <h1 className="text-4xl font-bold mb-4">⭐️ StarNight</h1>
          <p className="text-xl mb-6">{error}</p>
          {error.includes('start the bot') ? (
            <a 
              href="https://t.me/starnight9bot?start=webapp"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-blue-500 rounded-lg font-semibold hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
            >
              Start Bot
            </a>
          ) : (
            <a 
              href="https://t.me/starnight9bot"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-blue-500 rounded-lg font-semibold hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
            >
              Open in Telegram
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="profile" element={<Profile />} />
        <Route path="challenges" element={<Challenges />} />
        <Route path="game/:gameId" element={<Game />} />
        <Route path="recharge" element={<Recharge />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthenticatedApp />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;