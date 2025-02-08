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
        // Check if we're in Telegram WebApp
        if (!window.Telegram?.WebApp) {
          setError('Please open this app through Telegram');
          setIsLoading(false);
          return;
        }

        // Initialize WebApp
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();

        // Get initData and user data
        const initData = window.Telegram.WebApp.initData;
        const userData = window.Telegram.WebApp.initDataUnsafe?.user;

        if (!initData || !userData) {
          setError('Invalid Telegram data');
          setIsLoading(false);
          return;
        }

        // Set up axios interceptors
        axios.interceptors.request.use((config) => {
          if (config.headers) {
            config.headers['X-Telegram-Init-Data'] = initData;
            config.headers['X-Telegram-User'] = JSON.stringify(userData);
          }
          return config;
        });

        // Check session status first
        const sessionResponse = await axios.get('/api/auth/session');
        if (sessionResponse.data) {
          queryClient.setQueryData('userData', sessionResponse.data);
          setIsLoading(false);
          navigate('/home', { replace: true });
          return;
        }

        // If no session, initialize user
        const initResponse = await axios.post('/api/auth/initialize');
        if (initResponse.data) {
          queryClient.setQueryData('userData', initResponse.data);
          setIsLoading(false);
          navigate('/home', { replace: true });
          return;
        }

        setError('Failed to initialize user data');
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
              href={`https://t.me/${process.env.BOT_USERNAME}?start=webapp`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-blue-500 rounded-lg font-semibold hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
            >
              Start Bot
            </a>
          ) : (
            <a 
              href={`https://t.me/${process.env.BOT_USERNAME}`}
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