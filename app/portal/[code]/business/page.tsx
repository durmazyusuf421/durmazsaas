'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, LogOut, 
  Loader2, Rocket, FileText, TrendingDown, Wallet, Activity, 
  TrendingUp, Globe, CheckCircle2, Truck, Map, Settings
} from 'lucide-react';
import Link from 'next/link';

export default function BusinessDashboard() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
      productCount: 0, orderCount: 0, customerCount: 0, totalIncome: 0, totalExpense: 0
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchData = async () => {
    setLoading(true);
    try {
        let { data: compData } = await supabase.from('companies').select('*').eq('id', code).single();
        if (!compData) {
            const { data: nameData } = await supabase.from('companies').select('*').eq('name', code).single();
            compData = nameData;
        }

        if (compData) {
            setCompany(compData);
            const { count: pCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('company_id', compData.id);
            const { count: oCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('company_id', compData.id);
            const { count: cCount } = await supabase.from('companies').select('*', { count: 'exact', head: true }).neq('id', compData.id);
            
            const { data: invData } = await supabase.from('invoices').select('total').eq('company_id', compData.id);
            const totalInc = invData ? invData.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0) : 0;

            const { data: expData } = await supabase.from('expenses').select('amount').eq('company_id', compData.id);
            const totalExp = expData ? expData.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) : 0;

            setStats({ productCount: pCount || 0, orderCount: oCount || 0, customerCount: cCount || 0, totalIncome: totalInc, totalExpense: totalExp });
        }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { if (code) fetchData(); }, [code, supabase]);

  if (loading) return (
    <div className="h-screen bg-[#0B0E14] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#3063E9]" size={50} />
      <p className="text-[#3063E9]/50 font-black uppercase tracking-widest text-xs mt-4">Sistem Yükleniyor...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex font-sans selection:bg-[#3063E9]/30 overflow-x-hidden">
      
      <aside className="fixed top-0 left-0 h-full w-72 bg-[#0F1219] border-r border-white/5 p-8 flex flex-col z-[70] hidden lg:flex shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-gradient-to-br from-[#3063E9] to-[#BC13FE] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(48,99,233,0.3)]">
              <Rocket size={26} className="text-white" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tighter uppercase italic">Durmaz<span className="text-[#3063E9]">SaaS</span></span>
              <p className="text-[8px] font-black text-[#BC13FE] uppercase tracking-[0.3em]">Business Intelligence</p>
            </div>
        </div>
        <nav className="space-y-2 flex-1">
          <div className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-[#3063E9]/20 to-transparent border-l-4 border-[#3063E9] text-white rounded-r-xl font-bold shadow-[0_0_30px_rgba(48,99,233,0.1)]">
            <LayoutDashboard size={20} className="text-[#3063E9]"/> Komuta Merkezi
          </div>
          <Link href={`/portal/${code}/business/products`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><Package size={20} className="group-hover:text-[#3063E9]" /> Ürün Yönetimi</Link>
          <Link href={`/portal/${code}/business/orders`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><ShoppingCart size={20} className="group-hover:text-[#3063E9]" /> Gelen Siparişler</Link>
          <Link href={`/portal/${code}/business/invoices`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><FileText size={20} className="group-hover:text-[#3063E9]" /> Fatura Yönetimi</Link>
          <Link href={`/portal/${code}/business/customers`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><Users size={20} className="group-hover:text-[#3063E9]" /> Bayi Ağı</Link>
          <Link href={`/portal/${code}/business/expenses`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><TrendingDown size={20} className="group-hover:text-red-500 transition-colors" /> Gider Takibi</Link>
          
          <Link href={`/portal/${code}/business/settings`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group mt-4">
            <Settings size={20} className="group-hover:text-gray-400 transition-colors" /> Sistem Ayarları
          </Link>
        </nav>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/portal'))} className="flex items-center gap-4 px-5 py-4 text-red-500/50 hover:text-red-500 border border-red-500/10 rounded-xl font-bold transition-all mt-auto group"><LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> Güvenli Çıkış</button>
      </aside>

      <main className="flex-1 lg:ml-72 p-4 md:p-10 space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#0F1219] p-8 rounded-[40px] border border-white/5 shadow-lg">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-[#0B0E14] rounded-2xl border border-white/5"><LayoutDashboard className="text-[#3063E9]" size={28} /></div>
            <div>
                <h2 className="text-2xl font-black tracking-tight uppercase italic text-white">Komuta Merkezi</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1">İşletme: <span className="text-[#BC13FE]">{company?.name || '...'}</span></p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-[#0B0E14] px-6 py-4 rounded-3xl border border-white/5">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Sistem Çevrimiçi</span>
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1">Cari Kod: <span className="text-[#3063E9]">{code.toUpperCase()}</span></span>
            </div>
          </div>
        </div>

        <div className="bg-[#0F1219] p-8 rounded-[40px] border border-white/5 shadow-lg relative overflow-hidden h-[350px]">
            <div className="absolute top-8 left-8 z-20">
                <h3 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-3"><Map className="text-[#3063E9]" size={20}/> Canlı Bayi Ağı (Şehir Krokisi)</h3>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Aktif Lojistik ve Bağlantı Noktaları</p>
            </div>
            
            <div className="absolute inset-0 z-10 opacity-40" style={{ backgroundImage: `linear-gradient(to right, #3063E915 1px, transparent 1px), linear-gradient(to bottom, #3063E915 1px, transparent 1px)`, backgroundSize: '40px 40px' }}></div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="w-4 h-4 bg-[#BC13FE] rounded-full shadow-[0_0_30px_#BC13FE] animate-pulse relative">
                    <div className="absolute -inset-8 border border-[#BC13FE]/30 rounded-full animate-[ping_3s_linear_infinite]"></div>
                    <div className="absolute -inset-16 border border-[#BC13FE]/10 rounded-full animate-[ping_4s_linear_infinite]"></div>
                    <span className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-white uppercase tracking-widest bg-black/50 px-2 py-1 rounded">MERKEZ</span>
                </div>
            </div>

            <div className="absolute top-[30%] left-[20%] z-20 flex flex-col items-center group">
                <div className="w-2 h-2 bg-[#3063E9] rounded-full shadow-[0_0_15px_#3063E9]"></div>
                <div className="w-[1px] h-20 bg-[#3063E9]/30 -rotate-45 transform origin-top absolute top-1 left-1"></div>
            </div>
            <div className="absolute bottom-[20%] left-[30%] z-20 flex flex-col items-center">
                <div className="w-2 h-2 bg-[#3063E9] rounded-full shadow-[0_0_15px_#3063E9]"></div>
            </div>
            <div className="absolute top-[40%] right-[25%] z-20 flex flex-col items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_15px_#22c55e] animate-pulse"></div>
                <span className="text-[8px] font-bold text-gray-400 mt-2 uppercase">Aktif Sevkiyat</span>
            </div>
            <div className="absolute bottom-[35%] right-[15%] z-20 flex flex-col items-center">
                <div className="w-2 h-2 bg-[#3063E9] rounded-full shadow-[0_0_15px_#3063E9]"></div>
            </div>

            <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(48,99,233,0.1)_90deg,transparent_90deg)] rounded-full animate-[spin_4s_linear_infinite] z-10 pointer-events-none"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-[#0F1219] p-8 rounded-[40px] border border-white/5 relative overflow-hidden flex flex-col justify-between shadow-lg h-44 group">
                <div className="absolute top-6 right-6 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={60} className="text-green-500" /></div>
                <div className="w-12 h-12 bg-[#0B0E14] border border-white/5 rounded-2xl flex items-center justify-center mb-auto"><Wallet size={20} className="text-green-500"/></div>
                <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Kasa Tahsilat</p>
                    <p className="text-2xl font-black text-white">{stats.totalIncome.toLocaleString('tr-TR')} <span className="text-green-500 text-sm">₺</span></p>
                </div>
            </div>

            <div className="bg-[#0F1219] p-8 rounded-[40px] border border-white/5 relative overflow-hidden flex flex-col justify-between shadow-lg h-44 group">
                <div className="absolute top-6 right-6 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingDown size={60} className="text-red-500" /></div>
                <div className="w-12 h-12 bg-[#0B0E14] border border-white/5 rounded-2xl flex items-center justify-center mb-auto"><Activity size={20} className="text-red-500"/></div>
                <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Toplam Gider Çıkışı</p>
                    <p className="text-2xl font-black text-white">{stats.totalExpense.toLocaleString('tr-TR')} <span className="text-red-500 text-sm">₺</span></p>
                </div>
            </div>

            <div className="bg-[#0F1219] p-8 rounded-[40px] border border-white/5 relative overflow-hidden flex flex-col justify-between shadow-lg h-44 group">
                <div className="absolute top-6 right-6 opacity-5 group-hover:opacity-10 transition-opacity"><ShoppingCart size={60} className="text-[#3063E9]" /></div>
                <div className="w-12 h-12 bg-[#0B0E14] border border-white/5 rounded-2xl flex items-center justify-center mb-auto"><ShoppingCart size={20} className="text-[#3063E9]"/></div>
                <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Bekleyen Sipariş</p>
                    <p className="text-2xl font-black text-white">{stats.orderCount} <span className="text-[#3063E9] text-xs uppercase tracking-widest">Adet</span></p>
                </div>
            </div>

            <div className="bg-[#0F1219] p-6 rounded-[40px] border border-white/5 relative overflow-hidden flex flex-col justify-between shadow-lg h-44 group">
                <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-5 group-hover:opacity-10 transition-opacity"><Globe size={80} className="text-[#BC13FE]" /></div>
                
                <div className="bg-[#0B0E14] rounded-2xl p-4 flex justify-between items-center border border-white/5 relative z-10">
                    <div>
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Vitrindeki Ürün</p>
                        <p className="text-lg font-black text-white flex items-center gap-2"><Package size={14} className="text-[#BC13FE]"/> {stats.productCount}</p>
                    </div>
                </div>
                
                <div className="bg-[#0B0E14] rounded-2xl p-4 flex justify-between items-center border border-white/5 relative z-10 mt-2">
                    <div>
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Bağlı Bayiler</p>
                        <p className="text-lg font-black text-white flex items-center gap-2"><Users size={14} className="text-[#BC13FE]"/> {stats.customerCount}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#0F1219] rounded-[40px] border border-white/5 overflow-hidden shadow-lg p-8">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3 mb-6"><Truck className="text-[#3063E9]" size={18}/> Sistem Durumu</h3>
                <div className="p-6 bg-[#0B0E14] border border-white/5 rounded-3xl flex items-center gap-5 hover:border-[#3063E9]/30 transition-all">
                    <div className="w-10 h-10 bg-[#3063E9]/10 text-[#3063E9] rounded-2xl flex items-center justify-center"><CheckCircle2 size={18}/></div>
                    <div>
                        <p className="text-xs font-black text-white uppercase tracking-wider">Veritabanı Senkronize</p>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Tüm veriler güncel</p>
                    </div>
                </div>
            </div>
            
            <div className="bg-[#0F1219] rounded-[40px] border border-white/5 overflow-hidden shadow-lg p-8">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3 mb-6"><Activity className="text-[#BC13FE]" size={18}/> Finansal Özet</h3>
                <div className="p-6 bg-[#0B0E14] border border-white/5 rounded-3xl flex items-center gap-5 hover:border-green-500/30 transition-all">
                    <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center"><CheckCircle2 size={18}/></div>
                    <div>
                        <p className="text-xs font-black text-white uppercase tracking-wider">Kasa Durumu Stabil</p>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Gelir/Gider oranı normal</p>
                    </div>
                </div>
            </div>
        </div>

      </main>

      <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #3063E933; border-radius: 10px; }`}} />
    </div>
  );
}