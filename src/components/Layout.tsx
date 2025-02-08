import React from 'react';
import { Outlet } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useQuery } from 'react-query';
import { getUserData } from '../api/user';

function Layout() {
  const { data: user } = useQuery('userData', getUserData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
      <header className="fixed top-0 left-0 right-0 bg-black/30 backdrop-blur-lg p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">StarNight</h1>
        {user && (
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="font-bold">{user.stars}</span>
          </div>
        )}
      </header>
      <main className="pt-16 pb-4 px-4 max-w-2xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;