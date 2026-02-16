'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  Loader2, Search, ArrowLeft, Package, Plus, Minus, ShoppingCart, 
  CheckCircle2, Store, LayoutDashboard, ShoppingBag, LogOut, Rocket 
} from 'lucide-react';
import Link from 'next/link';

export default function BusinessStorePage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  const companyId = params?.companyId as string;

  const [company, setCompany] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // SEPET STATE'İ
  const [cart, setCart] = useState<any[]>([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchStoreData = async () => {
      setLoading(true);
      // İşletme Bilgisi
      const { data: companyData } = await supabase.from('companies').select('name').eq('id', companyId).single();
      if (companyData) setCompany(companyData);

      // Ürünleri Çek (İşletmeye ait ürünler)
      const { data: productsData } = await supabase.from('products').select('*').eq('company_id', companyId);
      if (productsData) setProducts(productsData);
      
      setLoading(false);
    };

    if (companyId) fetchStoreData();
  }, [companyId, supabase]);

  // SEPET FONKSİYONLARI
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
      }
      return prev.filter(item => item.id !== productId);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // SİPARİŞİ GÖNDER (VERİTABANINA YAZ)
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setPlacingOrder(true);
    
    try {
      const itemsJson = cart.map(c => ({ 
        id: c.id, 
        name: c.name, 
        quantity: c.quantity, 
        price: c.price, 
        unit: c.unit || 'Adet' 
      }));

      const { error } = await supabase.from('orders').insert({
        company_id: companyId,
        customer_cari_code: code,
        items: JSON.stringify(itemsJson),
        total_amount: cartTotal,
        status: 'Beklemede'
      });

      if (error) throw error;

      setOrderSuccess(true);
      setCart([]);
      
      // 3 Saniye sonra siparişlerim sayfasına at
      setTimeout(() => {
        router.push(`/portal/${code}/orders`);
      }, 3000);

    } catch (error: any) {
      alert("Sipariş verilirken hata oluştu: " + error.message);
    }
    setPlacingOrder(false);
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-[#F4F7FE] gap-4"><Loader2 className="animate-spin text-blue-600" size={48} /><p className="text-[#1B2559] font-bold uppercase tracking-widest text-xs">Mağaza Yükleniyor...</p></div>;

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex font-sans">
      
      {/* SOL MENÜ */}
      <aside className="w-72 bg-[#1B2559] text-white p-8 flex-col justify-between hidden lg:flex fixed h-full shadow-2xl z-20">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg"><Rocket className="text-white" size={22} /></div>
            <span className="text-2xl font-black tracking-tighter uppercase italic text-white">Durmaz<span className="text-blue-500">SaaS</span></span>
          </div>
          <nav className="space-y-3">
            <Link href={`/portal/${code}`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all"><LayoutDashboard size={22}/> Özet Panel</Link>
            
            {/* YENİ EKLENEN SİPARİŞ VER BUTONU (Aktif Durumda) */}
            <Link href={`/portal/${code}`} className="w-full flex items-center gap-4 px-5 py-4 bg-[#3063E9] text-white rounded-2xl font-bold transition-all shadow-lg">
               <Store size={22} /> Sipariş Ver
            </Link>

            <Link href={`/portal/${code}/orders`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all group"><ShoppingBag size={22} className="group-hover:text-white"/> Sipariş & Mutabakat</Link>
          </nav>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/portal'); }} className="flex items-center gap-4 px-5 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl font-bold transition-all mt-auto border border-red-500/20"><LogOut size={22}/> Güvenli Çıkış</button>
      </aside>

      {/* ANA İÇERİK (Mağaza ve Sepet) */}
      <main className="flex-1 lg:ml-72 p-6 md:p-10 flex flex-col xl:flex-row gap-8 relative">
        
        {/* SOL KISIM: Ürünler */}
        <div className="flex-1 space-y-8">
          
          {/* Üst Başlık ve Arama */}
          <div className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <Link href={`/portal/${code}`} className="text-blue-500 hover:text-blue-700 font-bold uppercase text-xs tracking-widest flex items-center gap-2 mb-2"><ArrowLeft size={16}/> İşletmelere Dön</Link>
              <h1 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter flex items-center gap-3">
                <Store className="text-blue-500" size={32}/> {company?.name || 'Toptancı Mağazası'}
              </h1>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Ürün Ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-[#1B2559] placeholder:text-gray-400" 
              />
            </div>
          </div>

          {/* Ürün Listesi */}
          {products.length === 0 ? (
            <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-gray-200">
              <Package size={64} className="mx-auto text-gray-200 mb-4" />
              <h3 className="text-xl font-black text-[#1B2559] uppercase">Ürün Bulunamadı</h3>
              <p className="text-gray-400 font-bold text-sm mt-2">İşletme henüz ürün eklememiş.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => {
                const cartItem = cart.find(c => c.id === product.id);
                return (
                  <div key={product.id} className="bg-white p-6 rounded-[32px] shadow-sm hover:shadow-xl transition-all border border-gray-50 flex flex-col justify-between group">
                    <div>
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><Package size={24}/></div>
                      <h4 className="text-lg font-black text-[#1B2559] uppercase leading-tight mb-1">{product.name}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.unit || 'Adet'}</p>
                    </div>
                    
                    <div className="mt-6 flex items-end justify-between">
                      <p className="text-2xl font-black text-blue-600">{product.price} <span className="text-sm text-gray-400">₺</span></p>
                      
                      {/* Sepet Kontrolleri */}
                      {cartItem ? (
                        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200">
                          <button onClick={() => removeFromCart(product.id)} className="w-8 h-8 bg-white text-red-500 rounded-xl flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"><Minus size={16}/></button>
                          <span className="font-black text-[#1B2559] w-4 text-center">{cartItem.quantity}</span>
                          <button onClick={() => addToCart(product)} className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-sm hover:bg-blue-700 transition-colors"><Plus size={16}/></button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(product)} className="w-12 h-12 bg-[#F4F7FE] text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl flex items-center justify-center transition-all">
                          <Plus size={24}/>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SAĞ KISIM: Sepet (Sticky Panel) */}
        <div className="w-full xl:w-96 shrink-0 relative">
          <div className="sticky top-10 bg-white rounded-[40px] shadow-2xl border border-gray-100 p-8 flex flex-col max-h-[calc(100vh-80px)] overflow-hidden">
            
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100 shrink-0">
              <h2 className="text-2xl font-black text-[#1B2559] uppercase flex items-center gap-3"><ShoppingCart size={28} className="text-blue-500"/> Sepetim</h2>
              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-black">{cartItemCount} Ürün</span>
            </div>

            {/* Sepet İçeriği */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
              {cart.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                  <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300"/>
                  <p className="font-bold text-gray-400 uppercase text-xs">Sepetiniz Boş</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-sm text-[#1B2559] truncate">{item.name}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase mt-1">{item.price} ₺ x {item.quantity}</p>
                    </div>
                    <div className="font-black text-blue-600 text-right">{(item.price * item.quantity).toLocaleString('tr-TR')} ₺</div>
                  </div>
                ))
              )}
            </div>

            {/* Alt Kısım: Toplam ve Onay */}
            <div className="pt-6 mt-6 border-t border-gray-100 shrink-0">
              <div className="flex justify-between items-center mb-6">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sipariş Toplamı</p>
                <p className="text-3xl font-black text-[#1B2559]">{cartTotal.toLocaleString('tr-TR')} <span className="text-lg">₺</span></p>
              </div>

              {orderSuccess ? (
                <div className="bg-green-50 text-green-600 p-4 rounded-3xl flex items-center justify-center gap-3 font-black uppercase text-sm border border-green-200">
                  <CheckCircle2 size={24}/> Sipariş İletildi!
                </div>
              ) : (
                <button 
                  onClick={handlePlaceOrder}
                  disabled={cart.length === 0 || placingOrder}
                  className="w-full py-5 bg-[#3063E9] text-white font-black rounded-3xl uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none"
                >
                  {placingOrder ? <Loader2 className="animate-spin" size={24} /> : "Sepeti Onayla ve Gönder"}
                </button>
              )}
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}