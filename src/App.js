import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// Import Components
import Sidebar from './components/Sidebar';
import Auth from './components/Auth'; // Added this import

// Import Pages
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import SalesOrder from './pages/SalesOrder';
import PurchaseOrder from './pages/PurchaseOrder';
import Reports from './pages/Reports';
import Transactions from './pages/Transactions';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Settings from './Settings';
import Journal from './pages/Journal';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [session, setSession] = useState(null);

  // --- 1. HOOKS MUST COME FIRST ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- 2. TRAFFIC CONTROLLER (Logic) ---
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard setPage={setActivePage} />;
      case 'inventory': return <Inventory />;
      case 'sales': return <SalesOrder />;
      case 'purchase': return <PurchaseOrder />;
      case 'reports': return <Reports />;
      case 'customers': return <Customers />;
      case 'suppliers': return <Suppliers />;
      case 'transactions': return <Transactions />;
      case 'journal': return <Journal />;
      case 'settings': return <Settings />;
      default: return <Dashboard setPage={setActivePage} />;
    }
  };

  // --- 3. RENDER LOGIC ---
  
  // If not logged in, show ONLY the Auth screen
  if (!session) {
    return <Auth />;
  }

  // If logged in, show the Sidebar + the Content
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar for Desktop Navigation */}
      <Sidebar activePage={activePage} setPage={setActivePage} />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen p-4">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;