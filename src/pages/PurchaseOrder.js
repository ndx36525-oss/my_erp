import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Truck, Package, Building2, DollarSign, Save, CreditCard, history } from 'lucide-react';

const PurchaseOrder = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash or credit (A/P)

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: suppData } = await supabase.from('suppliers').select('*').order('name');
    const { data: itemData } = await supabase.from('items').select('*').order('name');
    setSuppliers(suppData || []);
    setItems(itemData || []);
  };

  const handleItemChange = (itemId) => {
    setSelectedItem(itemId);
    const item = items.find(i => i.id === itemId);
    // When purchasing, we default to the purchase_price set in the item master
    if (item) setPrice(item.purchase_price || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (quantity <= 0) return alert("Please enter a valid quantity.");
    
    setLoading(true);

    const item = items.find(i => i.id === selectedItem);
    const totalCost = quantity * price;
    const supplierName = suppliers.find(s => s.id === selectedSupplier)?.name;

    try {
        // 1. Create Journal Entry Header
        const { data: header, error: hErr } = await supabase
          .from('journal_entries')
          .insert([{ description: `Purchase: ${supplierName} - ${item.name}` }])
          .select().single();

        if (hErr) throw hErr;

        // 2. Account IDs (Using your business logic)
        const CASH_ACC = 'ccc129ab-c1f4-457b-ad67-9a3df3556b85'; 
        const AP_ACC = '987f41e7-f2b9-44ee-855e-07ad08522197'; // Update this with your A/P UUID
        const INV_ACC = 'c57bebc2-0135-4442-81f9-34c034ada268';

        const creditAccount = paymentMethod === 'cash' ? CASH_ACC : AP_ACC;

        // 3. Double-Entry Accounting (Increase Asset, Decrease Cash/Increase Liability)
        const { error: lErr } = await supabase.from('journal_lines').insert([
          { entry_id: header.id, account_id: INV_ACC, debit: totalCost, credit: 0 },
          { entry_id: header.id, account_id: creditAccount, debit: 0, credit: totalCost }
        ]);
        if (lErr) throw lErr;

        // 4. Physical Stock Update (Increase stock)
        const { error: stockErr } = await supabase
          .from('items')
          .update({ quantity: item.quantity + parseInt(quantity) })
          .eq('id', selectedItem);
        if (stockErr) throw stockErr;

        // 5. Log to Transactions Table (For the Item Deep Dive history)
        const { error: transErr } = await supabase
          .from('transactions')
          .insert([{
              item_id: selectedItem,
              type: 'purchase',
              quantity: parseInt(quantity),
              entity_name: supplierName
          }]);
        if (transErr) throw transErr;

        alert("Purchase recorded and stock increased!");
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
          <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
            <Truck size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Purchase Stock</h2>
            <p className="text-sm text-gray-500 font-medium">Restock inventory and record expenses.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Supplier / Vendor</label>
              <select required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}>
                <option value="">Select Supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Item to Buy</label>
              <select required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={selectedItem} onChange={(e) => handleItemChange(e.target.value)}>
                <option value="">Select Item...</option>
                {items.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name} (Current: {i.quantity} {i.uom})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Qty to Add</label>
              <input type="number" placeholder="0" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Purchase Price ($)</label>
              <input type="number" step="0.01" placeholder="0.00" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setPaymentMethod('cash')} className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'cash' ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-gray-50 text-gray-400 hover:bg-gray-50'}`}>
                <CreditCard size={18} /> Cash
              </button>
              <button type="button" onClick={() => setPaymentMethod('credit')} className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'credit' ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-gray-50 text-gray-400 hover:bg-gray-50'}`}>
                <history size={18} /> Credit (A/P)
              </button>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-2xl flex justify-between items-center border border-blue-100">
            <span className="text-blue-700 font-bold uppercase text-[10px] tracking-widest">Total Cost:</span>
            <span className="text-2xl font-black text-blue-800">${(quantity * price).toLocaleString()}</span>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98] disabled:bg-gray-300">
            {loading ? "PROCESSING..." : "RECEIVE STOCK"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PurchaseOrder;