import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Edit2, Trash2, Save, X, UserPlus, Search, Phone, MapPin, Plus } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // States for Editing and Creating
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', address: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (!error) setCustomers(data);
    setLoading(false);
  };

  // --- CREATE LOGIC ---
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCustomer.name) return alert("Customer name is required");

    const { error } = await supabase
      .from('customers')
      .insert([newCustomer]);

    if (error) {
      alert(error.message);
    } else {
      setNewCustomer({ name: '', email: '', phone: '', address: '' });
      setShowAddForm(false);
      fetchCustomers();
    }
  };

  // --- DELETE LOGIC ---
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) alert(error.message);
      else fetchCustomers();
    }
  };

  // --- EDIT LOGIC ---
  const startEdit = (customer) => {
    setEditId(customer.id);
    setEditForm({ 
      name: customer.name || '', 
      email: customer.email || '', 
      phone: customer.phone || '', 
      address: customer.address || '' 
    });
  };

  const handleUpdate = async (id) => {
    const { error } = await supabase
      .from('customers')
      .update(editForm)
      .eq('id', id);

    if (error) alert(error.message);
    else {
      setEditId(null);
      fetchCustomers();
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <UserPlus className="text-blue-600" /> Customer Master
          </h1>
          
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${
              showAddForm ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
            }`}
          >
            {showAddForm ? <X size={20} /> : <Plus size={20} />}
            {showAddForm ? "Cancel" : "Add New Customer"}
          </button>
        </div>

        {/* --- ADD CUSTOMER FORM --- */}
        {showAddForm && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                placeholder="Full Name"
                className="p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="Email Address"
                className="p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
              />
              <input
                type="tel"
                placeholder="Phone Number"
                className="p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
              />
              <input
                placeholder="Physical Address"
                className="p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
              />
              <button type="submit" className="md:col-span-2 lg:col-span-4 bg-blue-600 text-white py-3 rounded-xl font-black hover:bg-blue-700 transition-all">
                SAVE CUSTOMER RECORD
              </button>
            </form>
          </div>
        )}
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            className="w-full pl-12 pr-4 py-4 border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Customer Profile</th>
                <th className="p-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Contact Details</th>
                <th className="p-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="p-5">
                      {editId === customer.id ? (
                        <div className="space-y-2">
                          <input
                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                          <input
                            type="email"
                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-gray-800">{customer.name}</p>
                          <p className="text-xs text-gray-500 font-medium">{customer.email || 'No email'}</p>
                        </div>
                      )}
                    </td>
                    <td className="p-5">
                      {editId === customer.id ? (
                        <div className="space-y-2">
                          <input
                            type="tel"
                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          />
                          <input
                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={editForm.address}
                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                          />
                        </div>
                      ) : (
                        <div className="text-sm space-y-1">
                          <p className="flex items-center gap-2 text-gray-700 font-medium">
                            <Phone size={14} className="text-blue-400" /> {customer.phone || 'N/A'}
                          </p>
                          <p className="flex items-center gap-2 text-gray-400 text-xs">
                            <MapPin size={14} /> {customer.address || 'No address registered'}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2">
                        {editId === customer.id ? (
                          <>
                            <button onClick={() => handleUpdate(customer.id)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                              <Save size={18} />
                            </button>
                            <button onClick={() => setEditId(null)} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(customer)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDelete(customer.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="p-20 text-center text-gray-400 font-medium italic">
                    No matching customer records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Customers;