'use client';
import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function CreateCompanyPage() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 1. Şirketi oluştur
      const { data: company, error: cErr } = await supabase
        .from('companies')
        .insert([{ name, join_code: randomCode }])
        .select().single();

      if (cErr) throw cErr;

      // 2. Seni admin yap
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('profiles').update({ company_id: company.id, role: 'admin' }).eq('id', user?.id);

      // 3. Oturumu tazele ve içeri gir
      await supabase.auth.refreshSession();
      window.location.href = '/dashboard';

    } catch (err: any) {
      alert("Hata: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F4F7FE]">
      <div className="bg-white p-10 rounded-[2rem] shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-[#1B2559] mb-6">İşletmeni Kur</h1>
        <form onSubmit={handleCreate} className="space-y-4">
          <input 
            type="text" 
            placeholder="İşletme Adı" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-blue-500"
          />
          <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold">
            {loading ? "Kuruluyor..." : "Hemen Oluştur"}
          </button>
        </form>
      </div>
    </div>
  );
}