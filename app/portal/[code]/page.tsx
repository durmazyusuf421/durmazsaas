'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingBag, FileText, LogOut, Loader2, Store, 
  UserCircle, Rocket, Barcode, Bell, Settings, Menu, X, Activity, 
  Map as MapIcon, ChevronRight, Search
} from 'lucide-react';
import Link from 'next/link';

export default function FullyResponsiveDashboard() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobil Menü Kontrolü
  const [selectedCity, setSelectedCity] = useState('Konya');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/portal'); return; }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('global_cari_code', code).single();
      if (profileData) setProfile(profileData);
      setLoading(false);
    };
    fetchData();
  }, [code]);

  if (loading) return (
    <div className="h-screen bg-[#0B0E14] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#BC13FE]" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-[#BC13FE]/30 overflow-x-hidden">
      
      {/* --- SIDEBAR (RESPONSIVE) --- */}
      {/* Mobil Arka Plan Karartma */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-[#0F1219] border-r border-white/5 p-8 flex flex-col z-[70] transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#3063E9] to-[#BC13FE] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(188,19,254,0.3)]">
              <Rocket size={22} />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">Durmaz<span className="text-[#BC13FE]">SaaS</span></span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500"><X /></button>
        </div>

        <nav className="space-y-2 flex-1">
          <button className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-[#BC13FE]/20 to-transparent border-l-4 border-[#BC13FE] text-white rounded-r-xl font-bold transition-all">
            <LayoutDashboard size={20} className="text-[#BC13FE]"/> Ana Sayfa
          </button>
          
          <Link href={`/portal/${code}/stores`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <Store size={20} className="group-hover:text-[#BC13FE]" /> Sipariş Ver
          </Link>

          <Link href={`/portal/${code}/orders`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <ShoppingBag size={20} className="group-hover:text-[#BC13FE]" /> Sipariş & Mutabakat
          </Link>

          <Link href={`/portal/${code}/pos`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <Barcode size={20} className="group-hover:text-[#BC13FE]" /> Hızlı Satış (POS)
          </Link>
        </nav>

        <button onClick={() => supabase.auth.signOut().then(() => router.push('/portal'))} className="mt-auto flex items-center gap-4 px-5 py-4 text-red-500/50 hover:text-red-500 border border-red-500/10 rounded-xl font-bold transition-all">
          <LogOut size={20}/> Güvenli Çıkış
        </button>
      </aside>

      {/* --- ANA İÇERİK --- */}
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'blur-sm' : ''} lg:ml-72 p-4 md:p-8 lg:p-10`}>
        
        {/* TOP BAR */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-3 bg-[#0F1219] rounded-xl border border-white/5"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-xl md:text-3xl font-black tracking-tight uppercase">Ana Sayfa</h2>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            {/* Bildirim İkonu (Mobilde Gizlenebilir) */}
            <div className="hidden sm:flex bg-[#0F1219] p-3 rounded-xl border border-white/5 text-gray-500 relative">
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-[#BC13FE] rounded-full"></span>
            </div>
            {/* Profil */}
            <div className="flex items-center gap-3 bg-[#0F1219] p-1.5 md:p-2 rounded-2xl border border-white/5">
              <div className="hidden md:block text-right px-2">
                <p className="text-[10px] font-black uppercase leading-none">{profile?.full_name}</p>
                <p className="text-[8px] text-gray-500 font-bold mt-1 tracking-widest">{code}</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#BC13FE]/20 to-[#3063E9]/20 rounded-xl flex items-center justify-center border border-white/5">
                <UserCircle size={20} className="text-[#BC13FE]" />
              </div>
            </div>
          </div>
        </div>

        {/* DASHBOARD GRID */}
        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          
          {/* HARİTA VE ANA DURUM (SOL/ÜST) */}
          <div className="col-span-12 lg:col-span-8 space-y-6 lg:space-y-8">
            
            {/* CANLI KROKİ KARTI */}
            <div className="bg-[#0F1219] rounded-[30px] border border-white/5 overflow-hidden relative min-h-[400px] flex flex-col">
              <div className="p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10">
                <div>
                  <h3 className="text-base md:text-lg font-black uppercase tracking-tighter">Durmazsaas - {selectedCity} Ağı</h3>
                  <div className="flex items-center gap-2 text-[8px] md:text-[10px] text-[#BC13FE] font-black uppercase tracking-widest mt-1">
                    <span className="w-2 h-2 bg-[#BC13FE] rounded-full animate-pulse"></span> Canlı Veri Akışı
                  </div>
                </div>
                <select 
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full sm:w-auto bg-[#1B202A] border border-white/10 text-[10px] font-bold px-4 py-2 rounded-xl focus:border-[#BC13FE] transition-colors"
                >
                  <option value="Konya">Konya Bağlantı Ağı</option>
                  <option value="İstanbul">İstanbul Bağlantı Ağı</option>
                  <option value="Ankara">Ankara Bağlantı Ağı</option>
                </select>
              </div>

              {/* KROKİ ALANI (RESPONSIVE SVG/IMAGE) */}
              <div className="flex-1 relative bg-[#0B0E14] flex items-center justify-center p-10 overflow-hidden">
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#BC13FE_1px,transparent_1px)] [background-size:30px_30px]"></div>
                
                {/* Core Visual */}
                <div className="relative">
                  <div className="absolute inset-0 bg-[#BC13FE]/20 blur-[100px] rounded-full"></div>
                  <div className="w-16 h-16 md:w-24 md:h-24 border-2 border-[#BC13FE]/50 rounded-full flex items-center justify-center relative animate-spin-slow">
                    <div className="w-2 h-2 bg-[#BC13FE] rounded-full absolute -top-1 shadow-[0_0_15px_#BC13FE]"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center font-black text-xs md:text-lg italic uppercase tracking-widest text-white/80">
                    Durmaz
                  </div>
                </div>

                {/* Bağlantı Noktaları (Mobilde Sadelestirilmis) */}
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3063E9]"></div>
                <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-[#BC13FE] rounded-full shadow-[0_0_10px_#BC13FE]"></div>
              </div>
            </div>

            {/* HABERLER (SCROLLABLE) */}
            <div className="bg-[#0F1219] p-6 md:p-8 rounded-[30px] border border-white/5">
              <h4 className="font-black uppercase tracking-widest text-xs mb-6">Sistem Haberleri</h4>
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-[#BC13FE]/30 transition-all cursor-pointer group">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#BC13FE]/10 to-transparent rounded-xl flex items-center justify-center text-[#BC13FE]">
                      <Activity size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-bold">Yeni Lojistik Noktası Eklendi: {selectedCity}</p>
                      <p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">2 Dakika Önce</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-700 group-hover:text-white" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SAĞ KOLON (STATİSTİKLER VE AKSİYONLAR) */}
          <div className="col-span-12 lg:col-span-4 space-y-6 lg:space-y-8">
            
            {/* HIZLI AKSİYONLAR GRID */}
            <div className="bg-[#0F1219] p-6 md:p-8 rounded-[30px] border border-white/5">
              <h4 className="font-black uppercase tracking-widest text-xs mb-6">Hızlı Menü</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Store />, label: 'Marketler', color: 'text-blue-500' },
                  { icon: <ShoppingBag />, label: 'Siparişler', color: 'text-purple-500' },
                  { icon: <Barcode />, label: 'POS Satış', color: 'text-[#BC13FE]' },
                  { icon: <FileText />, label: 'Faturalar', color: 'text-orange-500' }
                ].map((item, idx) => (
                  <button key={idx} className="bg-white/5 border border-white/5 p-4 rounded-[25px] hover:bg-white/10 transition-all flex flex-col items-center gap-3">
                    <div className={`${item.color} bg-white/5 p-3 rounded-xl`}>{item.icon}</div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CANLI TRAFİK (GRAFİK) */}
            <div className="bg-[#0F1219] p-6 md:p-8 rounded-[30px] border border-white/5">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-black uppercase tracking-widest text-[10px] text-gray-500">Ağ Yoğunluğu</h4>
                <span className="text-[10px] font-black text-green-500 animate-pulse">LIVE</span>
              </div>
              <div className="h-24 w-full flex items-end gap-1.5 px-2">
                {[40, 60, 45, 90, 100, 80, 55, 70, 85, 50, 65, 95].map((h, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-[#BC13FE]/20 to-[#BC13FE] rounded-t-sm transition-all duration-1000" style={{ height: `${h}%` }}></div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-[8px] font-black text-gray-600 uppercase">
                <span>08:00</span>
                <span>14:00</span>
                <span>20:00</span>
              </div>
            </div>

            {/* BÖLGESEL VERİLER (PROGRESS) */}
            <div className="bg-[#0F1219] p-6 md:p-8 rounded-[30px] border border-white/5">
              <h4 className="font-black uppercase tracking-widest text-[10px] text-gray-500 mb-6">Aktif Bölge Kullanımı</h4>
              <div className="space-y-5">
                {[
                  { name: 'Karatay', value: 88, color: 'bg-[#BC13FE]' },
                  { name: 'Selçuklu', value: 65, color: 'bg-blue-500' },
                  { name: 'Meram', value: 42, color: 'bg-cyan-500' }
                ].map((b) => (
                  <div key={b.name}>
                    <div className="flex justify-between text-[10px] font-black uppercase mb-2 tracking-widest">
                      <span>{b.name}</span>
                      <span className="text-white/50">%{b.value}</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${b.color} shadow-[0_0_10px_rgba(188,19,254,0.5)]`} style={{ width: `${b.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* MODAL CSS - Animasyonlar */}
      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #BC13FE33;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}