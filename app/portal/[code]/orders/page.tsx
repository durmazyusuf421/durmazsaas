'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Store, ShoppingBag, FileText, LogOut, 
  Loader2, Rocket, Menu, X, Eye, CheckCircle2, Clock, 
  Printer, ShieldCheck, AlertTriangle, Package
} from 'lucide-react';
import Link from 'next/link';

export default function CustomerOrders() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (profileData) setProfile(profileData);

        if (profileData?.global_cari_code) {
          // Müşterinin kendi cari koduna ait tüm siparişleri ve fatura durumlarını çek
          const { data: ordersData } = await supabase
            .from('orders')
            .select(`
                *,
                invoices ( id, status, invoice_no ),
                companies ( name )
            `)
            .eq('cari_code', profileData.global_cari_code.trim())
            .order('created_at', { ascending: false });

          if (ordersData) {
            const formatted = ordersData.map((o: any) => {
              const invoice = o.invoices && o.invoices.length > 0 ? o.invoices[0] : null;
              const compName = Array.isArray(o.companies) ? o.companies[0]?.name : o.companies?.name;
              
              return {
                ...o,
                target_company_name: compName || 'İşletme',
                date: new Date(o.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                is_invoiced: !!invoice,
                invoice_id: invoice?.id,
                invoice_no: invoice?.invoice_no,
                invoice_status: invoice?.status
              };
            });
            setOrders(formatted);
          }
        }
      } catch (error) { 
        console.error("Veri çekme hatası:", error); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchData();
  }, [code, router, supabase]);

  // --- 🚀 MÜŞTERİ MUTABAKAT ONAY MOTORU (DÜZELTİLDİ) ---
  const handleApproveInvoice = async (order: any) => {
    if (!order.invoice_id || !order.customer_id || !order.company_id) return;
    
    setActionLoading(order.id);
    try {
      // 1. Faturayı "Ödenmedi" olarak güncelle
      const { error: invError } = await supabase
        .from('invoices')
        .update({ status: 'Ödenmedi' })
        .eq('id', order.invoice_id);
      if (invError) throw invError;

      // 2. Siparişi "Tamamlandı" olarak güncelle (Toptancı Ekranı İçin)
      const { error: ordError } = await supabase
        .from('orders')
        .update({ status: 'Tamamlandı' })
        .eq('id', order.id);
      if (ordError) throw ordError;

      // 3. Finansal Hareket Ekle (İşletmenin bakiyesine borç)
      const { error: transError } = await supabase
        .from('transactions')
        .insert([{
          company_id: order.company_id,
          customer_id: order.customer_id,
          type: 'FATURA',
          amount: order.total_amount,
          description: `Sipariş Mutabakatı Onaylandı (${order.id.slice(0,8)})`,
          items: order.items // Detayları da aktarıyoruz
        }]);
      if (transError) throw transError;

      // 4. Müşterinin Bakiyesine Tutar Ekle (Customer Tablosu Güncellemesi)
      const { data: custData } = await supabase
        .from('customers')
        .select('balance')
        .eq('id', order.customer_id)
        .single();
      
      if (custData) {
          const newBalance = Number(custData.balance) + Number(order.total_amount);
          await supabase.from('customers').update({ balance: newBalance }).eq('id', order.customer_id);
      }

      // 5. UI Güncelle (Ekrandaki listeyi yenile)
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Tamamlandı', invoice_status: 'Ödenmedi' } : o));
      setSelectedOrder(null);
      alert(`✅ Mutabakat Sağlandı! Sipariş onaylandı ve tutar ekstrenize yansıtıldı.`);
    } catch (e: any) {
      alert(`Onaylama sırasında siber hata oluştu: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingApprovals = orders.filter(o => o.is_invoiced && o.invoice_status === 'Müşteri Onayı Bekliyor');
  const pastOrders = orders.filter(o => !o.is_invoiced || o.invoice_status !== 'Müşteri Onayı Bekliyor');

  if (loading) return (
    <div className="h-screen bg-[#0B0E14] flex flex-col items-center justify-center z-[100] relative">
      <Loader2 className="animate-spin text-[#BC13FE]" size={50} />
      <p className="text-[#BC13FE]/50 font-black uppercase tracking-widest text-xs mt-4">Siparişler Yükleniyor...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-[#BC13FE]/30 print:bg-white print:text-black overflow-x-hidden relative">
      
      {/* SIDEBAR (Yazdırırken Gizlenir) */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden print:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-[#0F1219] border-r border-white/5 p-8 flex flex-col z-[70] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 print:hidden`}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#3063E9] to-[#BC13FE] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(188,19,254,0.3)]">
              <Rocket size={22} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter uppercase italic leading-none">Durmaz<span className="text-[#BC13FE]">SaaS</span></span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500"><X /></button>
        </div>

        <nav className="space-y-2 flex-1">
          <Link href={`/portal/${code}`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <LayoutDashboard size={20} className="group-hover:text-[#BC13FE]"/> Ana Sayfa
          </Link>
          <Link href={`/portal/${code}/stores`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <Store size={20} className="group-hover:text-[#BC13FE]" /> İşletmeler & Market
          </Link>
          <button className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-[#BC13FE]/20 to-transparent border-l-4 border-[#BC13FE] text-white rounded-r-xl font-bold shadow-[0_0_30px_rgba(188,19,254,0.1)] transition-all">
            <ShoppingBag size={20} className="text-[#BC13FE]" /> Siparişlerim
          </button>
          <Link href={`/portal/${code}/billing`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <FileText size={20} className="group-hover:text-[#BC13FE]" /> Hesap & Faturalar
          </Link>
        </nav>

        <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="mt-auto flex items-center gap-4 px-5 py-4 text-red-500/50 hover:text-red-500 border border-red-500/10 rounded-xl font-bold transition-all hover:bg-red-500/10 group">
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> Sistemden Çık
        </button>
      </aside>

      {/* ANA İÇERİK */}
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'blur-sm' : ''} lg:ml-72 p-4 md:p-8 lg:p-10 relative z-10 print:hidden`}>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#BC13FE]/5 blur-[150px] rounded-full pointer-events-none -z-10" />

        <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-[#0F1219] rounded-xl border border-white/5"><Menu size={20} /></button>
            <div>
              <h2 className="text-xl md:text-3xl font-black tracking-tight uppercase italic text-white">Sipariş & Mutabakat</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">İşlem Geçmişi ve Onaylar</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-white uppercase leading-none">{profile?.full_name}</p>
            <p className="text-[10px] text-[#BC13FE] font-black mt-1 tracking-widest">{code}</p>
          </div>
        </div>

        {/* 🚀 ONAY BEKLEYENLER ALANI (KAYDIRILABİLİR) */}
        {pendingApprovals.length > 0 && (
          <div className="mb-12">
            <h3 className="text-sm font-black text-orange-500 uppercase flex items-center gap-2 mb-4">
                <AlertTriangle size={18} /> Onay Bekleyen Ekstreler ({pendingApprovals.length})
            </h3>
            <div className="flex overflow-x-auto gap-6 pb-4 snap-x custom-scrollbar">
              {pendingApprovals.map(o => (
                <div key={o.id} className="min-w-[320px] bg-orange-500/5 border border-orange-500/20 p-6 rounded-[32px] snap-center shrink-0 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-2xl rounded-full pointer-events-none" />
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-500"><Clock size={20} /></div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{o.target_company_name}</p>
                            <p className="text-xs font-black">{o.date}</p>
                        </div>
                    </div>
                  </div>
                  
                  <h4 className="text-2xl font-black italic text-white mb-6 relative z-10">{o.total_amount.toLocaleString('tr-TR')} ₺</h4>
                  
                  <button onClick={() => setSelectedOrder(o)} className="w-full py-4 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:bg-orange-600 transition-all flex items-center justify-center gap-2 relative z-10 hover:scale-[1.02]">
                     İncele ve Onayla <Eye size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GEÇMİŞ SİPARİŞLER */}
        <div>
           <h3 className="text-sm font-black text-gray-500 uppercase mb-4 flex items-center gap-2"><Package size={16}/> Tüm Siparişlerim</h3>
           <div className="space-y-4">
            {pastOrders.map((o) => (
              <div key={o.id} className="bg-[#0F1219] border border-white/5 p-5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 group hover:border-[#BC13FE]/30 transition-all shadow-lg">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 text-gray-400 group-hover:text-[#BC13FE] transition-colors"><ShoppingBag size={20} /></div>
                  <div>
                    <h4 className="font-black text-white text-sm uppercase">{o.target_company_name}</h4>
                    <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-1">{o.date}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-center">
                    {o.is_invoiced ? (
                      <span className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg text-[9px] font-black uppercase flex items-center gap-1"><CheckCircle2 size={12}/> Mutabakat Tamam</span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded-lg text-[9px] font-black uppercase">İşletme Onayı Bekleniyor</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <p className="text-xl font-black italic">{o.total_amount.toLocaleString('tr-TR')} <span className="text-sm text-[#BC13FE] not-italic">₺</span></p>
                    <button onClick={() => setSelectedOrder(o)} className="p-3 bg-white/5 hover:bg-[#BC13FE] rounded-xl transition-colors"><Eye size={18} /></button>
                  </div>
                </div>
              </div>
            ))}
            {pastOrders.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-center opacity-50 bg-[#0F1219] rounded-[32px] border border-dashed border-white/10">
                    <ShoppingBag size={48} className="text-gray-600 mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest">Geçmiş sipariş bulunmuyor.</p>
                </div>
            )}
          </div>
        </div>
      </main>

      {/* 🖨️ YAZDIRILABİLİR FİŞ & ONAY MODALI */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex justify-center items-center p-4 print:static print:p-0 print:block">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md print:hidden transition-opacity" onClick={() => setSelectedOrder(null)} />
          
          <div className="relative w-full max-w-[600px] bg-[#0F1219] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-[40px] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 print:max-h-none print:w-full print:border-none print:shadow-none print:bg-white print:text-black print:rounded-none">
            
            {/* Modal Üst Bar */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center print:hidden bg-[#0B0E14] rounded-t-[40px]">
                <h3 className="text-lg font-black uppercase italic">Sipariş Ekstresi</h3>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="p-3 bg-[#BC13FE]/20 text-[#BC13FE] hover:bg-[#BC13FE] hover:text-white rounded-xl transition-all"><Printer size={20} /></button>
                    <button onClick={() => setSelectedOrder(null)} className="p-3 bg-white/5 hover:bg-red-500 rounded-xl transition-all"><X size={20} /></button>
                </div>
            </div>

            {/* 🧾 FİŞ BÖLÜMÜ */}
            <div className="flex-1 overflow-y-auto p-8 print:overflow-visible print:p-0 custom-scrollbar">
                
                <div className="text-center mb-8 border-b border-white/10 print:border-black/20 pb-8">
                    <div className="w-16 h-16 bg-[#BC13FE] rounded-2xl flex items-center justify-center mx-auto mb-4 print:bg-black print:text-white print:rounded-none"><Rocket size={32} /></div>
                    <h2 className="text-2xl font-black italic uppercase">DURMAZ SAAS</h2>
                    <p className="text-[10px] text-gray-500 font-bold mt-2 print:text-gray-700 tracking-widest uppercase">Resmi Sipariş & Fatura Ekstresi</p>
                    
                    <div className="mt-8 flex justify-between text-left text-xs bg-[#0B0E14] p-5 rounded-2xl print:bg-transparent print:p-0 print:border-t print:border-black/20 print:pt-4 border border-white/5">
                        <div>
                            <p className="text-gray-500 uppercase text-[9px] tracking-widest print:text-gray-700 mb-1">Toptancı</p>
                            <p className="font-black uppercase">{selectedOrder.target_company_name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500 uppercase text-[9px] tracking-widest print:text-gray-700 mb-1">Tarih / Sipariş No</p>
                            <p className="font-black">{selectedOrder.date} <br/> <span className="text-[#BC13FE] print:text-black">#{selectedOrder.id.slice(0,8)}</span></p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    {selectedOrder.items && selectedOrder.items.map((it: any, i: number) => (
                        <div key={i} className="flex justify-between items-center pb-4 border-b border-white/5 print:border-black/10">
                            <div className="flex-1">
                                <h5 className="text-sm font-black uppercase text-white print:text-black">{it.name}</h5>
                                <p className="text-[10px] text-gray-500 font-bold print:text-gray-700 tracking-widest mt-1">{it.qty} {it.unit || 'AD'} x {it.price} ₺</p>
                            </div>
                            <span className="text-lg font-black italic text-white print:text-black">{(it.qty * it.price).toLocaleString('tr-TR')} ₺</span>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center bg-gradient-to-r from-[#BC13FE]/20 to-purple-900/20 p-6 rounded-3xl border border-[#BC13FE]/30 print:bg-gray-100 print:border-black/30 print:rounded-none shadow-inner">
                    <p className="text-sm text-[#BC13FE] uppercase font-black print:text-black tracking-widest">Genel Toplam</p>
                    <p className="text-4xl font-black italic text-[#BC13FE] print:text-black">{selectedOrder.total_amount.toLocaleString('tr-TR')} ₺</p>
                </div>

                {/* SADECE MÜŞTERİ ONAY BEKLİYORSA GÖRÜNECEK BUTON */}
                {selectedOrder.invoice_status === 'Müşteri Onayı Bekliyor' && (
                  <div className="mt-8 pt-8 border-t border-white/10 print:hidden">
                    <div className="flex items-center gap-3 justify-center mb-6 text-orange-500 bg-orange-500/10 p-4 rounded-xl border border-orange-500/20">
                        <AlertTriangle size={20} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-center">Bu ekstre henüz onaylanmamıştır.<br/>Lütfen kontrol edip onaylayınız.</p>
                    </div>
                    <button 
                      onClick={() => handleApproveInvoice(selectedOrder)}
                      disabled={actionLoading === selectedOrder.id}
                      className="w-full py-5 bg-gradient-to-r from-[#BC13FE] to-purple-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_0_30px_rgba(188,19,254,0.4)] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
                    >
                      {actionLoading === selectedOrder.id ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />} 
                      {actionLoading === selectedOrder.id ? 'ONAYLANIYOR VE İŞLENİYOR...' : 'Ekstreyi Onaylıyorum (Bakiye Yazılacak)'}
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #BC13FE33; border-radius: 10px; }
      `}} />
    </div>
  );
}