import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import SalesOrder from './pages/SalesOrder';
import PurchaseOrder from './pages/PurchaseOrder';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Transactions from './pages/Transactions';

// Import other placeholders as needed
// import Journal from './pages/Journal';
// import Reports from './pages/Reports';
// import Settings from './pages/Settings';

function App() {
  // This state determines which page is currently displayed
  const [activePage, setPage] = useState('dashboard');

  // Conditional Rendering Logic
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <Items />;
      case 'sales':
        return <SalesOrder />;
      case 'purchase':
        return <PurchaseOrder />;
      case 'customers':
        return <Customers />;
      case 'suppliers':
        return <Suppliers />;
      case 'transactions':
        return <Transactions />;
      /* case 'journal': return <Journal />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />; 
      */
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar navigation */}
      <Sidebar activePage={activePage} setPage={setPage} />
      
      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto">
        <div className="animate-in fade-in duration-500">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;