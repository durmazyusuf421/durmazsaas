'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingBag, FileText, LogOut, Loader2, Store, 
  UserCircle, Rocket, Bell, Menu, X, Search, 
  ShoppingCart, Plus, Minus, ChevronRight, Package, Trash2, Globe, ChevronDown
} from 'lucide-react';
import Link from 'next/link';

interface LinkedCompany {
  id: string; 
  company_id: string; 
  company_name: string;
  balance: number;
}

export default function CustomerStores() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{product: any, quantity: number}[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);

  const [linkedCompanies, setLinkedCompanies] = useState<LinkedCompany[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        const cariKodu = decodeURIComponent(code).trim().toUpperCase();

        const { data: profileData } = await supabase.from('profiles').select('*').eq('global_cari_code', cariKodu).maybeSingle();
        if (profileData) setProfile(profileData);

        // 1. Önce bu müşterinin bağlı olduğu Toptancıları (company_id) bulalım
        let companyIdsToFetch: string[] = [];
        
        const { data: customersData } = await supabase
            .from('customers')
            .select('id, company_id, balance, companies!inner(name)')
            .eq('code', cariKodu);

        if (customersData && customersData.length > 0) {
            const formattedCompanies = customersData.map((c: any) => ({
              id: c.id,
              company_id: c.company_id,
              company_name: Array.isArray(c.companies) ? c.companies[0]?.name : c.companies?.name,
              balance: Number(c.balance) || 0
            }));
            setLinkedCompanies(formattedCompanies);
            companyIdsToFetch = formattedCompanies.map(c => c.company_id);
        }

        // 2. SADECE BAĞLI OLDUĞU TOPTANCILARIN ÜRÜNLERİNİ ÇEK
        if (companyIdsToFetch.length > 0) {
            const { data: productsData, error } = await supabase
              .from('products')
              .select('*, companies(name)')
              .in('company_id', companyIdsToFetch)
              .order('created_at', { ascending: false });
            
            if (!error && productsData) {
              setProducts(productsData);
            } else {
              setProducts([]); // Hata varsa veya ürün yoksa boş bırak (SAHTE VERİ YOK)
            }
        } else {
            // Müşteri hiçbir toptancıya bağlı değilse ürün listesi kesinlikle boş olmalı
            setProducts([]);
        }

      } catch (error) { 
        console.error("Veri çekme hatası:", error); 
      } finally { 
        setLoading(false); 
      }
    };
    if (code) fetchData();
  }, [code, router, supabase]);

  // Sepet İşlemleri
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing && existing.quantity > 1) return prev.map(item => item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
      return prev.filter(item => item.product.id !== productId);
    });
  };

  const clearCartItem = (productId: any) => setCart(prev => prev.filter(item => item.product.id !== productId));
  const cartTotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  // Sipariş Gönderme
  const handleSubmitOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;

    const uniqueCartCompanies = new Set(cart.map(c => c.product.company_name || c.product.companies?.name));
    if (uniqueCartCompanies.size > 1) {
        alert("Lütfen tek seferde sadece tek bir toptancıdan sipariş verin. Sepetinizde farklı işletmelerin ürünleri var.");
        return;
    }

    const firstItemCompany = cart[0].product.company_name || cart[0].product.companies?.name;
    const targetCompany = linkedCompanies.find(c => c.company_name === firstItemCompany);

    if (!targetCompany) {
        alert("Bağlı olduğunuz toptancı bulunamadı. Lütfen işletmenin sizi eklediğinden emin olun.");
        return;
    }

    setIsSubmitting(true);
    try {
        const orderData = {
            company_id: targetCompany.company_id, 
            customer_id: targetCompany.id,        
            customer_name: profile?.full_name || 'Bilinmeyen Müşteri',
            cari_code: profile?.global_cari_code || code,
            total_amount: cartTotal,
            status: 'Yeni',
            items: cart.map(c => ({
                name: c.product.name,
                qty: c.quantity,
                price: c.product.price,
                unit: 'AD'
            }))
        };

        const { error } = await supabase.from('orders').insert([orderData]);
        if (error) throw error;

        alert(`✅ Sipariş Başarıyla Gönderildi! Toptancı: ${targetCompany.company_name}`);
        setCart([]); 
        setIsCartOpen(false); 
    } catch (e: any) {
        alert("Sipariş gönderilirken hata oluştu: " + e.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const uniqueCompanies = linkedCompanies.length > 0 ? linkedCompanies.map(c => c.company_name) : Array.from(new Set(products.map(p => p.company_name || p.companies?.name || 'Toptancı')));
  const uniqueCategories = ['Tümü', ...Array.from(new Set(products.map(p => p.category || 'Genel')))];

  const filteredProducts = products.filter(p => {
    const compName = p.company_name || p.companies?.name || 'Toptancı';
    const catName = p.category || 'Genel';
    
    const matchesSearch = p?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || compName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany = selectedCompany ? compName === selectedCompany : true;
    const matchesCategory = selectedCategory !== 'Tümü' ? catName === selectedCategory : true;

    return matchesSearch && matchesCompany && matchesCategory;
  });

  if (loading) return (
    <div className="h-screen bg-[#0B0E14] flex flex-col items-center justify-center z-[100] relative">
      <Loader2 className="animate-spin text-[#BC13FE]" size={50} />
      <p className="text-[#BC13FE]/50 font-black uppercase tracking-widest text-xs mt-4">Siber Pazar Yükleniyor...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-[#BC13FE]/30 overflow-x-hidden relative">
      
      {/* SIDEBAR */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-[#0F1219] border-r border-white/5 p-8 flex flex-col z-[70] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#3063E9] to-[#BC13FE] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(188,19,254,0.3)]">
              <Rocket size={22} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter uppercase italic leading-none">Durmaz<span className="text-[#BC13FE]">SaaS</span></span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500"><X /></button>
        </div>

        <nav className="space-y-2 flex-1">
          <Link href={`/portal/${code}`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <LayoutDashboard size={20} className="group-hover:text-[#BC13FE]"/> Ana Sayfa
          </Link>
          <button className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-[#BC13FE]/20 to-transparent border-l-4 border-[#BC13FE] text-white rounded-r-xl font-bold shadow-[0_0_30px_rgba(188,19,254,0.1)] transition-all">
            <Store size={20} className="text-[#BC13FE]" /> İşletmeler & Market
          </button>
          <Link href={`/portal/${code}/orders`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <ShoppingBag size={20} className="group-hover:text-[#BC13FE]" /> Siparişlerim
          </Link>
          <Link href={`/portal/${code}/billing`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <FileText size={20} className="group-hover:text-[#BC13FE]" /> Hesap & Faturalar
          </Link>
        </nav>

        <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="mt-auto flex items-center gap-4 px-5 py-4 text-red-500/50 hover:text-red-500 border border-red-500/10 rounded-xl font-bold transition-all hover:bg-red-500/10 group">
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> Sistemden Çık
        </button>
      </aside>

      {/* ANA İÇERİK */}
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'blur-sm' : ''} lg:ml-72 p-4 md:p-8 lg:p-10 relative z-10 pb-32`}>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#BC13FE]/5 blur-[150px] rounded-full pointer-events-none -z-10" />

        {/* TOP BAR */}
        <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-[#0F1219] rounded-xl border border-white/5"><Menu size={20} /></button>
            <div>
              <h2 className="text-xl md:text-3xl font-black tracking-tight uppercase italic text-white">Siber Pazar</h2>
              <div className="flex items-center gap-2 mt-1">
                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Toptan Alım Ağı</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div onClick={() => setIsCartOpen(true)} className="bg-[#0F1219] p-3 rounded-xl border border-white/5 text-white relative cursor-pointer hover:border-[#BC13FE]/50 transition-colors group flex items-center gap-3">
              <div className="relative">
                <ShoppingCart size={20} className="group-hover:text-[#BC13FE] transition-colors" />
                {cartItemCount > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#BC13FE] rounded-full flex items-center justify-center text-[9px] font-black shadow-[0_0_10px_#BC13FE] animate-bounce">{cartItemCount}</span>}
              </div>
              <span className="hidden sm:block text-[11px] font-black italic">{cartTotal.toLocaleString('tr-TR')} ₺</span>
            </div>

            <div className="flex items-center gap-3 bg-[#0F1219] p-1.5 md:p-2 rounded-2xl border border-white/5">
              <div className="hidden md:block text-right px-2">
                <p className="text-[10px] font-black text-white uppercase leading-none">{profile?.full_name}</p>
                <p className="text-[8px] text-[#BC13FE] font-black mt-1 tracking-widest">{code}</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#BC13FE]/20 to-[#3063E9]/20 rounded-xl flex items-center justify-center border border-white/5">
                <UserCircle size={20} className="text-[#BC13FE]" />
              </div>
            </div>
          </div>
        </div>

        {/* ARAMA VE TOPTANCI SEÇİMİ */}
        <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4 relative z-20">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#BC13FE] transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Ürün veya Marka ara..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0F1219] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[11px] font-bold text-white uppercase tracking-widest outline-none focus:border-[#BC13FE]/50 transition-all shadow-inner h-full"
                    />
                </div>

                <div className="relative w-full md:w-auto">
                    <button 
                        onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                        className={`w-full md:w-64 h-full flex justify-between items-center bg-[#0F1219] border ${isCompanyDropdownOpen ? 'border-[#BC13FE]' : 'border-white/5'} hover:border-[#BC13FE]/50 rounded-2xl px-5 py-4 transition-all shadow-lg`}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Store size={18} className={selectedCompany ? "text-[#BC13FE]" : "text-gray-500"} />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest truncate">
                                {selectedCompany || 'Tüm Toptancılar'}
                            </span>
                        </div>
                        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isCompanyDropdownOpen ? 'rotate-180 text-[#BC13FE]' : ''}`} />
                    </button>

                    {isCompanyDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsCompanyDropdownOpen(false)} />
                            <div className="absolute right-0 top-full mt-2 w-full bg-[#0B0E14] border border-[#BC13FE]/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-40 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                    <button 
                                        onClick={() => { setSelectedCompany(null); setIsCompanyDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-colors ${!selectedCompany ? 'bg-[#BC13FE]/10 text-[#BC13FE]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <Globe size={16} /> Tüm Pazaryeri
                                    </button>
                                    {uniqueCompanies.map((compName, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => { setSelectedCompany(compName as string); setIsCompanyDropdownOpen(false); }}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-colors ${selectedCompany === compName ? 'bg-[#BC13FE]/10 text-[#BC13FE]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            <Store size={16} /> <span className="truncate">{compName as string}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar relative z-10">
                {uniqueCategories.map((cat, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedCategory(cat as string)}
                    className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-[#BC13FE]/10 text-[#BC13FE] border-[#BC13FE]/30 shadow-[0_0_15px_rgba(188,19,254,0.1)]' : 'bg-[#0F1219] text-gray-400 border-white/5 hover:text-white hover:border-white/20'}`}
                  >
                    {cat as string}
                  </button>
                ))}
            </div>
        </div>

        {/* ÜRÜN VİTRİNİ */}
        {filteredProducts.length === 0 ? (
           <div className="py-32 flex flex-col items-center justify-center text-center opacity-50 relative z-10">
             <Package size={64} className="text-gray-600 mb-6" />
             <h3 className="text-xl font-black uppercase italic mb-2">Market Boş</h3>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-sm">
                 Şu anda kayıtlı olduğunuz toptancılarda ürün bulunmuyor.
             </p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
              {filteredProducts.map((product, idx) => {
                const cartItem = cart.find(item => item.product.id === product.id);
                const qtyInCart = cartItem ? cartItem.quantity : 0;
                const compName = product.company_name || product.companies?.name || 'Toptancı';

                return (
                  <div key={idx} className="bg-[#0F1219] rounded-[30px] border border-white/5 overflow-hidden flex flex-col group hover:border-[#BC13FE]/30 transition-all shadow-lg hover:shadow-[0_10px_40px_rgba(188,19,254,0.05)] relative">
                    <div className="h-48 bg-[#020408] relative p-6 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#BC13FE_1px,transparent_1px)] [background-size:15px_15px]"></div>
                      <div className="w-24 h-24 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 relative z-10">
                        <Package size={40} className="text-gray-600 group-hover:text-[#BC13FE] transition-colors" />
                      </div>
                      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-lg text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1.5 z-20 shadow-lg">
                        <Store size={10} className={selectedCompany === compName ? "text-[#BC13FE]" : "text-[#3063E9]"}/> <span className="max-w-[120px] truncate">{compName}</span>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-auto">
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <h3 className="text-sm font-black text-white uppercase leading-snug line-clamp-2">{product?.name || 'Ürün'}</h3>
                        </div>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-4">Kategori: {product?.category || 'Genel'}</p>
                      </div>

                      <div className="flex items-end justify-between mt-4 pt-4 border-t border-white/5">
                        <div>
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Birim Fiyat</p>
                          <p className="text-2xl font-black italic text-white">{Number(product?.price || 0).toLocaleString('tr-TR')} <span className="text-sm text-[#BC13FE] not-italic">₺</span></p>
                        </div>

                        {qtyInCart === 0 ? (
                          <button onClick={() => addToCart(product)} className="w-12 h-12 bg-[#BC13FE]/10 text-[#BC13FE] hover:bg-[#BC13FE] hover:text-white rounded-2xl flex items-center justify-center transition-all">
                            <Plus size={20} />
                          </button>
                        ) : (
                          <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-1.5 rounded-2xl">
                            <button onClick={() => removeFromCart(product.id)} className="w-8 h-8 bg-black/50 text-white hover:text-red-400 rounded-xl flex items-center justify-center transition-colors"><Minus size={14} /></button>
                            <span className="w-6 text-center text-sm font-black">{qtyInCart}</span>
                            <button onClick={() => addToCart(product)} className="w-8 h-8 bg-[#BC13FE] text-white rounded-xl flex items-center justify-center shadow-[0_0_10px_rgba(188,19,254,0.3)]"><Plus size={14} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* FLOATING SEPET BARI */}
        {cartItemCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-4xl bg-gradient-to-r from-[#0F1219] to-[#1A0B2E] border border-[#BC13FE]/30 p-4 md:p-6 rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-40 flex flex-col md:flex-row justify-between items-center gap-4 animate-in slide-in-from-bottom-10 duration-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#BC13FE] rounded-2xl flex items-center justify-center shadow-[0_0_20px_#BC13FE]">
                <ShoppingBag size={24} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Sepetinizde <span className="text-white">{cartItemCount} Ürün</span> Var</p>
                <p className="text-2xl font-black italic text-white leading-none">{cartTotal.toLocaleString('tr-TR')} <span className="text-sm text-[#BC13FE] not-italic">₺</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button onClick={() => setCart([])} className="flex-1 md:flex-none px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2">Temizle</button>
              <button onClick={() => setIsCartOpen(true)} className="flex-1 md:flex-none px-8 py-4 bg-[#BC13FE] hover:bg-purple-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(188,19,254,0.3)] flex items-center justify-center gap-2 group">
                Sepeti Onayla <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* --- SEPET ÇEKMECESİ --- */}
      {isCartOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-[#0F1219] border-l border-white/5 z-[90] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-[#0B0E14]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#BC13FE]/10 rounded-xl flex items-center justify-center text-[#BC13FE]"><ShoppingCart size={20} /></div>
                <div>
                  <h3 className="text-xl font-black italic uppercase text-white">Sepet İçeriği</h3>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">{cartItemCount} Ürün Seçildi</p>
                </div>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><X size={24} className="text-gray-400" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                  <ShoppingBag size={64} className="mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">Sepetiniz Boş</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl relative group">
                    <div className="w-16 h-16 bg-black/50 rounded-xl flex items-center justify-center shrink-0 border border-white/5"><Package size={24} className="text-[#BC13FE]/50" /></div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-black text-white uppercase leading-tight line-clamp-2 pr-6">{item.product.name}</h4>
                        <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1">{item.product.company_name || item.product.companies?.name || 'Toptancı'}</p>
                      </div>
                      <div className="flex items-end justify-between mt-3">
                        <span className="text-sm font-black italic text-[#BC13FE]">{Number(item.product.price).toLocaleString('tr-TR')} ₺</span>
                        <div className="flex items-center gap-2 bg-[#0B0E14] border border-white/10 p-1 rounded-xl">
                          <button onClick={() => removeFromCart(item.product.id)} className="w-6 h-6 bg-white/5 text-gray-400 hover:text-white rounded-lg flex items-center justify-center transition-colors"><Minus size={12} /></button>
                          <span className="w-4 text-center text-xs font-black">{item.quantity}</span>
                          <button onClick={() => addToCart(item.product)} className="w-6 h-6 bg-white/5 text-gray-400 hover:text-white rounded-lg flex items-center justify-center transition-colors"><Plus size={12} /></button>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => clearCartItem(item.product.id)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-8 border-t border-white/5 bg-[#0B0E14] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#BC13FE]/10 blur-3xl rounded-full pointer-events-none" />
                <div className="space-y-3 mb-6 relative z-10">
                  <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest"><span>Ara Toplam</span><span>{cartTotal.toLocaleString('tr-TR')} ₺</span></div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest"><span>KDV (%0 - B2B)</span><span>0 ₺</span></div>
                  <div className="flex justify-between text-lg font-black text-white italic pt-3 border-t border-white/5 mt-3"><span className="uppercase not-italic text-sm self-end mb-1">Genel Toplam</span><span>{cartTotal.toLocaleString('tr-TR')} <span className="text-sm text-[#BC13FE] not-italic">₺</span></span></div>
                </div>
                
                <button 
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting || cart.length === 0}
                    className="w-full py-5 bg-gradient-to-r from-[#BC13FE] to-purple-600 disabled:opacity-50 text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(188,19,254,0.4)] hover:scale-[1.02] flex items-center justify-center gap-2 relative z-10"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Rocket size={18} />} 
                  {isSubmitting ? 'GÖNDERİLİYOR...' : 'Siparişi Toptancıya Gönder'}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #BC13FE33; border-radius: 10px; }
      `}} />
    </div>
  );
}