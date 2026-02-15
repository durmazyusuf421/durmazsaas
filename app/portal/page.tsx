'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Store, ArrowRight, Loader2 } from 'lucide-react';

export default function PortalLogin() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 5) return setError("Lütfen geçerli bir Cari Kod girin.");
    
    setLoading(true);
    setError('');

    try {
      // Kodu veritabanında ara
      const { data, error } = await supabase
        .from('customers')
        .select('current_cari_code, name')
        .eq('current_cari_code', code.trim())
        .single();

      if (error || !data) throw new Error("Bu koda ait bir müşteri bulunamadı!");

      // Kod doğruysa adamı kendi özel portalına yönlendir
      router.push(`/portal/${code.trim()}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
        
        <div className="w-16 h-16 bg-blue-50 text-[#3063E9] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Store size={32} />
        </div>
        
        <h1 className="text-2xl font-black text-center text-[#1B2559] uppercase tracking-tighter mb-2">Müşteri Portalı</h1>
        <p className="text-center text-gray-400 font-medium text-sm mb-8">İşletmenizin size verdiği 6 haneli Cari Kodu girerek hesabınıza ulaşın.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input 
              type="text" 
              placeholder="Cari Kodunuz (Örn: 123456)" 
              className="w-full p-5 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-[#3063E9] font-black text-center text-2xl tracking-widest text-[#1B2559] transition-all"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
            />
          </div>
          
          {error && <p className="text-red-500 text-sm font-bold text-center bg-red-50 p-3 rounded-xl">{error}</p>}

          <button 
            type="submit" 
            disabled={loading || !code}
            className="w-full p-5 bg-[#3063E9] hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <>Giriş Yap <ArrowRight size={20} /></>}
          </button>
        </form>

      </div>
    </div>
  );
}