import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ShoppingCart, Plus, Trash2, Edit2, Wallet, Clock, Save, Package } from 'lucide-react';

const SalesOrder = () => {
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Header State
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Input Row State
  const [selectedItemId, setSelectedItemId] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);

  // Cart/Lines State
  const [lines, setLines] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: custData } = await supabase.from('customers').select('*').order('name');
    const { data: itemData } = await supabase.from('items').select('*').order('name');
    setCustomers(custData || []);
    setItems(itemData || []);
  };

  const handleItemSelect = (itemId) => {
    setSelectedItemId(itemId);
    const item = items.find(i => i.id === itemId);
    if (item) {
      setPrice(item.selling_price || 0);
      setDescription(item.description || '');
    }
  };

  const addLineItem = () => {
    const item = items.find(i => i.id === selectedItemId);
    if (!item || quantity <= 0) return alert("Select an item and enter quantity");
    
    // Check local stock before adding to cart
    if (quantity > item.quantity) return alert(`Only ${item.quantity} units available in stock.`);

    const newLine = {
      item_id: selectedItemId,
      name: item.name,
      description: description,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      amount: parseFloat(quantity) * parseFloat(price),
      cost_price: item.purchase_price // Needed for COGS calculation
    };

    if (editingIndex !== null) {
      const updatedLines = [...lines];
      updatedLines[editingIndex] = newLine;
      setLines(updatedLines);
      setEditingIndex(null);
    } else {
      setLines([...lines, newLine]);
    }

    // Reset inputs
    setSelectedItemId('');
    setDescription('');
    setQuantity(0);
    setPrice(0);
  };

  const deleteLine = (index) => setLines(lines.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lines.length === 0) return alert("Your cart is empty");
    if (!selectedCustomer) return alert("Please select a customer");

    setLoading(true);
    const customerName = customers.find(c => c.id === selectedCustomer)?.name;
    const totalRevenue = lines.reduce((sum, l) => sum + l.amount, 0);
    const totalCOGS = lines.reduce((sum, l) => sum + (l.quantity * l.cost_price), 0);

    try {
      // 1. Create Journal Header
      const { data: header, error: hErr } = await supabase
        .from('journal_entries')
        .insert([{ description: `Sales Invoice: ${customerName}` }])
        .select().single();
      if (hErr) throw hErr;

      // 2. Account IDs
      const CASH_ACC = 'ccc129ab-c1f4-457b-ad67-9a3df3556b85';
      const AR_ACC = 'ff50fd39-6a37-476f-970d-b32900ec1cc4';
      const SALES_ACC = '07945ae9-2da2-4768-94a2-0e9680a1e1ca';
      const INV_ACC = 'c57bebc2-0135-4442-81f9-34c034ada268';
      const COGS_ACC = 'bd3a726c-caa6-43c8-8488-344595b854ce';

      const debitAccount = paymentMethod === 'cash' ? CASH_ACC : AR_ACC;

      // 3. Update Inventory & Log Transactions for each line
      for (const line of lines) {
        const itemInDB = items.find(i => i.id === line.item_id);
        
        // Deduct Stock
        await supabase.from('items')
          .update({ quantity: itemInDB.quantity - line.quantity })
          .eq('id', line.item_id);

        // Log Transaction for History
        await supabase.from('transactions').insert([{
          item_id: line.item_id,
          type: 'sale',
          quantity: line.quantity,
          entity_name: customerName
        }]);
      }

      // 4. Financial "Quad-Entry" Accounting
      await supabase.from('journal_lines').insert([
        { entry_id: header.id, account_id: debitAccount, debit: totalRevenue, credit: 0 }, // Cash/AR up
        { entry_id: header.id, account_id: SALES_ACC, debit: 0, credit: totalRevenue },  // Sales up
        { entry_id: header.id, account_id: COGS_ACC, debit: totalCOGS, credit: 0 },      // Expense up
        { entry_id: header.id, account_id: INV_ACC, debit: 0, credit: totalCOGS }        // Asset down
      ]);

      alert("Dispatch successful! Stock and ledger updated.");
      setLines([]);
      setSelectedCustomer('');
      fetchData();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-green-600 p-3 rounded-2xl text-white shadow-lg shadow-green-100">
            <ShoppingCart size={24} />
          </div>
          <h2 className="text-2xl font-black text-gray-800">Dispatch Truckload</h2>
        </div>

        {/* --- CUSTOMER & PAYMENT --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-dashed">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Customer</label>
            <select className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-green-500" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)}>
              <option value="">Select Customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Payment Status</label>
            <div className="flex gap-2">
              <button onClick={() => setPaymentMethod('cash')} className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all ${paymentMethod === 'cash' ? 'bg-green-50 border-green-600 text-green-700' : 'bg-white'}`}><Wallet size={16}/> Cash</button>
              <button onClick={() => setPaymentMethod('credit')} className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all ${paymentMethod === 'credit' ? 'bg-green-50 border-green-600 text-green-700' : 'bg-white'}`}><Clock size={16}/> On Account</button>
            </div>
          </div>
        </div>

        {/* --- ITEM INPUT --- */}
        <div className="bg-green-50/50 p-6 rounded-2xl mb-8 border border-green-100">
          <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-4">Add Product to Invoice</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <select className="w-full p-3 border rounded-xl" value={selectedItemId} onChange={(e) => handleItemSelect(e.target.value)}>
                <option value="">Choose Product...</option>
                {items.map(i => <option key={i.id} value={i.id} disabled={i.quantity <= 0}>{i.name} ({i.quantity} in stock)</option>)}
              </select>
            </div>
            <input type="number" placeholder="Qty" className="p-3 border rounded-xl" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <input type="number" placeholder="Unit Price" className="p-3 border rounded-xl" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <textarea placeholder="Sale description..." className="w-full p-3 border rounded-xl mb-4 text-sm" rows="1" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button onClick={addLineItem} className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition-all shadow-md">
             <Plus size={18}/> Add to Cart
          </button>
        </div>

        {/* --- INVOICE TABLE --- */}
        <div className="overflow-hidden border border-gray-100 rounded-2xl mb-8">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Qty</th>
                <th className="p-4">Price</th>
                <th className="p-4">Total</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.map((line, index) => (
                <tr key={index} className="text-sm">
                  <td className="p-4 font-bold text-gray-700">{line.name}</td>
                  <td className="p-4 font-mono">{line.quantity}</td>
                  <td className="p-4 text-gray-500">${line.price}</td>
                  <td className="p-4 font-black">${line.amount.toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => deleteLine(index)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr><td colSpan="5" className="p-10 text-center text-gray-400 italic">Invoice is empty. Add products above.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FINAL TOTALS --- */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900 p-8 rounded-3xl text-white shadow-2xl">
          <div className="mb-4 md:mb-0">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Invoice Amount</p>
            <p className="text-5xl font-black">${lines.reduce((sum, l) => sum + l.amount, 0).toLocaleString()}</p>
          </div>
          <button 
            onClick={handleSubmit} 
            disabled={loading || lines.length === 0}
            className="w-full md:w-auto bg-green-500 hover:bg-green-400 text-gray-900 font-black px-12 py-5 rounded-2xl transition-all active:scale-95 disabled:bg-gray-700 disabled:text-gray-500"
          >
            {loading ? "PROCESSING..." : "CONFIRM & DISPATCH"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesOrder;