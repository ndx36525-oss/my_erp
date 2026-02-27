import React from 'react';
import { supabase } from '../supabaseClient';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  BarChart3, 
  History, 
  Settings, 
  LogOut, 
  BookOpen,
  Users,
  Building2
} from 'lucide-react';

const Sidebar = ({ activePage, setPage }) => {
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert(error.message);
  };

  // Grouped Menu Items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'inventory', label: 'Inventory', icon: <Package size={20} /> }, // This links to your Items.js
    { id: 'sales', label: 'Sales Order', icon: <ShoppingCart size={20} /> },
    { id: 'purchase', label: 'Purchase Order', icon: <Truck size={20} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={20} /> },
    { id: 'suppliers', label: 'Suppliers', icon: <Building2 size={20} /> },
    { id: 'journal', label: 'Journal Entry', icon: <BookOpen size={20} /> },
    { id: 'transactions', label: 'Transactions', icon: <History size={20} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col p-4 shadow-sm">
      <div className="mb-8 px-2 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold italic">S</div>
        <h1 className="text-xl font-black text-gray-800 tracking-tight">SMART ERP</h1>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
              activePage === item.id 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {item.icon}
            <span className="font-bold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="font-bold text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;