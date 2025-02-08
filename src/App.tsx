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

function TelegramAuthCheck({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if we're in Telegram
        const twa = window.Telegram?.WebApp;
        if (!twa) {
          setError('Please open this app through Telegram');
          setIsLoading(false);
          return;
        }

        // Initialize Telegram WebApp
        twa.ready();
        twa.expand();

        // Set up axios interceptor for Telegram data
        axios.interceptors.request.use((config) => {
          if (config.headers) {
            config.headers['X-Telegram-Init-Data'] = twa.initData;
            if (twa.initDataUnsafe?.user) {
              config.headers['X-Telegram-User'] = JSON.stringify(twa.initDataUnsafe.user);
            }
          }
          return config;
        });

        // Try to get existing session first
        try {
          const sessionResponse = await axios.get('/api/auth/session');
          if (sessionResponse.data) {
            queryClient.setQueryData('userData', sessionResponse.data);
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.log('No existing session, creating new one...');
        }

        // Initialize new session
        const response = await axios.post('/api/auth/initialize');
        if (response.data) {
          queryClient.setQueryData('userData', response.data);
          setIsAuthenticated(true);
          setIsLoading(false);
          // Redirect to home after successful authentication
          navigate('/', { replace: true });
          return;
        }

        setError('Failed to initialize user data');
        setIsLoading(false);
      } catch (e: any) {
        console.error('Error initializing app:', e);
        const errorMessage = e.response?.data?.error || e.message || 'Unable to initialize app';
        const botUsername = e.response?.data?.botUsername || 'starnight9bot';
        setError(errorMessage);
        if (errorMessage.includes('start the bot')) {
          window.location.href = `https://t.me/${botUsername}?start=webapp`;
        }
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
          <a 
            href={`https://t.me/starnight9bot`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-blue-500 rounded-lg font-semibold hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
          >
            Open in Telegram
          </a>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TelegramAuthCheck>
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
        </TelegramAuthCheck>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;