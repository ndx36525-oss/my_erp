import React from 'react';
import { Home, Package, Settings, LogOut } from 'lucide-react';
import { supabase } from '..pages/supabaseClient';

const Navbar = ({ activeTab, setActiveTab }) => {
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center md:top-0 md:bottom-auto md:flex-col md:w-20 md:h-full md:border-r md:border-t-0">
      <button 
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-500'}`}
      >
        <Home size={24} />
        <span className="text-xs mt-1">Home</span>
      </button>

      <button 
        onClick={() => setActiveTab('inventory')}
        className={`flex flex-col items-center ${activeTab === 'inventory' ? 'text-blue-600' : 'text-gray-500'}`}
      >
        <Package size={24} />
        <span className="text-xs mt-1">Stock</span>
      </button>

      <button 
        onClick={() => setActiveTab('settings')}
        className={`flex flex-col items-center ${activeTab === 'settings' ? 'text-blue-600' : 'text-gray-500'}`}
      >
        <Settings size={24} />
        <span className="text-xs mt-1">Setup</span>
      </button>

      <button 
        onClick={handleLogout}
        className="flex flex-col items-center text-red-500"
      >
        <LogOut size={24} />
        <span className="text-xs mt-1">Exit</span>
      </button>
    </nav>
  );
};

export default Navbar;