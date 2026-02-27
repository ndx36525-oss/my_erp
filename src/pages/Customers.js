import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Edit2, Trash2, Save, X, UserPlus, Search, Phone, MapPin } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    address: '' 
  });

  // 1. Fetch Customers
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

  // 2. Delete Logic
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) alert(error.message);
      else fetchCustomers();
    }
  };

  // 3. Edit Toggle
  const startEdit = (customer) => {
    setEditId(customer.id);
    setEditForm({ 
      name: customer.name || '', 
      email: customer.email || '', 
      phone: customer.phone || '', 
      address: customer.address || '' 
    });
  };

  // 4. Update Logic
  const handleUpdate = async (id) => {
    const { error } = await supabase
      .from('customers')
      .update({ 
        name: editForm.name, 
        email: editForm.email,
        phone: editForm.phone,
        address: editForm.address
      })
      .eq('id', id);

    if (error) alert(error.message);
    else {
      setEditId(null);
      fetchCustomers();
    }
  };

  // 5. Search Filter Logic
  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <UserPlus className="text-blue-600" /> Customer Management
        </h1>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading your customers...</div>
      ) : (
        <div className="bg-white shadow-sm rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-4 text-xs font-bold uppercase text-gray-500">Customer Info</th>
                <th className="p-4 text-xs font-bold uppercase text-gray-500">Contact & Address</th>
                <th className="p-4 text-xs font-bold uppercase text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-4">
                      {editId === customer.id ? (
                        <div className="space-y-2">
                          <input
                            className="w-full border rounded p-2 text-sm"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            placeholder="Name"
                          />
                          <input
                            type="email"
                            className="w-full border rounded p-2 text-sm"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            placeholder="Email"
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-gray-900">{customer.name}</p>
                          <p className="text-sm text-gray-500">{customer.email}</p>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {editId === customer.id ? (
                        <div className="space-y-2">
                          <input
                            type="tel"
                            className="w-full border rounded p-2 text-sm"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            placeholder="Phone"
                          />
                          <input
                            className="w-full border rounded p-2 text-sm"
                            value={editForm.address}
                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            placeholder="Address"
                          />
                        </div>
                      ) : (
                        <div className="text-sm space-y-1">
                          <p className="flex items-center gap-1 text-gray-700">
                            <Phone size={14} className="text-gray-400" /> {customer.phone || 'N/A'}
                          </p>
                          <p className="flex items-center gap-1 text-gray-500 italic">
                            <MapPin size={14} className="text-gray-400" /> {customer.address || 'No address'}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-3">
                        {editId === customer.id ? (
                          <>
                            <button onClick={() => handleUpdate(customer.id)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                              <Save size={20} />
                            </button>
                            <button onClick={() => setEditId(null)} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                              <X size={20} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(customer)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDelete(customer.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
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
                  <td colSpan="3" className="p-10 text-center text-gray-400">No customers found.</td>
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