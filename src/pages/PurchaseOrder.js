import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Truck, Package, Plus, Trash2, Edit2, Save, X, CreditCard, Clock } from 'lucide-react';

const PurchaseOrder = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Header State
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Input Row State (The "Current" item being typed)
  const [selectedItemId, setSelectedItemId] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);

  // The Table State (All items added to this PO)
  const [lines, setLines] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: suppData } = await supabase.from('suppliers').select('*').order('name');
    const { data: itemData } = await supabase.from('items').select('*').order('name');
    setSuppliers(suppData || []);
    setItems(itemData || []);
  };

  const handleItemSelect = (itemId) => {
    setSelectedItemId(itemId);
    const item = items.find(i => i.id === itemId);
    if (item) {
      setPrice(item.purchase_price || 0);
      setDescription(item.description || '');
    }
  };

  const addLineItem = () => {
    if (!selectedItemId || quantity <= 0) return alert("Select an item and quantity");
    
    const item = items.find(i => i.id === selectedItemId);
    const newLine = {
      item_id: selectedItemId,
      name: item.name,
      description: description,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      amount: parseFloat(quantity) * parseFloat(price)
    };

    if (editingIndex !== null) {
      const updatedLines = [...lines];
      updatedLines[editingIndex] = newLine;
      setLines(updatedLines);
      setEditingIndex(null);
    } else {
      setLines([...lines, newLine]);
    }

    // Clear inputs
    setSelectedItemId('');
    setDescription('');
    setQuantity(0);
    setPrice(0);
  };

  const editLine = (index) => {
    const line = lines[index];
    setSelectedItemId(line.item_id);
    setDescription(line.description);
    setQuantity(line.quantity);
    setPrice(line.price);
    setEditingIndex(index);
  };

  const deleteLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lines.length === 0) return alert("Add at least one item");
    if (!selectedSupplier) return alert("Select a supplier");

    setLoading(true);
    const supplierName = suppliers.find(s => s.id === selectedSupplier)?.name;
    const grandTotal = lines.reduce((sum, line) => sum + line.amount, 0);

    try {
      // 1. Create Journal Entry Header
      const { data: header, error: hErr } = await supabase
        .from('journal_entries')
        .insert([{ description: `Bulk Purchase: ${supplierName}` }])
        .select().single();

      if (hErr) throw hErr;

      // 2. Prepare Accounting IDs
      const CASH_ACC = 'ccc129ab-c1f4-457b-ad67-9a3df3556b85'; 
      const AP_ACC = '987f41e7-f2b9-44ee-855e-07ad08522197'; 
      const INV_ACC = 'c57bebc2-0135-4442-81f9-34c034ada268';
      const creditAccount = paymentMethod === 'cash' ? CASH_ACC : AP_ACC;

      // 3. Process each line for stock and transactions
      for (const line of lines) {
        // A. Update Stock
        const currentItem = items.find(i => i.id === line.item_id);
        await supabase.from('items')
          .update({ quantity: currentItem.quantity + line.quantity })
          .eq('id', line.item_id);

        // B. Log Transaction
        await supabase.from('transactions').insert([{
          item_id: line.item_id,
          type: 'purchase',
          quantity: line.quantity,
          entity_name: supplierName
        }]);
      }

      // 4. Financial Record (Total PO amount)
      await supabase.from('journal_lines').insert([
        { entry_id: header.id, account_id: INV_ACC, debit: grandTotal, credit: 0 },
        { entry_id: header.id, account_id: creditAccount, debit: 0, credit: grandTotal }
      ]);

      alert("Success! All items received and stock updated.");
      setLines([]);
      setSelectedSupplier('');
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
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100">
            <Truck size={24} />
          </div>
          <h2 className="text-2xl font-black text-gray-800">New Purchase Order</h2>
        </div>

        {/* --- HEADER SECTION --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-dashed">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Supplier</label>
            <select required className="w-full p-3 bg-gray-50 border rounded-xl" value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}>
              <option value="">Select Supplier...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Payment Terms</label>
            <div className="flex gap-2">
              <button onClick={() => setPaymentMethod('cash')} className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm ${paymentMethod === 'cash' ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white'}`}><CreditCard size={16}/> Cash</button>
              <button onClick={() => setPaymentMethod('credit')} className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm ${paymentMethod === 'credit' ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white'}`}><Clock size={16}/> Credit</button>
            </div>
          </div>
        </div>

        {/* --- INPUT SECTION --- */}
        <div className="bg-gray-50 p-6 rounded-2xl mb-8">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Add Item to Order</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <select className="w-full p-3 border rounded-xl" value={selectedItemId} onChange={(e) => handleItemSelect(e.target.value)}>
                <option value="">Choose Item...</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.quantity})</option>)}
              </select>
            </div>
            <input type="number" placeholder="Qty" className="p-3 border rounded-xl" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <input type="number" placeholder="Unit Price" className="p-3 border rounded-xl" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <textarea placeholder="Line description..." className="w-full p-3 border rounded-xl mb-4 text-sm" rows="1" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button onClick={addLineItem} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all">
            {editingIndex !== null ? <Save size={18}/> : <Plus size={18}/>}
            {editingIndex !== null ? 'Update Line' : 'Add Line Item'}
          </button>
        </div>

        {/* --- TABLE SECTION --- */}
        <div className="overflow-hidden border border-gray-100 rounded-2xl mb-8">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
              <tr>
                <th className="p-4">Item</th>
                <th className="p-4">Description</th>
                <th className="p-4">Qty</th>
                <th className="p-4">Price</th>
                <th className="p-4">Amount</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lines.map((line, index) => (
                <tr key={index} className="text-sm hover:bg-gray-50">
                  <td className="p-4 font-bold">{line.name}</td>
                  <td className="p-4 text-gray-500">{line.description}</td>
                  <td className="p-4">{line.quantity}</td>
                  <td className="p-4">${line.price}</td>
                  <td className="p-4 font-bold">${line.amount.toLocaleString()}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => editLine(index)} className="text-gray-400 hover:text-blue-600"><Edit2 size={16}/></button>
                    <button onClick={() => deleteLine(index)} className="text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr><td colSpan="6" className="p-10 text-center text-gray-400 italic">No items added to this order yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER --- */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Grand Total</p>
            <p className="text-4xl font-black text-gray-800">${lines.reduce((sum, l) => sum + l.amount, 0).toLocaleString()}</p>
          </div>
          <button 
            onClick={handleSubmit} 
            disabled={loading || lines.length === 0}
            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-black px-12 py-4 rounded-2xl shadow-xl shadow-green-100 disabled:bg-gray-300 transition-all active:scale-95"
          >
            {loading ? "RECEIVING..." : "RECEIVE ALL STOCK"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrder;