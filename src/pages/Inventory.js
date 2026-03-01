import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Package, Plus, Edit2, Trash2, ChevronRight, History,
  ArrowLeft, ShoppingCart, Truck, X, Save 
} from 'lucide-react';

const Items = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    name: '', sku: '', description: '', quantity: 0, uom: 'pcs', 
    purchase_price: 0, selling_price: 0, shipment_threshold: 0
  });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('items').select('*').order('name');
    if (!error) setItems(data);
    setLoading(false);
  };

  const fetchTransactions = async (itemId) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });
    if (!error) setTransactions(data);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('items').insert([formData]);
    if (error) alert(error.message);
    else {
      setShowAddForm(false);
      resetForm();
      fetchItems();
    }
  };

  const handleUpdate = async (id) => {
    const { error } = await supabase.from('items').update(formData).eq('user_id', id);
    if (error) alert(error.message);
    else {
      setEditId(null);
      fetchItems();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this item?")) {
      await supabase.from('items').delete().eq('user_id', id);
      fetchItems();
    }
  };

  const resetForm = () => {
    setFormData({ name: '', sku: '', description: '', quantity: 0, uom: 'pcs', purchase_price: 0, selling_price: 0, shipment_threshold: 0 });
  };

  // --- VIEW 1: TRANSACTION DETAILS ---
  if (selectedItem) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <button onClick={() => setSelectedItem(null)} className="flex items-center gap-2 text-blue-600 mb-6 font-bold hover:underline">
          <ArrowLeft size={20} /> Back to Item List
        </button>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-3xl font-black text-gray-800">{selectedItem.name}</h2>
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
            <span>SKU: <b className="text-gray-700">{selectedItem.sku}</b></span>
            <span>Current Stock: <b className="text-blue-600">{selectedItem.quantity} {selectedItem.uom}</b></span>
          </div>
        </div>

        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <History size={20} className="text-gray-400" /> Transaction History
        </h3>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-400">
              <tr>
                <th className="p-4">Type</th>
                <th className="p-4">Supplier/Customer</th>
                <th className="p-4">Quantity</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length > 0 ? transactions.map(t => (
                <tr key={t.id} className="text-sm">
                  <td className="p-4 flex items-center gap-2">
                    {t.type === 'purchase' ? 
                      <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-md font-bold text-[10px] uppercase"><Truck size={12}/> Purchase</span> : 
                      <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md font-bold text-[10px] uppercase"><ShoppingCart size={12}/> Sale</span>
                    }
                  </td>
                  <td className="p-4 font-semibold text-gray-700">{t.entity_name}</td>
                  <td className="p-4 font-mono font-bold">{t.quantity}</td>
                  <td className="p-4 text-gray-400">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="p-10 text-center text-gray-400 italic">No transactions found for this item.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
          <Package className="text-blue-600" size={32} /> Inventory Master
        </h1>
        <button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all active:scale-95"
        >
          {showAddForm ? <X size={20}/> : <Plus size={20}/>} {showAddForm ? 'Cancel' : 'New Item'}
        </button>
      </div>

      {/* ADD ITEM FORM */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-blue-50 mb-8 animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleSaveItem} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input className="border p-2.5 rounded-lg text-sm" placeholder="Item Name" onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input className="border p-2.5 rounded-lg text-sm" placeholder="SKU" onChange={e => setFormData({...formData, sku: e.target.value})} required />
            <input className="border p-2.5 rounded-lg text-sm" type="number" placeholder="Stock Qty" onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} />
            <input className="border p-2.5 rounded-lg text-sm" placeholder="UOM (pcs, kg)" onChange={e => setFormData({...formData, uom: e.target.value})} />
            <input className="border p-2.5 rounded-lg text-sm" type="number" step="0.01" placeholder="Purchase Price" onChange={e => setFormData({...formData, purchase_price: parseFloat(e.target.value)})} />
            <input className="border p-2.5 rounded-lg text-sm" type="number" step="0.01" placeholder="Selling Price" onChange={e => setFormData({...formData, selling_price: parseFloat(e.target.value)})} />
            <input className="border p-2.5 rounded-lg text-sm" type="number" placeholder="Alert Threshold" onChange={e => setFormData({...formData, shipment_threshold: parseInt(e.target.value)})} />
            <button type="submit" className="bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">Save Item</button>
          </form>
        </div>
      )}

      {/* ITEM TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b tracking-wider">
            <tr>
              <th className="p-5">Product Info</th>
              <th className="p-5">Prices (In/Out)</th>
              <th className="p-5">Stock / UOM</th>
              <th className="p-5">Total Value</th>
              <th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer">
                <td className="p-5" onClick={() => { setSelectedItem(item); fetchTransactions(item.id); }}>
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{item.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono uppercase">{item.sku}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-200 group-hover:text-blue-400 ml-auto" />
                  </div>
                </td>
                <td className="p-5 text-sm">
                  <p className="text-gray-500">P: <span className="text-gray-800 font-semibold">${item.purchase_price}</span></p>
                  <p className="text-gray-500">S: <span className="text-blue-600 font-semibold">${item.selling_price}</span></p>
                </td>
                <td className="p-5">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black ${
                    item.quantity <= item.shipment_threshold ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {item.quantity} {item.uom.toUpperCase()}
                  </span>
                </td>
                <td className="p-5 font-bold text-gray-900">
                  ${(item.quantity * item.purchase_price).toLocaleString()}
                </td>
                <td className="p-5 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
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