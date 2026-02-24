import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ShoppingBag, Package, Truck, DollarSign, Save, CreditCard, Wallet } from 'lucide-react';

const PurchaseOrder = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [cost, setCost] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // Default to cash

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: suppData } = await supabase.from('suppliers').select('*');
    const { data: itemData } = await supabase.from('items').select('*');
    setSuppliers(suppData || []);
    setItems(itemData || []);
  };

  const handleItemChange = (itemId) => {
    setSelectedItem(itemId);
    const item = items.find(i => i.id === itemId);
    if (item) setCost(item.cost_price);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const totalAmount = quantity * cost;
    const supplierName = suppliers.find(s => s.id === selectedSupplier)?.name;

    // 1. Create a Journal Entry Header
    const { data: header, error: hErr } = await supabase
      .from('journal_entries')
      .insert([{ description: `Purchase (${paymentMethod}) from ${supplierName}` }])
      .select().single();

    if (hErr) return alert(hErr.message);

    // 2. Define the Credit Account based on Payment Method
    // REPLACE THESE WITH YOUR ACTUAL UUIDs from chart_of_accounts
    const CASH_ACC = 'ccc129ab-c1f4-457b-ad67-9a3df3556b85'; 
    const AP_ACC = '987f41e7-f2b9-44ee-855e-07ad08522197'; 
    const INV_ACC = 'c57bebc2-0135-4442-81f9-34c034ada268';

    const creditAccount = paymentMethod === 'cash' ? CASH_ACC : AP_ACC;

    // 3. Double Entry: Debit Inventory, Credit (Cash or A/P)
    const { error: lErr } = await supabase.from('journal_lines').insert([
      { entry_id: header.id, account_id: INV_ACC, debit: totalAmount, credit: 0 },
      { entry_id: header.id, account_id: creditAccount, debit: 0, credit: totalAmount }
    ]);

    // 4. Update Stock
    const currentItem = items.find(i => i.id === selectedItem);
    const { error: stockErr } = await supabase
      .from('items')
      .update({ opening_stock: currentItem.opening_stock + parseInt(quantity) })
      .eq('id', selectedItem);

    if (!lErr && !stockErr) {
      alert(`Success! Stock updated and recorded as ${paymentMethod}.`);
      setQuantity(0);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
            <ShoppingBag size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Receive Stock</h2>
            <p className="text-sm text-gray-500">Inventory intake from suppliers.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Supplier & Item Selection (Same as before) */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Supplier</label>
              <select required className="w-full p-3 bg-gray-50 border rounded-xl outline-none" onChange={(e) => setSelectedSupplier(e.target.value)}>
                <option value="">Select Supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
            <input type="number" placeholder="Cost" className="p-3 bg-gray-50 border rounded-xl outline-none" value={cost} onChange={(e) => setCost(e.target.value)} />
          </div>

          {/* PAYMENT METHOD SELECTOR */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'cash' ? 'border-blue-600 bg-blue-50 text-blue-600 font-bold' : 'border-gray-100 text-gray-400'}`}
              >
                <Wallet size={18} /> Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('credit')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'credit' ? 'border-blue-600 bg-blue-50 text-blue-600 font-bold' : 'border-gray-100 text-gray-400'}`}
              >
                <CreditCard size={18} /> On Credit
              </button>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
            <span className="text-gray-500 font-bold uppercase text-xs">Total:</span>
            <span className="text-xl font-black text-gray-800">${(quantity * cost).toLocaleString()}</span>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all">
            {loading ? "Processing..." : "Confirm Purchase"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PurchaseOrder;