import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Lock, Mail, ShieldCheck } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-blue-600 rounded-2xl text-white mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-black text-gray-800">Smart ERP Login</h1>
          <p className="text-gray-500 text-sm">Secure access to your warehouse data</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input 
              type="email" placeholder="Email Address" 
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              value={email} onChange={(e) => setEmail(e.target.value)} required 
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input 
              type="password" placeholder="Password" 
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              value={password} onChange={(e) => setPassword(e.target.value)} required 
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}