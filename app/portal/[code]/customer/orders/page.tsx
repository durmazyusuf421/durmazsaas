'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, LogOut, 
  Loader2, Rocket, Menu, X, 
  Eye, CheckCircle2, Clock, Printer, ShieldCheck, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

interface OrderType {
  id: string;
  customer_id: string;
  customer_name: string;
  cari_code: string;
  total_amount: number;
  status: string;
  date: string;
  created_at?: string;
  items: any[];
  is_invoiced?: boolean;
  invoice_id?: string;
  invoice_status?: string;
}

export default function CustomerOrders() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string) || '';
  
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState('Müşteri');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        const { data: profile } = await supabase.from('profiles').select('full_name, global_cari_code').eq('id', user.id).maybeSingle();
        if (profile) setProfileName(profile.full_name || 'Müşteri');

        const { data: cData } = await supabase.from('companies').select('id').eq('name', code).maybeSingle();
        if (cData) {
          setCompanyId(cData.id);

          // Müşteri sadece kendi cari koduna ait siparişleri görür. 
          // (Test için şimdilik tümünü çektik, cari sisteme tam geçince eq('cari_code', profile.global_cari_code) eklenebilir)
          const { data: ordersData } = await supabase
            .from('orders')
            .select(`*, invoices(id, status)`)
            .eq('company_id', cData.id)
            .order('created_at', { ascending: false });

          if (ordersData) {
            const formatted = ordersData.map((o: any) => {
              const invoice = o.invoices && o.invoices.length > 0 ? o.invoices[0] : null;
              return {
                ...o,
                date: new Date(o.created_at).toLocaleDateString('tr-TR'),
                is_invoiced: !!invoice,
                invoice_id: invoice?.id,
                invoice_status: invoice?.status
              };
            });
            setOrders(formatted);
          }
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, [code, router, supabase]);

  // --- 🚀 MÜŞTERİ MUTABAKAT ONAYI ---
  const handleApproveInvoice = async (order: OrderType) => {
    if (!companyId || !order.customer_id || !order.invoice_id) return;
    
    setActionLoading(order.id);
    try {
      // 1. Faturayı Onayla
      const { error: invError } = await supabase.from('invoices').update({ status: 'Ödenmedi' }).eq('id', order.invoice_id);
      if (invError) throw invError;

      // 2. Bakiyeye İşle (Transactions)
      const { error: transError } = await supabase.from('transactions').insert([{
          company_id: companyId,
          customer_id: order.customer_id,
          type: 'FATURA',
          amount: order.total_amount,
          description: `Müşteri Onaylı Sipariş Faturası (${order.id})`
      }]);
      if (transError) throw transError;

      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, invoice_status: 'Ödenmedi' } : o));
      setSelectedOrder(null);
      alert(`✅ Mutabakat Sağlandı! Fatura onaylandı.`);
    } catch (e: any) {
      alert(`Onaylama sırasında hata: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingApprovals = orders.filter(o => o.is_invoiced && o.invoice_status === 'Müşteri Onayı Bekliyor');
  const pastOrders = orders.filter(o => !o.is_invoiced || o.invoice_status !== 'Müşteri Onayı Bekliyor');

  if (loading) return <div className="h-screen bg-[#0B0E14] flex items-center justify-center"><Loader2 className="animate-spin text-[#3063E9]" size={50} /></div>;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans print:bg-white print:text-black">
      
      {/* SİDEBAR (Yazdırırken Gizlenir - print:hidden) */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-[#0F1219] border-r border-white/5 p-8 flex flex-col z-[70] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 print:hidden`}>
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-[#3063E9] rounded-xl flex items-center justify-center shadow-lg"><Rocket size={22} /></div>
          <span className="text-xl font-black italic uppercase leading-none">Müşteri<span className="text-[#3063E9]">Panel</span></span>
        </div>
        <nav className="space-y-2 flex-1">
          <button className="w-full flex items-center gap-4 px-5 py-4 bg-[#3063E9]/10 border-l-4 border-[#3063E9] text-white rounded-r-xl font-bold transition-all"><ShoppingCart size={20} className="text-[#3063E9]" /> Siparişlerim</button>
        </nav>
      </aside>

      <main className="lg:ml-72 p-6 md:p-10 relative print:hidden">
        <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-[#0F1219] rounded-lg border border-white/5"><Menu size={20} /></button>
            <h2 className="text-3xl font-black uppercase italic">Sipariş & Ekstreler</h2>
          </div>
          <div className="bg-[#0F1219] p-3 px-5 rounded-2xl border border-white/5"><p className="text-xs font-black uppercase">{profileName}</p></div>
        </div>

        {/* 🚀 KAYDIRILABİLİR ONAY BEKLEYENLER ALANI */}
        {pendingApprovals.length > 0 && (
          <div className="mb-12">
            <h3 className="text-sm font-black text-orange-500 uppercase flex items-center gap-2 mb-4"><AlertTriangle size={16} /> Onay Bekleyen Ekstreler ({pendingApprovals.length})</h3>
            <div className="flex overflow-x-auto gap-6 pb-4 snap-x custom-scrollbar">
              {pendingApprovals.map(o => (
                <div key={o.id} className="min-w-[300px] bg-orange-500/5 border border-orange-500/20 p-6 rounded-[32px] snap-center shrink-0 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-2xl rounded-full" />
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-500"><Clock size={24} /></div>
                    <span className="text-[10px] text-gray-400 font-bold">{o.date}</span>
                  </div>
                  <h4 className="text-2xl font-black italic text-white mb-6 relative z-10">{o.total_amount.toLocaleString('tr-TR')} ₺</h4>
                  <button onClick={() => setSelectedOrder(o)} className="w-full py-3 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center justify-center gap-2 relative z-10">
                     İncele ve Onayla <Eye size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GEÇMİŞ SİPARİŞLER */}
        <div>
           <h3 className="text-sm font-black text-gray-500 uppercase mb-4">Tüm Siparişlerim</h3>
           <div className="space-y-4">
            {pastOrders.map((o) => (
              <div key={o.id} className="bg-[#0F1219] border border-white/5 p-5 rounded-3xl flex items-center justify-between group hover:border-[#3063E9]/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center"><ShoppingCart size={20} /></div>
                  <div><p className="text-[10px] text-gray-500 font-bold mb-1">{o.date}</p><p className="font-black text-white">{o.id}</p></div>
                </div>
                <div className="text-center hidden md:block">
                  {o.is_invoiced ? <span className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg text-[8px] font-black uppercase flex items-center gap-1"><CheckCircle2 size={10}/> Faturalandı</span> : <span className="px-3 py-1 bg-gray-500/10 text-gray-500 border border-gray-500/20 rounded-lg text-[8px] font-black uppercase">İşleniyor</span>}
                </div>
                <div className="flex items-center gap-6">
                  <p className="text-xl font-black italic">{o.total_amount.toLocaleString('tr-TR')} ₺</p>
                  <button onClick={() => setSelectedOrder(o)} className="p-3 bg-white/5 hover:bg-[#3063E9] rounded-xl transition-all"><Eye size={18} /></button>
                </div>
              </div>
            ))}
            {pastOrders.length === 0 && <p className="text-gray-500 text-sm italic">Geçmiş sipariş bulunmuyor.</p>}
          </div>
        </div>
      </main>

      {/* 🖨️ YAZDIRILABİLİR FİŞ & ONAY MODALI */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex justify-center items-center p-4 print:static print:p-0 print:block">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md print:hidden" onClick={() => setSelectedOrder(null)} />
          
          <div className="relative w-full max-w-[600px] bg-[#0F1219] border border-white/10 shadow-2xl rounded-[40px] flex flex-col max-h-[90vh] print:max-h-none print:w-full print:border-none print:shadow-none print:bg-white print:text-black print:rounded-none">
            
            {/* Modal Başlığı (Sadece Ekranda Görünür) */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center print:hidden">
                <h3 className="text-lg font-black uppercase">Sipariş Ekstresi</h3>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="p-2 bg-[#3063E9]/20 text-[#3063E9] hover:bg-[#3063E9] hover:text-white rounded-xl transition-all"><Printer size={20} /></button>
                    <button onClick={() => setSelectedOrder(null)} className="p-2 bg-white/5 hover:bg-red-500 rounded-xl transition-all"><X size={20} /></button>
                </div>
            </div>

            {/* 🧾 FİŞ (RECEIPT) BÖLÜMÜ - YAZDIRILACAK ALAN */}
            <div className="flex-1 overflow-y-auto p-8 print:overflow-visible print:p-0">
                
                {/* Fiş Üst Kısım */}
                <div className="text-center mb-8 border-b border-white/10 print:border-black/20 pb-8">
                    <div className="w-16 h-16 bg-[#3063E9] rounded-2xl flex items-center justify-center mx-auto mb-4 print:bg-black print:text-white print:rounded-none"><Rocket size={32} /></div>
                    <h2 className="text-2xl font-black italic uppercase">DURMAZ SAAS</h2>
                    <p className="text-xs text-gray-500 font-bold mt-2 print:text-gray-700">Resmi Sipariş & Fatura Ekstresi</p>
                    <div className="mt-6 flex justify-between text-left text-xs bg-white/5 p-4 rounded-2xl print:bg-transparent print:p-0 print:border-t print:border-black/20 print:pt-4">
                        <div><p className="text-gray-500 uppercase text-[9px] print:text-gray-700">Müşteri</p><p className="font-black uppercase">{selectedOrder.customer_name}</p></div>
                        <div className="text-right"><p className="text-gray-500 uppercase text-[9px] print:text-gray-700">Tarih / No</p><p className="font-black">{selectedOrder.date} / {selectedOrder.id.slice(0,8)}</p></div>
                    </div>
                </div>

                {/* Fiş Kalemleri */}
                <div className="space-y-3 mb-8">
                    {selectedOrder.items && selectedOrder.items.map((it: any, i: number) => (
                        <div key={i} className="flex justify-between items-center pb-3 border-b border-white/5 print:border-black/10">
                            <div className="flex-1">
                                <h5 className="text-xs font-black uppercase">{it.name}</h5>
                                <p className="text-[9px] text-gray-500 font-bold print:text-gray-700">{it.qty} {it.unit || 'AD'} x {it.price} ₺</p>
                            </div>
                            <span className="text-sm font-black italic">{(it.qty * it.price).toLocaleString('tr-TR')} ₺</span>
                        </div>
                    ))}
                </div>

                {/* Fiş Toplam */}
                <div className="flex justify-between items-center bg-[#3063E9]/10 p-6 rounded-3xl border border-[#3063E9]/20 print:bg-gray-100 print:border-black/30 print:rounded-none">
                    <p className="text-sm text-[#3063E9] uppercase font-black print:text-black">Genel Toplam</p>
                    <p className="text-4xl font-black italic text-[#3063E9] print:text-black">{selectedOrder.total_amount.toLocaleString('tr-TR')} ₺</p>
                </div>

                {/* Onay Bekleyenler için Müşteri Onay Butonu (Yazdırırken Gizlenir) */}
                {selectedOrder.invoice_status === 'Müşteri Onayı Bekliyor' && (
                  <div className="mt-8 pt-8 border-t border-white/10 print:hidden">
                    <p className="text-[10px] text-orange-500 text-center font-bold mb-4">Bu ekstre henüz onaylanmamıştır. Lütfen kontrol edip onaylayınız.</p>
                    <button 
                      onClick={() => handleApproveInvoice(selectedOrder)}
                      disabled={actionLoading === selectedOrder.id}
                      className="w-full py-5 bg-[#3063E9] text-white rounded-2xl font-black uppercase text-xs shadow-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-all"
                    >
                      {actionLoading === selectedOrder.id ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />} Ekstreyi Onaylıyorum
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(249, 115, 22, 0.5); border-radius: 10px; }
      `}</style>
    </div>
  );
}