'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Package, 
  Loader2, 
  CheckCircle2, 
  Search, 
  Rocket, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

const borderColors = [
  'border-blue-500/50 hover:border-blue-500',
  'border-orange-500/50 hover:border-orange-500',
  'border-green-500/50 hover:border-green-500',
];

export default function B2BStorePage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  const companyId = params?.companyId as string;

  const [company, setCompany] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchStoreData = async () => {
      const { data: compData } = await supabase.from('companies').select('*').eq('id', companyId).single();
      if (compData) setCompany(compData);

      const { data: prodData } = await supabase.from('products').select('*').eq('company_id', companyId).order('name');
      if (prodData) setProducts(prodData);

      setLoading(false);
    };
    if (companyId) fetchStoreData();
  }, [companyId, supabase]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing && existing.quantity > 1) return prev.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
      return prev.filter(item => item.id !== productId);
    });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // --- GARANTİLİ HANDLE CHECKOUT FONKSİYONU ---
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setOrdering(true);
    
    try {
      // 1. 'orders' tablosuna ana kaydı atıyoruz (Hata veren 'items' sütununu da doldurarak)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_cari_code: code,
          company_id: companyId,
          total_amount: totalAmount,
          status: 'Beklemede',
          items: JSON.stringify(cart) // VERİTABANININ İSTEDİĞİ O KRİTİK SÜTUNU BURADA DOYURUYORUZ
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. 'order_items' tablosuna detayları işliyoruz
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Başarılı!
      setOrderSuccess(true);
      setCart([]);
    } catch (error: any) {
      console.error("Sipariş hatası:", error);
      alert("Hata: " + (error.message || "Sipariş kaydedilemedi."));
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#1a1a1a] gap-4">
      <Loader2 className="animate-spin text-blue-500" size={48} />
      <p className="text-blue-500 font-bold tracking-widest uppercase text-xs">Sistem Hazırlanıyor...</p>
    </div>
  );

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
        <div className="bg-[#242424] p-12 rounded-[48px] shadow-2xl text-center max-w-md w-full border border-gray-800/50">
          <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={52} />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Müjde Patron!</h2>
          <p className="text-gray-400 font-medium mb-10 leading-relaxed">
            Sipariş veritabanına başarıyla kilitlendi. Toptancınız ekranında görecektir.
          </p>
          <Link href={`/portal/${code}/orders`} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest block transition-all shadow-xl shadow-blue-600/20">
            Siparişlerim Sayfasına Git
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] font-sans text-white pb-24 lg:pb-0">
      
      {/* HEADER */}
      <div className="max-w-[1600px] mx-auto pt-10 px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-6 w-full lg:w-auto">
            <Link href={`/portal/${code}`} className="p-4 bg-[#242424] rounded-2xl hover:bg-[#2d2d2d] transition-all border border-gray-800 flex items-center gap-3 text-sm font-black text-gray-300 uppercase tracking-widest">
              <ArrowLeft size={20} /> Geri Dön
            </Link>
            <div>
              <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-white">
                {company?.name || 'DENEME MAĞAZASI'}
              </h1>
              <p className="text-blue-400 text-xs font-black tracking-[0.3em] uppercase mt-1 opacity-70">Holding B2B Satış Portalı</p>
            </div>
          </div>
          
          <div className="relative w-full lg:w-[500px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={24} />
            <input 
              type="text"
              placeholder="Ürün kataloğunda hızlı arama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-[#242424] border border-gray-800 rounded-[24px] outline-none focus:border-blue-500 text-white font-bold transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto p-6 lg:p-12 flex flex-col lg:flex-row gap-12 items-start">
        
        {/* ÜRÜN LİSTESİ */}
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <Package className="text-blue-500" size={28} /> Mevcut Ürünler
            </h2>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-[#242424] p-24 rounded-[48px] border border-gray-800 text-center">
              <AlertCircle size={64} className="text-gray-700 mx-auto mb-6" />
              <p className="text-xl font-black text-gray-400 uppercase tracking-widest">Ürün Bulunamadı</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredProducts.map((p, index) => {
                const borderColorClass = borderColors[index % borderColors.length];
                return (
                  <div key={p.id} className={`bg-[#242424] p-6 rounded-[32px] border-2 ${borderColorClass} shadow-xl hover:-translate-y-2 transition-all flex flex-col justify-between group`}>
                    <div>
                      <div className="w-full h-56 bg-[#1a1a1a] rounded-[24px] mb-6 flex items-center justify-center text-gray-700 group-hover:text-white transition-colors">
                        <Package size={80} strokeWidth={1} />
                      </div>
                      <h3 className="font-black text-white uppercase text-lg leading-tight mb-2 line-clamp-2 min-h-[56px]">{p.name}</h3>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Birim: {p.unit} | Stok: {p.stock}</p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <span className="text-2xl font-black text-blue-400">{p.price.toLocaleString('tr-TR')} ₺</span>
                      <button 
                        onClick={() => addToCart(p)}
                        className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all shadow-lg shadow-blue-600/20"
                      >
                        <Plus size={24} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SAĞ TARAF: SEPET */}
        <div className="w-full lg:w-[450px] bg-[#242424] rounded-[48px] border border-gray-800 shadow-2xl p-10 h-fit lg:sticky lg:top-8">
          <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                <ShoppingCart size={28}/>
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Sepetim</h2>
            </div>
            <span className="bg-gray-800 text-gray-400 text-xs font-black px-4 py-2 rounded-full uppercase">
              {cart.length} Ürün
            </span>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-[32px] mb-8">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Sepetiniz Boş</p>
            </div>
          ) : (
            <div className="space-y-4 mb-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-[#1a1a1a] p-5 rounded-[24px] border border-gray-800">
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-black text-white text-xs uppercase truncate pr-4">{item.name}</h4>
                    <p className="text-blue-400 font-black text-sm mt-1">{item.price.toLocaleString('tr-TR')} ₺</p>
                  </div>
                  <div className="flex items-center gap-3 bg-[#242424] px-3 py-2 rounded-xl">
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-red-500">
                      {item.quantity === 1 ? <Trash2 size={14}/> : <Minus size={14}/>}
                    </button>
                    <span className="font-black text-white text-xs w-4 text-center">{item.quantity}</span>
                    <button onClick={() => addToCart(item)} className="text-gray-500 hover:text-blue-500">
                      <Plus size={14}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-8 border-t border-gray-800">
            <div className="flex justify-between items-end mb-10">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">TOPLAM TUTAR</p>
              <span className="text-3xl font-black text-white">
                {totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </span>
            </div>
            
            <button 
              onClick={handleCheckout} 
              disabled={cart.length === 0 || ordering} 
              className={`w-full py-6 rounded-3xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all
                ${cart.length === 0 ? 'bg-gray-800 text-gray-600' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-2xl'}`}
            >
              {ordering ? <Loader2 className="animate-spin" size={28} /> : <><Rocket size={28} /> Siparişi Onayla</>}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}