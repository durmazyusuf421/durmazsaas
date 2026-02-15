'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  FileText, 
  LogOut, 
  Loader2, 
  Building2, 
  Store, 
  CalendarDays, 
  ChevronRight, 
  Wallet, 
  Bell, 
  UserCircle,
  Rocket 
} from 'lucide-react';
import Link from 'next/link';

export default function CustomerDashboard() {
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
    const fetchDashboardData = async () => {
      // 1. Auth kontrolü
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/portal');
        return;
      }

      try {
        // 2. Müşteri profilini çek
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('global_cari_code', code)
          .single();

        if (profileData) setProfile(profileData);

        // 3. Bağlı olduğu işletmeleri çek
        const { data: businesses } = await supabase
          .from('customers')
          .select('id, created_at, company_id, companies(name)')
          .eq('current_cari_code', code);

        if (businesses) setLinkedBusinesses(businesses);
      } catch (error) {
        console.error("Veri yükleme hatası:", error);
      } finally {
        setLoading(false);
      }
    };

    if (code) fetchDashboardData();
  }, [code, supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/portal');
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#F4F7FE] gap-4">
        <Loader2 className="animate-spin text-[#3063E9]" size={48} />
        <p className="text-[#1B2559] font-bold animate-pulse uppercase tracking-widest text-xs">Portala Giriş Yapılıyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex font-sans">
      
      {/* --- SOL MENÜ (SIDEBAR) --- */}
      <aside className="w-72 bg-[#1B2559] text-white p-8 flex-col justify-between hidden lg:flex fixed h-full shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Rocket className="text-white" size={22} />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">Durmaz<span className="text-blue-500">SaaS</span></span>
          </div>

          <nav className="space-y-3">
            <Link href={`/portal/${code}`} className="w-full flex items-center gap-4 px-5 py-4 bg-[#3063E9] text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20">
              <LayoutDashboard size={22}/> Özet Panel
            </Link>
            <button className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:bg-white/5 rounded-2xl font-bold transition-all group">
              <ShoppingBag size={22} className="group-hover:text-white"/> Siparişlerim
            </button>
            <button className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:bg-white/5 rounded-2xl font-bold transition-all group">
              <FileText size={22} className="group-hover:text-white"/> Ekstrelerim
            </button>
            <button className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:bg-white/5 rounded-2xl font-bold transition-all group">
              <Bell size={22} className="group-hover:text-white"/> Bildirimler
            </button>
          </nav>
        </div>

        <button onClick={handleLogout} className="flex items-center gap-4 px-5 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl font-bold transition-all mt-auto border border-red-500/20">
          <LogOut size={22}/> Güvenli Çıkış
        </button>
      </aside>

      {/* --- ANA İÇERİK ALANI --- */}
      <main className="flex-1 lg:ml-72 p-6 md:p-12">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* ÜST BAR: KULLANICI BİLGİSİ */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[40px] shadow-sm border border-white gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 border border-blue-100">
                <UserCircle size={40} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter leading-none">{profile?.full_name || 'Müşteri'}</h1>
                <p className="text-blue-500 font-bold text-sm mt-2 tracking-widest uppercase">Global Cari: {code}</p>
              </div>
            </div>
            <div className="hidden md:block h-12 w-[1px] bg-gray-100"></div>
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 text-right">Durum</span>
                <span className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-xs font-black uppercase border border-green-100">Aktif Üye</span>
            </div>
          </div>

          {/* HIZLI İSTATİSTİKLER */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-white flex items-center gap-6 group hover:scale-[1.02] transition-transform">
              <div className="w-20 h-20 bg-[#F4F7FE] text-[#3063E9] rounded-[30px] flex items-center justify-center shrink-0 shadow-inner group-hover:bg-[#3063E9] group-hover:text-white transition-colors">
                <Building2 size={36}/>
              </div>
              <div>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Bağlı İşletmeler</p>
                <h3 className="text-5xl font-black text-[#1B2559]">{linkedBusinesses.length}</h3>
              </div>
            </div>

            <div className="bg-[#3063E9] p-8 rounded-[40px] shadow-xl shadow-blue-500/20 flex items-center gap-6 group hover:scale-[1.02] transition-transform relative overflow-hidden text-white">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <div className="w-20 h-20 bg-white/20 rounded-[30px] flex items-center justify-center shrink-0 backdrop-blur-md">
                <Wallet size={36}/>
              </div>
              <div>
                <p className="text-[11px] font-black text-blue-200 uppercase tracking-[0.2em] mb-1 text-white/70">Bekleyen Sipariş</p>
                <h3 className="text-5xl font-black">0</h3>
              </div>
            </div>
          </div>

          {/* BAĞLI İŞLETMELER LİSTESİ */}
          <div className="space-y-6">
             <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black text-[#1B2559] uppercase tracking-tighter flex items-center gap-3">
                    <Store size={28} className="text-blue-500" /> B2B İş Ortaklarım
                </h2>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Toplam {linkedBusinesses.length} Dükkan</span>
             </div>

             {linkedBusinesses.length === 0 ? (
                <div className="bg-white p-20 rounded-[50px] border-2 border-dashed border-gray-100 text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300"><Store size={48}/></div>
                    <h3 className="text-2xl font-black text-[#1B2559] uppercase tracking-tighter">Henüz Bir Kapı Açılmadı</h3>
                    <p className="text-gray-400 font-medium max-w-sm mx-auto mt-2">Toptancınıza <b>{code}</b> kodunuzu iletin, dükkanını buraya eklesin.</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {linkedBusinesses.map((b, index) => (
                      <Link 
                        key={index}
                        href={`/portal/${code}/store/${b.company_id}`} 
                        className="group relative bg-white p-8 rounded-[40px] border border-transparent hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10 transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-gray-50 text-blue-500 rounded-3xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                                <Store size={30}/>
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-[#1B2559] uppercase tracking-tighter group-hover:text-blue-600 transition-colors leading-none mb-2">
                                  {b.companies?.name || 'İşletme Adı'}
                                </h4>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <CalendarDays size={14} className="text-blue-400"/> Bağlantı: {new Date(b.created_at).toLocaleDateString('tr-TR')}
                                </div>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center text-gray-300 group-hover:text-blue-500 group-hover:border-blue-500 transition-all transform group-hover:translate-x-2">
                            <ChevronRight size={24}/>
                        </div>
                      </Link>
                    ))}
                </div>
             )}
          </div>

        </div>
      </main>
    </div>
  );
}