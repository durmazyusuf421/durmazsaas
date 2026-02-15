'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Package, Loader2, Edit, Send, CheckCircle2, XCircle, Clock, AlertCircle, ShoppingBag, X } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Düzenleme / Mutabakat Modalı State'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [editItems, setEditItems] = useState<any[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      if (!profile?.company_id) return;

      // Siparişleri ve Müşteri isimlerini çek
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, customers(name, current_cari_code)')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (ordersData) setOrders(ordersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // 📝 SİPARİŞİ HAZIRLAMA MODALINI AÇ
  const openPrepareModal = (order: any) => {
    setSelectedOrder(order);
    // İçerideki ürünleri kopyala ki orijinali bozulmasın
    setEditItems(JSON.parse(JSON.stringify(order.items)));
    setIsModalOpen(true);
  };

  // ✏️ ÜRÜN ADET/FİYAT DEĞİŞTİRME
  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...editItems];
    newItems[index][field] = Number(value);
    setEditItems(newItems);
  };

  // 🗑️ ÜRÜNÜ LİSTEDEN ÇIKARMA (Stokta hiç yoksa)
  const handleRemoveItem = (index: number) => {
    const newItems = editItems.filter((_, i) => i !== index);
    setEditItems(newItems);
  };

  // 🧮 YENİ TOPLAMI HESAPLA
  const calculateNewTotal = () => {
    return editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // 🚀 MÜŞTERİ ONAYINA (MUTABAKATA) GÖNDER
  const handleSendToApproval = async () => {
    if (editItems.length === 0) return alert("Siparişte hiç ürün kalmadı! İptal etmek istiyorsanız çarpıya basın.");
    if (!confirm("Siparişi güncelleyip müşterinin onayına (Mutabakata) göndermek istiyor musunuz?")) return;

    setProcessing(true);
    const newTotal = calculateNewTotal();

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          items: editItems,
          total_amount: newTotal,
          status: 'musteri_onayinda' // 🌟 Topu Müşteriye Attık!
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      alert("Sipariş başarıyla hazırlandı ve Müşteri Onayına gönderildi!");
      setIsModalOpen(false);
      fetchOrders();
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // ❌ SİPARİŞİ KOMPLE İPTAL ET
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Bu sipariş talebini tamamen iptal etmek istediğinize emin misiniz?")) return;
    setProcessing(true);
    try {
      await supabase.from('orders').update({ status: 'reddedildi' }).eq('id', orderId);
      fetchOrders();
    } catch (err: any) { alert("Hata: " + err.message); } finally { setProcessing(false); }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 text-[#1B2559]">
      
      {/* BAŞLIK */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Gelen Siparişler</h1>
          <p className="text-gray-400 font-medium text-sm mt-1">Müşteri taleplerini hazırlayın ve mutabakata gönderin.</p>
        </div>
      </div>

      {/* SİPARİŞ TABLOSU */}
      <div className="bg-white border border-gray-100 rounded-[30px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-gray-50/50 border-b border-gray-50">
              <tr>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Sipariş & Müşteri</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Tarih</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Tahmini Tutar</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Durum</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-[#3063E9]" size={32}/></td></tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-medium">Henüz gelen bir sipariş talebi yok.</p>
                  </td>
                </tr>
              ) : orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50/30 transition-colors">
                  
                  {/* MÜŞTERİ BİLGİSİ */}
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-[#3063E9] rounded-xl flex items-center justify-center">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="font-black text-[#1B2559] uppercase">{o.customers?.name || 'Bilinmeyen Müşteri'}</p>
                        <p className="text-xs text-gray-400 font-bold tracking-widest">KOD: {o.customers?.current_cari_code} • {o.items.length} Kalem Ürün</p>
                      </div>
                    </div>
                  </td>
                  
                  {/* TARİH */}
                  <td className="p-5 text-center font-bold text-gray-500 text-sm">
                    {new Date(o.created_at).toLocaleDateString('tr-TR')}
                  </td>

                  {/* TUTAR */}
                  <td className="p-5 text-right font-black text-lg tracking-tight text-[#1B2559]">
                    ₺{Number(o.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>

                  {/* DURUM ROZETİ */}
                  <td className="p-5 text-center">
                    {o.status === 'bekliyor' && <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-100"><Clock size={14}/> Sizi Bekliyor</span>}
                    {o.status === 'musteri_onayinda' && <span className="inline-flex items-center gap-1 bg-blue-50 text-[#3063E9] px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 animate-pulse"><Send size={14}/> Müşteri Onayı Bekliyor</span>}
                    {o.status === 'onaylandi' && <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-100"><CheckCircle2 size={14}/> Fatura Kesildi</span>}
                    {o.status === 'reddedildi' && <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200"><XCircle size={14}/> İptal / İtiraz</span>}
                  </td>

                  {/* İŞLEM BUTONLARI */}
                  <td className="p-5 text-right">
                    {o.status === 'bekliyor' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openPrepareModal(o)} className="bg-[#3063E9] hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95">
                          <Edit size={16} /> Hazırla & Fiyatla
                        </button>
                        <button onClick={() => handleCancelOrder(o.id)} disabled={processing} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                          <X size={20} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">İşlem Yapılamaz</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🌟 SİPARİŞ HAZIRLAMA VE FİYATLAMA MODALI (MUTABAKAT EKRANI) */}
      {/* ========================================================= */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-3xl rounded-[32px] p-8 shadow-2xl relative flex flex-col max-h-[90vh]">
            
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors">
              <X size={24} />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-black tracking-tighter uppercase text-[#1B2559]">Siparişi Hazırla</h2>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
                Müşteri: <span className="text-[#3063E9]">{selectedOrder.customers?.name}</span>
              </p>
            </div>

            {/* UYARI BİLGİSİ */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6 flex gap-3 items-start">
              <AlertCircle className="text-[#3063E9] shrink-0 mt-0.5" size={20} />
              <p className="text-sm font-medium text-blue-900">
                Lütfen stok durumuna göre adetleri ve güncel fiyatları düzenleyin. Siz gönderdikten sonra <strong>müşteri onaylarsa</strong> bu tutar resmi borç (fatura) olarak bakiyesine yazılacaktır.
              </p>
            </div>

            {/* ÜRÜN LİSTESİ (KAYDIRILABİLİR ALAN) */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-6">
              {editItems.map((item, index) => (
                <div key={index} className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-4">
                  
                  <div className="flex-1">
                    <p className="font-black text-[#1B2559] text-sm uppercase">{item.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">İlk Talep: {item.quantity} Adet x ₺{item.price}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* ADET AYARI */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Gerçek Adet</label>
                      <input 
                        type="number" 
                        min="1"
                        className="w-20 p-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#3063E9] font-black text-center"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      />
                    </div>
                    
                    {/* FİYAT AYARI */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Güncel Fiyat (₺)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-28 p-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#3063E9] font-black text-center"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      />
                    </div>

                    <div className="text-right w-24">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Satır Toplamı</p>
                      <p className="font-black text-[#1B2559]">₺{(item.price * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                    </div>

                    {/* SİL BUTONU (Stokta Yoksa) */}
                    <button onClick={() => handleRemoveItem(index)} className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors mt-4 md:mt-0" title="Ürünü Çıkar (Stokta Yok)">
                      <X size={18} />
                    </button>
                  </div>

                </div>
              ))}
            </div>

            {/* YENİ TOPLAM VE GÖNDER BUTONU */}
            <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Yeni Hazırlanan Tutar</p>
                <p className="text-3xl font-black tracking-tighter text-[#1B2559]">
                  ₺{calculateNewTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all">
                  İptal
                </button>
                <button 
                  onClick={handleSendToApproval} 
                  disabled={processing || editItems.length === 0}
                  className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-black uppercase tracking-wide rounded-2xl shadow-xl shadow-green-200 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 w-full md:w-auto"
                >
                  {processing ? <Loader2 size={20} className="animate-spin" /> : <><Send size={20} /> Müşteri Onayına Gönder</>}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}