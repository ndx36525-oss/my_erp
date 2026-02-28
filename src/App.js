import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory'; // Import your new Items page
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';

// Import other placeholder pages as you create them
// import SalesOrder from './pages/SalesOrder';

function App() {
  // This state controls which page is currently visible
  const [activePage, setPage] = useState('dashboard');

  // Logic to determine which component to show
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <Inventory />;
      case 'customers':
        return <Customers />;
      case 'suppliers':
        return <Suppliers />;
      // Add more cases here as you build more pages:
      // case 'sales': return <SalesOrder />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar gets the state and the function to change it */}
      <Sidebar activePage={activePage} setPage={setPage} />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;