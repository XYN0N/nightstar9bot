import React from 'react';
import { Settings } from 'lucide-react';
import { useQuery } from 'react-query';
import { getUserData } from '../api/user';
import { ADMIN_ID } from '../config/telegram';

function AdminPanel() {
  const { data: user } = useQuery('userData', getUserData);

  if (!user || user.id !== ADMIN_ID) {
    return (
      <div className="text-center py-12">
        <p className="text-xl">Access denied</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-300">Manage game settings</p>
      </div>

      <div className="space-y-4">
        <div className="p-6 bg-white/10 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-lg">
              <p className="text-sm text-gray-300">Total Users</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg">
              <p className="text-sm text-gray-300">Games Today</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white/10 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Minimum Bet Amount
              </label>
              <input
                type="number"
                className="w-full bg-white/5 rounded-lg p-2"
                defaultValue={15}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Maximum Bet Amount
              </label>
              <input
                type="number"
                className="w-full bg-white/5 rounded-lg p-2"
                defaultValue={100}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;