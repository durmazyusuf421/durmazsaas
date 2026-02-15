'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, FileText, LogOut, Loader2, Building2 } from 'lucide-react';

export default function CustomerDashboard() {
  const params = useParams();
  const code = params?.code; // URL'deki CARI-XXXX kodunu buradan yakalıyoruz
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/portal');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('global_cari_code', code)
        .single();

      setProfile(data);
      setLoading(false);
    };

    if (code) fetchProfile();
  }, [code, router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/portal';
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F4F7FE]"><Loader2 className="animate-spin text-[#3063E9]" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex">
      {/* SOL MENÜ */}
      <aside className="w-64 bg-[#1B2559] text-white p-6 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-[#3063E9] rounded-lg flex items-center justify-center font-bold">Y</div>
            <span className="text-xl font-black tracking-tighter uppercase text-white">Müşteri Portalı</span>
          </div>
          <nav className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#3063E9] rounded-xl font-bold transition-all"><LayoutDashboard size={20}/> Özet</button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-white/5 rounded-xl font-bold transition-all"><ShoppingBag size={20}/> Siparişlerim</button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-white/5 rounded-xl font-bold transition-all"><FileText size={20}/> Ekstrelerim</button>
          </nav>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl font-bold transition-all"><LogOut size={20}/> Çıkış Yap</button>
      </aside>

      {/* ANA İÇERİK */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter">Hoş Geldiniz</h1>
              <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-1">Cari Kod: {code}</p>
            </div>
            <div className="text-right">
              <p className="font-black text-[#1B2559] uppercase">{profile?.full_name}</p>
              <p className="text-xs text-gray-400 font-medium">{profile?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-50 text-[#3063E9] rounded-2xl flex items-center justify-center shrink-0"><Building2 size={32}/></div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bağlı İşletme Sayısı</p>
                <h3 className="text-3xl font-black text-[#1B2559]">0</h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 text-center space-y-4">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300"><FileText size={40}/></div>
             <h3 className="text-xl font-black text-[#1B2559] uppercase tracking-tighter">Henüz bir işletmeye bağlı değilsiniz</h3>
             <p className="text-gray-400 font-medium max-w-sm mx-auto">Toptancınıza <b>{code}</b> kodunu vererek sizi sistemlerine eklemesini isteyin.</p>
          </div>
        </div>
      </main>
    </div>
  );
}