'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, LogOut, 
  Loader2, Rocket, FileText, TrendingDown, Bell, Menu, X, 
  UserCircle, Plus, Search, Filter, Edit, Trash2, Image as ImageIcon,
  CheckCircle2, Settings, Layers, Scale, Eye, EyeOff, ArrowUp, ArrowDown
} from 'lucide-react';
import Link from 'next/link';

export default function BusinessProducts() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  
  const [company, setCompany] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Sekme (Tab) Sistemi
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'units'>('products');

  // Modallar
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  // Veri State'leri
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State'leri
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryVisible, setNewCategoryVisible] = useState(true);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitShort, setNewUnitShort] = useState('');
  
  // Listeler
  const [categories, setCategories] = useState([
    { id: 1, name: 'Gıda & İçecek', isVisible: true, order: 1 },
    { id: 2, name: 'Ambalaj & Paketleme', isVisible: true, order: 2 },
    { id: 3, name: 'Temizlik', isVisible: false, order: 3 }, 
    { id: 4, name: 'Kırtasiye', isVisible: true, order: 4 },
  ]);

  const [units, setUnits] = useState([
    { id: 1, name: 'Adet', short: 'AD' },
    { id: 2, name: 'Kilogram', short: 'KG' },
    { id: 3, name: 'Koli', short: 'KOLİ' },
    { id: 4, name: 'Litre', short: 'LT' },
  ]);

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

        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (profileData) setProfile(profileData);

        let compData = null;
        const { data: nameData } = await supabase.from('companies').select('*').eq('name', code).maybeSingle();
        if (nameData) compData = nameData;
        else if (code.length > 20) { 
            const { data: idData } = await supabase.from('companies').select('*').eq('id', code).maybeSingle();
            compData = idData;
        }

        if (compData) {
            setCompany(compData);
            const { data: productsData } = await supabase.from('products').select('*').eq('company_id', compData.id).order('created_at', { ascending: false });
            
            if (productsData && productsData.length > 0) {
              setProducts(productsData);
            } else {
              setProducts([
                { id: 1, name: 'Premium Espresso Çekirdeği', sku: 'PRM-ESP-01', price: 850, stock: 124, unit: 'KG', category: 'Gıda & İçecek', status: 'active' },
                { id: 2, name: 'Sade Karton Bardak 8oz', sku: 'KRT-BRD-8', price: 420, stock: 8, unit: 'KOLİ', category: 'Ambalaj & Paketleme', status: 'low_stock' },
                { id: 3, name: 'Organik Sızma Zeytinyağı', sku: 'ORG-ZYT-5', price: 1250, stock: 0, unit: 'LT', category: 'Gıda & İçecek', status: 'out_of_stock' },
              ]);
            }
        }
      } catch (error) { 
        console.error("Veri çekme hatası:", error); 
      } finally { 
        setLoading(false); 
      }
    };

    if (code) fetchData();
  }, [code, router, supabase]);

  if (loading) return (
    <div className="h-screen bg-[#0B0E14] flex flex-col items-center justify-center z-[100] relative">
      <Loader2 className="animate-spin text-[#3063E9]" size={50} />
      <p className="text-[#3063E9]/50 font-black uppercase tracking-widest text-xs mt-4">Katalog Yükleniyor...</p>
    </div>
  );

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

  // Kategori Yönetimi
  const handleAddCategory = () => {
      if (!newCategoryName.trim()) return;
      const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
      setCategories([...categories, { id: newId, name: newCategoryName, isVisible: newCategoryVisible, order: categories.length + 1 }]);
      setNewCategoryName('');
      setNewCategoryVisible(true);
      setIsCategoryModalOpen(false);
  };
  const handleDeleteCategory = (id: number) => setCategories(categories.filter(c => c.id !== id));
  const toggleCategoryVisibility = (id: number) => setCategories(categories.map(c => c.id === id ? { ...c, isVisible: !c.isVisible } : c));
  const moveCategory = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newCats = [...categories];
      [newCats[index - 1], newCats[index]] = [newCats[index], newCats[index - 1]];
      setCategories(newCats);
    } else if (direction === 'down' && index < categories.length - 1) {
      const newCats = [...categories];
      [newCats[index], newCats[index + 1]] = [newCats[index + 1], newCats[index]];
      setCategories(newCats);
    }
  };

  // Birim Yönetimi
  const handleAddUnit = () => {
      if (!newUnitName.trim() || !newUnitShort.trim()) return;
      const newId = units.length > 0 ? Math.max(...units.map(u => u.id)) + 1 : 1;
      setUnits([...units, { id: newId, name: newUnitName, short: newUnitShort.toUpperCase() }]);
      setNewUnitName('');
      setNewUnitShort('');
      setIsUnitModalOpen(false);
  };
  const handleDeleteUnit = (id: number) => setUnits(units.filter(u => u.id !== id));

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-[#3063E9]/30 overflow-x-hidden relative">
      
      {/* --- SIDEBAR --- */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 h-full w-72 bg-[#0F1219] border-r border-white/5 p-8 flex flex-col z-[70] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#3063E9] to-[#6089F1] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(48,99,233,0.3)]">
              <Rocket size={22} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter uppercase italic leading-none">Durmaz<span className="text-[#3063E9]">SaaS</span></span>
              <span className="text-[7px] font-black text-[#BC13FE] uppercase tracking-[0.3em] mt-1">Business Intelligence</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500"><X /></button>
        </div>

        <nav className="space-y-2 flex-1">
          <Link href={`/portal/${code}/business`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <LayoutDashboard size={20} className="group-hover:text-[#3063E9]"/> Komuta Merkezi
          </Link>
          <button className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-[#3063E9]/20 to-transparent border-l-4 border-[#3063E9] text-white rounded-r-xl font-bold shadow-[0_0_30px_rgba(48,99,233,0.1)] transition-all">
            <Package size={20} className="text-[#3063E9]" /> Ürün Yönetimi
          </button>
          <Link href={`/portal/${code}/business/orders`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <ShoppingCart size={20} className="group-hover:text-[#3063E9]" /> Gelen Siparişler
          </Link>
          <Link href={`/portal/${code}/business/invoices`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <FileText size={20} className="group-hover:text-[#3063E9]" /> Fatura Yönetimi
          </Link>
          <Link href={`/portal/${code}/business/customers`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <Users size={20} className="group-hover:text-[#3063E9]" /> Bayi Ağı
          </Link>
          <Link href={`/portal/${code}/business/expenses`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <TrendingDown size={20} className="group-hover:text-red-500 transition-colors" /> Gider Takibi
          </Link>
          <Link href={`/portal/${code}/business/settings`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group mt-4">
            <Settings size={20} className="group-hover:text-gray-400 transition-colors" /> Sistem Ayarları
          </Link>
        </nav>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="mt-auto flex items-center gap-4 px-5 py-4 text-red-500/50 hover:text-red-500 border border-red-500/10 rounded-xl font-bold transition-all group">
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> Güvenli Çıkış
        </button>
      </aside>

      {/* --- ANA İÇERİK --- */}
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'blur-sm' : ''} lg:ml-72 p-4 md:p-8 lg:p-10 relative z-10`}>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#3063E9]/5 blur-[150px] rounded-full pointer-events-none -z-10" />

        <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-[#0F1219] rounded-xl border border-white/5"><Menu size={20} /></button>
            <div>
              <h2 className="text-xl md:text-3xl font-black tracking-tight uppercase italic text-white">Envanter Merkezi</h2>
              <div className="flex items-center gap-2 mt-1">
                 <span className="w-2 h-2 bg-[#3063E9] rounded-full animate-pulse shadow-[0_0_10px_#3063E9]"></span>
                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Katalog ve Tanımlar</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden sm:flex bg-[#0F1219] p-3 rounded-xl border border-white/5 text-gray-500 relative cursor-pointer hover:text-white transition-colors"><Bell size={20} /></div>
            <div className="flex items-center gap-3 bg-[#0F1219] p-1.5 md:p-2 rounded-2xl border border-white/5">
              <div className="hidden md:block text-right px-2">
                <p className="text-[10px] font-black text-white uppercase leading-none">{profile?.full_name || 'Yönetici'}</p>
                <p className="text-[8px] text-[#3063E9] font-black mt-1 tracking-widest">PATRON HESABI</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#3063E9]/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-white/5">
                <UserCircle size={20} className="text-[#3063E9]" />
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-2 bg-[#020408] p-1.5 rounded-2xl border border-white/5 w-full md:w-fit mb-8 overflow-x-auto custom-scrollbar">
            <button onClick={() => setActiveTab('products')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'products' ? 'bg-[#3063E9] text-white shadow-[0_0_15px_rgba(48,99,233,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                <Package size={16} /> Ürünler
            </button>
            <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'categories' ? 'bg-[#3063E9] text-white shadow-[0_0_15px_rgba(48,99,233,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                <Layers size={16} /> Kategoriler
            </button>
            <button onClick={() => setActiveTab('units')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'units' ? 'bg-[#3063E9] text-white shadow-[0_0_15px_rgba(48,99,233,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                <Scale size={16} /> Birimler
            </button>
        </div>

        {/* SEKME 1: ÜRÜNLER */}
        {activeTab === 'products' && (
            <div className="bg-[#0F1219] rounded-[40px] border border-white/5 p-4 md:p-8 relative overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex-1 w-full max-w-xl relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#3063E9] transition-colors" size={18} />
                        <input type="text" placeholder="Ürün adı veya Stok Kodu (SKU) ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#020408] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[11px] font-bold text-white uppercase tracking-widest outline-none focus:border-[#3063E9]/50 transition-all shadow-inner" />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button className="p-4 bg-[#020408] border border-white/5 rounded-2xl text-gray-400 hover:text-white transition-colors"><Filter size={20} /></button>
                        <button onClick={() => setIsAddModalOpen(true)} className="flex-1 md:flex-none px-6 py-4 bg-[#3063E9] hover:bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(48,99,233,0.3)] hover:scale-105">
                            <Plus size={18} /> Yeni Ürün
                        </button>
                    </div>
                </div>

                <div className="hidden md:grid grid-cols-12 gap-4 px-6 pb-4 border-b border-white/5 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">
                    <div className="col-span-5">Ürün Detayı</div>
                    <div className="col-span-2 text-center">Kategori</div>
                    <div className="col-span-2 text-center">Stok & Birim</div>
                    <div className="col-span-2 text-right">Birim Fiyat</div>
                    <div className="col-span-1 text-right">İşlem</div>
                </div>

                <div className="space-y-4">
                    {filteredProducts.length > 0 ? filteredProducts.map((product, idx) => (
                        <div key={idx} className="flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center p-4 md:px-6 bg-[#020408]/50 hover:bg-white/[0.02] border border-white/5 rounded-3xl transition-all group">
                            <div className="col-span-5 flex items-center gap-4 w-full">
                                <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-[#3063E9]/30 transition-colors shrink-0"><ImageIcon size={24} className="text-gray-600" /></div>
                                <div className="flex-1 pr-4">
                                    <h3 className="text-sm font-black uppercase text-white tracking-tight leading-tight">{product.name}</h3>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">SKU: {product.sku}</p>
                                </div>
                            </div>
                            <div className="col-span-2 flex md:justify-center w-full md:w-auto">
                                <span className="bg-[#0F1219] px-3 py-1.5 rounded-lg text-[9px] font-black uppercase text-gray-400 tracking-widest border border-white/5">{product.category}</span>
                            </div>
                            <div className="col-span-2 flex md:justify-center w-full md:w-auto">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] ${product.status === 'active' ? 'bg-green-500 text-green-500' : product.status === 'low_stock' ? 'bg-orange-500 text-orange-500 animate-pulse' : 'bg-red-500 text-red-500'}`} />
                                    <div className="flex flex-col md:items-center">
                                        <span className="text-xs font-black text-white">{product.stock} <span className="text-[9px] text-[#3063E9]">{product.unit || 'AD'}</span></span>
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${product.status === 'active' ? 'text-green-500' : product.status === 'low_stock' ? 'text-orange-500' : 'text-red-500'}`}>
                                            {product.status === 'active' ? 'Stok Yeterli' : product.status === 'low_stock' ? 'Kritik Seviye' : 'Tükendi'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-2 flex md:justify-end w-full md:w-auto">
                                <span className="text-lg font-black italic text-white">{Number(product.price).toLocaleString('tr-TR')} <span className="text-[10px] text-gray-500 not-italic">₺</span></span>
                            </div>
                            <div className="col-span-1 flex items-center justify-end gap-2 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0 mt-2 md:mt-0">
                                <button className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-colors"><Edit size={16}/></button>
                                <button className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    )) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
                            <Package size={64} className="text-gray-600 mb-6" />
                            <h3 className="text-xl font-black uppercase italic mb-2">Ürün Bulunamadı</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-sm">Kataloğunuzda aradığınız kriterlere uygun ürün bulunmuyor.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* SEKME 2: KATEGORİ YÖNETİMİ */}
        {activeTab === 'categories' && (
            <div className="bg-[#0F1219] rounded-[40px] border border-white/5 p-4 md:p-8 relative overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
                    <div>
                        <h3 className="text-lg font-black text-white uppercase italic">Kategori Tanımları</h3>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Müşterilerin göreceği reyonları sıralayın veya gizleyin.</p>
                    </div>
                    <button onClick={() => setIsCategoryModalOpen(true)} className="px-6 py-3 bg-[#3063E9] hover:bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(48,99,233,0.3)] hover:scale-[1.02]">
                        <Plus size={16} /> Yeni Kategori
                    </button>
                </div>

                <div className="space-y-3 max-w-4xl">
                    {categories.map((cat, idx) => (
                        <div key={cat.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${cat.isVisible ? 'bg-[#020408] border-white/5' : 'bg-red-950/10 border-red-500/20 opacity-70'}`}>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col gap-1 bg-[#0F1219] p-1.5 rounded-lg border border-white/5">
                                    <button onClick={() => moveCategory(idx, 'up')} disabled={idx === 0} className="text-gray-500 hover:text-white disabled:opacity-30 transition-colors"><ArrowUp size={14}/></button>
                                    <button onClick={() => moveCategory(idx, 'down')} disabled={idx === categories.length - 1} className="text-gray-500 hover:text-white disabled:opacity-30 transition-colors"><ArrowDown size={14}/></button>
                                </div>
                                <span className="w-6 text-center text-[10px] font-black text-[#3063E9]">#{idx + 1}</span>
                                <h4 className={`text-sm font-black uppercase tracking-wider ${cat.isVisible ? 'text-white' : 'text-gray-500 line-through'}`}>{cat.name}</h4>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${cat.isVisible ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {cat.isVisible ? 'Müşteriye Açık' : 'Gizli Reyon'}
                                </span>
                                <div className="flex items-center gap-2 border-l border-white/10 pl-3">
                                    <button onClick={() => toggleCategoryVisibility(cat.id)} className={`p-2 rounded-xl transition-colors ${cat.isVisible ? 'bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500' : 'bg-white/5 hover:bg-green-500/20 text-gray-400 hover:text-green-500'}`}>
                                        {cat.isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                    <button className="p-2 bg-white/5 hover:bg-[#3063E9]/20 text-gray-400 hover:text-[#3063E9] rounded-xl transition-colors"><Edit size={18}/></button>
                                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-xl transition-colors"><Trash2 size={18}/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* SEKME 3: BİRİM AYARLARI */}
        {activeTab === 'units' && (
            <div className="bg-[#0F1219] rounded-[40px] border border-white/5 p-4 md:p-8 relative overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
                    <div>
                        <h3 className="text-lg font-black text-white uppercase italic">Ölçü Birimleri</h3>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Sektörünüze özel birimler tanımlayın (Kutu, Çuval, Palet vb.)</p>
                    </div>
                    <button onClick={() => setIsUnitModalOpen(true)} className="px-6 py-3 bg-[#3063E9] hover:bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(48,99,233,0.3)] hover:scale-[1.02]">
                        <Plus size={16} /> Yeni Birim
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
                    {units.map((unit) => (
                        <div key={unit.id} className="flex items-center justify-between p-5 bg-[#020408] border border-white/5 rounded-2xl group hover:border-[#3063E9]/50 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#3063E9]/10 text-[#3063E9] rounded-xl flex items-center justify-center font-black text-sm italic border border-[#3063E9]/20">
                                    {unit.short}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-wider">{unit.name}</h4>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Kısaltma: {unit.short}</p>
                                </div>
                            </div>
                            <button onClick={() => handleDeleteUnit(unit.id)} className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </main>

      {/* --- MODALLAR --- */}

      {/* 1. YENİ ÜRÜN MODALI */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsAddModalOpen(false)}></div>
            <div className="bg-[#0F1219] border border-[#3063E9]/30 rounded-[40px] w-full max-w-2xl relative z-10 shadow-[0_0_50px_rgba(48,99,233,0.1)] overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#3063E9]/20 blur-[60px] rounded-full pointer-events-none" />
                <div className="p-8 border-b border-white/5 flex justify-between items-center relative z-10">
                    <h3 className="text-2xl font-black italic uppercase text-white flex items-center gap-3"><Package className="text-[#3063E9]"/> Yeni Ürün Ekle</h3>
                    <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-white/5 rounded-xl hover:bg-red-500 hover:text-white transition-colors"><X size={20}/></button>
                </div>

                <div className="p-8 space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Ürün Adı</label>
                            <input type="text" className="w-full bg-[#020408] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-[#3063E9] outline-none transition-colors" placeholder="Örn: Espresso Çekirdeği" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Stok Kodu (SKU)</label>
                            <input type="text" className="w-full bg-[#020408] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-[#3063E9] outline-none transition-colors" placeholder="Örn: ESP-001" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Kategori Seçimi</label>
                            <select className="w-full bg-[#020408] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-[#3063E9] outline-none transition-colors appearance-none">
                                {categories.filter(c => c.isVisible).map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Birim Fiyat (₺)</label>
                                <input type="number" className="w-full bg-[#020408] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-[#3063E9] outline-none transition-colors" placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Birim</label>
                                <select className="w-full bg-[#020408] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-[#3063E9] outline-none transition-colors appearance-none">
                                    {units.map(u => (
                                        <option key={u.id} value={u.short}>{u.short} - {u.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-white/5 bg-[#020408]/50 flex justify-end gap-4 relative z-10">
                    <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">İptal</button>
                    <button className="px-8 py-3 bg-[#3063E9] hover:bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(48,99,233,0.3)] flex items-center gap-2">
                        <CheckCircle2 size={16} /> Veritabanına Yaz
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 2. YENİ KATEGORİ MODALI */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsCategoryModalOpen(false)}></div>
            <div className="bg-[#0F1219] border border-white/10 rounded-[30px] w-full max-w-md relative z-10 shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-lg font-black uppercase text-white flex items-center gap-2"><Layers className="text-[#3063E9]"/> Yeni Kategori</h3>
                    <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 bg-white/5 rounded-xl hover:bg-red-500 hover:text-white transition-colors"><X size={16}/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Kategori Adı</label>
                        <input 
                            type="text" 
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="w-full bg-[#020408] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-[#3063E9] outline-none transition-colors" 
                            placeholder="Örn: Hediyelik Eşya" 
                        />
                    </div>
                    <div className="flex items-center gap-3 bg-[#020408] p-4 rounded-xl border border-white/5">
                        <input 
                            type="checkbox" 
                            checked={newCategoryVisible}
                            onChange={(e) => setNewCategoryVisible(e.target.checked)}
                            className="w-4 h-4 accent-[#3063E9] rounded bg-[#0F1219] border-white/10 cursor-pointer" 
                        />
                        <div className="cursor-pointer select-none" onClick={() => setNewCategoryVisible(!newCategoryVisible)}>
                            <p className="text-xs font-black text-white uppercase tracking-widest">Müşteriye Açık (Görünür)</p>
                            <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-0.5">Seçimi kaldırırsanız bayi ekranında görünmez.</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-white/5 bg-[#020408]/50 flex justify-end gap-3">
                    <button 
                        onClick={handleAddCategory}
                        disabled={!newCategoryName.trim()}
                        className="px-6 py-3 bg-[#3063E9] hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                        Sisteme Ekle
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 3. YENİ BİRİM MODALI */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsUnitModalOpen(false)}></div>
            <div className="bg-[#0F1219] border border-white/10 rounded-[30px] w-full max-w-md relative z-10 shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-lg font-black uppercase text-white flex items-center gap-2"><Scale className="text-[#3063E9]"/> Yeni Ölçü Birimi</h3>
                    <button onClick={() => setIsUnitModalOpen(false)} className="p-2 bg-white/5 rounded-xl hover:bg-red-500 hover:text-white transition-colors"><X size={16}/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Birim Tam Adı</label>
                        <input 
                            type="text" 
                            value={newUnitName}
                            onChange={(e) => setNewUnitName(e.target.value)}
                            className="w-full bg-[#020408] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-[#3063E9] outline-none transition-colors" 
                            placeholder="Örn: Palet" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Kısaltma (Etiket)</label>
                        <input 
                            type="text" 
                            value={newUnitShort}
                            onChange={(e) => setNewUnitShort(e.target.value)}
                            className="w-full bg-[#020408] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-[#3063E9] outline-none transition-colors uppercase" 
                            placeholder="Örn: PLT" 
                            maxLength={4} 
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-white/5 bg-[#020408]/50 flex justify-end gap-3">
                    <button 
                        onClick={handleAddUnit}
                        disabled={!newUnitName.trim() || !newUnitShort.trim()}
                        className="px-6 py-3 bg-[#3063E9] hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                        Birimi Kaydet
                    </button>
                </div>
            </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3063E933; border-radius: 10px; }
      `}} />
    </div>
  );
}