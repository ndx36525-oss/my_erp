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
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: custData } = await supabase.from('customers').select('*').order('name');
    const { data: itemData } = await supabase.from('items').select('*').order('name');
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
    if (quantity <= 0) return alert("Please enter a valid quantity.");
    
    setLoading(true);

    const item = items.find(i => i.id === selectedItem);
    if (quantity > item.quantity) {
        setLoading(false);
        return alert("Insufficient stock!");
    }

    const totalRevenue = quantity * price;
    const totalCost = quantity * (item.purchase_price || 0); // Corrected column name
    const customerObj = customers.find(c => c.id === selectedCustomer);
    const customerName = customerObj?.name;

    try {
        // 1. Create Journal Entry Header
        const { data: header, error: hErr } = await supabase
          .from('journal_entries')
          .insert([{ description: `Sale & COGS: ${customerName} - ${item.name}` }])
          .select().single();

        if (hErr) throw hErr;

        // 2. Account IDs (Using your provided UUIDs)
        const CASH_ACC = 'ccc129ab-c1f4-457b-ad67-9a3df3556b85';
        const AR_ACC = 'ff50fd39-6a37-476f-970d-b32900ec1cc4';
        const SALES_ACC = '07945ae9-2da2-4768-94a2-0e9680a1e1ca';
        const INV_ACC = 'c57bebc2-0135-4442-81f9-34c034ada268';
        const COGS_ACC = 'bd3a726c-caa6-43c8-8488-344595b854ce';

        const debitAccount = paymentMethod === 'cash' ? CASH_ACC : AR_ACC;

        // 3. Quad-Entry Accounting
        const { error: lErr } = await supabase.from('journal_lines').insert([
          { entry_id: header.id, account_id: debitAccount, debit: totalRevenue, credit: 0 },
          { entry_id: header.id, account_id: SALES_ACC, debit: 0, credit: totalRevenue },
          { entry_id: header.id, account_id: COGS_ACC, debit: totalCost, credit: 0 },
          { entry_id: header.id, account_id: INV_ACC, debit: 0, credit: totalCost }
        ]);
        if (lErr) throw lErr;

        // 4. Physical Stock Update (Updated column name to 'quantity')
        const { error: stockErr } = await supabase
          .from('items')
          .update({ quantity: item.quantity - parseInt(quantity) })
          .eq('id', selectedItem);
        if (stockErr) throw stockErr;

        // 5. NEW: Log to Transactions Table (For the Item Deep Dive history)
        const { error: transErr } = await supabase
          .from('transactions')
          .insert([{
              item_id: selectedItem,
              type: 'sale',
              quantity: parseInt(quantity),
              entity_name: customerName
          }]);
        if (transErr) throw transErr;

        alert("Sale dispatched and stock updated!");
        setQuantity(0);
        fetchData(); // Refresh local stock data
    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto bg-gray-50 min-h-screen">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-green-100 p-3 rounded-2xl text-green-600">
            <ShoppingCart size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Dispatch Sale</h2>
            <p className="text-sm text-gray-500 font-medium">Create invoice and update inventory.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Customer</label>
              <select required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)}>
                <option value="">Select Customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Product to Dispatch</label>
              <select required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all" value={selectedItem} onChange={(e) => handleItemChange(e.target.value)}>
                <option value="">Select Item...</option>
                {items.map(i => (
                  <option key={i.id} value={i.id} disabled={i.quantity <= 0}>
                    {i.name} (Stock: {i.quantity} {i.uom})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Quantity</label>
              <input type="number" placeholder="0" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-green-500" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Unit Price ($)</label>
              <input type="number" step="0.01" placeholder="0.00" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-green-500" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Payment Terms</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setPaymentMethod('cash')} className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'cash' ? 'border-green-600 bg-green-50 text-green-700 font-bold' : 'border-gray-50 text-gray-400 hover:bg-gray-50'}`}>
                <Wallet size={18} /> Instant Cash
              </button>
              <button type="button" onClick={() => setPaymentMethod('credit')} className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'credit' ? 'border-green-600 bg-green-50 text-green-700 font-bold' : 'border-gray-50 text-gray-400 hover:bg-gray-50'}`}>
                <Clock size={18} /> Credit (A/R)
              </button>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-2xl flex justify-between items-center border border-green-100">
            <span className="text-green-700 font-bold uppercase text-[10px] tracking-widest">Grand Total:</span>
            <span className="text-2xl font-black text-green-800">${(quantity * price).toLocaleString()}</span>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-green-100 transition-all active:scale-[0.98] disabled:bg-gray-300">
            {loading ? "SYNCING..." : "CONFIRM & DISPATCH"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SalesOrder;