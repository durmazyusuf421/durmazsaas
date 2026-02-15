'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  ShoppingBag, 
  Calendar, 
  ChevronRight, 
  Loader2, 
  Package,
  Search
} from 'lucide-react';

export default function BusinessOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      
      // 1. Kullanıcıyı kontrol et
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 2. KULLANICIYA AİT "TÜM" DÜKKANLARI ÇEK
      const { data: companies, error: compError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('owner_id', user.id);

      // Eğer hiç dükkan yoksa durdur
      if (compError || !companies || companies.length === 0) {
        console.error("Dükkan bulunamadı:", compError);
        setLoading(false);
        return;
      }

      // 3. Dükkanların ID'lerini bir listeye al (Böylece 1. ve 2. şube dahil tüm siparişler gelir)
      const companyIds = companies.map(c => c.id);

      // 4. Siparişleri bu ID listesi ile çek
      const { data: ordersData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .in('company_id', companyIds)
        .order('created_at', { ascending: false });

      if (orderError) {
        console.error("Siparişler çekilirken hata:", orderError);
      }

      if (ordersData) {
        // 5. Müşteri isimlerini 'profiles' tablosundan eşleştir
        const ordersWithCustomerData = await Promise.all(
          ordersData.map(async (order) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('global_cari_code', order.customer_cari_code)
              .maybeSingle();

            // Ürün (kalem) sayısını hesapla
            let itemCount = 0;
            try {
              if (order.items) {
                 const parsed = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                 itemCount = Array.isArray(parsed) ? parsed.length : 0;
              }
            } catch (e) { 
              itemCount = 0; 
            }

            return {
              ...order,
              customer_name: profile?.full_name || 'Bilinmeyen Müşteri',
              item_count: itemCount
            };
          })
        );
        setOrders(ordersWithCustomerData);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [supabase]);

  // Arama filtresi
  const filteredOrders = orders.filter(o => 
    o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer_cari_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-[#3063E9]" size={48} />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Siparişler Getiriliyor...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8">
      {/* BAŞLIK VE ARAMA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter">Gelen Siparişler</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Toplam {orders.length} Sipariş Bulunuyor</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Müşteri veya Kod Ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:border-[#3063E9] shadow-sm font-medium transition-all"
          />
        </div>
      </div>

      {/* SİPARİŞ LİSTESİ */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-20 rounded-[40px] border-2 border-dashed border-gray-100 text-center">
          <ShoppingBag size={64} className="mx-auto text-gray-100 mb-6" />
          <h3 className="text-xl font-black text-[#1B2559] uppercase">Henüz Sipariş Yok</h3>
          <p className="text-gray-400 mt-2">Müşterileriniz sipariş verdiğinde burada görünecek.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className="bg-white p-6 rounded-[32px] border border-transparent hover:border-[#3063E9]/20 hover:shadow-xl hover:shadow-blue-500/5 transition-all group flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="w-14 h-14 bg-[#F4F7FE] text-[#3063E9] rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-[#3063E9] group-hover:text-white transition-colors">
                  <Package size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-[#1B2559] uppercase text-lg leading-none">{order.customer_name}</h4>
                    <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">{order.customer_cari_code}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <Calendar size={12} /> {new Date(order.created_at).toLocaleDateString('tr-TR')}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                      <ShoppingBag size={12} /> {order.item_count} Ürün (Kalem)
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-8 border-t md:border-t-0 pt-4 md:pt-0">
                <div className="text-left md:text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Toplam Tutar</p>
                  <p className="text-2xl font-black text-[#1B2559]">{order.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                    order.status === 'Beklemede' 
                    ? 'bg-orange-50 text-orange-600 border-orange-100' 
                    : 'bg-green-50 text-green-600 border-green-100'
                  }`}>
                    {order.status}
                  </div>
                  <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#1B2559] hover:text-white transition-all">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}