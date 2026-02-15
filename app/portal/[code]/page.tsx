'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, FileText, LogOut, Loader2, Building2, Store, CalendarDays } from 'lucide-react';

export default function CustomerDashboard() {
  const params = useParams();
  const code = params?.code as string;
  const [profile, setProfile] = useState<any>(null);
  const [linkedBusinesses, setLinkedBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/portal';
        return;
      }

      try {
        // 1. Müşterinin kendi profilini çek
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('global_cari_code', code)
          .single();

        if (profileData) setProfile(profileData);

        // 2. Müşterinin bağlı olduğu dükkanları çek (customers tablosundan)
        const { data: businesses } = await supabase
          .from('customers')
          .select('id, created_at, company_id, companies(name)')
          .eq('current_cari_code', code);

        if (businesses) {
          setLinkedBusinesses(businesses);
        }
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        setLoading(false);
      }
    };

    if (code) fetchDashboardData();
  }, [code, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/portal';
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F4F7FE]"><Loader2 className="animate-spin text-[#3063E9]" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex font-sans">
      {/* SOL MENÜ */}
      <aside className="w-64 bg-[#1B2559] text-white p-6 flex-col justify-between hidden md:flex fixed h-full">
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
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl font-bold transition-all mt-auto"><LogOut size={20}/> Çıkış Yap</button>
      </aside>

      {/* ANA İÇERİK */}
      <main className="flex-1 md:ml-64 p-4 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Üst Karşılama Alanı */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 gap-4">
            <div>
              <h1 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter">Hoş Geldiniz</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-blue-50 text-[#3063E9] px-3 py-1 rounded-lg text-xs font-black tracking-widest uppercase">Cari Kod: {code}</span>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="font-black text-[#1B2559] uppercase text-lg">{profile?.full_name}</p>
              <p className="text-sm text-gray-400 font-medium">{profile?.email}</p>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-50 text-[#3063E9] rounded-2xl flex items-center justify-center shrink-0"><Building2 size={32}/></div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Bağlı Olduğunuz Toptancılar</p>
                <h3 className="text-4xl font-black text-[#1B2559]">{linkedBusinesses.length}</h3>
              </div>
            </div>
          </div>

          {/* Bağlı İşletmeler Listesi */}
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50 bg-gray-50/50">
              <h2 className="text-xl font-black text-[#1B2559] uppercase tracking-tighter flex items-center gap-2">
                <Store size={24} className="text-[#3063E9]" /> B2B Bağlantılarım
              </h2>
            </div>
            
            <div className="p-8">
              {linkedBusinesses.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300 mb-4"><FileText size={40}/></div>
                  <h3 className="text-xl font-black text-[#1B2559] uppercase tracking-tighter mb-2">Henüz Bir İşletmeye Bağlı Değilsiniz</h3>
                  <p className="text-gray-400 font-medium max-w-sm mx-auto">Toptancınıza <b className="text-[#3063E9]">{code}</b> kodunu vererek sizi sistemlerine eklemesini isteyin.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {linkedBusinesses.map((b, index) => (
                    <div key={index} className="flex items-center gap-4 p-5 rounded-2xl border border-gray-100 hover:border-[#3063E9] hover:shadow-lg transition-all cursor-pointer group">
                      <div className="w-12 h-12 bg-[#F4F7FE] text-[#3063E9] rounded-xl flex items-center justify-center font-black group-hover:bg-[#3063E9] group-hover:text-white transition-colors">
                        <Store size={20} />
                      </div>
                      <div>
                        {/* TypeScript hatası almamak için any olarak gelen nested datayı güvenli okuyoruz */}
                        <h4 className="font-black text-[#1B2559] uppercase">{b.companies?.name || 'Bilinmeyen İşletme'}</h4>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                          <CalendarDays size={12} /> Kayıt: {new Date(b.created_at).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}