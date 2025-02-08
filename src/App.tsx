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
  const [isTelegram, setIsTelegram] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    try {
      // Initialize Telegram WebApp
      WebApp.ready();
      setIsTelegram(true);

      // Set up axios interceptor to include Telegram user data
      axios.interceptors.request.use((config) => {
        const initData = WebApp.initData;
        if (initData) {
          config.headers['X-Telegram-Init-Data'] = initData;
          // Extract user ID from initData and add it as a header
          try {
            const data = Object.fromEntries(new URLSearchParams(initData));
            if (data.user) {
              const user = JSON.parse(data.user);
              config.headers['X-Telegram-ID'] = user.id;
            }
          } catch (e) {
            console.error('Error parsing Telegram init data:', e);
          }
        }
        return config;
      });

      setIsInitialized(true);
    } catch (e) {
      console.error('Error initializing Telegram WebApp:', e);
      setIsTelegram(false);
      setIsInitialized(true);
    }
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isTelegram) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold mb-4">⭐️ StarNight</h1>
          <p className="text-xl">This app is only available through Telegram.</p>
          <a 
            href="https://t.me/starnight9bot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-6 inline-block px-6 py-3 bg-blue-500 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Open in Telegram
          </a>
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