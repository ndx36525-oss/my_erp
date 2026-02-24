import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Database, Save, Info } from 'lucide-react';

const Settings = () => {
  // We load the saved IDs from the browser's memory, or use empty strings
  const [ids, setIds] = useState({
    cash: localStorage.getItem('CASH_ACC') || '',
    inventory: localStorage.getItem('INV_ACC') || '',
    sales: localStorage.getItem('SALES_ACC') || '',
    cogs: localStorage.getItem('COGS_ACC') || '',
    receivable: localStorage.getItem('AR_ACC') || '',
    payable: localStorage.getItem('AP_ACC') || ''
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    // Save each ID to localStorage
    localStorage.setItem('CASH_ACC', ids.cash);
    localStorage.setItem('INV_ACC', ids.inventory);
    localStorage.setItem('SALES_ACC', ids.sales);
    localStorage.setItem('COGS_ACC', ids.cogs);
    localStorage.setItem('AR_ACC', ids.receivable);
    localStorage.setItem('AP_ACC', ids.payable);
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000); // Hide success message after 3s
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gray-800 p-2 rounded-lg text-white">
            <SettingsIcon size={20} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">System Configuration</h2>
        </div>
        <p className="text-sm text-gray-500">Map your Supabase Chart of Accounts UUIDs here.</p>
      </header>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-8 flex gap-3 items-start">
        <Info className="text-blue-500 shrink-0" size={20} />
        <p className="text-xs text-blue-700 leading-relaxed">
          Go to your **Supabase Table Editor chart_of_accounts**, copy the **id** for each account, and paste them below. This ensures your Sales and Purchases update the correct balances.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {[
          { label: 'ccc129ab-c1f4-457b-ad67-9a3df3556b85', key: 'cash' },
          { label: 'c57bebc2-0135-4442-81f9-34c034ada268', key: 'inventory' },
          { label: '07945ae9-2da2-4768-94a2-0e9680a1e1ca', key: 'sales' },
          { label: 'bd3a726c-caa6-43c8-8488-344595b854ce', key: 'cogs' },
          { label: 'ff50fd39-6a37-476f-970d-b32900ec1cc4', key: 'receivable' },
          { label: '987f41e7-f2b9-44ee-855e-07ad08522197', key: 'payable' },
        ].map((field) => (
          <div key={field.key} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
              {field.label}
            </label>
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
              <Database size={14} className="text-gray-400" />
              <input
                type="text"
                className="bg-transparent w-full text-sm outline-none font-mono text-blue-600"
                placeholder="00000000-0000-0000-0000-000000000000"
                value={ids[field.key]}
                onChange={(e) => setIds({ ...ids, [field.key]: e.target.value })}
              />
            </div>
          </div>
        ))}

        <button
          type="submit"
          className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all"
        >
          <Save size={20} />
          {saved ? "Settings Updated!" : "Save Configuration"}
        </button>
      </form>
    </div>
  );
};

export default Settings;