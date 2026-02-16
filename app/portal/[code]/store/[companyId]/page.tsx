'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingBag, LogOut, Loader2, Store, 
  ShoppingCart, Rocket, UserCircle, ChevronRight, ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function StoreSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  
  const [profile, setProfile] = useState<any>(null);
  const [linkedBusinesses, setLinkedBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchStores = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/portal'); return; }

      try {
        const { data: profileData } = await supabase.from('profiles').select('full_name').eq('global_cari_code', code).single();
        if (profileData) setProfile(profileData);

        const { data: businesses } = await supabase.from('customers').select('id, company_id, companies(name)').eq('current_cari_code', code);
        if (businesses) setLinkedBusinesses(businesses);

      } catch (error) {
        console.error("Veri yükleme hatası:", error);
      } finally {
        setLoading(false);
      }
    };

    if (code) fetchStores();
  }, [code, supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/portal');
  };

  if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-[#F4F7FE] gap-4"><Loader2 className="animate-spin text-[#3063E9]" size={48} /><p className="text-[#1B2559] font-bold animate-pulse uppercase tracking-widest text-xs">Mağazalar Yükleniyor...</p></div>;

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex font-sans">
      
      {/* SOL MENÜ (Sidebar) */}
      <aside className="w-72 bg-[#1B2559] text-white p-8 flex-col justify-between hidden lg:flex fixed h-full shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg"><Rocket className="text-white" size={22} /></div>
            <span className="text-2xl font-black tracking-tighter uppercase italic text-white">Durmaz<span className="text-blue-500">SaaS</span></span>
          </div>
          
          <nav className="space-y-3">
            <Link href={`/portal/${code}`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all group">
              <LayoutDashboard size={22} className="group-hover:text-white"/> Özet Panel
            </Link>
            
            {/* SİPARİŞ VER AKTİF BUTON */}
            <Link href={`/portal/${code}/stores`} className="w-full flex items-center gap-4 px-5 py-4 bg-[#3063E9] text-white rounded-2xl font-bold transition-all shadow-lg">
               <Store size={22} /> Sipariş Ver
            </Link>

            <Link href={`/portal/${code}/orders`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all group">
              <ShoppingBag size={22} className="group-hover:text-white"/> Sipariş & Mutabakat
            </Link>
          </nav>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-4 px-5 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl font-bold transition-all mt-auto border border-red-500/20"><LogOut size={22}/> Güvenli Çıkış</button>
      </aside>

      {/* ANA İÇERİK */}
      <main className="flex-1 lg:ml-72 p-6 md:p-12">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* ÜST BAŞLIK */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[40px] shadow-sm border border-white gap-6">
            <div>
              <h1 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter">Sipariş Ver</h1>
              <p className="text-gray-400 font-bold text-xs uppercase mt-2 tracking-widest">Alışveriş yapmak istediğiniz toptancıyı seçin</p>
            </div>
            <div className="flex items-center gap-4 bg-gray-50 px-6 py-3 rounded-3xl border border-gray-100">
              <UserCircle size={24} className="text-blue-500" />
              <span className="font-black text-[#1B2559] uppercase text-sm">{profile?.full_name || 'Müşteri'}</span>
            </div>
          </div>

          {/* MAĞAZA (İŞLETME) LİSTESİ */}
          <div className="space-y-6">
             {linkedBusinesses.length === 0 ? (
                <div className="bg-white p-20 rounded-[50px] border-2 border-dashed border-gray-100 text-center shadow-sm">
                    <Store size={64} className="mx-auto text-gray-200 mb-6"/>
                    <h3 className="text-2xl font-black text-[#1B2559] uppercase tracking-tighter">Bağlantı Bulunamadı</h3>
                    <p className="text-gray-400 font-bold mt-2">Sipariş verebileceğiniz kayıtlı bir toptancı bulunmuyor.</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 gap-6">
                    {linkedBusinesses.map((b, index) => (
                      <div key={index} className="bg-white p-8 rounded-[40px] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all border border-gray-50 flex flex-col md:flex-row items-center justify-between gap-8 group">
                        
                        {/* Sol Taraf: İşletme Logosu ve Adı */}
                        <div className="flex items-center gap-6 w-full md:w-auto">
                            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                                <Store size={36}/>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#1B2559] uppercase mb-1">{b.companies?.name || 'Toptancı Mağazası'}</h3>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Sipariş Almaya Açık
                                </div>
                            </div>
                        </div>

                        {/* Sağ Taraf: Devasa Siparişe Başla Butonu */}
                        <Link 
                          href={`/portal/${code}/store/${b.company_id}`} 
                          className="w-full md:w-auto px-10 py-5 bg-[#3063E9] text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                        >
                          <ShoppingCart size={22}/> Mağazaya Gir <ArrowRight size={20} />
                        </Link>

                      </div>
                    ))}
                </div>
             )}
          </div>

        </div>
      </main>
    </div>
  );
}