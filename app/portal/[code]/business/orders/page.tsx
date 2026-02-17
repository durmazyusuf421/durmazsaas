'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, LogOut, 
  Loader2, Rocket, Menu, X, CheckCircle2, Clock, 
  Truck, Eye, AlertCircle, Search
} from 'lucide-react';
import Link from 'next/link';

export default function BusinessOrdersPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  
  const [company, setCompany] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const { data: compData } = await supabase.from('companies').select('*').eq('company_code', code).single();
      
      if (compData) {
          setCompany(compData);
          const { data: ordersData } = await supabase
              .from('orders')
              .select('*')
              .eq('company_id', compData.id)
              .order('created_at', { ascending: false });

          if (ordersData) {
              const enriched = ordersData.map(order => {
                  let parsedItems = [];
                  try { parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items; } 
                  catch (e) { parsedItems = []; }
                  return { ...order, parsed_items: parsedItems };
              });
              setOrders(enriched);
          }
      }
      setLoading(false);
    };

    if (code) fetchOrders();
  }, [code, supabase]);

  // Durum Güncelleme (Toptancı Onayı)
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
      setProcessingId(orderId);
      try {
          const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
          if (error) throw error;
          
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } catch (error: any) {
          alert("Hata oluştu: " + error.message);
      } finally {
          setProcessingId(null);
      }
  };

  const filteredOrders = orders.filter(o => 
      o.customer_cari_code?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-screen bg-[#0B0E14] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#3063E9]" size={50} />
      <p className="text-[#3063E9]/50 font-black uppercase tracking-widest text-xs mt-4">Sipariş Ağı Taranıyor...</p>
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
          <Link href={`/portal/${code}/business`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <LayoutDashboard size={20} className="group-hover:text-[#3063E9] transition-colors"/> Komuta Merkezi
          </Link>
          
          <Link href={`/portal/${code}/business/products`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <Package size={20} className="group-hover:text-[#3063E9] transition-colors" /> Ürün Yönetimi
          </Link>

          <div className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-[#3063E9]/20 to-transparent border-l-4 border-[#3063E9] text-white rounded-r-xl font-bold transition-all shadow-lg">
            <ShoppingCart size={20} className="text-[#3063E9]" /> Gelen Siparişler
          </div>

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
        
        {/* TOP BAR & ARAMA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 bg-[#0F1219] p-6 rounded-[30px] border border-white/5">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-white/5 rounded-xl border border-white/5"><Menu size={20} /></button>
            <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">Sipariş Yönetimi</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Bayilerden Gelen Aktif Talepler</p>
            </div>
          </div>
          
          <div className="w-full md:w-80 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#3063E9] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="CARI VEYA ID ARA..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0B0E14] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold focus:outline-none focus:border-[#3063E9]/50 transition-all placeholder:text-gray-700 uppercase"
            />
          </div>
        </div>

        {/* SİPARİŞ LİSTESİ */}
        <div className="space-y-6">
            {filteredOrders.length === 0 ? (
                <div className="bg-[#0F1219] rounded-[30px] border border-white/5 p-20 text-center">
                    <ShoppingCart size={48} className="mx-auto text-gray-700 mb-4 opacity-50" />
                    <p className="text-gray-500 font-bold uppercase text-[11px] tracking-widest">Ağda aktif sipariş bulunamadı.</p>
                </div>
            ) : (
                filteredOrders.map((order) => (
                    <div key={order.id} className="bg-[#0F1219] rounded-[30px] border border-white/5 overflow-hidden hover:border-[#3063E9]/30 transition-all group">
                        
                        {/* Sipariş Üst Başlık (Müşteri & Tutar) */}
                        <div className="p-6 md:p-8 bg-gradient-to-r from-white/[0.02] to-transparent border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                                    order.status === 'Beklemede' ? 'bg-[#BC13FE]/10 text-[#BC13FE] border-[#BC13FE]/20' : 
                                    order.status === 'Hazırlanıyor' ? 'bg-[#3063E9]/10 text-[#3063E9] border-[#3063E9]/20' : 
                                    'bg-green-500/10 text-green-500 border-green-500/20'
                                }`}>
                                    {order.status === 'Beklemede' ? <AlertCircle size={24} /> : order.status === 'Hazırlanıyor' ? <Truck size={24} /> : <CheckCircle2 size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight">{order.customer_cari_code}</h3>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                        Sipariş ID: {order.id.slice(0, 8)} • {new Date(order.created_at).toLocaleString('tr-TR')}
                                    </p>
                                </div>
                            </div>

                            <div className="text-left md:text-right w-full md:w-auto flex flex-row md:flex-col justify-between md:justify-end items-center md:items-end gap-2">
                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                                    order.status === 'Beklemede' ? 'bg-[#BC13FE]/10 text-[#BC13FE] border-[#BC13FE]/30 animate-pulse' : 
                                    order.status === 'Hazırlanıyor' ? 'bg-[#3063E9]/10 text-[#3063E9] border-[#3063E9]/30' : 
                                    'bg-green-500/10 text-green-500 border-green-500/30'
                                }`}>
                                    {order.status}
                                </span>
                                <p className="text-2xl font-black text-white">{Number(order.total_amount || 0).toLocaleString('tr-TR')} <span className="text-[#3063E9] text-base">₺</span></p>
                            </div>
                        </div>

                        {/* Sipariş Edilen Ürünler (Grid) */}
                        <div className="p-6 md:p-8 bg-[#0B0E14]">
                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-4">Talep Edilen Ürünler</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {order.parsed_items?.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-[#0F1219] border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                                        <div className="overflow-hidden pr-2">
                                            <p className="text-xs font-bold text-gray-300 uppercase truncate">{item.name || item.product_name}</p>
                                            <p className="text-[10px] text-[#3063E9] font-black uppercase mt-1 tracking-widest">{item.price} ₺</p>
                                        </div>
                                        <div className="bg-white/5 px-3 py-2 rounded-xl text-center">
                                            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Miktar</p>
                                            <p className="text-sm font-black text-white">{item.quantity}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Aksiyon Butonları (Toptancı Onayı) */}
                        <div className="p-6 bg-[#0F1219] border-t border-white/5 flex flex-wrap gap-4 justify-end">
                            {order.status === 'Beklemede' && (
                                <button 
                                    onClick={() => updateOrderStatus(order.id, 'Hazırlanıyor')}
                                    disabled={processingId === order.id}
                                    className="px-6 py-3 bg-[#3063E9] hover:bg-blue-600 text-white text-xs font-black rounded-xl uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {processingId === order.id ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                                    Siparişi Onayla & Hazırla
                                </button>
                            )}
                            
                            {order.status === 'Hazırlanıyor' && (
                                <button 
                                    onClick={() => updateOrderStatus(order.id, 'Onay Bekliyor')}
                                    disabled={processingId === order.id}
                                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {processingId === order.id ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
                                    Sevkiyatı Tamamla (Faturayı Kes)
                                </button>
                            )}

                            {order.status === 'Tamamlandı' && (
                                <div className="px-6 py-3 bg-green-500/10 text-green-500 border border-green-500/20 text-xs font-black rounded-xl uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle2 size={16} /> Müşteri Tarafından Onaylandı
                                </div>
                            )}

                            {order.status === 'Onay Bekliyor' && (
                                <div className="px-6 py-3 bg-gray-800 text-gray-400 border border-gray-700 text-xs font-black rounded-xl uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={16} /> Müşterinin Mal Kabulü Bekleniyor
                                </div>
                            )}
                        </div>

                    </div>
                ))
            )}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3063E933; border-radius: 10px; }
      `}} />
    </div>
  );
}