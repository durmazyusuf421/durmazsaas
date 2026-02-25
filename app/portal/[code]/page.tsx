'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingBag, FileText, LogOut, Loader2, Store, 
  UserCircle, Rocket, Barcode, Bell, Menu, X, Activity, 
  Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, BarChart3, 
  ArrowRightLeft
} from 'lucide-react';
import Link from 'next/link';

export default function CustomerDashboard() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 🚀 DİNAMİK VERİ STATE'LERİ
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [networkCount, setNetworkCount] = useState<number>(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // GRAFİK SEKMESİ (Alım / Satış) Kontrolü
  const [chartType, setChartType] = useState<'alim' | 'satis'>('alim');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/portal'); return; }

        const cariKodu = decodeURIComponent(code).trim().toUpperCase();

        // 1. Profil Bilgisini Çek
        const { data: profileData } = await supabase.from('profiles').select('*').eq('global_cari_code', cariKodu).single();
        if (profileData) setProfile(profileData);

        // 2. Gerçek Bakiyeyi ve İşletme Sayısını Çek
        const { data: customerRecords } = await supabase
            .from('customers')
            .select(`id, balance, company_id, companies ( name )`)
            .eq('code', cariKodu);

        if (customerRecords && customerRecords.length > 0) {
            const calculatedTotal = customerRecords.reduce((acc, curr) => acc + (curr.balance || 0), 0);
            setTotalBalance(calculatedTotal);
            setNetworkCount(customerRecords.length);

            // 3. Gerçek Siparişleri/Faturaları Çek
            const customerIds = customerRecords.map(r => r.id);
            const { data: invoicesData } = await supabase
                .from('invoices')
                .select(`id, invoice_no, total_amount, status, created_at, companies ( name )`)
                .in('customer_id', customerIds)
                .order('created_at', { ascending: false })
                .limit(4);

            if (invoicesData) {
                setRecentOrders(invoicesData.map((inv: any) => ({
                    id: inv.invoice_no || `INV-${inv.id.substring(0,4)}`,
                    store: inv.companies?.name || 'Bilinmeyen İşletme',
                    status: inv.status || 'İşlemde',
                    amount: `₺${(inv.total_amount || 0).toLocaleString('tr-TR')}`,
                    date: new Date(inv.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
                    statusColor: inv.status === 'Tamamlandı' ? 'text-green-500 bg-green-500/10' : 'text-blue-500 bg-blue-500/10'
                })));
            }
        }
      } catch (err) {
          console.error("Dashboard Veri Hatası:", err);
      } finally {
          setLoading(false);
      }
    };
    fetchData();
  }, [code, router, supabase]);

  if (loading) return (
    <div className="h-screen bg-[#0B0E14] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#BC13FE]" size={48} />
      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black animate-pulse">Siber Terminal Hazırlanıyor</p>
    </div>
  );

  // Sahte (Taslak) Grafik Verileri (Daha Sonra Backend'e Bağlanabilir)
  const alimVerisi = [
    { day: 'Pzt', val: 0, amount: '₺0' }, { day: 'Sal', val: 0, amount: '₺0' },
    { day: 'Çar', val: 0, amount: '₺0' }, { day: 'Per', val: 0, amount: '₺0' },
    { day: 'Cum', val: 0, amount: '₺0', active: true }, { day: 'Cmt', val: 0, amount: '₺0' },
    { day: 'Paz', val: 0, amount: '₺0' }
  ];

  const aktifVeri = alimVerisi;
  const aktifRenk = 'from-[#BC13FE]/40 to-[#BC13FE]';
  const textRenk = 'text-[#BC13FE]';

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-[#BC13FE]/30 overflow-x-hidden">
      
      {/* --- SIDEBAR --- */}
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
          <button className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-[#BC13FE]/20 to-transparent border-l-4 border-[#BC13FE] text-white rounded-r-xl font-bold transition-all shadow-lg">
            <LayoutDashboard size={20} className="text-[#BC13FE]"/> Ana Sayfa
          </button>
          <Link href={`/portal/${code}/stores`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <Store size={20} className="group-hover:text-[#BC13FE]" /> İşletmeler & Market
          </Link>
          <Link href={`/portal/${code}/orders`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <ShoppingBag size={20} className="group-hover:text-[#BC13FE]" /> Siparişlerim
          </Link>
          <Link href={`/portal/${code}/billing`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <FileText size={20} className="group-hover:text-[#BC13FE]" /> Hesap & Faturalar
          </Link>
        </nav>

        <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="mt-auto flex items-center gap-4 px-5 py-4 text-red-500/50 hover:text-red-500 border border-red-500/10 rounded-xl font-bold transition-all hover:bg-red-500/10">
          <LogOut size={20}/> Sistemden Çık
        </button>
      </aside>

      {/* --- ANA İÇERİK --- */}
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'blur-sm' : ''} lg:ml-72 p-4 md:p-8 lg:p-10 relative`}>
        
        {/* Arka Plan Glow */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#BC13FE]/5 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* TOP BAR */}
        <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-[#0F1219] rounded-xl border border-white/5">
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-xl md:text-3xl font-black tracking-tight uppercase italic">{profile?.full_name?.split(' ')[0] || 'Müşteri'} Terminali</h2>
              <div className="flex items-center gap-2 mt-1">
                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ağ Bağlantısı Aktif</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden sm:flex bg-[#0F1219] p-3 rounded-xl border border-white/5 text-gray-500 relative cursor-pointer hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#BC13FE] rounded-full shadow-[0_0_10px_#BC13FE]"></span>
            </div>
            <div className="flex items-center gap-3 bg-[#0F1219] p-1.5 md:p-2 rounded-2xl border border-white/5">
              <div className="hidden md:block text-right px-2">
                <p className="text-[10px] font-black uppercase leading-none">{profile?.full_name}</p>
                <p className="text-[8px] text-[#BC13FE] font-black mt-1 tracking-widest">{code}</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#BC13FE]/20 to-[#3063E9]/20 rounded-xl flex items-center justify-center border border-white/5">
                <UserCircle size={20} className="text-[#BC13FE]" />
              </div>
            </div>
          </div>
        </div>

        {/* DASHBOARD GRID */}
        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          
          {/* FİNANSAL ÖZET (ÜST 3 KART) */}
          <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Kart: DİNAMİK TOPLAM BORÇ */}
            <div className="bg-[#0F1219] rounded-[30px] border border-white/5 p-8 relative overflow-hidden group hover:border-[#BC13FE]/30 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#BC13FE]/10 blur-3xl rounded-full" />
              <div className="w-12 h-12 bg-[#BC13FE]/10 rounded-2xl flex items-center justify-center mb-6 text-[#BC13FE]">
                <Wallet size={24} />
              </div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Ağ Geneli Toplam Bakiye</p>
              <h3 className="text-4xl font-black italic">₺{totalBalance.toLocaleString('tr-TR')}</h3>
              <div className="mt-6 flex items-center gap-2 text-[#BC13FE] text-[9px] font-black uppercase bg-[#BC13FE]/10 w-fit px-3 py-1.5 rounded-full tracking-widest">
                <Store size={14} /> {networkCount === 0 ? 'Hiçbir Ağa Kayıtlı Değil' : `${networkCount} Farklı Toptancıda`}
              </div>
            </div>

            {/* 2. Kart: Aylık Alım Hacmi (Şimdilik Statik Sıfır) */}
            <div className="bg-[#0F1219] rounded-[30px] border border-white/5 p-8 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-500">
                <TrendingUp size={24} />
              </div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Bu Ayki Toptan Alım</p>
              <h3 className="text-4xl font-black italic">₺0<span className="text-lg text-gray-500">,00</span></h3>
              <div className="mt-6 flex items-center gap-2 text-blue-400 text-[9px] font-black uppercase bg-blue-500/10 w-fit px-3 py-1.5 rounded-full tracking-widest">
                <Activity size={14} /> Veri Bekleniyor
              </div>
            </div>

            {/* 3. Kart: Hızlı Aksiyon */}
            <div className="bg-gradient-to-br from-[#1A0B2E] to-[#0F1219] rounded-[30px] border border-[#BC13FE]/20 p-8 relative overflow-hidden flex flex-col justify-between group">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#BC13FE_1px,transparent_1px)] [background-size:20px_20px]" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-3 h-3 rounded-full ${networkCount > 0 ? 'bg-[#BC13FE] shadow-[0_0_15px_#BC13FE] animate-pulse' : 'bg-gray-600'}`} />
                  <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${networkCount > 0 ? 'text-[#BC13FE]' : 'text-gray-500'}`}>
                    {networkCount > 0 ? 'Siber Pazar Aktif' : 'Pazar Kapalı'}
                  </p>
                </div>
                <h3 className="text-2xl font-black italic uppercase leading-tight mb-2">Toptancıları <br/> Keşfet</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Güncel fiyatlara göz at.</p>
              </div>
              <Link href={`/portal/${code}/stores`} className="relative z-10 mt-6 w-full py-4 bg-[#BC13FE] hover:bg-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 transition-colors">
                <Store size={16} /> Pazara Gir
              </Link>
            </div>
          </div>

          {/* SOL KOLON: DİNAMİK SİPARİŞLER VE GRAFİK */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {/* 1. DİNAMİK SİPARİŞ RADARI */}
            <div className="bg-[#0F1219] rounded-[30px] border border-white/5 p-8">
              <div className="flex justify-between items-center mb-8">
                <h4 className="font-black uppercase tracking-widest text-sm italic">Aktif Sipariş Radarı</h4>
                <Link href={`/portal/${code}/orders`} className="text-[10px] font-black text-[#BC13FE] uppercase tracking-widest hover:underline">Tümünü Gör</Link>
              </div>
              
              <div className="space-y-4">
                {recentOrders.length === 0 ? (
                  <div className="py-10 text-center text-gray-600">
                    <ShoppingBag size={40} className="mx-auto mb-4 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest">Bekleyen Sipariş Yok</p>
                  </div>
                ) : (
                  recentOrders.map((order, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-[#BC13FE]/30 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black/50 rounded-xl flex items-center justify-center border border-white/5">
                          <ShoppingBag size={20} className="text-gray-400 group-hover:text-[#BC13FE] transition-colors" />
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight">{order.store}</p>
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">{order.id} • {order.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                        <span className="font-black text-md italic">{order.amount}</span>
                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest ${order.statusColor}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. DİNAMİK TİCARET GRAFİĞİ (TASLAK SIFIR) */}
            <div className="bg-[#0F1219] rounded-[30px] border border-white/5 p-8 relative overflow-hidden group transition-all">
              <div className="absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full pointer-events-none transition-colors duration-1000 bg-[#BC13FE]/5" />
              
              <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-end mb-8 relative z-10 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#BC13FE]/10 text-[#BC13FE]">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h4 className="font-black uppercase tracking-widest text-sm italic">Haftalık Ticaret Radarı</h4>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Son 7 Günlük Alım Hacmi</p>
                  </div>
                </div>
              </div>

              {/* Grafik Alanı */}
              <div className="h-48 flex items-end gap-2 sm:gap-4 mt-8 relative z-10 pt-4 border-b border-white/5">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="w-full h-[1px] bg-white/20 border-t border-dashed border-white/30" />
                  <div className="w-full h-[1px] bg-white/20 border-t border-dashed border-white/30" />
                  <div className="w-full h-[1px] bg-white/20 border-t border-dashed border-white/30" />
                </div>

                {aktifVeri.map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar h-full">
                    <div className="w-full relative flex items-end justify-center h-full">
                      <div className="w-full max-w-[40px] rounded-t-xl transition-all duration-500 relative cursor-pointer bg-white/5" style={{ height: '0%' }}></div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{item.day}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>Haftalık Toplam Alım:</span>
                <span className="text-sm italic text-[#BC13FE]">₺0</span>
              </div>
            </div>

          </div>

          {/* SAĞ KOLON: HIZLI MENÜ & SON ÖDEMELER */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            {/* HIZLI MENÜ */}
            <div className="bg-[#0F1219] p-8 rounded-[30px] border border-white/5">
              <h4 className="font-black uppercase tracking-widest text-xs mb-6 italic">Hızlı Erişim</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Store />, label: 'Market', link: `/portal/${code}/stores`, color: 'text-[#3063E9]' },
                  { icon: <Barcode />, label: 'Market', link: `/portal/${code}/stores`, color: 'text-blue-500' },
                  { icon: <ShoppingBag />, label: 'Siparişler', link: `/portal/${code}/orders`, color: 'text-[#BC13FE]' },
                  { icon: <FileText />, label: 'Faturalar', link: `/portal/${code}/billing`, color: 'text-green-500' }
                ].map((item, idx) => (
                  <Link href={item.link} key={idx} className="bg-white/[0.02] border border-white/5 p-5 rounded-[20px] hover:bg-white/10 hover:border-[#BC13FE]/50 transition-all flex flex-col items-center gap-3 group">
                    <div className={`${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-white">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* SON ÖDEMELER (TASLAK) */}
            <div className="bg-[#0F1219] p-8 rounded-[30px] border border-white/5">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-black uppercase tracking-widest text-[10px] text-gray-500">Son Dekontlar</h4>
              </div>
              <div className="space-y-4">
                 <div className="py-6 text-center text-gray-600">
                    <ArrowDownLeft size={30} className="mx-auto mb-3 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Kayıtlı Ödeme Yok</p>
                 </div>
              </div>
            </div>

          </div>
        </div>
      </main>

    </div>
  );
}