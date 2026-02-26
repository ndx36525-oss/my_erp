import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BookOpen, Plus, Save, Trash2 } from 'lucide-react';

const Journal = () => {
  const [accounts, setAccounts] = useState([]);
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState([{ account_id: '', debit: 0, credit: 0 }]);

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data } = await supabase.from('chart_of_accounts').select('*');
      setAccounts(data || []);
    };
    fetchAccounts();
  }, []);

  const addLine = () => setLines([...lines, { account_id: '', debit: 0, credit: 0 }]);
  
  const handleSave = async () => {
    // 1. Create Header
    const { data: header } = await supabase.from('journal_entries').insert([{ description }]).select().single();
    
    // 2. Create Lines
    const finalLines = lines.map(l => ({ ...l, entry_id: header.id }));
    const { error } = await supabase.from('journal_lines').insert(finalLines);

    if (!error) {
      alert("Journal Entry Posted!");
      setDescription('');
      setLines([{ account_id: '', debit: 0, credit: 0 }]);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
          <BookOpen className="text-blue-600" /> General Journal Entry
        </h2>
        
        <input 
          placeholder="Transaction Description (e.g., Warehouse Rent)" 
          className="w-full p-4 bg-gray-50 border rounded-2xl mb-6 outline-none"
          value={description} onChange={e => setDescription(e.target.value)}
        />

        <div className="space-y-4 mb-6">
          {lines.map((line, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select 
                className="p-3 bg-white border rounded-xl outline-none text-sm"
                value={line.account_id}
                onChange={e => {
                  const newLines = [...lines];
                  newLines[index].account_id = e.target.value;
                  setLines(newLines);
                }}
              >
                <option value="">Select Account...</option>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
              <input type="number" placeholder="Debit (+)" className="p-3 border rounded-xl" onChange={e => {
                const newLines = [...lines];
                newLines[index].debit = parseFloat(e.target.value);
                setLines(newLines);
              }} />
              <input type="number" placeholder="Credit (-)" className="p-3 border rounded-xl" onChange={e => {
                const newLines = [...lines];
                newLines[index].credit = parseFloat(e.target.value);
                setLines(newLines);
              }} />
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button onClick={addLine} className="flex-1 py-3 border-2 border-dashed rounded-xl text-gray-400 font-bold hover:bg-gray-50">+ Add Line</button>
          <button onClick={handleSave} className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold">Post Entry</button>
        </div>
      </div>
    </div>
  );
};

export default Journal;