'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, LogOut, 
  Loader2, Rocket, Menu, X, CheckCircle2, Clock, 
  Truck, Search, FileText, TrendingDown, Settings
} from 'lucide-react';
import Link from 'next/link';

export default function BusinessOrdersPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const fetchOrders = async () => {
    setLoading(true);
    let { data: compData } = await supabase.from('companies').select('*').eq('id', code).single();
    if (!compData) { const { data: nameData } = await supabase.from('companies').select('*').eq('name', code).single(); compData = nameData; }
    if (compData) { const { data: ordersData } = await supabase.from('orders').select('*').eq('company_id', compData.id).order('created_at', { ascending: false }); if (ordersData) setOrders(ordersData); }
    setLoading(false);
  };

  useEffect(() => { if (code) fetchOrders(); }, [code]);

  if (loading) return <div className="h-screen bg-[#0B0E14] flex flex-col items-center justify-center"><Loader2 className="animate-spin text-[#3063E9]" size={50} /></div>;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex font-sans overflow-x-hidden">
      <aside className="fixed top-0 left-0 h-full w-72 bg-[#0F1219] border-r border-white/5 p-8 flex flex-col z-[70] hidden lg:flex shadow-2xl">
        <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-gradient-to-br from-[#3063E9] to-[#BC13FE] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(48,99,233,0.3)]"><Rocket size={26} className="text-white" /></div>
            <div><span className="text-2xl font-black uppercase italic text-white">Durmaz<span className="text-[#3063E9]">SaaS</span></span><p className="text-[8px] font-black text-[#BC13FE] uppercase tracking-[0.3em]">Business Intelligence</p></div>
        </div>
        <nav className="space-y-2 flex-1">
          <Link href={`/portal/${code}/business`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><LayoutDashboard size={20} className="group-hover:text-[#3063E9]"/> Komuta Merkezi</Link>
          <Link href={`/portal/${code}/business/products`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><Package size={20} className="group-hover:text-[#3063E9]" /> Ürün Yönetimi</Link>
          <div className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-[#3063E9]/20 to-transparent border-l-4 border-[#3063E9] text-white rounded-r-xl font-bold shadow-lg"><ShoppingCart size={20} className="text-[#3063E9]" /> Gelen Siparişler</div>
          <Link href={`/portal/${code}/business/invoices`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><FileText size={20} className="group-hover:text-[#3063E9]" /> Fatura Yönetimi</Link>
          <Link href={`/portal/${code}/business/customers`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><Users size={20} className="group-hover:text-[#3063E9]" /> Bayi Ağı</Link>
          <Link href={`/portal/${code}/business/expenses`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><TrendingDown size={20} className="group-hover:text-red-500 transition-colors" /> Gider Takibi</Link>
          
          {/* SİSTEM AYARLARI EKLENDİ */}
          <Link href={`/portal/${code}/business/settings`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group mt-4"><Settings size={20} className="group-hover:text-gray-400 transition-colors" /> Sistem Ayarları</Link>
        </nav>
      </aside>
      <main className="flex-1 lg:ml-72 p-10">
        <div className="flex justify-between items-center mb-10 bg-[#0F1219] p-8 rounded-[40px] border border-white/5 shadow-2xl">
          <h2 className="text-3xl font-black uppercase italic"><ShoppingCart className="inline mr-3 text-[#3063E9]" /> Siparişler</h2>
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Aktif Talepler: {orders.length}</div>
        </div>
        <div className="space-y-6">
            {orders.length === 0 ? (
                <div className="bg-[#0F1219] rounded-[30px] border border-white/5 p-20 text-center text-gray-600 font-bold uppercase text-xs tracking-[0.3em]">Ağda aktif sipariş bulunamadı.</div>
            ) : (
                orders.map((o) => (
                    <div key={o.id} className="bg-[#0F1219] rounded-[35px] border border-white/5 p-8 flex justify-between items-center hover:border-[#3063E9]/30 transition-all group shadow-lg">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-[#0B0E14] text-[#3063E9] rounded-2xl flex items-center justify-center"><Truck size={24}/></div>
                            <div>
                                <h4 className="text-lg font-black uppercase text-white tracking-tight">{o.customer_cari_code || 'BİLİNMEYEN BAYİ'}</h4>
                                <p className="text-[10px] text-gray-600 font-bold uppercase mt-1 tracking-widest">Sipariş ID: {o.id.slice(0,8)}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-black text-white">{Number(o.total_amount).toLocaleString('tr-TR')} ₺</p>
                            <span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase bg-[#3063E9]/10 text-[#3063E9] border border-[#3063E9]/20">{o.status}</span>
                        </div>
                    </div>
                ))
            )}
        </div>
      </main>
    </div>
  );
}