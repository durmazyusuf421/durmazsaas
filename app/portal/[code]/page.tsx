'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { Wallet, Building2, CreditCard, LogOut, Loader2, FileText, Eye, Printer, X, Download, ShoppingCart, Package, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';

export default function CustomerPortal() {
  const { code } = useParams();
  const router = useRouter();
  
  const [customer, setCustomer] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Sekmeler (Tabs): ozet | siparis | siparislerim
  const [activeTab, setActiveTab] = useState('ozet');
  const [viewDocument, setViewDocument] = useState<any>(null);

  // Sepet State'i: { product_id: quantity }
  const [cart, setCart] = useState<Record<string, number>>({});

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      // 1. Müşteri
      const { data: custData, error: custErr } = await supabase.from('customers').select('*').eq('current_cari_code', code).single();
      if (custErr || !custData) throw new Error("Müşteri bulunamadı");
      setCustomer(custData);

      // 2. Şirket
      const { data: compData } = await supabase.from('companies').select('*').eq('id', custData.company_id).single();
      setCompany(compData);

      // 3. Ekstre (Fatura ve Tahsilatlar)
      const { data: invData } = await supabase.from('invoices').select('*').eq('customer_id', custData.id);
      const { data: payData } = await supabase.from('payments').select('*').eq('customer_id', custData.id);

      let allTransactions: any[] = [];
      if (invData) allTransactions = [...allTransactions, ...invData.map(i => ({ ...i, type: 'invoice', date: i.created_at }))];
      if (payData) allTransactions = [...allTransactions, ...payData.map(p => ({ ...p, type: 'payment', date: p.created_at }))];
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(allTransactions);

      // 4. Ürünler (Katalog)
      const { data: prodData } = await supabase.from('products').select('*').eq('company_id', custData.company_id);
      if (prodData) setProducts(prodData);

      // 5. Siparişler
      const { data: ordData } = await supabase.from('orders').select('*').eq('customer_id', custData.id).order('created_at', { ascending: false });
      if (ordData) setOrders(ordData);

    } catch (error) {
      console.error(error);
      router.push('/portal'); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (code) fetchPortalData(); }, [code, router]);

  // 🛒 SEPET İŞLEMLERİ
  const handleQuantityChange = (productId: string, delta: number) => {
    setCart(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) delete updated[productId];
      else updated[productId] = next;
      return updated;
    });
  };

  const calculateCartTotal = () => {
    let total = 0;
    Object.entries(cart).forEach(([id, qty]) => {
      const p = products.find(prod => prod.id === id);
      if (p) total += (p.price * qty);
    });
    return total;
  };

  const handlePlaceOrder = async () => {
    const items = Object.entries(cart).map(([id, qty]) => {
      const p = products.find(prod => prod.id === id);
      return { product_id: id, name: p?.name, price: p?.price, quantity: qty };
    });

    if (items.length === 0) return alert("Sepetiniz boş!");
    if (!confirm("Sipariş talebinizi işletmeye göndermek istiyor musunuz?")) return;

    setProcessing(true);
    try {
      const { error } = await supabase.from('orders').insert([{
        company_id: customer.company_id,
        customer_id: customer.id,
        items: items,
        total_amount: calculateCartTotal(),
        status: 'bekliyor' // İşletme (Sen) göreceksin
      }]);

      if (error) throw error;
      
      alert("Sipariş talebiniz başarıyla gönderildi! İşletme onayladığında size bildirim düşecek.");
      setCart({});
      setActiveTab('siparislerim');
      fetchPortalData();
    } catch (err: any) { alert("Hata: " + err.message); } finally { setProcessing(false); }
  };

  // 🤝 MUTABAKAT: MÜŞTERİ SİPARİŞİ ONAYLIYOR (FATURAYA DÖNÜŞÜR)
  const handleApproveOrder = async (order: any) => {
    if (!confirm(`Tutar: ₺${order.total_amount}. Bu faturayı onaylıyor musunuz? (Onaylarsanız bakiyenize borç olarak yansıyacaktır).`)) return;
    
    setProcessing(true);
    try {
      // 1. Faturayı (İnvoice) Kes (Borç Kaydı)
      const { error: invError } = await supabase.from('invoices').insert([{
        company_id: customer.company_id,
        customer_id: customer.id,
        amount: order.total_amount,
        status: 'ödenmedi'
      }]);
      if (invError) throw invError;

      // 2. Bakiyeyi Güncelle (Müşteriyi Borçlandır)
      const newBalance = Number(customer.balance || 0) + Number(order.total_amount);
      const { error: custError } = await supabase.from('customers').update({ balance: newBalance }).eq('id', customer.id);
      if (custError) throw custError;

      // 3. Siparişin Durumunu 'onaylandi' yap
      const { error: ordError } = await supabase.from('orders').update({ status: 'onaylandi' }).eq('id', order.id);
      if (ordError) throw ordError;

      alert("Fatura başarıyla onaylandı ve hesabınıza yansıtıldı!");
      fetchPortalData();
    } catch (err: any) { alert("Hata: " + err.message); } finally { setProcessing(false); }
  };

  // ❌ MUTABAKAT: MÜŞTERİ SİPARİŞE İTİRAZ EDİYOR
  const handleRejectOrder = async (orderId: string) => {
    if (!confirm("Bu faturada hata olduğunu belirtip reddetmek istediğinize emin misiniz?")) return;
    setProcessing(true);
    try {
      await supabase.from('orders').update({ status: 'reddedildi' }).eq('id', orderId);
      alert("Sipariş reddedildi. İşletmeye bilgi verildi.");
      fetchPortalData();
    } catch (err: any) { alert("Hata: " + err.message); } finally { setProcessing(false); }
  };

  const calculateTax = (totalAmount: number) => {
    const araToplam = totalAmount / 1.20;
    return { araToplam, kdvTutari: totalAmount - araToplam };
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#F4F7FE]"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
  if (!customer) return null;

  // Onay bekleyen sipariş sayısı
  const pendingApprovalsCount = orders.filter(o => o.status === 'musteri_onayinda').length;

  return (
    <div className="relative min-h-screen bg-[#F4F7FE]">
      
      {/* 🌟 ÜST BAR VE SEKMELER */}
      <div className={`bg-[#1B2559] text-white sticky top-0 z-10 shadow-lg ${viewDocument ? 'print:hidden hidden' : 'block'}`}>
        <div className="p-6 pb-0 max-w-6xl mx-auto flex justify-between items-start">
          <div>
            <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-1">Hoş Geldiniz</p>
            <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase">{customer.name}</h1>
          </div>
          <button onClick={() => router.push('/portal')} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all text-sm font-bold">
            <LogOut size={18} /> <span className="hidden md:inline">Çıkış</span>
          </button>
        </div>
        
        {/* SEKMELER (TABS) */}
        <div className="max-w-6xl mx-auto px-6 mt-6 flex gap-4 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('ozet')} className={`pb-4 px-2 font-bold whitespace-nowrap border-b-4 transition-all ${activeTab === 'ozet' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>
            Hesap Özeti
          </button>
          <button onClick={() => setActiveTab('siparis')} className={`pb-4 px-2 font-bold whitespace-nowrap border-b-4 transition-all ${activeTab === 'siparis' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>
            Yeni Sipariş Ver
          </button>
          <button onClick={() => setActiveTab('siparislerim')} className={`pb-4 px-2 font-bold whitespace-nowrap border-b-4 transition-all flex items-center gap-2 ${activeTab === 'siparislerim' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>
            Siparişlerim
            {pendingApprovalsCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                {pendingApprovalsCount} ONAY BEKLİYOR
              </span>
            )}
          </button>
        </div>
      </div>

      <div className={`max-w-6xl mx-auto p-4 md:p-8 space-y-6 mt-4 ${viewDocument ? 'print:hidden hidden' : 'block'}`}>
        
        {/* ========================================= */}
        {/* SEKME 1: HESAP ÖZETİ (EKSTRE) */}
        {/* ========================================= */}
        {activeTab === 'ozet' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-[#3063E9] to-blue-800 p-8 rounded-[32px] text-white shadow-xl shadow-blue-200 flex items-center justify-between">
                <div><p className="text-blue-100 font-bold uppercase tracking-widest text-sm mb-2">Güncel Borcunuz</p><h2 className="text-5xl font-black tracking-tighter">₺{Number(customer.balance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h2></div>
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center"><Wallet size={32} className="text-white" /></div>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-50 pb-4"><div className="bg-green-50 text-green-600 p-3 rounded-xl"><Building2 size={24}/></div><div><h3 className="font-black text-[#1B2559] uppercase">{company?.name || 'İşletme Bilgileri'}</h3><p className="text-xs text-gray-400 font-bold tracking-widest">ÖDEME BİLGİLERİ</p></div></div>
                <div className="space-y-3">
                  <div><p className="text-[10px] font-bold text-gray-400 uppercase">Banka & Alıcı</p><p className="font-bold text-[#1B2559]">{company?.bank_name || '-'} • {company?.account_holder || '-'}</p></div>
                  <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center border border-gray-100"><div><p className="text-[10px] font-bold text-gray-400 uppercase">IBAN</p><p className="font-mono font-black text-[#1B2559] tracking-wider text-sm md:text-base">{company?.iban || 'Tanımlanmamış'}</p></div><CreditCard className="text-gray-300 hidden md:block" size={24} /></div>
                </div>
              </div>
            </div>
            {/* Ekstre Tablosu */}
            <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center"><h3 className="text-xl font-black uppercase tracking-tighter text-[#1B2559]">Geçmiş Hareketler (Ekstre)</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead className="bg-white border-b border-gray-50"><tr><th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Tarih</th><th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">İşlem</th><th className="p-5 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Tutar & Belge</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {transactions.length === 0 ? ( <tr><td colSpan={3} className="p-10 text-center text-gray-400 font-medium">Hareket bulunamadı.</td></tr> ) : transactions.map((t, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/30">
                        <td className="p-5 font-bold text-gray-500 text-sm">{new Date(t.date).toLocaleDateString('tr-TR')}</td>
                        <td className="p-5">{t.type === 'invoice' ? <div className="flex items-center gap-3"><FileText size={18} className="text-red-400"/> <span className="font-bold text-[#1B2559]">Fatura (Borç Kaydı)</span></div> : <div className="flex items-center gap-3"><Wallet size={18} className="text-green-500"/> <span className="font-bold text-[#1B2559]">Ödeme ({t.payment_method})</span></div>}</td>
                        <td className="p-5"><div className="flex items-center justify-end gap-3">{t.type === 'invoice' ? <span className="text-red-500 font-black text-lg tracking-tight">+ ₺{Number(t.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span> : <span className="text-green-500 font-black text-lg tracking-tight">- ₺{Number(t.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>}<button onClick={() => setViewDocument(t)} className="p-2.5 bg-blue-50 hover:bg-[#3063E9] hover:text-white text-[#3063E9] rounded-xl transition-all shadow-sm" title="Resmi Belge"><Eye size={18} /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* SEKME 2: YENİ SİPARİŞ VER (KATALOG) */}
        {/* ========================================= */}
        {activeTab === 'siparis' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-[#3063E9] p-6 rounded-[32px] text-white flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl shadow-blue-200">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-4 rounded-2xl"><ShoppingCart size={32} /></div>
                <div><h2 className="text-2xl font-black tracking-tighter">Ürün Kataloğu</h2><p className="text-blue-100 font-medium text-sm">İhtiyaçlarınızı seçip işletmeye talep gönderin.</p></div>
              </div>
              <div className="bg-white text-[#1B2559] p-4 rounded-2xl w-full md:w-auto text-center shadow-lg">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sepet Tahmini Tutarı</p>
                <p className="text-2xl font-black tracking-tighter">₺{calculateCartTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                <button onClick={handlePlaceOrder} disabled={processing || calculateCartTotal() === 0} className="w-full mt-2 bg-[#1B2559] hover:bg-blue-900 text-white py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                  {processing ? <Loader2 className="animate-spin mx-auto" size={16}/> : 'Siparişi Gönder'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.length === 0 ? (
                <div className="col-span-full text-center p-10 bg-white rounded-3xl border border-gray-100"><Package className="mx-auto text-gray-300 mb-4" size={48}/><p className="text-gray-500 font-bold">İşletme henüz ürün eklememiş.</p></div>
              ) : products.map(p => {
                const qty = cart[p.id] || 0;
                return (
                  <div key={p.id} className={`bg-white p-6 rounded-[24px] border-2 transition-all ${qty > 0 ? 'border-[#3063E9] shadow-lg shadow-blue-100' : 'border-gray-100 shadow-sm'}`}>
                    <h3 className="font-black text-[#1B2559] text-lg mb-1">{p.name}</h3>
                    <p className="text-[#3063E9] font-black text-xl mb-6">₺{p.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <button onClick={() => handleQuantityChange(p.id, -1)} className="w-10 h-10 bg-white text-red-500 rounded-lg font-black text-xl shadow-sm hover:bg-red-50">-</button>
                      <span className="font-black text-lg w-12 text-center">{qty}</span>
                      <button onClick={() => handleQuantityChange(p.id, 1)} className="w-10 h-10 bg-[#3063E9] text-white rounded-lg font-black text-xl shadow-sm hover:bg-blue-700">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* SEKME 3: SİPARİŞLERİM & ONAYLAR (MUTABAKAT) */}
        {/* ========================================= */}
        {activeTab === 'siparislerim' && (
          <div className="space-y-6 animate-in fade-in">
            {pendingApprovalsCount > 0 && (
              <div className="bg-red-50 border-2 border-red-200 p-6 rounded-[32px] flex items-start gap-4 animate-pulse">
                <AlertCircle className="text-red-500 mt-1" size={32} />
                <div>
                  <h3 className="text-red-700 font-black text-lg uppercase tracking-tight">Onay Bekleyen Faturalarınız Var!</h3>
                  <p className="text-red-600 font-medium text-sm">İşletme siparişinizi hazırladı. Lütfen aşağıdaki listeden kontrol edip faturayı onaylayın.</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center p-10 bg-white rounded-3xl border border-gray-100"><ShoppingBag className="mx-auto text-gray-300 mb-4" size={48}/><p className="text-gray-500 font-bold">Henüz hiç sipariş vermediniz.</p></div>
              ) : orders.map((order) => (
                <div key={order.id} className={`bg-white border-2 p-6 rounded-[32px] transition-all ${order.status === 'musteri_onayinda' ? 'border-red-300 shadow-xl shadow-red-100' : 'border-gray-100 shadow-sm'}`}>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-50 pb-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sipariş Tarihi: {new Date(order.created_at).toLocaleDateString('tr-TR')}</p>
                      <h4 className="text-lg font-black text-[#1B2559] uppercase">SİPARİŞ #{order.id.slice(0,6)}</h4>
                    </div>
                    
                    {/* DURUM ROZETLERİ */}
                    {order.status === 'bekliyor' && <span className="bg-amber-50 text-amber-600 border border-amber-200 px-4 py-2 rounded-xl font-bold text-xs uppercase flex items-center gap-2"><Loader2 size={16} className="animate-spin"/> İşletme Hazırlıyor</span>}
                    {order.status === 'onaylandi' && <span className="bg-green-50 text-green-600 border border-green-200 px-4 py-2 rounded-xl font-bold text-xs uppercase flex items-center gap-2"><CheckCircle2 size={16}/> Fatura Onaylandı (Tamamlandı)</span>}
                    {order.status === 'reddedildi' && <span className="bg-gray-100 text-gray-500 border border-gray-300 px-4 py-2 rounded-xl font-bold text-xs uppercase flex items-center gap-2"><X size={16}/> İtiraz Edildi / İptal</span>}
                    {order.status === 'musteri_onayinda' && <span className="bg-red-500 text-white px-4 py-2 rounded-xl font-black text-xs uppercase flex items-center gap-2 animate-bounce">Sizin Onayınızı Bekliyor!</span>}
                  </div>

                  {/* SİPARİŞ İÇERİĞİ */}
                  <div className="bg-gray-50 p-4 rounded-2xl mb-6">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sipariş Detayı</p>
                    <div className="space-y-2">
                      {order.items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm font-bold text-[#1B2559] border-b border-gray-200/50 pb-2 last:border-0 last:pb-0">
                          <span>{item.quantity}x {item.name}</span>
                          <span>₺{(item.price * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                      <span className="font-black text-gray-500 uppercase">Genel Toplam:</span>
                      <span className="text-2xl font-black text-[#1B2559]">₺{Number(order.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* 🌟 KRİTİK NOKTA: MUTABAKAT BUTONLARI */}
                  {order.status === 'musteri_onayinda' && (
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => handleRejectOrder(order.id)} disabled={processing} className="flex-1 bg-white border-2 border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 py-3 rounded-xl font-bold text-sm transition-all">İtiraz Et / Hatalı</button>
                      <button onClick={() => handleApproveOrder(order)} disabled={processing} className="flex-[2] bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-200 py-3 rounded-xl font-black text-sm uppercase flex justify-center items-center gap-2 transition-all active:scale-95">
                        {processing ? <Loader2 size={18} className="animate-spin"/> : <><CheckCircle2 size={18}/> Faturayı Onaylıyorum</>}
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}