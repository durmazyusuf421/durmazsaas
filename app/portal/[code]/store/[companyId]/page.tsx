'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Plus, Minus, Package, Loader2, CheckCircle2, Search, Rocket, Trash2 } from 'lucide-react';
import Link from 'next/link';

// Mockup'taki gibi renkli borderlar için yardımcı dizi
const borderColors = [
  'border-blue-500/50 hover:border-blue-500',
  'border-orange-500/50 hover:border-orange-500',
  'border-green-500/50 hover:border-green-500',
];

export default function B2BStorePage() {
  const params = useParams();
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

  // Ürünleri arama terimine göre filtrele
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setOrdering(true);
    setTimeout(() => { setOrdering(false); setOrderSuccess(true); setCart([]); }, 1500);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#1a1a1a]"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

  if (orderSuccess) {
      return (
          <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
              <div className="bg-[#242424] p-10 rounded-[40px] shadow-2xl text-center max-w-md w-full border border-gray-800/50">
                  <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={40} /></div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Sipariş Alındı!</h2>
                  <p className="text-gray-400 font-medium mb-8">Toptancınıza siparişiniz anında iletildi. En kısa sürede işleme alınacaktır.</p>
                  <Link href={`/portal/${code}`} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest block transition-all">Panele Dön</Link>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] font-sans text-white pb-24 md:pb-0">
      
      {/* ÜST BAŞLIK ALANI */}
      <div className="max-w-8xl mx-auto pt-8 px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <Link href={`/portal/${code}`} className="p-3 bg-[#242424] rounded-xl hover:bg-[#2d2d2d] transition-all border border-gray-800 flex items-center gap-2 text-sm font-bold text-gray-300">
                    <ArrowLeft size={18} /> Geri Dön
                </Link>
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                    {company?.name || 'Toptancı Mağazası'}
                </h1>
            </div>
            
            {/* Arama Çubuğu */}
            <div className="relative w-full md:w-96">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={20} className="text-gray-500" />
                </div>
                <input 
                    type="text"
                    placeholder="Ürün ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-[#242424] border border-gray-800 rounded-2xl outline-none focus:border-blue-500/50 text-white font-medium transition-all"
                />
            </div>
        </div>
      </div>

      <main className="max-w-8xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* SOL: ÜRÜN KATALOĞU GRID */}
        <div className="flex-1 w-full">
            <div className="flex items-center gap-2 mb-6">
                <Package className="text-blue-500" />
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Katalog & Ürünler</h2>
            </div>

            {filteredProducts.length === 0 ? (
                <div className="bg-[#242424] p-16 rounded-[32px] border border-gray-800 text-center shadow-sm">
                    <Package size={64} className="mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400 font-medium text-lg">
                        {searchTerm ? 'Aradığınız kriterde ürün bulunamadı.' : 'Patron henüz dükkana ürün dizmemiş.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProducts.map((p, index) => {
                        // Mockup'taki gibi sırayla renkli border seçimi
                        const borderColorClass = borderColors[index % borderColors.length];
                        
                        return (
                        <div key={p.id} className={`bg-[#242424] p-5 rounded-[24px] border-2 ${borderColorClass} shadow-lg hover:shadow-xl transition-all flex flex-col justify-between group relative overflow-hidden`}>
                            <div className="absolute top-0 right-0 bg-[#1a1a1a] px-3 py-1 rounded-bl-xl text-xs font-bold text-gray-400 border-b border-l border-gray-800">
                                {p.unit}
                            </div>
                            <div>
                                {/* Ürün Görseli Alanı (Placeholder) */}
                                <div className="w-full h-48 bg-[#2d2d2d] rounded-2xl mb-5 flex items-center justify-center text-gray-600 group-hover:text-white transition-colors relative">
                                    <Package size={64} strokeWidth={1} />
                                    {/* Stok Durumu */}
                                    <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1">
                                        <CheckCircle2 size={12} className="text-green-500" /> Stokta: {p.stock}
                                    </div>
                                </div>
                                <h3 className="font-black text-white uppercase text-base leading-tight mb-4 line-clamp-2">{p.name}</h3>
                            </div>
                            <div className="flex items-center justify-between bg-[#1a1a1a] p-2 rounded-2xl border border-gray-800">
                                <span className="text-xl font-black text-blue-400 pl-2">{p.price} ₺</span>
                                <button onClick={() => addToCart(p)} className="px-4 py-3 bg-blue-600 text-white rounded-xl flex items-center gap-2 hover:bg-blue-500 transition-colors active:scale-95 font-bold text-sm">
                                    <Plus size={18} /> Sepete Ekle
                                </button>
                            </div>
                        </div>
                    )})}
                </div>
            )}
        </div>

        {/* SAĞ: YAPIŞKAN SİPARİŞ SEPETİ (DARK THEME) */}
        <div className="w-full lg:w-[420px] bg-[#242424] rounded-[32px] border border-gray-800 shadow-2xl p-8 h-fit sticky top-8">
            <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center shadow-inner-blue"><ShoppingCart size={24}/></div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Sipariş<br/>Sepetiniz</h2>
                </div>
                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">{cart.length} Ürün</span>
            </div>

            {cart.length === 0 ? (
                <div className="text-center py-16 text-gray-500 border-2 border-dashed border-gray-700 rounded-3xl">
                    <ShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-base font-bold">Sepetiniz henüz boş.</p>
                    <p className="text-sm opacity-60">Katalogdan ürün eklemeye başlayın.</p>
                </div>
            ) : (
                <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {cart.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-[#1a1a1a] p-4 rounded-2xl border border-gray-800 group hover:border-gray-700 transition-all">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-14 h-14 bg-[#242424] rounded-xl flex items-center justify-center text-gray-500 shrink-0 border border-gray-800">
                                    <Package size={24} />
                                </div>
                                <div className="overflow-hidden">
                                    <h4 className="font-bold text-white text-sm uppercase leading-tight truncate">{item.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-blue-400 font-black text-sm">{item.price} ₺</p>
                                        <span className="text-gray-500 text-xs">/ {item.unit}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Miktar Kontrolleri (Mockup Tarzı) */}
                            <div className="flex items-center gap-3 bg-[#242424] px-2 py-1 rounded-xl border border-gray-800 ml-4">
                                {item.quantity === 1 ? (
                                     <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                     </button>
                                ) : (
                                    <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                                        <Minus size={16} />
                                    </button>
                                )}
                                <span className="font-black text-white text-sm min-w-[20px] text-center">{item.quantity}</span>
                                <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Alt Toplam ve Buton Alanı */}
            <div className="pt-6 border-t border-gray-700/50 bg-[#242424] relative">
                {/* Gölgelendirme Efekti */}
                <div className="absolute -top-6 left-0 w-full h-6 bg-gradient-to-t from-[#242424] to-transparent pointer-events-none"></div>
                
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Toplam Tutar</p>
                        <p className="text-xs text-gray-500">KDV Dahil</p>
                    </div>
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white">{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                </div>
                
                <button 
                    onClick={handleCheckout} 
                    disabled={cart.length === 0 || ordering} 
                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all relative overflow-hidden group
                        ${cart.length === 0 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/20 active:scale-95'}`
                    }
                >
                    {ordering ? (
                        <Loader2 className="animate-spin" size={24} />
                    ) : (
                        <>
                            <Rocket size={24} className="group-hover:animate-bounce" /> 
                            Siparişi Gönder
                            {/* Parlama Efekti */}
                            {cart.length > 0 && <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer pointer-events-none"></div>}
                        </>
                    )}
                </button>
            </div>
        </div>
      </main>
    </div>
  );
}