'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, LogOut, 
  Loader2, Rocket, Menu, X, TrendingUp, Activity, 
  MapPin, Bell, ChevronRight, CheckCircle2, DollarSign, Store // <-- EKSİK İKON BURAYA EKLENDİ!
} from 'lucide-react';
import Link from 'next/link';

export default function NeonBusinessDashboard() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  
  const [company, setCompany] = useState<any>(null);
  const [stats, setStats] = useState({ revenue: 0, pendingOrders: 0, activeCustomers: 0, productCount: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Konya Merkezi');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchBusinessData = async () => {
      setLoading(true);
      // 1. İşletme Bilgisini Çek
      const { data: compData } = await supabase.from('companies').select('*').eq('company_code', code).single();
      if (compData) setCompany(compData);

      // 2. İstatistikleri ve Siparişleri Çek
      if (compData) {
          const { data: orders } = await supabase.from('orders').select('*').eq('company_id', compData.id).order('created_at', { ascending: false }).limit(5);
          
          if (orders) {
              setRecentOrders(orders);
              const pending = orders.filter(o => o.status === 'Beklemede').length;
              const revenue = orders.filter(o => o.status === 'Tamamlandı').reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
              setStats(prev => ({ ...prev, pendingOrders: pending, revenue: revenue }));
          }
      }

      setLoading(false);
    };

    if (code) fetchBusinessData();
  }, [code, supabase]);

  if (loading) return (
    <div className="h-screen bg-[#0B0E14] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#3063E9]" size={50} />
      <p className="text-[#3063E9]/50 font-black uppercase tracking-widest text-xs mt-4">Tedarik Ağı Başlatılıyor...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex font-sans selection:bg-[#3063E9]/30 overflow-x-hidden">
      
      {/* --- SIDEBAR (RESPONSIVE) --- */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      
      <aside className={`fixed top-0 left-0 h-full w-72 bg-[#0F1219] border-r border-white/5 p-8 flex flex-col z-[70] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#3063E9] to-[#BC13FE] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(48,99,233,0.3)]">
              <Rocket size={22} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter uppercase italic">Durmaz<span className="text-[#3063E9]">SaaS</span></span>
              <p className="text-[8px] font-black text-[#BC13FE] uppercase tracking-[0.3em]">Tedarikçi Modülü</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500"><X /></button>
        </div>

        <nav className="space-y-2 flex-1">
          <div className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-[#3063E9]/20 to-transparent border-l-4 border-[#3063E9] text-white rounded-r-xl font-bold transition-all shadow-lg">
            <LayoutDashboard size={20} className="text-[#3063E9]"/> Komuta Merkezi
          </div>
          
          <Link href={`/portal/${code}/business/products`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <Package size={20} className="group-hover:text-[#3063E9] transition-colors" /> Ürün Yönetimi
          </Link>

          <Link href={`/portal/${code}/business/orders`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group relative">
            <ShoppingCart size={20} className="group-hover:text-[#3063E9] transition-colors" /> Gelen Siparişler
            {stats.pendingOrders > 0 && (
                <span className="absolute right-4 bg-[#BC13FE] text-white text-[9px] font-black px-2 py-0.5 rounded-full">{stats.pendingOrders}</span>
            )}
          </Link>

          <Link href={`/portal/${code}/business/customers`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <Users size={20} className="group-hover:text-[#3063E9] transition-colors" /> Bayi Ağı
          </Link>
        </nav>

        <button onClick={() => supabase.auth.signOut().then(() => router.push('/portal'))} className="flex items-center gap-4 px-5 py-4 text-red-500/50 hover:text-red-500 border border-red-500/10 rounded-xl font-bold transition-all mt-auto">
          <LogOut size={20}/> Güvenli Çıkış
        </button>
      </aside>

      {/* --- ANA İÇERİK --- */}
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'blur-sm' : ''} flex-1 lg:ml-72 p-4 md:p-8 lg:p-10`}>
        
        {/* TOP BAR */}
        <div className="flex justify-between items-center mb-10 bg-[#0F1219] p-6 rounded-[30px] border border-white/5">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-white/5 rounded-xl border border-white/5"><Menu size={20} /></button>
            <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">Komuta Merkezi</h2>
                <p className="text-[10px] text-[#3063E9] font-bold uppercase tracking-widest mt-1">Sistem Aktif & Senkronize</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 px-6 py-3 bg-[#0B0E14] rounded-2xl border border-white/5 text-gray-400">
              <Bell size={18} className="text-[#BC13FE] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">{stats.pendingOrders} Yeni Bildirim</span>
            </div>
          </div>
        </div>

        {/* İSTATİSTİK KARTLARI (NEON GRID) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#0F1219] p-6 rounded-[30px] border border-white/5 relative overflow-hidden group hover:border-[#3063E9]/50 transition-all">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#3063E9]/10 rounded-full blur-3xl group-hover:bg-[#3063E9]/20 transition-all"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-12 h-12 bg-[#0B0E14] rounded-xl flex items-center justify-center border border-white/5 text-[#3063E9]"><DollarSign size={24}/></div>
                    <span className="bg-green-500/10 text-green-500 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1"><TrendingUp size={10}/> %12 Artış</span>
                </div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 relative z-10">Aylık Hacim</p>
                <p className="text-3xl font-black text-white relative z-10">{stats.revenue.toLocaleString('tr-TR')} <span className="text-[#3063E9] text-xl">₺</span></p>
            </div>

            <div className="bg-[#0F1219] p-6 rounded-[30px] border border-[#BC13FE]/30 relative overflow-hidden group shadow-[0_0_30px_rgba(188,19,254,0.05)]">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#BC13FE]/10 rounded-full blur-3xl group-hover:bg-[#BC13FE]/20 transition-all"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-12 h-12 bg-[#0B0E14] rounded-xl flex items-center justify-center border border-white/5 text-[#BC13FE]"><ShoppingCart size={24}/></div>
                    <span className="bg-[#BC13FE]/10 text-[#BC13FE] text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1 animate-pulse"><Activity size={10}/> Acil</span>
                </div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 relative z-10">Bekleyen Sipariş</p>
                <p className="text-3xl font-black text-white relative z-10">{stats.pendingOrders} <span className="text-[#BC13FE] text-xl">Adet</span></p>
            </div>

            <div className="bg-[#0F1219] p-6 rounded-[30px] border border-white/5 relative overflow-hidden group hover:border-orange-500/50 transition-all">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-12 h-12 bg-[#0B0E14] rounded-xl flex items-center justify-center border border-white/5 text-orange-500"><Users size={24}/></div>
                </div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 relative z-10">Aktif Bayi Ağı</p>
                <p className="text-3xl font-black text-white relative z-10">24 <span className="text-orange-500 text-xl">Nokta</span></p>
            </div>

            <div className="bg-[#0F1219] p-6 rounded-[30px] border border-white/5 relative overflow-hidden group hover:border-cyan-500/50 transition-all">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-12 h-12 bg-[#0B0E14] rounded-xl flex items-center justify-center border border-white/5 text-cyan-500"><Package size={24}/></div>
                </div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 relative z-10">Sistemdeki Ürünler</p>
                <p className="text-3xl font-black text-white relative z-10">145 <span className="text-cyan-500 text-xl">Çeşit</span></p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* HARİTA VE AĞ DURUMU (SOL 8 KOLON) */}
          <div className="lg:col-span-8 space-y-8">
            
            <div className="bg-[#0F1219] rounded-[35px] border border-white/5 overflow-hidden relative min-h-[400px] flex flex-col">
              <div className="p-6 md:p-8 flex justify-between items-center z-10 bg-gradient-to-b from-[#0F1219] to-transparent">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
                      <MapPin className="text-[#3063E9]" /> Dağıtım Ağı Radar
                  </h3>
                  <p className="text-[10px] text-[#3063E9] font-bold uppercase tracking-[0.3em] mt-1">Canlı Lojistik Takibi</p>
                </div>
                <select 
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-[#1B202A] border border-white/10 text-xs font-bold px-4 py-2 rounded-xl focus:outline-none focus:border-[#3063E9] text-gray-300 uppercase tracking-widest"
                >
                  <option value="Konya Merkezi">Konya Merkezi</option>
                  <option value="İlçeler">İlçeler Ağı</option>
                </select>
              </div>

              {/* KROKİ ALANI (TOPTANCI GÖZÜNDEN) */}
              <div className="flex-1 w-full relative flex items-center justify-center bg-[#0B0E14] overflow-hidden">
                {/* Neon Grid */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3063E9_1px,transparent_1px)] [background-size:40px_40px]"></div>
                
                {/* Merkez Toptancı Node */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-24 h-24 bg-[#3063E9]/10 border border-[#3063E9]/50 rounded-full flex items-center justify-center relative animate-pulse shadow-[0_0_40px_rgba(48,99,233,0.2)]">
                      <Store size={32} className="text-[#3063E9]" />
                  </div>
                  <p className="mt-4 font-black text-xl uppercase tracking-widest italic text-white/90">Merkez Depo</p>
                </div>

                {/* Bağlantı Çizgileri ve Bayi Noktaları */}
                <div className="absolute top-1/3 left-1/4 w-32 h-px bg-gradient-to-r from-transparent via-[#BC13FE] to-transparent rotate-45 opacity-50"></div>
                <div className="absolute top-1/4 left-[15%] w-4 h-4 bg-[#BC13FE] rounded-full shadow-[0_0_15px_#BC13FE]"></div>

                <div className="absolute bottom-1/3 right-1/4 w-48 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent -rotate-12 opacity-50"></div>
                <div className="absolute bottom-1/4 right-[20%] w-4 h-4 bg-cyan-500 rounded-full shadow-[0_0_15px_cyan]"></div>
              </div>
            </div>
          </div>

          {/* SAĞ KOLON (GELEN SİPARİŞLER & HIZLI AKSİYON) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* SON SİPARİŞLER */}
            <div className="bg-[#0F1219] p-8 rounded-[35px] border border-white/5">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-black uppercase tracking-widest text-[11px]">Son Gelen Siparişler</h4>
                <Link href={`/portal/${code}/business/orders`} className="text-[#3063E9] text-[9px] font-black uppercase hover:underline tracking-widest">Tümünü Gör</Link>
              </div>
              
              <div className="space-y-4">
                {recentOrders.length === 0 ? (
                    <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest text-center py-6">Henüz sipariş yok.</p>
                ) : (
                    recentOrders.map((order, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-[#0B0E14] rounded-2xl border border-white/5 group hover:border-[#3063E9]/30 transition-all cursor-pointer">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${order.status === 'Beklemede' ? 'bg-[#BC13FE]/10 text-[#BC13FE]' : 'bg-green-500/10 text-green-500'}`}>
                            {order.status === 'Beklemede' ? <ShoppingCart size={18} /> : <CheckCircle2 size={18} />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[11px] font-black uppercase text-gray-300 truncate">{order.customer_cari_code || 'Bilinmeyen Bayi'}</p>
                            <p className="text-[9px] font-bold text-gray-500 mt-1 uppercase tracking-widest">{Number(order.total_amount || 0).toLocaleString('tr-TR')} ₺</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
                    </div>
                    ))
                )}
              </div>
            </div>

            {/* SİSTEM SAĞLIĞI (CYBER GRAPH) */}
            <div className="bg-[#0F1219] p-8 rounded-[35px] border border-white/5">
              <h4 className="font-black uppercase tracking-widest text-[11px] text-gray-500 mb-6">Sistem Yük Durumu</h4>
              <div className="space-y-5">
                {[
                  { name: 'Sunucu Tepkimesi', value: 92, color: 'bg-green-500' },
                  { name: 'Stok Senkronizasyonu', value: 100, color: 'bg-[#3063E9]' },
                  { name: 'Ağ Yoğunluğu', value: 45, color: 'bg-[#BC13FE]' }
                ].map((s) => (
                  <div key={s.name}>
                    <div className="flex justify-between text-[9px] font-black uppercase mb-2 tracking-widest">
                      <span>{s.name}</span>
                      <span className="text-white/50">%{s.value}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0B0E14] rounded-full overflow-hidden border border-white/5">
                      <div className={`h-full ${s.color} shadow-[0_0_10px_currentColor]`} style={{ width: `${s.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* GÜVENLİ CSS ENJEKSİYONU */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3063E933; border-radius: 10px; }
      `}} />
    </div>
  );
}