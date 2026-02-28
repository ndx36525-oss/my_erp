import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Package, Edit2, Trash2, Save, X, Search, Plus, AlertCircle, CheckCircle } from 'lucide-react';

const Items = () => {
  const [items, setItems] = useState([]);
  //const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editId, setEditId] = useState(null);
  
  // Form State for both Add and Edit
  const [formData, setFormData] = useState({
    name: '', sku: '', description: '', quantity: 0, uom: 'pcs', price: 0, shipment_threshold: 0
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('items').select('*').order('name', { ascending: true });
    if (!error) setItems(data);
    setLoading(false);
  };

  // --- CRUD Actions ---

  const handleAddItem = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('items').insert([formData]);
    if (error) alert(error.message);
    else {
      alert("Item Added!");
      resetForm();
      fetchItems();
    }
  };

  const handleUpdate = async (user_id) => {
    const { error } = await supabase.from('items').update(formData).eq('user_id', user_id);
    if (error) alert(error.message);
    else {
      setEditId(null);
      fetchItems();
    }
  };

  const handleDelete = async (user_id) => {
    if (window.confirm("Delete this item?")) {
      const { error } = await supabase.from('items').delete().eq('user_id', user_id);
      if (error) alert(error.message);
      else fetchItems();
    }
  };

  const startEdit = (item) => {
    setEditId(item.user_id);
    setFormData({ ...item });
  };

  const resetForm = () => {
    setFormData({ name: '', sku: '', description: '', quantity: 0, uom: 'pcs', price: 0, shipment_threshold: 0 });
  };

  // --- Filtered List ---
  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 max-w-6xl mx-auto bg-gray-50 min-h-screen font-sans">
      
      {/* 1. Header & Add Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600">
          <Plus size={20} /> Add New Inventory Item
        </h2>
        <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="border p-2 rounded text-sm" placeholder="Item Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          <input className="border p-2 rounded text-sm" placeholder="SKU" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} required />
          <input className="border p-2 rounded text-sm" type="number" placeholder="Initial Qty" onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} />
          <input className="border p-2 rounded text-sm" type="number" step="0.01" placeholder="Price" onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
          <input className="border p-2 rounded text-sm" placeholder="UOM (pcs, kg)" value={formData.uom} onChange={e => setFormData({...formData, uom: e.target.value})} />
          <input className="border p-2 rounded text-sm" type="number" placeholder="Alert Threshold" onChange={e => setFormData({...formData, shipment_threshold: parseInt(e.target.value)})} />
          <textarea className="border p-2 rounded text-sm md:col-span-2" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="1" />
          <button type="submit" className="bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition md:col-span-4 py-2">Save to Database</button>
        </form>
      </div>

      {/* 2. Search & Table */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input 
          className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400" 
          placeholder="Search by name or SKU..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase font-bold">
            <tr>
              <th className="p-4">Item / SKU</th>
              <th className="p-4">Stock Level</th>
              <th className="p-4">Price/UOM</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredItems.map(item => (
              <tr key={item.user_id} className="hover:bg-blue-50/20">
                <td className="p-4">
                  {editId === item.user_id ? (
                    <input className="border p-1 w-full text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  ) : (
                    <>
                      <p className="font-bold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.sku}</p>
                    </>
                  )}
                </td>
                <td className="p-4">
                  {editId === item.user_id ? (
                    <div className="flex gap-1">
                      <input type="number" className="border p-1 w-16 text-sm" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} />
                      <span className="text-gray-400 text-xs self-center">/</span>
                      <input type="number" className="border p-1 w-16 text-sm" value={formData.shipment_threshold} onChange={e => setFormData({...formData, shipment_threshold: parseInt(e.target.value)})} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        item.quantity >= item.shipment_threshold ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-pulse'
                      }`}>
                        {item.quantity >= item.shipment_threshold ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                        {item.quantity >= item.shipment_threshold ? 'HEALTHY' : 'LOW STOCK'}
                      </span>
                      <span className="text-sm font-semibold">{item.quantity}</span>
                    </div>
                  )}
                </td>
                <td className="p-4 text-sm text-gray-600">
                   {editId === item.user_id ? (
                     <input type="number" className="border p-1 w-20" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                   ) : (
                     `$${item.price} / ${item.uom}`
                   )}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    {editId === item.user_id ? (
                      <>
                        <button onClick={() => handleUpdate(item.user_id)} className="text-green-600 p-1"><Save size={18}/></button>
                        <button onClick={() => setEditId(null)} className="text-gray-400 p-1"><X size={18}/></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(item)} className="text-blue-500 p-1"><Edit2 size={16}/></button>
                        <button onClick={() => handleDelete(item.user_id)} className="text-red-400 p-1"><Trash2 size={16}/></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Items;