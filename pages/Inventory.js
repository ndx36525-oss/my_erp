import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Edit3, Trash2, Truck, Plus } from 'lucide-react';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('name', { ascending: true });
    
    if (!error) setItems(data);
    setLoading(false);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
          <p className="text-sm text-gray-500">Set shipment thresholds to optimize truck loads.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search SKU or Name..." 
            className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* --- INVENTORY TABLE --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 text-xs font-bold uppercase text-gray-400">Product Info</th>
              <th className="p-4 text-xs font-bold uppercase text-gray-400">Current Stock</th>
              <th className="p-4 text-xs font-bold uppercase text-gray-400">Shipment Threshold</th>
              <th className="p-4 text-xs font-bold uppercase text-gray-400">Load Status</th>
              <th className="p-4 text-xs font-bold uppercase text-gray-400 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="5" className="p-10 text-center text-gray-400">Loading inventory...</td></tr>
            ) : filteredItems.map((item) => {
              const loadPercentage = Math.min((item.opening_stock / item.shipment_threshold) * 100, 100);
              return (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-gray-800">{item.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{item.sku}</div>
                  </td>
                  <td className="p-4 font-semibold text-gray-700">
                    {item.opening_stock.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Truck size={14} className="text-blue-500" />
                      <span className="font-medium text-gray-600">{item.shipment_threshold}</span>
                    </div>
                  </td>
                  <td className="p-4 w-48">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${loadPercentage >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                          style={{ width: `${loadPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500">{loadPercentage.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                        <Edit3 size={18} />
                      </button>
                      <button className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Placeholder for Add Item functionality */}
      <div className="mt-6 flex justify-end">
         <p className="text-xs text-gray-400 italic">Use the + button on the Dashboard to add new items.</p>
      </div>
    </div>
  );
};

export default Inventory;