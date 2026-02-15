'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Wallet, FileText, ArrowDownToLine, ArrowUpFromLine, Loader2, X, Printer, Eye, Trash2 } from 'lucide-react'; // Trash2 eklendi

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [customer, setCustomer] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [viewDocument, setViewDocument] = useState<any>(null);

  const [invoiceForm, setInvoiceForm] = useState({ product_id: '', quantity: 1, due_date: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_method: 'Nakit', notes: '' });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // VERİLERİ ÇEKME
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: custData } = await supabase.from('customers').select('*').eq('id', id).single();
      setCustomer(custData);

      const { data: prodData } = await supabase.from('products').select('*').eq('company_id', custData.company_id);
      if (prodData) setProducts(prodData);

      const { data: invData } = await supabase.from('invoices').select('*, products(name)').eq('customer_id', id);
      const { data: payData } = await supabase.from('payments').select('*').eq('customer_id', id);

      let allTransactions: any[] = [];
      if (invData) allTransactions = [...allTransactions, ...invData.map(i => ({ ...i, type: 'invoice', date: i.created_at }))];
      if (payData) allTransactions = [...allTransactions, ...payData.map(p => ({ ...p, type: 'payment', date: p.created_at }))];
      
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(allTransactions);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { if (id) fetchData(); }, [id]);

  // BORÇ EKLEME
  const handleAddInvoice = async () => {
    if (!invoiceForm.product_id || invoiceForm.quantity < 1) return alert("Lütfen ürün ve adet seçin!");
    setProcessing(true);
    try {
      const selectedProduct = products.find(p => p.id === invoiceForm.product_id);
      const totalAmount = selectedProduct.price * invoiceForm.quantity;

      const { error: invError } = await supabase.from('invoices').insert([{
        company_id: customer.company_id, customer_id: id, amount: totalAmount, due_date: invoiceForm.due_date || null, status: 'ödenmedi'
      }]);
      if (invError) throw invError;

      const newBalance = Number(customer.balance || 0) + totalAmount;
      await supabase.from('customers').update({ balance: newBalance }).eq('id', id);

      setIsInvoiceModalOpen(false); setInvoiceForm({ product_id: '', quantity: 1, due_date: '' }); fetchData();
    } catch (err: any) { alert("Hata: " + err.message); } finally { setProcessing(false); }
  };

  // TAHSİLAT EKLEME
  const handleAddPayment = async () => {
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) return alert("Geçerli bir tutar girin!");
    setProcessing(true);
    try {
      const payAmount = Number(paymentForm.amount);
      const { error: payError } = await supabase.from('payments').insert([{
        company_id: customer.company_id, customer_id: id, amount: payAmount, payment_method: paymentForm.payment_method, notes: paymentForm.notes, status: 'onayli'
      }]);
      if (payError) throw payError;

      const newBalance = Number(customer.balance || 0) - payAmount;
      await supabase.from('customers').update({ balance: newBalance }).eq('id', id);

      setIsPaymentModalOpen(false); setPaymentForm({ amount: '', payment_method: 'Nakit', notes: '' }); fetchData();
    } catch (err: any) { alert("Hata: " + err.message); } finally { setProcessing(false); }
  };

  // 🌟 YENİ: İŞLEM SİLME FONKSİYONU
  const handleDeleteTransaction = async (transaction: any) => {
    if (!confirm("Bu işlemi silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve müşteri bakiyesi yeniden hesaplanacaktır.")) return;
    setProcessing(true);
    try {
      // 1. Kaydı tablodan sil
      const tableName = transaction.type === 'invoice' ? 'invoices' : 'payments';
      const { error: deleteError } = await supabase.from(tableName).delete().eq('id', transaction.id);
      if (deleteError) throw deleteError;

      // 2. Bakiyeyi yeniden hesapla (Kritik Nokta!)
      // Fatura silinirse borç azalır (-), Tahsilat silinirse borç artar (+)
      let adjustment = transaction.type === 'invoice' ? -Number(transaction.amount) : Number(transaction.amount);
      const newBalance = Number(customer.balance || 0) + adjustment;

      // 3. Müşteri bakiyesini güncelle
      const { error: updateError } = await supabase.from('customers').update({ balance: newBalance }).eq('id', id);
      if (updateError) throw updateError;

      alert("İşlem başarıyla silindi ve bakiye güncellendi.");
      fetchData(); // Verileri yenile
    } catch (err: any) {
      alert("Silme hatası: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
  if (!customer) return <div className="p-8 text-center text-red-500 font-bold">Müşteri bulunamadı!</div>;

  return (
    <div className="relative min-h-screen">
      {/* ANA EKRAN */}
      <div className={`p-4 md:p-8 space-y-6 text-[#1B2559] max-w-6xl mx-auto ${viewDocument ? 'print:hidden' : ''}`}>
        {/* ÜST BAŞLIK */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard/customers')} className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm"><ArrowLeft size={24} className="text-gray-500" /></button>
            <div><h1 className="text-3xl font-black uppercase tracking-tighter">{customer.name}</h1><p className="text-gray-400 font-bold text-sm tracking-widest uppercase mt-1">Cari Kod: <span className="text-[#3063E9]">{customer.current_cari_code || 'YOK'}</span> • Tel: {customer.phone || 'Belirtilmedi'}</p></div>
          </div>
          <button onClick={() => window.print()} className="bg-gray-800 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"><Printer size={20} /> Tüm Ekstreyi Yazdır</button>
        </div>

        {/* BAKİYE KARTI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
          <div className="md:col-span-2 bg-gradient-to-br from-[#3063E9] to-blue-800 p-8 rounded-[32px] text-white shadow-xl shadow-blue-200 flex items-center justify-between">
            <div><p className="text-blue-100 font-bold uppercase tracking-widest text-sm mb-2">Güncel Bakiye (Toplam Borç)</p><h2 className="text-5xl font-black tracking-tighter">₺{Number(customer.balance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h2></div>
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center"><Wallet size={40} className="text-white" /></div>
          </div>
          <div className="flex flex-col gap-4">
            <button onClick={() => setIsInvoiceModalOpen(true)} className="flex-1 bg-white border-2 border-red-100 hover:border-red-300 hover:bg-red-50 text-red-600 rounded-[24px] p-4 font-black text-lg flex items-center justify-center gap-3 transition-all shadow-sm"><ArrowUpFromLine size={24} /> Borç (Fatura) Yaz</button>
            <button onClick={() => setIsPaymentModalOpen(true)} className="flex-1 bg-white border-2 border-green-100 hover:border-green-300 hover:bg-green-50 text-green-600 rounded-[24px] p-4 font-black text-lg flex items-center justify-center gap-3 transition-all shadow-sm"><ArrowDownToLine size={24} /> Tahsilat Al</button>
          </div>
        </div>

        {/* HESAP HAREKETLERİ TABLOSU */}
        <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm mt-8 print:border-none print:shadow-none">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50 print:bg-transparent print:p-0 print:mb-4"><h3 className="text-xl font-black uppercase tracking-tighter">Hesap Hareketleri (Ekstre)</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white border-b border-gray-50">
                <tr>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Tarih</th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">İşlem Türü & Detay</th>
                  <th className="p-5 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Tutar</th>
                  <th className="p-5 text-center text-xs font-bold text-gray-400 uppercase tracking-widest print:hidden">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.length === 0 ? ( <tr><td colSpan={4} className="p-10 text-center text-gray-400 font-medium">Hareket yok.</td></tr> ) : transactions.map((t, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5 font-bold text-gray-500 text-sm">{new Date(t.date).toLocaleDateString('tr-TR')}</td>
                    <td className="p-5">
                      {t.type === 'invoice' ? (
                        <div className="flex items-center gap-3"><div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center print:border print:border-red-200"><FileText size={20}/></div><div><p className="font-bold text-[#1B2559]">Fatura Kesildi</p><p className="text-xs text-gray-400 font-medium">Vade: {t.due_date ? new Date(t.due_date).toLocaleDateString('tr-TR') : 'Belirtilmedi'}</p></div></div>
                      ) : (
                        <div className="flex items-center gap-3"><div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center print:border print:border-green-200"><Wallet size={20}/></div><div><p className="font-bold text-[#1B2559]">Tahsilat ({t.payment_method})</p><p className="text-xs text-gray-400 font-medium">{t.notes || 'Açıklama yok'}</p></div></div>
                      )}
                    </td>
                    <td className="p-5 text-right font-black text-lg tracking-tight">
                      {t.type === 'invoice' ? <span className="text-red-500">+ ₺{Number(t.amount).toLocaleString('tr-TR')}</span> : <span className="text-green-500">- ₺{Number(t.amount).toLocaleString('tr-TR')}</span>}
                    </td>
                    <td className="p-5 text-center print:hidden flex items-center justify-center gap-2">
                      <button onClick={() => setViewDocument(t)} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-[#3063E9] hover:text-white text-[#3063E9] rounded-xl text-xs font-bold transition-all shadow-sm" title="Detay Gör"><Eye size={16} /></button>
                      
                      {/* 🌟 YENİ: SİL BUTONU */}
                      <button onClick={() => handleDeleteTransaction(t)} disabled={processing} className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded-xl text-xs font-bold transition-all shadow-sm" title="İşlemi Sil">
                        {processing ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* TEKİL BELGE GÖRÜNTÜLEME MODALI */}
      {viewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:absolute print:inset-0 print:bg-white print:p-0 print:block">
          <div className="bg-white w-full max-w-2xl rounded-[32px] p-8 md:p-12 shadow-2xl relative print:shadow-none print:w-full print:max-w-none print:border-none print:rounded-none">
            <button onClick={() => setViewDocument(null)} className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors print:hidden"><X size={24} /></button>
            <div className="border border-gray-100 p-8 rounded-[24px] print:border-none print:p-0">
              <div className="flex justify-between items-start border-b border-gray-100 pb-8 mb-8">
                <div><h2 className="text-3xl font-black tracking-tighter uppercase mb-1 text-[#1B2559]">{viewDocument.type === 'invoice' ? 'SATIŞ FATURASI' : 'TAHSİLAT MAKBUZU'}</h2><p className="text-gray-400 font-bold tracking-widest text-xs uppercase">Belge No: #{viewDocument.id.slice(0,8).toUpperCase()}</p></div>
                <div className="text-right"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tarih</p><p className="font-bold text-[#1B2559] mb-2">{new Date(viewDocument.date).toLocaleDateString('tr-TR')}</p></div>
              </div>
              <div className="mb-10"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sayın / Müşteri</p><h3 className="text-2xl font-black text-[#1B2559] uppercase">{customer.name}</h3></div>
              <div className={`rounded-2xl p-8 flex items-center justify-between print:border-t print:border-b print:rounded-none print:bg-transparent ${viewDocument.type === 'invoice' ? 'bg-red-50' : 'bg-green-50'}`}>
                <span className="font-black text-gray-600 uppercase tracking-widest text-sm">Genel Toplam</span><span className={`text-4xl font-black tracking-tighter ${viewDocument.type === 'invoice' ? 'text-red-600' : 'text-green-600'}`}>₺{Number(viewDocument.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3 print:hidden"><button onClick={() => setViewDocument(null)} className="px-6 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all">İptal</button><button onClick={() => window.print()} className="px-8 py-4 bg-[#3063E9] hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 flex items-center gap-2 active:scale-95 transition-all"><Printer size={20} /> Belgeyi Yazdır</button></div>
          </div>
        </div>
      )}

      {/* BORÇ & TAHSİLAT MODALLARI (Aynı kaldığı için kısaltıldı, tam kodda mevcut) */}
      {isInvoiceModalOpen && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm print:hidden"><div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95"><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-[#1B2559]">Borç (Fatura) Yaz</h2><button onClick={() => setIsInvoiceModalOpen(false)}><X className="text-gray-400 hover:text-red-500" /></button></div><div className="space-y-4"><div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ürün / Hizmet Seçin</label><select className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-[#1B2559]" value={invoiceForm.product_id} onChange={e => setInvoiceForm({...invoiceForm, product_id: e.target.value})}><option value="">Seçiniz...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} (₺{p.price})</option>)}</select></div><div className="flex gap-4"><div className="space-y-1 flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Adet / Miktar</label><input type="number" min="1" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={invoiceForm.quantity} onChange={e => setInvoiceForm({...invoiceForm, quantity: Number(e.target.value)})} /></div><div className="space-y-1 flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Vade (Son Ödeme)</label><input type="date" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-500" value={invoiceForm.due_date} onChange={e => setInvoiceForm({...invoiceForm, due_date: e.target.value})} /></div></div><button onClick={handleAddInvoice} disabled={processing} className="w-full p-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-200 mt-2 flex justify-center items-center">{processing ? <Loader2 className="animate-spin" size={20} /> : "Borcu Kaydet"}</button></div></div></div>)}
      {isPaymentModalOpen && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm print:hidden"><div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95"><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-[#1B2559]">Tahsilat Al</h2><button onClick={() => setIsPaymentModalOpen(false)}><X className="text-gray-400 hover:text-red-500" /></button></div><div className="space-y-4"><div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Alınan Tutar (₺)</label><input type="number" placeholder="0.00" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black text-2xl text-green-600" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} /></div><div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ödeme Yöntemi</label><select className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}><option value="Nakit">Elden Nakit</option><option value="Havale/EFT">Havale / EFT</option><option value="Kredi Kartı">Kredi Kartı</option><option value="Çek/Senet">Çek / Senet</option></select></div><div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Açıklama / Not</label><input placeholder="Örn: Ahmet getirdi" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-medium" value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} /></div><button onClick={handleAddPayment} disabled={processing} className="w-full p-4 bg-green-500 text-white rounded-2xl font-bold shadow-lg shadow-green-200 mt-2 flex justify-center items-center">{processing ? <Loader2 className="animate-spin" size={20} /> : "Tahsilatı Kaydet"}</button></div></div></div>)}
    </div>
  );
}