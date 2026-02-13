'use client';
import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Plus, FileText, User, Trash2, Save, Loader2, X, Eye, Share2 } from 'lucide-react';

export default function InvoicesPage() {
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  
  // Veriler
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Modal Durumları
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Yeni Fatura Formu
  const [newInvoice, setNewInvoice] = useState({
    customer_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'Bekliyor',
    notes: ''
  });

  // Fatura Kalemleri
  const [items, setItems] = useState<any[]>([
    { product_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: 20, total: 0 }
  ]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // VERİLERİ ÇEK
  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
    
    if (profile?.company_id) {
      setCompanyId(profile.company_id);

      const { data: invData } = await supabase
        .from('invoices')
        .select(`*, customers(name, phone)`)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });
      if (invData) setInvoices(invData);

      const { data: custData } = await supabase.from('customers').select('*').eq('company_id', profile.company_id);
      if (custData) setCustomers(custData);

      const { data: prodData } = await supabase.from('products').select('*').eq('company_id', profile.company_id);
      if (prodData) setProducts(prodData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // FONKSİYONLAR
  const handleViewInvoice = (invoiceId: string) => {
    window.open(`/invoice/${invoiceId}`, '_blank');
  };

  const handleShareWhatsApp = (invoiceId: string, customerPhone: string) => {
    const url = `${window.location.origin}/invoice/${invoiceId}`;
    const text = `Merhaba, faturanız: ${url}`;
    const cleanPhone = customerPhone ? customerPhone.replace(/\D/g,'') : '';
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Silmek istediğinize emin misiniz?")) return;
    await supabase.from('invoices').delete().eq('id', id);
    fetchData();
  };

  // HESAPLAMALAR
  const calculateTotals = () => {
    let subTotal = 0;
    let taxTotal = 0;
    items.forEach(item => {
      const lineTotal = item.quantity * item.unit_price;
      const lineTax = lineTotal * (item.tax_rate / 100);
      subTotal += lineTotal;
      taxTotal += lineTax;
    });
    return { subTotal, taxTotal, grandTotal: subTotal + taxTotal };
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    const item = newItems[index];

    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        item.product_id = product.id;
        item.description = product.name;
        item.unit_price = product.price;
        item.tax_rate = product.vat_rate;
      }
    } else {
      // @ts-ignore
      item[field] = value;
    }
    setItems(newItems);
  };

  const addItemRow = () => setItems([...items, { product_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: 20, total: 0 }]);
  const removeItemRow = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!newInvoice.customer_id || !companyId) { alert("Müşteri seçin!"); return; }
    setSaving(true);
    const totals = calculateTotals();

    const { data: invData, error: invError } = await supabase
      .from('invoices')
      .insert([{
        company_id: companyId,
        customer_id: newInvoice.customer_id,
        invoice_date: newInvoice.invoice_date,
        due_date: newInvoice.due_date || null,
        status: newInvoice.status,
        notes: newInvoice.notes,
        total_amount: totals.grandTotal,
        tax_amount: totals.taxTotal
      }])
      .select().single();

    if (invError) { alert("Hata: " + invError.message); setSaving(false); return; }

    const invoiceItems = items.map(item => ({
      invoice_id: invData.id,
      product_id: item.product_id || null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      total_price: (item.quantity * item.unit_price) * (1 + item.tax_rate / 100)
    }));

    await supabase.from('invoice_items').insert(invoiceItems);
    setIsModalOpen(false);
    setNewInvoice({ customer_id: '', invoice_date: new Date().toISOString().split('T')[0], due_date: '', status: 'Bekliyor', notes: '' });
    setItems([{ product_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: 20, total: 0 }]);
    fetchData();
    setSaving(false);
  };

  const { grandTotal } = calculateTotals();

  return (
    <div className="space-y-6">
      {/* 1. BAŞLIK ALANI (MOBİL UYUMLU: flex-col md:flex-row) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2559]">Faturalar</h1>
          <p className="text-gray-500 text-sm">Tüm faturalarınızı buradan yönetin.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#3063E9] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#2552D0] shadow-lg shadow-blue-500/30 transition-all"
        >
          <Plus size={20} /> Yeni Fatura
        </button>
      </div>

      {/* 2. LİSTE ALANI (MOBİL UYUMLU: overflow-x-auto) */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
        
        {/* BU SARMALAYICI (WRAPPER) MOBİLDE KAYDIRMAYI SAĞLAR */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]"> {/* Tablo en az 800px genişliğinde kalır */}
            
            <div className="grid grid-cols-12 gap-4 p-5 border-b border-gray-100 bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <div className="col-span-4">MÜŞTERİ</div>
              <div className="col-span-2">TARİH</div>
              <div className="col-span-2">DURUM</div>
              <div className="col-span-2 text-right">TUTAR</div>
              <div className="col-span-2 text-right">İŞLEM</div>
            </div>

            {loading ? (
              <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FileText size={40} className="text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-[#1B2559]">Henüz Fatura Yok</h3>
              </div>
            ) : (
              invoices.map((inv) => (
                <div key={inv.id} className="grid grid-cols-12 gap-4 p-5 border-b border-gray-50 hover:bg-blue-50/30 transition-colors items-center">
                  <div className="col-span-4 font-bold text-[#1B2559] flex items-center gap-2 truncate">
                    <User size={16} className="text-blue-500 shrink-0"/> {inv.customers?.name || 'Bilinmeyen'}
                  </div>
                  <div className="col-span-2 text-sm text-gray-500">
                    {new Date(inv.invoice_date).toLocaleDateString('tr-TR')}
                  </div>
                  <div className="col-span-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      inv.status === 'Ödendi' ? 'bg-green-100 text-green-700' : 
                      inv.status === 'İptal' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="col-span-2 text-right font-bold text-gray-800">
                    ₺{inv.total_amount?.toLocaleString()}
                  </div>
                  <div className="col-span-2 text-right flex justify-end gap-2">
                    <button onClick={() => handleViewInvoice(inv.id)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={20}/></button>
                    <button onClick={() => handleShareWhatsApp(inv.id, inv.customers?.phone)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"><Share2 size={20}/></button>
                    <button onClick={() => handleDelete(inv.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={20}/></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <h2 className="text-2xl font-bold text-[#1B2559]">Yeni Fatura</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-500 hover:text-red-500" /></button>
            </div>

            {/* Form Fields (Mobilde alt alta gelmesi için grid yapısı) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Müşteri</label>
                <select className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-blue-500/20" value={newInvoice.customer_id} onChange={(e) => setNewInvoice({...newInvoice, customer_id: e.target.value})}>
                  <option value="">Seçiniz...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tarih</label>
                <input type="date" className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-blue-500/20" value={newInvoice.invoice_date} onChange={(e) => setNewInvoice({...newInvoice, invoice_date: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Durum</label>
                <select className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-blue-500/20" value={newInvoice.status} onChange={(e) => setNewInvoice({...newInvoice, status: e.target.value})}>
                  <option value="Bekliyor">Bekliyor</option>
                  <option value="Ödendi">Ödendi</option>
                  <option value="İptal">İptal</option>
                </select>
              </div>
            </div>

            {/* Ürün Tablosu (Mobilde kaydırılabilir) */}
            <div className="mb-8 overflow-x-auto">
              <div className="min-w-[600px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b"><th className="pb-2 w-[30%]">Hizmet</th><th className="pb-2 w-[15%]">Adet</th><th className="pb-2 w-[15%]">Fiyat</th><th className="pb-2 w-[15%]">KDV %</th><th className="pb-2 w-[15%] text-right">Toplam</th><th className="pb-2 w-[10%]"></th></tr>
                  </thead>
                  <tbody className="text-sm">
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="py-2 pr-2"><select className="w-full p-2 bg-gray-50 rounded-lg outline-none" value={item.product_id} onChange={(e) => updateItem(index, 'product_id', e.target.value)}><option value="">Ürün...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></td>
                        <td className="py-2 pr-2"><input type="number" className="w-full p-2 bg-gray-50 rounded-lg outline-none text-center" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))} /></td>
                        <td className="py-2 pr-2"><input type="number" className="w-full p-2 bg-gray-50 rounded-lg outline-none text-right" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))} /></td>
                        <td className="py-2 pr-2"><input type="number" className="w-full p-2 bg-gray-50 rounded-lg outline-none text-center" value={item.tax_rate} onChange={(e) => updateItem(index, 'tax_rate', parseFloat(e.target.value))} /></td>
                        <td className="py-2 pr-2 text-right font-bold text-gray-700">₺{((item.quantity * item.unit_price) * (1 + item.tax_rate/100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-2 text-center"><button onClick={() => removeItemRow(index)} className="text-red-300 hover:text-red-500"><Trash2 size={18}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={addItemRow} className="mt-4 text-sm font-bold text-blue-600 hover:underline flex items-center gap-1"><Plus size={16}/> Satır Ekle</button>
            </div>

            <div className="flex justify-end border-t pt-4">
              <div className="w-full md:w-64 flex justify-between text-[#1B2559] font-bold text-xl pt-2"><span>Genel Toplam:</span><span>₺{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
            </div>
            
            <div className="mt-8 flex flex-col md:flex-row justify-end gap-4">
               <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl w-full md:w-auto">İptal</button>
               <button onClick={handleSave} disabled={saving} className="bg-[#3063E9] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#2552D0] flex items-center justify-center gap-2 w-full md:w-auto">{saving ? <Loader2 className="animate-spin"/> : <Save size={20}/>} {saving ? "Kaydediliyor..." : "Kaydet"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}