'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, ArrowUpRight, ArrowDownLeft, X, Package, Calculator } from 'lucide-react';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Verileri
  const [formData, setFormData] = useState({
    contact_id: '',
    product_id: '',
    type: 'sales',
    quantity: 1,      
    unit: 'Adet',     
    unit_price: 0,    // BİRİM FİYAT (Artık ekranda görünecek)
    total_amount: 0,  // TOPLAM TUTAR
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    
    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('*, contacts(name)')
      .order('created_at', { ascending: false });

    const { data: contactData } = await supabase
      .from('contacts')
      .select('id, name')
      .order('name', { ascending: true });

    const { data: productData } = await supabase
      .from('products')
      .select('id, name, price, stock')
      .order('name', { ascending: true });

    setInvoices(invoiceData || []);
    setContacts(contactData || []);
    setProducts(productData || []);
    setLoading(false);
  }

  // 1. Ürün Seçilince: Fiyatı getir ama kilitleme!
  const handleProductChange = (productId: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      const price = selectedProduct.price;
      setFormData({
        ...formData,
        product_id: productId,
        unit_price: price, // Varsayılan fiyatı koy
        total_amount: price * formData.quantity, // Toplamı hesapla
        description: selectedProduct.name
      });
    } else {
      setFormData({ ...formData, product_id: '', unit_price: 0, total_amount: 0, description: '' });
    }
  };

  // 2. Miktar Değişince: Toplamı güncelle
  const handleQuantityChange = (qty: number) => {
    setFormData({
      ...formData,
      quantity: qty,
      total_amount: qty * formData.unit_price
    });
  };

  // 3. Birim Fiyat (EL İLE) Değişince: Toplamı güncelle
  const handleUnitPriceChange = (price: number) => {
    setFormData({
      ...formData,
      unit_price: price,
      total_amount: price * formData.quantity
    });
  };

  async function handleAddInvoice(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      
      const payload = {
        company_id: profile?.company_id,
        contact_id: formData.contact_id,
        product_id: formData.product_id || null, 
        type: formData.type,
        quantity: formData.quantity,
        unit: formData.unit,
        total_amount: formData.total_amount,
        issue_date: formData.date,
        description: formData.description,
        status: 'pending'
      };

      const { error } = await supabase.from('invoices').insert([payload]);
      if (error) throw error;

      setIsModalOpen(false);
      // Formu sıfırla
      setFormData({ 
        contact_id: '', product_id: '', type: 'sales', 
        quantity: 1, unit: 'Adet', unit_price: 0, 
        total_amount: 0, date: new Date().toISOString().split('T')[0], description: '' 
      });
      fetchData();
      alert("İşlem Başarılı! Stok Güncellendi. ✅");

    } catch (error: any) {
      alert("Hata: " + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 ml-64 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Faturalar</h1>
          <p className="text-slate-500 text-sm mt-1">Satışlarınızı yönetin, stoktan otomatik düşün.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all">
          <Plus size={20} /> Yeni Fatura Kes
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Müşteri</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Detay</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase text-center">Miktar</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase text-right">Toplam</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Yükleniyor...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Kayıt yok.</td></tr>
            ) : invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all cursor-pointer" onClick={() => router.push(`/faturalar/${invoice.id}`)}>
                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                  {invoice.contacts?.name || 'Bilinmeyen'}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {invoice.description}
                  <span className="block text-[10px] text-slate-400">
                    {new Date(invoice.issue_date).toLocaleDateString('tr-TR')}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                    {invoice.quantity} {invoice.unit}
                  </span>
                </td>
                <td className={`px-6 py-4 text-right font-black text-lg ${invoice.type === 'sales' ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {invoice.total_amount} ₺
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* GELİŞMİŞ MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black">Yeni Fatura</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={24}/></button>
            </div>
            <form onSubmit={handleAddInvoice} className="space-y-4">
              
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Müşteri Seç</label>
                <select required className="w-full p-3 border rounded-xl bg-slate-50"
                  value={formData.contact_id} onChange={(e) => setFormData({...formData, contact_id: e.target.value})}>
                  <option value="">Seçiniz...</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <label className="text-[10px] font-bold uppercase text-blue-600 flex items-center gap-1 mb-1">
                  <Package size={12}/> Ürün Seç
                </label>
                <select className="w-full p-3 border border-blue-200 rounded-xl bg-white outline-none"
                  value={formData.product_id} onChange={(e) => handleProductChange(e.target.value)}>
                  <option value="">Manuel Giriş</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>
                  ))}
                </select>
              </div>

              {/* HESAPLAMA ALANI: Miktar x Birim Fiyat = Toplam */}
              <div className="grid grid-cols-3 gap-3">
                
                {/* 1. MİKTAR */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Miktar</label>
                  <div className="flex">
                    <input type="number" className="w-2/3 p-3 border-y border-l rounded-l-xl font-bold text-center"
                      value={formData.quantity} onChange={(e) => handleQuantityChange(parseFloat(e.target.value))} />
                    <select className="w-1/3 p-1 border rounded-r-xl bg-slate-100 text-xs"
                      value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})}>
                      <option>Adet</option>
                      <option>Kg</option>
                      <option>Koli</option>
                      <option>Çuval</option>
                    </select>
                  </div>
                </div>

                {/* 2. BİRİM FİYAT (BURASI ARTIK DEĞİŞTİRİLEBİLİR) */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Birim Fiyat</label>
                  <input type="number" className="w-full p-3 border rounded-xl font-bold text-center bg-amber-50 border-amber-200 text-amber-800"
                    placeholder="0.00"
                    value={formData.unit_price} 
                    onChange={(e) => handleUnitPriceChange(parseFloat(e.target.value))} />
                </div>

                {/* 3. TOPLAM (OTOMATİK) */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Toplam</label>
                  <div className="relative">
                     <input readOnly className="w-full p-3 border rounded-xl font-black text-right bg-slate-100 text-slate-500"
                      value={formData.total_amount.toLocaleString('tr-TR')} />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                 <div className="w-1/2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">İşlem Türü</label>
                  <select className="w-full p-3 border rounded-xl" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                    <option value="sales">Satış (Gelir)</option>
                    <option value="purchase">Alış (Gider)</option>
                  </select>
                </div>
                <div className="w-1/2">
                   <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Açıklama</label>
                   <input className="w-full p-3 border rounded-xl" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}/>
                </div>
              </div>

              <button disabled={submitting} type="submit" className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold shadow-lg">
                {submitting ? 'KAYDEDİLİYOR...' : 'ONAYLA VE BİTİR'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}