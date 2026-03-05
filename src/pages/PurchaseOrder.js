import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Truck, Plus, Trash2, Edit2, Save, X, CreditCard, Clock, UserPlus, PackagePlus } from 'lucide-react';

const PurchaseOrder = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', email: '', phone: '', address: '' });
  const [newItem, setNewItem] = useState({ name: '', description: '', purchase_price: 0, selling_price: 0, uom: '', shipment_threshold: '' });

  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const [selectedItemId, setSelectedItemId] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState(''); 

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
      setNewSupplier({ name: '', email: '', phone: '', address: '' });
    }
  };

  const quickAddItem = async () => {
    if (!newItem.name) return;
    const { data, error } = await supabase.from('items').insert([newItem]).select().single();
    if (!error) {
      setItems([...items, data]);
      setSelectedItemId(data.id);
      setShowItemModal(false);
      setNewItem({ name: '', description: '', purchase_price: '', selling_price: '', uom: 'pcs' });
    }
  };

  const handleSupplierSelect = (id) => {
    if (id === "new") setShowSupplierModal(true);
    else setSelectedSupplier(id);
  };

  const handleItemSelect = (itemId) => {
    if (itemId === "new") {
      setShowItemModal(true);
      return;
    }
    setSelectedItemId(itemId);
    const item = items.find(i => i.id === itemId);
    if (item) {
      setPrice(item.purchase_price || 0);
    }
  };

  // --- CORE LOGIC: ADDING/UPDATING TABLE ROWS ---
  const addLineItem = () => {
    if (!selectedItemId || !quantity || quantity <= 0) {
      return alert("Please select an item and enter a valid quantity");
    }

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
      // Update existing row
      const updatedLines = [...lines];
      updatedLines[editingIndex] = newLine;
      setLines(updatedLines);
      setEditingIndex(null);
    } else {
      // Add new row to table
      setLines([...lines, newLine]);
    }

    // Reset Entry Fields
    setSelectedItemId('');
    setDescription('');
    setQuantity('');
    setPrice('');
  };

  const editLine = (index) => {
    const line = lines[index];
    setSelectedItemId(line.item_id);
    setDescription(line.description);
    setQuantity(line.quantity);
    setPrice(line.price);
    setEditingIndex(index);
    // User can now see the data back in the input fields to change it
  };

  const deleteLine = (index) => {
    if (window.confirm("Remove this item from the order?")) {
      setLines(lines.filter((_, i) => i !== index));
      if (editingIndex === index) setEditingIndex(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lines.length === 0) return alert("Add at least one item to the table first");
    if (!selectedSupplier) return alert("Please select a vendor");

    setLoading(true);
    const supplierName = suppliers.find(s => s.id === selectedSupplier)?.name;
    const grandTotal = lines.reduce((sum, line) => sum + line.amount, 0);

    try {
      // Create Journal Entry Header
      const { data: header, error: hErr } = await supabase.from('journal_entries').insert([{ description: `Purchase: ${supplierName}` }]).select().single();
      if (hErr) throw hErr;

// Group by item to handle multiples
    const summaryByItem = lines.reduce((acc, line) => {
      if (!acc[line.item_id]) acc[line.item_id] = { qty: 0, cost: 0 };
      acc[line.item_id].qty += line.quantity;
      acc[line.item_id].cost += line.amount;
      return acc;
    }, {});

    for (const [itemId, incoming] of Object.entries(summaryByItem)) {
      const { data: itemInDB } = await supabase
        .from('items')
        .select('quantity, amount')
        .eq('id', itemId).single();

      // UPDATE LOGIC:
      // We add incoming quantity to existing quantity
      // We add incoming cost to existing 'amount' (Total Value)
      // We DO NOT touch 'purchase_price'
      const newTotalQty = (itemInDB?.quantity || 0) + incoming.qty;
      const newTotalValue = (itemInDB?.amount || 0) + incoming.cost;

      await supabase.from('items').update({ 
        quantity: newTotalQty,
        amount: newTotalValue 
      }).eq('id', itemId);
    }

    // Transactions & Journals
    const transactionRecords = lines.map(line => ({
      item_id: line.item_id,
      type: 'purchase',
      quantity: line.quantity,
      price: line.price, 
      entity_name: supplierName,
      uom: line.uom
    }));

    const { error: transErr } = await supabase
      .from('transactions')
      .insert(transactionRecords);
    
    if (transErr) throw transErr;

      // 5. Financials (Inventory vs Cash/AP)
      const CASH_ACC = 'ccc129ab-c1f4-457b-ad67-9a3df3556b85'; 
      const AP_ACC = '987f41e7-f2b9-44ee-855e-07ad08522197'; 
      const INV_ACC = 'c57bebc2-0135-4442-81f9-34c034ada268';
      const creditAccount = paymentMethod === 'cash' ? CASH_ACC : AP_ACC;

      await supabase.from('journal_lines').insert([
        { entry_id: header.id, account_id: INV_ACC, debit: grandTotal, credit: 0 },
        { entry_id: header.id, account_id: creditAccount, debit: 0, credit: grandTotal }
      ]);

      alert("Inventory Received Successfully!");
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
    <div className="p-4 md:p-8 max-w-5xl mx-auto bg-gray-50 min-h-screen font-sans">
      
      {/* MODALS (Suppliers/Items) */}
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
              <input placeholder="Email" className="w-full p-3 border rounded-xl" value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} />
              <input placeholder="Address" className="w-full p-3 border rounded-xl" value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} />
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
              <input placeholder="Description" className="w-full p-3 border rounded-xl" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
              <input placeholder="Purchase Price" className="w-full p-3 border rounded-xl" value={newItem.purchase_price} onChange={e => setNewItem({...newItem, purchase_price: e.target.value})} />
              <input placeholder="Selling Price" className="w-full p-3 border rounded-xl" value={newItem.selling_price} onChange={e => setNewItem({...newItem, selling_price_price: e.target.value})} />
              <input placeholder="Unit of Measure (pcs/kg)" className="w-full p-3 border rounded-xl" value={newItem.uom} onChange={e => setNewItem({...newItem, uom: e.target.value})} />
              <input placeholder="Shipment Threshold" type="number" className="w-full p-3 border rounded-xl" value={newItem.shipment_threshold} onChange={e => setNewItem({...newItem, shipment_threshold: e.target.value})} />
              <button onClick={quickAddItem} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Save & Select Item</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg">
            <Truck size={24} />
          </div>
          <h2 className="text-2xl font-black text-gray-800">New Purchase Order</h2>
        </div>

        {/* --- HEADER --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-dashed">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block italic">Vendor / Supplier</label>
            <select className="w-full p-3 bg-gray-50 border rounded-xl" value={selectedSupplier} onChange={(e) => handleSupplierSelect(e.target.value)}>
              <option value="">Select Supplier...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              <option value="new" className="text-blue-600 font-bold">+ Create New Supplier</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block italic">Payment Terms</label>
            <div className="flex gap-2">
              <button onClick={() => setPaymentMethod('cash')} className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all ${paymentMethod === 'cash' ? 'bg-blue-600 text-white' : 'bg-white text-gray-400'}`}><CreditCard size={16}/> Cash</button>
              <button onClick={() => setPaymentMethod('credit')} className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all ${paymentMethod === 'credit' ? 'bg-blue-600 text-white' : 'bg-white text-gray-400'}`}><Clock size={16}/> Credit</button>
            </div>
          </div>
        </div>

        {/* --- INPUT SECTION --- */}
        <div className="bg-blue-50/50 p-6 rounded-2xl mb-8 border border-blue-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-gray-500 uppercase mb-1 block">Item</label>
              <select className="w-full p-3 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={selectedItemId} onChange={(e) => handleItemSelect(e.target.value)}>
                <option value="">Choose Item...</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name} (In Stock: {i.quantity})</option>)}
                <option value="new" className="text-blue-600 font-bold">+ Create New Item</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase mb-1 block">Qty</label>
              <input type="number" className="w-full p-3 border rounded-xl bg-white" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase mb-1 block">Unit Price</label>
              <input type="number" className="w-full p-3 border rounded-xl bg-white" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div className="mb-6">
            <label className="text-[10px] font-black text-gray-500 uppercase mb-1 block">Description</label>
            <input className="w-full p-3 border rounded-xl bg-white" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Batch #101" />
          </div>
          <button onClick={addLineItem} className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all">
            {editingIndex !== null ? <><Save size={18}/> Update Line</> : <><Plus size={18}/> Add to Order</>}
          </button>
        </div>

        {/* --- THE TABLE --- */}
        <div className="overflow-hidden border border-gray-100 rounded-2xl mb-8">
          <table className="w-full text-left">
            <thead className="bg-gray-900 text-[10px] font-black uppercase text-gray-400">
              <tr>
                <th className="p-4">Item</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-center">Qty</th>
                <th className="p-4">Price</th>
                <th className="p-4">Amount</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.map((line, index) => (
                <tr key={index} className={`text-sm ${editingIndex === index ? 'bg-yellow-50' : ''}`}>
                  <td className="p-4 font-bold text-gray-700">{line.name}</td>
                  <td className="p-4 text-gray-400">{line.description || '—'}</td>
                  <td className="p-4 text-center font-mono">{line.quantity}</td>
                  <td className="p-4">${line.price.toLocaleString()}</td>
                  <td className="p-4 font-black text-blue-700">${line.amount.toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => editLine(index)} className="p-2 text-gray-400 hover:text-blue-600"><Edit2 size={16}/></button>
                      <button onClick={() => deleteLine(index)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr><td colSpan="6" className="p-12 text-center text-gray-300 italic">No items added to this order yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FINAL TOTALS --- */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900 p-8 rounded-3xl text-white shadow-xl">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Order Value</p>
            <p className="text-5xl font-black text-blue-400">${lines.reduce((sum, l) => sum + l.amount, 0).toLocaleString()}</p>
          </div>
          <button onClick={handleSubmit} disabled={loading || lines.length === 0} className="w-full md:w-auto bg-green-500 hover:bg-green-400 text-gray-900 font-black px-16 py-5 rounded-2xl transition-all disabled:bg-gray-800 mt-4 md:mt-0">
            {loading ? "PROCESSING..." : "CONFIRM RECEIPT"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrder;