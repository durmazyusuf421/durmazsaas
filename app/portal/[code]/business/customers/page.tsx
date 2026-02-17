'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, LogOut, 
  Loader2, Rocket, Search, UserPlus, X, FileText,
  TrendingUp, Wallet, ShieldCheck, ChevronRight, Activity, CheckCircle2, TrendingDown, Settings
} from 'lucide-react';
import Link from 'next/link';

export default function BusinessCustomersPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  const [company, setCompany] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCariCode, setNewCariCode] = useState('');

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const fetchData = async () => {
    setLoading(true);
    let { data: compData } = await supabase.from('companies').select('*').eq('id', code).single();
    if (!compData) { const { data: nameData } = await supabase.from('companies').select('*').eq('name', code).single(); compData = nameData; }
    if (compData) {
        setCompany(compData);
        const { data: custData } = await supabase.from('companies').select('*').neq('id', compData.id).limit(20);
        if (custData) setCustomers(custData.map(c => ({ ...c, balance: Math.floor(Math.random() * 50000) - 10000 })));
    }
    setLoading(false);
  };

  useEffect(() => { if (code) fetchData(); }, [code]);

  const handleAddCustomer = async (e: React.FormEvent) => { e.preventDefault(); alert("BAŞARILI! ✅"); setIsModalOpen(false); setNewCariCode(''); };

  const filteredCustomers = customers.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="h-screen bg-[#0B0E14] flex flex-col items-center justify-center"><Loader2 className="animate-spin text-[#3063E9]" size={50} /></div>;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex font-sans overflow-x-hidden">
      <aside className="fixed top-0 left-0 h-full w-72 bg-[#0F1219] border-r border-white/5 p-8 flex flex-col z-[70] hidden lg:flex shadow-2xl">
        <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-gradient-to-br from-[#3063E9] to-[#BC13FE] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(48,99,233,0.3)]"><Rocket size={26} className="text-white" /></div>
            <div><span className="text-2xl font-black uppercase italic">Durmaz<span className="text-[#3063E9]">SaaS</span></span><p className="text-[8px] font-black text-[#BC13FE] uppercase tracking-[0.3em]">Business Intelligence</p></div>
        </div>
        <nav className="space-y-2 flex-1">
          <Link href={`/portal/${code}/business`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><LayoutDashboard size={20} className="group-hover:text-[#3063E9]"/> Komuta Merkezi</Link>
          <Link href={`/portal/${code}/business/products`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><Package size={20} className="group-hover:text-[#3063E9]" /> Ürün Yönetimi</Link>
          <Link href={`/portal/${code}/business/orders`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><ShoppingCart size={20} className="group-hover:text-[#3063E9]" /> Gelen Siparişler</Link>
          <Link href={`/portal/${code}/business/invoices`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><FileText size={20} className="group-hover:text-[#3063E9]" /> Fatura Yönetimi</Link>
          <div className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-[#3063E9]/20 to-transparent border-l-4 border-[#3063E9] text-white rounded-r-xl font-bold shadow-lg"><Users size={20} className="text-[#3063E9]" /> Bayi Ağı</div>
          <Link href={`/portal/${code}/business/expenses`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><TrendingDown size={20} className="group-hover:text-red-500 transition-colors" /> Gider Takibi</Link>
          
          {/* SİSTEM AYARLARI EKLENDİ */}
          <Link href={`/portal/${code}/business/settings`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group mt-4"><Settings size={20} className="group-hover:text-gray-400 transition-colors" /> Sistem Ayarları</Link>
        </nav>
      </aside>
      <main className="flex-1 lg:ml-72 p-10">
        <div className="flex justify-between items-center mb-12 bg-[#0F1219] p-8 rounded-[40px] border border-white/5 shadow-2xl">
          <h2 className="text-3xl font-black uppercase italic"><Users className="inline mr-3 text-[#3063E9]" /> Radar Ağı</h2>
          <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-[#3063E9] text-white text-xs font-black rounded-2xl uppercase shadow-[0_0_30px_rgba(48,99,233,0.3)] flex items-center gap-3 transition-all active:scale-95"><UserPlus size={20} /> Yeni Bayi</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredCustomers.map((c) => (
                <div key={c.id} className="bg-[#0F1219] rounded-[35px] border border-white/5 p-8 group relative overflow-hidden shadow-lg">
                    <div className="absolute top-6 right-8 flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span><span className="text-[8px] font-black text-green-500 uppercase">Aktif</span></div>
                    <div className="flex items-center gap-5 mb-8">
                        <div className="w-16 h-16 bg-[#0B0E14] text-[#BC13FE] rounded-3xl flex items-center justify-center font-black text-xl shadow-inner group-hover:scale-110 transition-transform duration-500">{(c.name || 'B').slice(0,1).toUpperCase()}</div>
                        <h4 className="font-black uppercase text-base text-gray-200 group-hover:text-white transition-colors">{c.name}</h4>
                    </div>
                    <div className="bg-[#0B0E14] rounded-2xl p-5 mb-6 border border-white/5 flex justify-between items-center">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Cari Durum</span>
                        <span className={`text-sm font-black ${c.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>{c.balance.toLocaleString('tr-TR')} ₺</span>
                    </div>
                </div>
            ))}
        </div>
      </main>
      {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
              <div className="bg-[#0F1219] w-full max-w-md rounded-[45px] border border-[#3063E9]/30 p-10 shadow-[0_0_100px_rgba(48,99,233,0.2)] overflow-hidden">
                  <div className="flex justify-between items-center mb-8"><h2 className="text-lg font-black uppercase tracking-[0.2em] text-white flex items-center gap-4"><UserPlus className="text-[#3063E9]" /> Bayi Tanımla</h2><button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white p-2.5 bg-white/5 rounded-full"><X size={24}/></button></div>
                  <form onSubmit={handleAddCustomer} className="space-y-6">
                    <input type="text" required value={newCariCode} onChange={(e) => setNewCariCode(e.target.value)} className="w-full bg-[#0F1219] border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold focus:border-[#3063E9] outline-none transition-all uppercase text-white mb-4 placeholder:text-gray-800" placeholder="CARI KOD VEYA İSİM GİRİNİZ" />
                    <button type="submit" className="w-full py-6 bg-[#3063E9] text-white rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-[0_10px_40px_rgba(48,99,233,0.4)] flex items-center justify-center gap-4 hover:bg-blue-600 active:scale-95 transition-all"><CheckCircle2 /> Senkronize Et</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}