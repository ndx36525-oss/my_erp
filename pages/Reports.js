import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  BarChart3, 
  PieChart, 
  Wallet 
} from 'lucide-react';

const Reports = () => {
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalCOGS: 0,
    receivables: 0,
    payables: 0,
    cash: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancials();
  }, []);

  const fetchFinancials = async () => {
    setLoading(true);
    // Fetch all accounts to calculate totals
    const { data: accounts, error } = await supabase
      .from('chart_of_accounts')
      .select('*');

    if (error) {
      console.error("Error fetching financials:", error);
    } else {
      // Logic to categorize balances
      const totals = accounts.reduce((acc, curr) => {
        if (curr.name === 'Sales' || curr.type === 'Revenue') acc.totalRevenue += curr.balance;
        if (curr.name === 'Cost of Goods Sold' || curr.type === 'Expense') acc.totalCOGS += curr.balance;
        if (curr.name === 'Accounts Receivable') acc.receivables += curr.balance;
        if (curr.name === 'Accounts Payable') acc.payables += curr.balance;
        if (curr.name === 'Cash') acc.cash += curr.balance;
        return acc;
      }, { totalRevenue: 0, totalCOGS: 0, receivables: 0, payables: 0, cash: 0 });

      setReportData(totals);
    }
    setLoading(false);
  };

  const netProfit = reportData.totalRevenue - reportData.totalCOGS;

  const kpis = [
    { 
      label: 'Net Profit', 
      value: netProfit, 
      icon: <TrendingUp className="text-green-600" />, 
      bg: 'bg-green-50',
      desc: 'Total earnings after costs'
    },
    { 
      label: 'Receivables', 
      value: reportData.receivables, 
      icon: <ArrowUpRight className="text-blue-600" />, 
      bg: 'bg-blue-50',
      desc: 'Money customers owe you'
    },
    { 
      label: 'Payables', 
      value: reportData.payables, 
      icon: <ArrowDownLeft className="text-red-600" />, 
      bg: 'bg-red-50',
      desc: 'Money you owe suppliers'
    }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-10">
        <h2 className="text-3xl font-black text-gray-800">Financial Performance</h2>
        <p className="text-gray-500">How your business is performing across all truckloads.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {kpis.map((kpi, idx) => (
          <div key={idx} className={`${kpi.bg} p-6 rounded-3xl border border-white shadow-sm`}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm">{kpi.icon}</div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Update</span>
            </div>
            <h3 className="text-gray-600 font-semibold text-sm">{kpi.label}</h3>
            <p className="text-2xl font-black text-gray-900">${kpi.value.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{kpi.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Simplified Income Statement */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-600" /> Income Statement (P&L)
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Total Revenue</span>
              <span className="font-bold text-green-600">+ ${reportData.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Cost of Goods Sold</span>
              <span className="font-bold text-red-600">- ${reportData.totalCOGS.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-4 pt-6">
              <span className="font-black text-gray-800 text-xl">Gross Profit</span>
              <span className="font-black text-blue-600 text-xl">${netProfit.toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* Liquidity Check */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <PieChart size={20} className="text-orange-600" /> Current Liquidity
          </h3>
          <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-2xl">
            <div className="bg-white p-4 rounded-full shadow-inner">
               <Wallet size={32} className="text-orange-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Total Cash Position</p>
              <h4 className="text-3xl font-black text-gray-800">${reportData.cash.toLocaleString()}</h4>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-6 leading-relaxed">
            *This reflects the total balance in your Cash account. It does not include outstanding Receivables.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Reports;