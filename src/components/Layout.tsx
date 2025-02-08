import { Outlet, Link, useLocation } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useQuery } from 'react-query';
import { getUserData } from '../api/user';

function Layout() {
  const { data: user } = useQuery('userData', getUserData);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
      <header className="fixed top-0 left-0 right-0 bg-black/30 backdrop-blur-lg p-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold hover:text-yellow-400 transition-colors">⭐️ StarNight</Link>
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

export default Layout;