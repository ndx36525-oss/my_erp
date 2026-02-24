import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Truck, Wallet, Plus, Package, Users, Receipt, ArrowRight } from 'lucide-react';

const Dashboard = ({ setPage }) => {
  const [cashBalance, setCashBalance] = useState(0);
  const [shipmentAlerts, setShipmentAlerts] = useState([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // 1. Fetch Cash Balance from Chart of Accounts
    const { data: cashData } = await supabase
      .from('chart_of_accounts')
      .select('balance')
      .eq('name', 'Cash')
      .single();
    
    // 2. Fetch Items and calculate shipment readiness
    const { data: items } = await supabase.from('items').select('*');

    if (cashData) setCashBalance(cashData.balance);
    
    if (items) {
      // Logic: Filter items that are at 80% or more of their shipment threshold
      const alerts = items
        .map(item => ({
          ...item,
          ratio: (item.opening_stock / item.shipment_threshold) * 100
        }))
        .filter(item => item.ratio >= 80)
        .sort((a, b) => b.ratio - a.ratio);
        
      setShipmentAlerts(alerts);
    }
    setLoading(false);
  };

  const quickActions = [
    { label: 'Purchase Order', icon: <Package size={18}/>, page: 'purchase' },
    { label: 'Sales Order', icon: <Truck size={18}/>, page: 'sales' },
    { label: 'Journal Entry', icon: <Receipt size={18}/>, page: 'journal' },
    { label: 'Supplier', icon: <Users size={18}/>, page: 'suppliers' },
    { label: 'Customer', icon: <Users size={18}/>, page: 'customers' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* --- HEADER --- */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Business Overview</h1>
        <p className="text-gray-500">Real-time status of your cash and logistics.</p>
      </header>

      {/* --- CASH CARD --- */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-3xl shadow-xl text-white mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-blue-100 text-sm font-bold uppercase tracking-wider mb-2">Total Cash on Hand</p>
          <h2 className="text-5xl font-black">${cashBalance.toLocaleString()}</h2>
        </div>
        <Wallet className="absolute right-[-20px] bottom-[-20px] text-blue-500 opacity-20" size={200} />
      </div>

      {/* --- SHIPMENT LOAD ALERTS --- */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Truck className="text-orange-500" /> High-Stock Shipment Alerts
          </h3>
          <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold">
            {shipmentAlerts.length} Items Pending
          </span>
        </div>

        {loading ? (
          <p className="text-center py-10 text-gray-400">Updating shipment status...</p>
        ) : (
          <div className="grid gap-6">
            {shipmentAlerts.length > 0 ? shipmentAlerts.map(item => (
              <div key={item.id} className="group">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-bold text-gray-800">{item.name}</span>
                    <span className="text-xs text-gray-400 ml-2">Target: {item.shipment_threshold}</span>
                  </div>
                  <span className={`text-sm font-black ${item.ratio >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                    {item.opening_stock} units ({item.ratio.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${item.ratio >= 100 ? 'bg-green-500' : 'bg-orange-500'}`} 
                    style={{ width: `${Math.min(item.ratio, 100)}%` }}
                  ></div>
                </div>
                {item.ratio >= 100 && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-black text-green-600 uppercase">
                    <ArrowRight size={12}/> Load truck and ship immediately
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center py-10 border-2 border-dashed rounded-xl">
                <p className="text-gray-400 text-sm">All inventory is currently below shipment levels.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* --- QUICK CREATE FLOATING ACTION BUTTON --- */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end z-50">
        {showQuickAdd && (
          <div className="mb-4 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 animate-in slide-in-from-bottom-5">
            <p className="text-[10px] font-bold text-gray-400 p-2 uppercase tracking-widest">Quick Create</p>
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => {
                  setPage(action.page);
                  setShowQuickAdd(false);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl text-sm font-semibold text-gray-700 transition-colors"
              >
                <span className="text-blue-600 bg-blue-50 p-2 rounded-lg">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        )}
        <button 
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          className={`p-4 rounded-full shadow-2xl transition-all duration-300 ${showQuickAdd ? 'bg-gray-800 rotate-45' : 'bg-blue-600'}`}
        >
          <Plus size={32} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;