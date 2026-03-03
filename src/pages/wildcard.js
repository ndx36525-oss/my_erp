import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Truck, Plus, Trash2, Edit2, Save, X, CreditCard, Clock, UserPlus, PackagePlus } from 'lucide-react';

const PurchaseOrder = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', email: '', phone: '' });
  const [newItem, setNewItem] = useState({ name: '', purchase_price: 0, uom: 'pcs' });

  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const [selectedItemId, setSelectedItemId] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0); // This state handles the auto-fill and manual edits

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

  const quickAddSupplier = async () => {
    if (!newSupplier.name) return;
    const { data, error } = await supabase.from('suppliers').insert([newSupplier]).select().single();
    if (!error) {
      setSuppliers([...suppliers, data]);
      setSelectedSupplier(data.id);
      setShowSupplierModal(false);
      setNewSupplier({ name: '', email: '', phone: '' });
    }
  };

  const quickAddItem = async () => {
    if (!newItem.name) return;
    const { data, error } = await supabase.from('items').insert([newItem]).select().single();
    if (!error) {
      setItems([...items, data]);
      handleItemSelect(data.id);
      setShowItemModal(false);
      setNewItem({ name: '', purchase_price: 0, uom: 'pcs' });
    }
  };

  // Auto-fill logic happens here
  const handleItemSelect = (itemId) => {
    if (itemId === "new") {
      setShowItemModal(true);
      return;
    }
    setSelectedItemId(itemId);
    const item = items.find(i => i.id === itemId);
    if (item) {
      // SETTING THE PRICE FROM DATABASE
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

  const deleteLine = (index) => setLines(lines.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lines.length === 0) return alert("Add at least one item");
    if (!selectedSupplier) return alert("Select a supplier");
    setLoading(true);
    const supplierName = suppliers.find(s => s.id === selectedSupplier)?.name;
    const grandTotal = lines.reduce((sum, line) => sum + line.amount, 0);
    try {
      const { data: header, error: hErr } = await supabase.from('journal_entries').insert([{ description: `Bulk Purchase: ${supplierName}` }]).select().single();
      if (hErr) throw hErr;
      const CASH_ACC = 'ccc129ab-c1f4-457b-ad67-9a3df3556b85'; 
      const AP_ACC = '987f41e7-f2b9-44ee-855e-07ad08522197'; 
      const INV_ACC = 'c57bebc2-0135-4442-81f9-34c034ada268';
      const creditAccount = paymentMethod === 'cash' ? CASH_ACC : AP_ACC;
      for (const line of lines) {
        const currentItem = items.find(i => i.id === line.item_id);
        await supabase.from('items').update({ quantity: (currentItem.quantity || 0) + line.quantity }).eq('id', line.item_id);
        await supabase.from('transactions').insert([{ item_id: line.item_id, type: 'purchase', quantity: line.quantity, entity_name: supplierName }]);
      }
      await supabase.from('journal_lines').insert([
        { entry_id: header.id, account_id: INV_ACC, debit: grandTotal, credit: 0 },
        { entry_id: header.id, account_id: creditAccount, debit: 0, credit: grandTotal }
      ]);
      alert("Success! All items received and stock updated.");
      setLines([]);
      setSelectedSupplier('');
      fetchData();
    } catch (err) { alert("Error: " + err.message); } finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto bg-gray-50 min-h-screen font-sans">
      {/* Modals remain the same ... */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-gray-800 flex items-center gap-2"><UserPlus size={18}/> Quick Add Supplier</h3>
              <button onClick={() => setShowSupplierModal(false)}><X/></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Name" className="w-full p-3 border rounded-xl" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
              <input placeholder="Phone" className="w-full p-3 border rounded-xl" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} />
              <button onClick={quickAddSupplier} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Save Supplier</button>
            </div>
          </div>
        </div>
      )}

      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-gray-800 flex items-center gap-2"><PackagePlus size={18}/> Quick Add New Item</h3>
              <button onClick={() => setShowItemModal(false)}><X/></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Item Name" className="w-full p-3 border rounded-xl" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              <input type="number" placeholder="Def. Purchase Price" className="w-full p-3 border rounded-xl" value={newItem.purchase_price} onChange={e => setNewItem({...newItem, purchase_price: e.target.value})} />
              <button onClick={quickAddItem} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Save & Select Item</button>
            </div>
          </div>
        </div>
      )}

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
            <div className="flex justify-between items-end mb-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block italic">Vendor / Supplier</label>
              <button onClick={() => setShowSupplierModal(true)} className="text-[10px] font-black text-blue-600 uppercase hover:underline">+ New Supplier</button>
            </div>
            <select required className="w-full p-3 bg-gray-50 border rounded-xl" value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}>
              <option value="">Select Supplier...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block italic">Settlement Method</label>
            <div className="flex gap-2">
              <button onClick={() => setPaymentMethod('cash')} className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm ${paymentMethod === 'cash' ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white'}`}><CreditCard size={16}/> Cash</button>
              <button onClick={() => setPaymentMethod('credit')} className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm ${paymentMethod === 'credit' ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white'}`}><Clock size={16}/> Credit</button>
            </div>
          </div>
        </div>

        {/* --- INPUT SECTION --- */}
        <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6">Line Item Entry</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-gray-500 uppercase mb-1 block">Item Name</label>
              <select className="w-full p-3 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={selectedItemId} onChange={(e) => handleItemSelect(e.target.value)}>
                <option value="">Choose Item...</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.quantity})</option>)}
                <option value="new" className="text-blue-600 font-bold">+ Create New Item</option>
              </select>
            </div>
            
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase mb-1 block">Quantity</label>
              <input type="number" placeholder="0.00" className="w-full p-3 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase mb-1 block">Purchase Price</label>
              <input type="number" placeholder="0.00" className="w-full p-3 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>

          <div className="mb-6">
            <label className="text-[10px] font-black text-gray-500 uppercase mb-1 block">Line Description (Optional)</label>
            <textarea placeholder="e.g. Batch #402, Seasonal Discount applied..." className="w-full p-3 border rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows="1" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <button onClick={addLineItem} className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
            {editingIndex !== null ? <Save size={18}/> : <Plus size={18}/>}
            {editingIndex !== null ? 'Update Line' : 'Add to Order'}
          </button>
        </div>

        {/* --- TABLE SECTION --- */}
        <div className="overflow-hidden border border-gray-100 rounded-2xl mb-8 shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-800 text-[10px] font-black uppercase text-gray-300">
              <tr>
                <th className="p-4">Item</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-center">Qty</th>
                <th className="p-4">Price</th>
                <th className="p-4">Amount</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lines.map((line, index) => (
                <tr key={index} className="text-sm hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 font-bold text-gray-700">{line.name}</td>
                  <td className="p-4 text-gray-400 italic">{line.description || '—'}</td>
                  <td className="p-4 text-center font-medium">{line.quantity}</td>
                  <td className="p-4">${line.price.toLocaleString()}</td>
                  <td className="p-4 font-black text-blue-700">${line.amount.toLocaleString()}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => editLine(index)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                    <button onClick={() => deleteLine(index)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-400 italic bg-gray-50/50">
                    Your order list is empty. Add items above to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER --- */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-4">
          <div className="text-center md:text-left">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Grand Total Payable</p>
            <p className="text-5xl font-black text-gray-900">${lines.reduce((sum, l) => sum + l.amount, 0).toLocaleString()}</p>
          </div>
          <button onClick={handleSubmit} disabled={loading || lines.length === 0} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-black px-16 py-5 rounded-2xl shadow-xl shadow-green-100 disabled:bg-gray-300 transition-all active:scale-95 text-lg">
            {loading ? "RECEIVING..." : "RECEIVE ALL STOCK"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrder;