'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Phone, Mail, FileText, 
  TrendingUp, TrendingDown, Building2, 
  Wallet, Plus, X 
} from 'lucide-react';

export default function CariDetayPage() {
  const params = useParams();
  const router = useRouter();
  const [cari, setCari] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]); // Hem fatura hem ödemeler burada
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Tahsilat Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payData, setPayData] = useState({ amount: '', description: 'Tahsilat', date: new Date().toISOString().split('T')[0] });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [params?.id]);

  async function fetchDetails() {
    if (!params?.id) return;
    setLoading(true);

    // 1. Cari Bilgisi
    const { data: cariData } = await supabase.from('contacts').select('*').eq('id', params.id).single();
    if (!cariData) return;
    setCari(cariData);

    // 2. Faturaları Çek
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, issue_date, description, type, total_amount, invoice_no')
      .eq('contact_id', params.id);

    // 3. Ödemeleri Çek
    const { data: payments } = await supabase
      .from('payments')
      .select('id, date, description, type, amount')
      .eq('contact_id', params.id);

    // 4. Verileri Birleştir ve Sırala
    const allMoves = [
      ...(invoices || []).map((i: any) => ({ ...i, kind: 'invoice', date: i.issue_date })),
      ...(payments || []).map((p: any) => ({ ...p, kind: 'payment', date: p.date, total_amount: p.amount }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setTransactions(allMoves);

    // 5. Bakiye Hesapla (En kritik yer!)
    let total = 0;
    
    // Satış Faturası (+) | Alış Faturası (-)
    // Tahsilat (Giriş) (-) Borcu düşer | Ödeme (Çıkış) (+) Alacağı düşer
    
    invoices?.forEach((inv: any) => {
      if (inv.type === 'sales') total += Number(inv.total_amount);
      if (inv.type === 'purchase') total -= Number(inv.total_amount);
    });

    payments?.forEach((pay: any) => {
      if (pay.type === 'in') total -= Number(pay.amount); // Tahsilat yaptık, adamın borcu azaldı
      if (pay.type === 'out') total += Number(pay.amount); // Ödeme yaptık, bizim borcumuz azaldı
    });

    setBalance(total);
    setLoading(false);
  }

  // Tahsilat Kaydetme Fonksiyonu
  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user?.id).single();

    // Eğer cari müşteriyse para girişi (in), tedarikçiyse para çıkışı (out) varsayalım
    const paymentType = cari.type === 'customer' ? 'in' : 'out';

    const { error } = await supabase.from('payments').insert([{
      company_id: profile?.company_id,
      contact_id: params.id,
      type: paymentType,
      amount: payData.amount,
      description: payData.description,
      date: payData.date
    }]);

    if (!error) {
      setIsPayModalOpen(false);
      setPayData({ amount: '', description: 'Tahsilat', date: new Date().toISOString().split('T')[0] });
      fetchDetails(); // Sayfayı güncelle
      alert("İşlem Başarılı! 💸");
    } else {
      alert(error.message);
    }
    setSubmitting(false);
  }

  if (loading) return <div className="p-10 text-center font-bold text-slate-500">Hesaplar yükleniyor...</div>;
  if (!cari) return <div className="p-10 text-center text-red-500 font-bold">Cari bulunamadı!</div>;

  return (
    <div className="p-8 ml-64 min-h-screen bg-slate-50 dark:bg-slate-950">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-medium">
        <ArrowLeft size={20} /> Listeye Dön
      </button>

      {/* Üst Bilgi Kartı */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-lg mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl">
            <Building2 size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">{cari.name}</h1>
            <div className="flex gap-3 mt-1 text-slate-500 text-sm">
              <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold uppercase">{cari.type === 'customer' ? 'Müşteri' : 'Tedarikçi'}</span>
              {cari.phone && <span className="flex items-center gap-1"><Phone size={14}/> {cari.phone}</span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Güncel Bakiye</p>
            <div className={`text-4xl font-black mt-1 ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {balance.toLocaleString('tr-TR')} ₺
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{balance >= 0 ? 'Alacaklısınız' : 'Borçlusunuz'}</p>
          </div>
          
          <button 
            onClick={() => setIsPayModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Wallet size={20}/> 
            {cari.type === 'customer' ? 'Tahsilat Ekle' : 'Ödeme Yap'}
          </button>
        </div>
      </div>

      {/* Hareket Dökümü */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <FileText className="text-blue-600" size={20}/>
            <h3 className="text-lg font-bold">Hesap Hareketleri (Ekstre)</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Tarih</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">İşlem</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Tür</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase text-right">Tutar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-slate-600">{new Date(t.date).toLocaleDateString('tr-TR')}</td>
                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                  {t.description}
                  {t.invoice_no && <span className="text-xs font-normal text-slate-400 ml-2">#{t.invoice_no}</span>}
                </td>
                <td className="px-6 py-4">
                   {t.kind === 'invoice' ? (
                     <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded uppercase">Fatura</span>
                   ) : (
                     <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-1 rounded uppercase">
                       {t.type === 'in' ? 'Tahsilat' : 'Ödeme'}
                     </span>
                   )}
                </td>
                <td className={`px-6 py-4 text-right font-black text-lg ${
                  (t.kind === 'invoice' && t.type === 'sales') || (t.kind === 'payment' && t.type === 'out') 
                  ? 'text-slate-900' // Borç Artıranlar
                  : 'text-emerald-600' // Borç Düşürenler (Tahsilat)
                }`}>
                  {t.total_amount} ₺
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TAHSİLAT MODALI */}
      {isPayModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-slate-200 animate-in fade-in zoom-in">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{cari.type === 'customer' ? 'Tahsilat Girişi' : 'Ödeme Çıkışı'}</h2>
                <button onClick={() => setIsPayModalOpen(false)}><X/></button>
             </div>
             <form onSubmit={handleAddPayment} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Tutar (TL)</label>
                  <input type="number" required className="w-full p-3 border rounded-xl font-bold text-lg" 
                    value={payData.amount} onChange={e => setPayData({...payData, amount: e.target.value})} placeholder="0.00"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Tarih</label>
                  <input type="date" required className="w-full p-3 border rounded-xl" 
                    value={payData.date} onChange={e => setPayData({...payData, date: e.target.value})}/>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Açıklama</label>
                  <input className="w-full p-3 border rounded-xl" 
                    value={payData.description} onChange={e => setPayData({...payData, description: e.target.value})}/>
                </div>
                <button disabled={submitting} type="submit" className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold shadow-lg">
                  {submitting ? 'KAYDEDİLİYOR...' : 'ONAYLA VE KAYDET'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}