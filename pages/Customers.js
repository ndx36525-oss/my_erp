import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserPlus, User, Mail, Phone, MapPin, Search } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', email: '', phone: '', address: '' });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').order('name');
    setCustomers(data || []);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('customers').insert([newCust]);
    if (!error) {
      setShowModal(false);
      setNewCust({ name: '', email: '', phone: '', address: '' });
      fetchCustomers();
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Customers</h2>
          <p className="text-sm text-gray-500">Manage your buyers and client list.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <UserPlus size={18} /> Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-100 p-3 rounded-2xl text-blue-600"><User size={20}/></div>
              <h3 className="font-bold text-gray-800 text-lg">{c.name}</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2"><Mail size={14}/> {c.email || 'No email'}</div>
              <div className="flex items-center gap-2"><Phone size={14}/> {c.phone || 'No phone'}</div>
              <div className="flex items-center gap-2"><MapPin size={14}/> {c.address || 'No address'}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Simple Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-6">New Customer Details</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input required placeholder="Full Name" className="w-full p-3 bg-gray-50 border rounded-xl outline-none" onChange={e => setNewCust({...newCust, name: e.target.value})} />
              <input placeholder="Email" className="w-full p-3 bg-gray-50 border rounded-xl outline-none" onChange={e => setNewCust({...newCust, email: e.target.value})} />
              <input placeholder="Phone" className="w-full p-3 bg-gray-50 border rounded-xl outline-none" onChange={e => setNewCust({...newCust, phone: e.target.value})} />
              <textarea placeholder="Address" className="w-full p-3 bg-gray-50 border rounded-xl outline-none" onChange={e => setNewCust({...newCust, address: e.target.value})} />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-gray-500 font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;