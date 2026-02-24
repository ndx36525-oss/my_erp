import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// Import Components
import Sidebar from './components/Sidebar';

// Import Pages
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import SalesOrder from './pages/SalesOrder';
import PurchaseOrder from './pages/PurchaseOrder';
import Reports from './pages/Reports';
import Transactions from './pages/Transactions';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Settings from './pages/Settings';
import Journal from './pages/Journal';


function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [session, setSession] = useState(null);

if (!session) {
  return <Auth />;
}
return (
  <div className="flex min-h-screen bg-gray-50">
    <Sidebar activePage={activePage} setPage={setActivePage} />
    <main className="flex-1 overflow-y-auto">{renderPage()}</main>
  </div>
);
  
  // Auth check: This keeps the user logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Traffic Controller: Decides which page to show
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard setPage={setActivePage} />;
      case 'inventory':
        return <Inventory />;
      case 'sales':
        return <SalesOrder />;
      case 'purchase':
        return <PurchaseOrder />;
      case 'reports':
        return <Reports />;
      case 'customers':
         return <Customers />;
      case 'suppliers':
         return <Suppliers />;
      case 'transactions':
        return <Transactions />;
      case 'journal':
        return <Journal />;
      case 'settings':
        return <Settings />;
      // Default to Dashboard if something goes wrong
      default:
        return <Dashboard setPage={setActivePage} />;
    }
  };

  // If there is no user logged in, you could return an Auth component here
  // For now, we render the main layout
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 1. The Sidebar (Navigation) */}
      <Sidebar activePage={activePage} setPage={setActivePage} />
      
      {/* 2. The Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;