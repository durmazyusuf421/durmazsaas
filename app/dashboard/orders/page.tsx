'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  ShoppingBag, 
  Calendar, 
  ChevronRight, 
  Loader2, 
  Package,
  Search,
  X,
  Receipt,
  Printer,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function BusinessOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchOrders();
  }, [supabase]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: companies } = await supabase.from('companies').select('id, name').eq('owner_id', user.id);
    if (!companies || companies.length === 0) { setLoading(false); return; }

    const companyIds = companies.map(c => c.id);

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .in('company_id', companyIds)
      .order('created_at', { ascending: false });

    if (ordersData) {
      const ordersWithCustomerData = await Promise.all(
        ordersData.map(async (order) => {
          const { data: profile } = await supabase
            .from('profiles').select('full_name').eq('global_cari_code', order.customer_cari_code).maybeSingle();

          let parsedItems = [];
          try {
            if (order.items) {
               parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            }
          } catch (e) { parsedItems = []; }

          return {
            ...order,
            customer_name: profile?.full_name || 'Bilinmeyen Müşteri',
            item_count: Array.isArray(parsedItems) ? parsedItems.length : 0,
            parsed_items: parsedItems
          };
        })
      );
      setOrders(ordersWithCustomerData);
    }
    setLoading(false);
  };

  const updateStatus = async (orderId: string, newStatus: string, shouldPrint: boolean = false) => {
    setUpdating(true);
    
    if (shouldPrint) {
      window.print();
    }

    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    
    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } else {
      alert("Durum güncellenirken bir hata oluştu!");
    }
    
    setUpdating(false);
    if (newStatus === 'Tamamlandı') setSelectedOrder(null);
  };

  const filteredOrders = orders.filter(o => 
    o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer_cari_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const newOrders = filteredOrders.filter(o => o.status === 'Beklemede');
  const preparingOrders = filteredOrders.filter(o => o.status === 'Hazırlanıyor');
  const readyOrders = filteredOrders.filter(o => o.status === 'Tamamlandı');

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin text-[#3063E9]" size={48} />
      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Sistem Yükleniyor...</p>
    </div>
  );

  const OrderCard = ({ order }: { order: any }) => (
    <div 
      onClick={() => setSelectedOrder(order)} 
      className="bg-white p-5 rounded-[24px] border border-gray-100 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-black text-[#1B2559] uppercase text-sm">{order.customer_name}</h4>
          <span className="text-[10px] font-black bg-gray-50 text-gray-500 px-2 py-1 rounded-md mt-1 inline-block">
            {order.customer_cari_code}
          </span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
          <ChevronRight size={16} />
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
          <Package size={12}/> {order.item_count} Kalem
        </div>
        <p className="text-lg font-black text-[#1B2559]">{order.total_amount.toLocaleString('tr-TR')} ₺</p>
      </div>
    </div>
  );

  // KDV ve Alt Toplam Hesaplamaları (Görsellik için %10 varsayılan KDV)
  const calculateTotals = (total: number) => {
    const taxRate = 10;
    const subTotal = total / (1 + taxRate / 100);
    const taxAmount = total - subTotal;
    return { subTotal, taxAmount, taxRate, grandTotal: total };
  };

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen bg-[#F4F7FE] print:p-0 print:bg-white">
      
      {/* KAĞIT ÇIKTISI AYARLARI (Yazıcıda renklerin çıkması ve A4 boyutu için) */}
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white; }
        }
      `}</style>

      {/* --- EKRAN GÖRÜNÜMÜ: BAŞLIK VE ARAMA (Yazdırırken Gizlenir) --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter">Sipariş Yönetimi</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Holding Operasyon Masası</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" placeholder="Müşteri veya Kod Ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-transparent rounded-2xl outline-none focus:border-blue-500 shadow-sm font-medium transition-all"
          />
        </div>
      </div>

      {/* --- EKRAN GÖRÜNÜMÜ: 3 BÖLMELİ KANBAN TAHTASI (Yazdırırken Gizlenir) --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 print:hidden">
        <div className="bg-gray-50/50 p-4 rounded-[32px] border border-gray-200/50">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-sm font-black text-orange-600 uppercase tracking-widest flex items-center gap-2"><Clock size={18}/> Yeni Bekleyen</h2>
            <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-black">{newOrders.length}</span>
          </div>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
            {newOrders.map(order => <OrderCard key={order.id} order={order} />)}
          </div>
        </div>

        <div className="bg-blue-50/30 p-4 rounded-[32px] border border-blue-100/50">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Package size={18}/> Hazırlanıyor</h2>
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-black">{preparingOrders.length}</span>
          </div>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
            {preparingOrders.map(order => <OrderCard key={order.id} order={order} />)}
          </div>
        </div>

        <div className="bg-green-50/30 p-4 rounded-[32px] border border-green-100/50">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-sm font-black text-green-600 uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={18}/> Hazırlandı</h2>
            <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-black">{readyOrders.length}</span>
          </div>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
            {readyOrders.map(order => <OrderCard key={order.id} order={order} />)}
          </div>
        </div>
      </div>

      {/* --- SİPARİŞ DETAY MODALI (EKRAN VE YAZICI İÇİN İKİYE AYRILDI) --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B2559]/60 backdrop-blur-md print:absolute print:inset-0 print:bg-white print:p-0 print:block">
          
          {/* 1. SADECE EKRANDA GÖRÜNEN MODERN POP-UP (Yazdırırken gizlenir) */}
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl flex flex-col max-h-[90vh] print:hidden">
            <div className="p-8 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-[#1B2559] uppercase tracking-tighter">{selectedOrder.customer_name}</h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">Cari: {selectedOrder.customer_cari_code}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Sipariş Edilen Ürünler</h3>
              <div className="space-y-3">
                {selectedOrder.parsed_items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div>
                      <h4 className="font-black text-[#1B2559] text-sm uppercase">{item.name}</h4>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Birim: {item.price?.toLocaleString('tr-TR')} ₺</p>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center pr-8 border-r border-gray-200">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Miktar</p>
                        <p className="font-black text-blue-600">{item.quantity} {item.unit}</p>
                      </div>
                      <div className="text-right w-24">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Toplam</p>
                        <p className="font-black text-[#1B2559]">{(item.price * item.quantity).toLocaleString('tr-TR')} ₺</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Genel Toplam</p>
                <p className="text-4xl font-black text-[#1B2559] tracking-tighter">{selectedOrder.total_amount.toLocaleString('tr-TR')} ₺</p>
              </div>
              <div className="flex w-full md:w-auto gap-4">
                {selectedOrder.status === 'Beklemede' && (
                  <button onClick={() => updateStatus(selectedOrder.id, 'Hazırlanıyor', true)} disabled={updating} className="flex-1 px-6 py-4 bg-[#3063E9] hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3">
                    {updating ? <Loader2 className="animate-spin" size={20}/> : <><Printer size={20}/> Fiş Yazdır & Hazırla</>}
                  </button>
                )}
                {selectedOrder.status === 'Hazırlanıyor' && (
                  <button onClick={() => updateStatus(selectedOrder.id, 'Tamamlandı')} disabled={updating} className="flex-1 px-6 py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3">
                    {updating ? <Loader2 className="animate-spin" size={20}/> : <><CheckCircle2 size={20}/> Hazırlandı İşaretle</>}
                  </button>
                )}
                {selectedOrder.status === 'Tamamlandı' && (
                  <div className="px-6 py-4 bg-gray-200 text-gray-500 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2">Sipariş Bitti</div>
                )}
              </div>
            </div>
          </div>

          {/* 2. SADECE YAZICIDA GÖRÜNEN KURUMSAL İRSALİYE TASARIMI (Ekranda gizlidir, çıktı alırken A4 olur) */}
          <div className="hidden print:block bg-white w-full h-full p-12 text-[#1a1a1a] font-sans">
            {/* Logo ve Başlık */}
            <div className="flex justify-between items-start border-b-2 border-[#1B2559] pb-8 mb-8">
              <div className="flex flex-col items-start">
                <div className="relative mb-2">
                    <span className="font-serif text-6xl font-bold text-[#1B2559] leading-none" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>D</span>
                    <div className="absolute -right-3 top-1 h-full border-r-2 border-[#c5a572]"></div>
                </div>
                <h1 className="text-2xl font-black text-[#1B2559] uppercase tracking-tight leading-none">DURMAZ SAAS HOLDİNG A.Ş.</h1>
                <p className="text-sm font-bold text-[#c5a572] tracking-[0.2em] uppercase mt-1">B2B PLATFORMU</p>
              </div>
              <div className="text-right mt-4">
                <h2 className="text-xl font-black uppercase tracking-widest text-[#1B2559] underline underline-offset-8 decoration-2">SEVK EMRİ VE İRSALİYESİ</h2>
              </div>
            </div>

            {/* Müşteri ve Belge Bilgileri */}
            <div className="grid grid-cols-2 gap-12 mb-10">
              <div>
                <h3 className="text-xs font-black text-[#1B2559] uppercase tracking-[0.1em] mb-3 border-b border-gray-300 pb-1">Müşteri Bilgileri</h3>
                <p className="font-bold text-lg uppercase">{selectedOrder.customer_name}</p>
                <p className="font-medium text-sm text-gray-600 mt-1">Cari Kod: <span className="font-bold text-black">{selectedOrder.customer_cari_code}</span></p>
              </div>
              <div className="text-right">
                <h3 className="text-xs font-black text-[#1B2559] uppercase tracking-[0.1em] mb-3 border-b border-gray-300 pb-1 inline-block w-full">Sipariş Bilgileri</h3>
                <div className="space-y-1">
                    <p className="font-medium text-sm text-gray-600">Sipariş No: <span className="font-bold text-black text-lg">SIP-{selectedOrder.id.substring(0,6).toUpperCase()}</span></p>
                    <p className="font-medium text-sm text-gray-600">Tarih: <span className="font-bold text-black">{new Date(selectedOrder.created_at).toLocaleDateString('tr-TR')}</span></p>
                    <p className="font-medium text-sm text-gray-600">Saat: <span className="font-bold text-black">{new Date(selectedOrder.created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</span></p>
                </div>
              </div>
            </div>

            {/* Sipariş Kalemleri Tablosu */}
            <div className="mb-8 overflow-hidden rounded-sm border border-[#1B2559]">
              <table className="w-full text-sm leading-relaxed">
                <thead>
                  <tr className="bg-[#1B2559] text-white uppercase text-xs tracking-wider font-black text-left">
                    <th className="py-3 px-4 border-r border-blue-800/30 w-12 text-center">No</th>
                    <th className="py-3 px-4 border-r border-blue-800/30 w-1/2">Ürün Adı</th>
                    <th className="py-3 px-4 border-r border-blue-800/30 text-center">Birim</th>
                    <th className="py-3 px-4 border-r border-blue-800/30 text-center">Miktar</th>
                    <th className="py-3 px-4 border-r border-blue-800/30 text-right">Fiyat</th>
                    <th className="py-3 px-4 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium text-gray-800">
                  {selectedOrder.parsed_items?.map((item: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-3 px-4 border-r border-gray-200 text-center font-bold">{index + 1}</td>
                      <td className="py-3 px-4 border-r border-gray-200 font-bold text-[#1B2559]">{item.name}</td>
                      <td className="py-3 px-4 border-r border-gray-200 text-center">{item.unit || 'Adet'}</td>
                      <td className="py-3 px-4 border-r border-gray-200 text-center font-bold text-black">{item.quantity}</td>
                      <td className="py-3 px-4 border-r border-gray-200 text-right">{item.price?.toLocaleString('tr-TR')} ₺</td>
                      <td className="py-3 px-4 text-right font-bold">{(item.price * item.quantity).toLocaleString('tr-TR')} ₺</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Toplamlar */}
            <div className="flex flex-col items-end space-y-3 mb-16 border-t-2 border-[#1B2559] pt-4">
              <div className="w-64 flex justify-between text-sm font-bold text-gray-600">
                <span>ARA TOPLAM:</span>
                <span>{calculateTotals(selectedOrder.total_amount).subTotal.toLocaleString('tr-TR', {maximumFractionDigits:2})} ₺</span>
              </div>
              <div className="w-64 flex justify-between text-sm font-bold text-gray-600">
                <span>KDV (%10):</span>
                <span>{calculateTotals(selectedOrder.total_amount).taxAmount.toLocaleString('tr-TR', {maximumFractionDigits:2})} ₺</span>
              </div>
              <div className="w-72 flex justify-between text-xl font-black text-[#1B2559] border-t border-gray-300 pt-2 bg-gray-100 px-3 py-2 rounded-md">
                <span>GENEL TOPLAM:</span>
                <span>{selectedOrder.total_amount.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</span>
              </div>
            </div>

            {/* İmzalar */}
            <div className="grid grid-cols-3 gap-8 mt-auto pb-12">
                {['HAZIRLAYAN', 'KONTROL EDEN', 'TESLİM ALAN'].map((role) => (
                    <div key={role} className="border-2 border-dashed border-gray-400 h-28 relative bg-gray-50/50 rounded-lg">
                        <span className="absolute top-2 left-3 text-[10px] font-black text-[#1B2559] uppercase tracking-widest bg-white px-1">{role}</span>
                        <div className="absolute bottom-2 left-3 right-3 border-b border-gray-400"></div>
                        <span className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-300 italic font-serif text-sm pointer-events-none">İmza / Kaşe / Tarih</span>
                    </div>
                ))}
            </div>

            {/* Fake Barkod */}
            <div className="absolute bottom-10 right-12 flex flex-col items-center opacity-70">
                <div className="flex h-8 gap-[2px]">
                    {[...Array(30)].map((_, i) => <div key={i} className={`bg-black ${i % 3 === 0 ? 'w-1' : 'w-[2px]'}`}></div>)}
                </div>
                <span className="text-[10px] font-bold tracking-[0.3em] mt-1">SIP-{selectedOrder.id.substring(0,6).toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}