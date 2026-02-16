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
      // 1. ÖNCE KULLANICIYI (PATRONU) BULUYORUZ
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı.");

      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 2. ŞİRKETİ OLUŞTURUYORUZ (owner_id EKLENDİ! 🚀)
      const { data: company, error: cErr } = await supabase
        .from('companies')
        .insert([{ 
          name, 
          join_code: randomCode,
          owner_id: user.id // İŞTE TAPUYU KESTİĞİMİZ YER BURASI!
        }])
        .select().single();

      if (cErr) throw cErr;

      // 3. SENİ ADMİN YAP VE PROFİLİNE DÜKKANI BAĞLA
      await supabase.from('profiles').update({ company_id: company.id, role: 'admin' }).eq('id', user.id);

      // 4. OTURUMU TAZELE VE İÇERİ GİR
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
            className="w-full p-4 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 ring-blue-500 font-bold text-[#1B2559]"
            required
          />
          <button 
            type="submit"
            disabled={loading || !name}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {loading ? "Kuruluyor..." : "Hemen Oluştur"}
          </button>
        </form>
      </div>
    </div>
  );
}