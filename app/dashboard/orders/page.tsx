'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  ShoppingBag, Calendar, ChevronRight, Loader2, Package, Search, X, Receipt, Printer, CheckCircle2, Clock 
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

    // 1. ADIM: SAHİBİ OLDUĞUNUZ TÜM DÜKKANLARIN LİSTESİNİ ALIN
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name')
      .eq('owner_id', user.id);

    if (!companies || companies.length === 0) {
      console.log("Dükkan bulunamadı, owner_id kontrol edilmeli.");
      setLoading(false);
      return;
    }

    const companyIds = companies.map(c => c.id);

    // 2. ADIM: BU DÜKKANLARA GELEN TÜM SİPARİŞLERİ ÇEKİN
    const { data: ordersData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .in('company_id', companyIds) // Sadece 1 dükkana değil, sahib olduğun her yere bakıyoruz
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
    if (shouldPrint) window.print();
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder({ ...selectedOrder, status: newStatus });
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
      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Siparişler Taranıyor...</p>
    </div>
  );

  const OrderCard = ({ order }: { order: any }) => (
    <div onClick={() => setSelectedOrder(order)} className="bg-white p-5 rounded-[24px] border border-gray-100 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-black text-[#1B2559] uppercase text-sm">{order.customer_name}</h4>
          <span className="text-[10px] font-black bg-gray-50 text-gray-500 px-2 py-1 rounded-md mt-1 inline-block">{order.customer_cari_code}</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all"><ChevronRight size={16} /></div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase"><Package size={12}/> {order.item_count} Kalem</div>
        <p className="text-lg font-black text-[#1B2559]">{order.total_amount.toLocaleString('tr-TR')} ₺</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen bg-[#F4F7FE] print:p-0 print:bg-white">
      {/* BAŞLIK VE ARAMA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter">Sipariş Yönetimi</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Tüm Şubelerden Gelen Siparişler</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Müşteri veya Kod Ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-transparent rounded-2xl outline-none focus:border-blue-500 shadow-sm font-medium transition-all" />
        </div>
      </div>

      {/* KANBAN TAHTASI */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 print:hidden">
        <div className="bg-gray-50/50 p-4 rounded-[32px] border border-gray-200/50">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-sm font-black text-orange-600 uppercase tracking-widest flex items-center gap-2"><Clock size={18}/> Yeni Bekleyen</h2>
            <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-black">{newOrders.length}</span>
          </div>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">{newOrders.map(order => <OrderCard key={order.id} order={order} />)}</div>
        </div>
        <div className="bg-blue-50/30 p-4 rounded-[32px] border border-blue-100/50">
          <div className="flex items-center justify-between mb-6 px-2"><h2 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Package size={18}/> Hazırlanıyor</h2><span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-black">{preparingOrders.length}</span></div>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">{preparingOrders.map(order => <OrderCard key={order.id} order={order} />)}</div>
        </div>
        <div className="bg-green-50/30 p-4 rounded-[32px] border border-green-100/50">
          <div className="flex items-center justify-between mb-6 px-2"><h2 className="text-sm font-black text-green-600 uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={18}/> Hazırlandı</h2><span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-black">{readyOrders.length}</span></div>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">{readyOrders.map(order => <OrderCard key={order.id} order={order} />)}</div>
        </div>
      </div>

      {/* MODAL / POP-UP BURAYA GELECEK (Önceki kodun aynısı) */}
      {selectedOrder && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B2559]/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl p-8">
               <div className="flex justify-between mb-6">
                 <h2 className="text-2xl font-black text-[#1B2559] uppercase">{selectedOrder.customer_name}</h2>
                 <button onClick={() => setSelectedOrder(null)}><X /></button>
               </div>
               {/* Ürünleri Listele */}
               <div className="space-y-4">
                 {selectedOrder.parsed_items?.map((item: any, idx: number) => (
                   <div key={idx} className="flex justify-between p-4 bg-gray-50 rounded-2xl">
                     <span className="font-bold">{item.name}</span>
                     <span className="font-black">{item.quantity} {item.unit}</span>
                   </div>
                 ))}
               </div>
               <div className="mt-8 flex justify-between items-center">
                 <p className="text-3xl font-black">{selectedOrder.total_amount} ₺</p>
                 <button 
                  onClick={() => updateStatus(selectedOrder.id, 'Hazırlanıyor', true)}
                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black"
                 >
                   YAZDIR VE HAZIRLA
                 </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}