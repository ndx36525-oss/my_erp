import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ShoppingCart, Package, User, DollarSign, Save, Wallet, Clock } from 'lucide-react';

const SalesOrder = () => {
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // Default to cash

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: custData } = await supabase.from('customers').select('*');
    const { data: itemData } = await supabase.from('items').select('*');
    setCustomers(custData || []);
    setItems(itemData || []);
  };

  const handleItemChange = (itemId) => {
    setSelectedItem(itemId);
    const item = items.find(i => i.id === itemId);
    if (item) setPrice(item.selling_price);
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  const item = items.find(i => i.id === selectedItem);
  const totalRevenue = quantity * price;
  const totalCost = quantity * item.cost_price; // This is the COGS amount
  const customerName = customers.find(c => c.id === selectedCustomer)?.name;

  // 1. Create Journal Entry Header
  const { data: header, error: hErr } = await supabase
    .from('journal_entries')
    .insert([{ description: `Sale & COGS: ${customerName}` }])
    .select().single();

  if (hErr) return alert(hErr.message);

  // 2. Define Account IDs (Use your actual UUIDs from Supabase)
  const CASH_ACC = 'ccc129ab-c1f4-457b-ad67-9a3df3556b85';
  const AR_ACC = 'ff50fd39-6a37-476f-970d-b32900ec1cc4';
  const SALES_ACC = '07945ae9-2da2-4768-94a2-0e9680a1e1ca';
  const INV_ACC = 'c57bebc2-0135-4442-81f9-34c034ada268';
  const COGS_ACC = 'bd3a726c-caa6-43c8-8488-344595b854ce'; // The new account you just created

  const debitAccount = paymentMethod === 'cash' ? CASH_ACC : AR_ACC;

  // 3. The Quad-Entry (The Pro Way)
  const { error: lErr } = await supabase.from('journal_lines').insert([
    // The Revenue Part
    { entry_id: header.id, account_id: debitAccount, debit: totalRevenue, credit: 0 },
    { entry_id: header.id, account_id: SALES_ACC, debit: 0, credit: totalRevenue },
    
    // The Cost Part (COGS)
    { entry_id: header.id, account_id: COGS_ACC, debit: totalCost, credit: 0 },
    { entry_id: header.id, account_id: INV_ACC, debit: 0, credit: totalCost }
  ]);

  // 4. Physical Stock Update
  const { error: stockErr } = await supabase
    .from('items')
    .update({ opening_stock: item.opening_stock - parseInt(quantity) })
    .eq('id', selectedItem);

  if (!lErr && !stockErr) {
    alert("Sale and Cost recorded successfully!");
    setQuantity(0);
  }
  setLoading(false);
};

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
            <ShoppingCart size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Dispatch Truckload</h2>
            <p className="text-sm text-gray-500">Record outgoing sales and revenue.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Customer</label>
              <select required className="w-full p-3 bg-gray-50 border rounded-xl outline-none" onChange={(e) => setSelectedCustomer(e.target.value)}>
                <option value="">Select Customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Product</label>
              <select required className="w-full p-3 bg-gray-50 border rounded-xl outline-none" onChange={(e) => handleItemChange(e.target.value)}>
                <option value="">Select Item...</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.opening_stock})</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Qty" className="p-3 bg-gray-50 border rounded-xl outline-none" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <input type="number" placeholder="Price" className="p-3 bg-gray-50 border rounded-xl outline-none" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>

          {/* PAYMENT METHOD TOGGLE */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">Customer Payment Status</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'cash' ? 'border-blue-600 bg-blue-50 text-blue-600 font-bold' : 'border-gray-100 text-gray-400'}`}
              >
                <Wallet size={18} /> Cash Paid
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('credit')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'credit' ? 'border-blue-600 bg-blue-50 text-blue-600 font-bold' : 'border-gray-100 text-gray-400'}`}
              >
                <Clock size={18} /> On Account
              </button>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-2xl flex justify-between items-center">
            <span className="text-blue-700 font-bold uppercase text-xs">Total Revenue:</span>
            <span className="text-xl font-black text-blue-800">${(quantity * price).toLocaleString()}</span>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all">
            {loading ? "Processing..." : "Confirm & Dispatch"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SalesOrder;