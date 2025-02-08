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
        <div className="flex items-center gap-3">
          {user?.photoUrl ? (
            <img 
              src={user.photoUrl} 
              alt={user.username}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold">{user?.username}</p>
            {user?.isPremium && (
              <p className="text-xs text-emerald-400">Premium</p>
            )}
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="font-bold">{user.stars}</span>
          </div>
        )}
      </header>
      <main className="pt-20 pb-4 px-4 max-w-2xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;