'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, Package, Search, Clock, CheckCircle2, ShoppingBag, X, Save, Calculator } from 'lucide-react';

export default function BusinessOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // SİPARİŞ DÜZENLEME STATE'LERİ
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [editableItems, setEditableItems] = useState<any[]>([]);
  const [newTotal, setNewTotal] = useState<number>(0);
  const [processing, setProcessing] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchAllMyOrders();
  }, [supabase]);

  const fetchAllMyOrders = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: myCompanies } = await supabase.from('companies').select('id, name').eq('owner_id', user.id);
    if (!myCompanies || myCompanies.length === 0) { setLoading(false); return; }

    const companyIds = myCompanies.map(c => c.id);

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .in('company_id', companyIds)
      .order('created_at', { ascending: false });

    if (ordersData) {
      const enriched = await Promise.all(ordersData.map(async (order) => {
        const { data: prof } = await supabase.from('profiles').select('full_name').eq('global_cari_code', order.customer_cari_code).maybeSingle();
        const dukkanAdi = myCompanies.find(c => c.id === order.company_id)?.name || 'Bilinmeyen Dükkan';
        
        let parsedItems = [];
        try { parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items; } 
        catch (e) { parsedItems = []; }

        return { 
          ...order, 
          customer_name: prof?.full_name || 'Bilinmeyen Müşteri',
          target_company: dukkanAdi,
          parsed_items: parsedItems
        };
      }));
      setOrders(enriched);
    }
    setLoading(false);
  };

  // MODAL AÇILDIĞINDA ÜRÜNLERİ DÜZENLENEBİLİR STATE'E AL
  const openOrderModal = (order: any) => {
    setSelectedOrder(order);
    setEditableItems([...order.parsed_items]);
    setNewTotal(order.total_amount);
  };

  // MİKTAR VEYA FİYAT DEĞİŞTİĞİNDE HESAPLAMA YAPAN FONKSİYON
  const handleItemChange = (index: number, field: string, value: string) => {
    const updated = [...editableItems];
    updated[index][field] = Number(value);
    setEditableItems(updated);
    
    // Yeni Genel Toplamı Hesapla
    const calculatedTotal = updated.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
    setNewTotal(calculatedTotal);
  };

  // SİPARİŞİ ONAYLA VE BAKİYEYİ MÜŞTERİYE BORÇ YAZ (ASIL BÜYÜ BURADA) 🚀
  const handleApproveAndBill = async () => {
    setProcessing(true);
    try {
      // 1. Siparişi Veritabanında Güncelle (Yeni miktar, yeni fiyat, yeni toplam ve durum = Hazırlanıyor)
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          items: JSON.stringify(editableItems),
          total_amount: newTotal,
          status: 'Hazırlanıyor'
        })
        .eq('id', selectedOrder.id);

      if (orderError) throw orderError;

      // 2. Müşterinin Profilini Bul ve Bakiyesine Ekle (Borçlandır)
      const { data: customerProfile } = await supabase
        .from('profiles')
        .select('id, current_balance')
        .eq('global_cari_code', selectedOrder.customer_cari_code)
        .single();

      if (customerProfile) {
        const updatedBalance = Number(customerProfile.current_balance || 0) + Number(newTotal);
        
        await supabase
          .from('profiles')
          .update({ current_balance: updatedBalance })
          .eq('id', customerProfile.id);
      }

      // Başarılı olursa ekranı güncelle
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { 
        ...o, 
        items: JSON.stringify(editableItems), 
        parsed_items: editableItems,
        total_amount: newTotal, 
        status: 'Hazırlanıyor' 
      } : o));
      
      setSelectedOrder(null);
      alert(`Sipariş Onaylandı! ${newTotal} ₺, ${selectedOrder.customer_name} adlı müşterinin cari hesabına borç olarak yazıldı.`);
      
    } catch (error: any) {
      alert("Hata oluştu: " + error.message);
    }
    setProcessing(false);
  };

  const newOrders = orders.filter(o => o.status === 'Beklemede');
  const preparingOrders = orders.filter(o => o.status === 'Hazırlanıyor');

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" size={48} /></div>;

  return (
    <div className="p-8 bg-[#F4F7FE] min-h-screen">
      <h1 className="text-3xl font-black text-[#1B2559] uppercase mb-8">Sipariş & Mutabakat Masası</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* YENİ BEKLEYEN SÜTUNU */}
        <div className="bg-white/50 p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <h2 className="font-black text-orange-600 mb-6 uppercase flex items-center gap-2"><Clock size={18} /> Bekleyen Onaylar ({newOrders.length})</h2>
          <div className="space-y-4">
            {newOrders.map(order => (
              <div key={order.id} onClick={() => openOrderModal(order)} className="bg-white p-5 rounded-3xl shadow-sm hover:border-blue-500/50 border border-transparent cursor-pointer transition-all">
                <h4 className="font-black text-[#1B2559] uppercase">{order.customer_name}</h4>
                <p className="text-lg font-black text-[#1B2559] mt-2">{order.total_amount} ₺</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">ŞUBE: {order.target_company}</p>
              </div>
            ))}
          </div>
        </div>

        {/* HAZIRLANANLAR (ONAYLANMIŞ) SÜTUNU */}
        <div className="bg-blue-50/30 p-6 rounded-[32px] border border-blue-100">
          <h2 className="font-black text-blue-600 mb-6 uppercase flex items-center gap-2"><Package size={18} /> Cari İşlenmiş & Hazırlananlar ({preparingOrders.length})</h2>
          <div className="space-y-4">
            {preparingOrders.map(order => (
              <div key={order.id} className="bg-white p-5 rounded-3xl shadow-sm border border-blue-100 opacity-80">
                <h4 className="font-black text-[#1B2559] uppercase">{order.customer_name}</h4>
                <p className="text-lg font-black text-blue-600 mt-2">{order.total_amount} ₺</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Durum: Onaylandı ve Bakiye Yazıldı</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SİPARİŞ DÜZENLEME VE ONAYLAMA MODALI */}
      {selectedOrder && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B2559]/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               {/* MODAL BAŞLIK */}
               <div className="bg-[#1B2559] p-6 text-white flex justify-between items-center shrink-0">
                 <div>
                   <h2 className="text-xl font-black uppercase">{selectedOrder.customer_name}</h2>
                   <p className="text-blue-200 text-xs font-bold mt-1">Siparişi düzenle ve cari bakiyeye aktar</p>
                 </div>
                 <button onClick={() => setSelectedOrder(null)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X /></button>
               </div>

               {/* ÜRÜN DÜZENLEME LİSTESİ */}
               <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
                 <div className="grid grid-cols-12 gap-4 mb-2 text-xs font-black text-gray-400 uppercase px-2">
                    <div className="col-span-5">Ürün Adı</div>
                    <div className="col-span-3 text-center">Miktar</div>
                    <div className="col-span-3 text-center">Birim Fiyat (₺)</div>
                    <div className="col-span-1 text-right">Top</div>
                 </div>
                 
                 <div className="space-y-3">
                   {editableItems.map((item: any, idx: number) => (
                     <div key={idx} className="grid grid-cols-12 gap-4 items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                       <div className="col-span-5 font-bold text-sm text-[#1B2559] truncate pr-2">{item.name}</div>
                       
                       {/* Miktar Değiştirme */}
                       <div className="col-span-3 flex items-center bg-gray-50 rounded-xl border border-gray-200 overflow-hidden focus-within:border-blue-500 transition-colors">
                          <input type="number" min="0" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} className="w-full bg-transparent text-center font-black py-2 outline-none text-[#1B2559]" />
                       </div>

                       {/* Fiyat Değiştirme */}
                       <div className="col-span-3 flex items-center bg-gray-50 rounded-xl border border-gray-200 overflow-hidden focus-within:border-blue-500 transition-colors">
                          <input type="number" min="0" step="0.01" value={item.price || 0} onChange={(e) => handleItemChange(idx, 'price', e.target.value)} className="w-full bg-transparent text-center font-black py-2 outline-none text-[#1B2559]" />
                       </div>

                       <div className="col-span-1 text-right font-black text-blue-600 text-sm">
                          {((item.quantity || 0) * (item.price || 0)).toLocaleString('tr-TR')}
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

               {/* ONAYLAMA VE TOPLAM BÖLÜMÜ */}
               <div className="p-6 bg-white border-t border-gray-100 shrink-0">
                 <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3 text-gray-400 font-bold uppercase text-sm">
                       <Calculator size={24} /> Yeni Genel Toplam:
                    </div>
                    <p className="text-4xl font-black text-[#1B2559]">{newTotal.toLocaleString('tr-TR')} <span className="text-xl">₺</span></p>
                 </div>
                 
                 <div className="flex gap-4">
                   <button onClick={() => setSelectedOrder(null)} className="w-1/3 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl uppercase hover:bg-gray-200 transition-colors">İptal</button>
                   <button 
                    onClick={handleApproveAndBill}
                    disabled={processing}
                    className="w-2/3 py-4 bg-[#3063E9] text-white font-black rounded-2xl uppercase shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                   >
                     {processing ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Onayla ve {newTotal} ₺ Cari Borç Yaz</>}
                   </button>
                 </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}