import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { History, Search, ArrowRight, Calendar, Tag } from 'lucide-react';

const Transactions = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    // We fetch the header and the individual lines together
    const { data, error } = await supabase
      .from('journal_entries')
      .select(`
        id,
        created_at,
        description,
        journal_lines (
          id,
          debit,
          credit,
          chart_of_accounts ( name )
        )
      `)
      .order('created_at', { ascending: false });

    if (!error) setEntries(data);
    setLoading(false);
  };

  const filteredEntries = entries.filter(entry =>
    entry.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>
          <p className="text-sm text-gray-500">A live audit log of all business activity.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* --- TRANSACTION LIST --- */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center py-20 text-gray-400 italic">Reading the ledger...</p>
        ) : filteredEntries.map((entry) => (
          <div key={entry.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-hover hover:border-blue-200">
            {/* Header of the Transaction */}
            <div className="p-4 bg-gray-50 flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <History size={18} className="text-blue-600" />
                </div>
                <span className="font-bold text-gray-800">{entry.description}</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-400">
                <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(entry.created_at).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Tag size={12}/> ID: {entry.id.split('-')[0]}</span>
              </div>
            </div>

            {/* Individual Lines (The Double Entry) */}
            <div className="p-4 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-[10px] uppercase tracking-widest">
                    <th className="pb-2">Account</th>
                    <th className="pb-2 text-right">Debit (+)</th>
                    <th className="pb-2 text-right">Credit (-)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entry.journal_lines.map((line) => (
                    <tr key={line.id}>
                      <td className="py-2 text-gray-600 font-medium">
                        {line.chart_of_accounts?.name}
                      </td>
                      <td className="py-2 text-right text-green-600 font-mono">
                        {line.debit > 0 ? `$${line.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2 text-right text-red-600 font-mono">
                        {line.credit > 0 ? `$${line.credit.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Transactions;