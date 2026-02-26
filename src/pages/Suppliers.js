import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Truck, Plus, Mail, Phone, Globe } from 'lucide-react';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newSupp, setNewSupp] = useState({ name: '', contact_person: '', email: '', phone: '' });

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('*').order('name');
    setSuppliers(data || []);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('suppliers').insert([newSupp]);
    if (!error) {
      setShowModal(false);
      setNewSupp({ name: '', contact_person: '', email: '', phone: '' });
      fetchSuppliers();
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Suppliers</h2>
          <p className="text-sm text-gray-500">Manage vendors you buy stock from.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 shadow-lg shadow-orange-100"
        >
          <Plus size={18} /> Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map(s => (
          <div key={s.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-orange-100 p-3 rounded-2xl text-orange-600"><Truck size={20}/></div>
              <h3 className="font-bold text-gray-800 text-lg">{s.name}</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="font-semibold text-gray-700 uppercase text-[10px]">Primary Contact</div>
              <div>{s.contact_person || 'N/A'}</div>
              <div className="flex items-center gap-2"><Mail size={14}/> {s.email}</div>
              <div className="flex items-center gap-2"><Phone size={14}/> {s.phone}</div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-orange-600">New Supplier</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input required placeholder="Company Name" className="w-full p-3 bg-gray-50 border rounded-xl outline-none" onChange={e => setNewSupp({...newSupp, name: e.target.value})} />
              <input placeholder="Contact Person" className="w-full p-3 bg-gray-50 border rounded-xl outline-none" onChange={e => setNewSupp({...newSupp, contact_person: e.target.value})} />
              <input placeholder="Email" className="w-full p-3 bg-gray-50 border rounded-xl outline-none" onChange={e => setNewSupp({...newSupp, email: e.target.value})} />
              <input placeholder="Phone" className="w-full p-3 bg-gray-50 border rounded-xl outline-none" onChange={e => setNewSupp({...newSupp, phone: e.target.value})} />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-gray-400">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;