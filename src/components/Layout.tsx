import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Star, Home } from 'lucide-react';
import { useQuery } from 'react-query';
import { getUserData } from '../api/user';

function Layout() {
  const { data: user } = useQuery('userData', getUserData, {
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });
  
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
      <header className="fixed top-0 left-0 right-0 bg-black/30 backdrop-blur-lg p-4 flex items-center justify-between">
        {location.pathname !== '/' && (
          <Link to="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Home className="w-6 h-6" />
          </Link>
        )}
        <div className="flex items-center gap-3">
          {user?.photoUrl ? (
            <img 
              src={user.photoUrl} 
              alt={user.username}
              className="w-10 h-10 rounded-full border-2 border-white/20"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold">{user?.username}</p>
            {user?.isPremium && (
              <p className="text-xs text-emerald-400 font-medium">Premium</p>
            )}
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
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

export default Layout