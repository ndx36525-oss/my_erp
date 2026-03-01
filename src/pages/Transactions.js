import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
  History, Search, Calendar, Tag, 
  ArrowUpRight, ArrowDownLeft, FileText, Package 
} from 'lucide-react';

const Transactions = () => {
  const [itemsTransactions, setItemsTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('inventory'); // 'inventory' or 'ledger'

  useEffect(() => {
    fetchData();
  }, [viewMode]);

  const fetchData = async () => {
    setLoading(true);
    if (viewMode === 'inventory') {
      // Fetch physical stock movements (Sales/Purchases)
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          items ( name, sku )
        `)
        .order('created_at', { ascending: false });
      if (!error) setItemsTransactions(data);
    } else {
      // Fetch Financial Ledger (Your existing logic)
      const { data, error } = await supabase
        .from('journal_entries')
        .select(`
          id, created_at, description,
          journal_lines ( id, debit, credit, chart_of_accounts ( name ) )
        `)
        .order('created_at', { ascending: false });
      if (!error) setItemsTransactions(data);
    }
    setLoading(false);
  };

  const filteredData = itemsTransactions.filter(item => {
    const searchStr = viewMode === 'inventory' ? item.entity_name : item.description;
    return searchStr?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* --- HEADER & TOGGLE --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Activity Log</h2>
          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => setViewMode('inventory')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${viewMode === 'inventory' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}
            >
              Inventory Movements
            </button>
            <button 
              onClick={() => setViewMode('ledger')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${viewMode === 'ledger' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}
            >
              Financial Ledger
            </button>
          </div>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* --- LIST --- */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center py-20 text-gray-400 italic">Syncing records...</p>
        ) : viewMode === 'inventory' ? (
          /* PHYSICAL INVENTORY VIEW */
          filteredData.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between hover:border-blue-200 transition-all shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${t.type === 'purchase' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                  {t.type === 'purchase' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{t.items?.name} <span className="text-xs font-normal text-gray-400">({t.items?.sku})</span></p>
                  <p className="text-sm text-gray-500">
                    {t.type === 'purchase' ? 'Purchased from ' : 'Sold to '}
                    <span className="font-semibold text-gray-700">{t.entity_name}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-black ${t.type === 'purchase' ? 'text-blue-600' : 'text-green-600'}`}>
                  {t.type === 'purchase' ? '+' : '-'}{t.quantity}
                </p>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
                  {new Date(t.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          /* FINANCIAL LEDGER VIEW (Your Original Table Logic) */
          filteredData.map((entry) => (
            <div key={entry.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
               {/* Use your original journal_lines table rendering here */}
               <div className="p-4 bg-gray-50 font-bold text-sm border-b">{entry.description}</div>
               <div className="p-4">
                  <table className="w-full text-xs">
                    {/* ... (Keep your table header/body from the previous code) ... */}
                    <tbody>
                      {entry.journal_lines.map(line => (
                        <tr key={line.id}>
                          <td className="py-1 text-gray-600">{line.chart_of_accounts?.name}</td>
                          <td className="text-right text-green-600">{line.debit > 0 ? `$${line.debit}` : '-'}</td>
                          <td className="text-right text-red-600">{line.credit > 0 ? `$${line.credit}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Transactions;