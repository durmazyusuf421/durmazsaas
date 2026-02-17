'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingBag, LogOut, Rocket, Store, 
  Barcode, Menu, X, Loader2, ScanLine, Scale, 
  Trash2, CreditCard, Banknote, BookOpen, FileText // EKSİK OLAN İKON BURAYA EKLENDİ!
} from 'lucide-react';
import Link from 'next/link';

export default function NeonPOSPage() {
    const params = useParams();
    const router = useRouter();
    const code = params?.code as string;
    
    const [inventory, setInventory] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [barcodeInput, setBarcodeInput] = useState('');
    const [scaleMode, setScaleMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const barcodeRef = useRef<HTMLInputElement>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchInventory = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/portal'); return; }

            const { data } = await supabase
                .from('retailer_inventory')
                .select('*')
                .eq('owner_id', user.id)
                .order('product_name', { ascending: true });

            if (data) setInventory(data);
            setLoading(false);
            
            if (barcodeRef.current) barcodeRef.current.focus();
        };

        fetchInventory();
    }, [supabase, router]);

    const handleBarcodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcodeInput.trim()) return;

        const product = inventory.find(p => 
            p.barcode === barcodeInput || 
            (p.product_name && p.product_name.toLowerCase() === barcodeInput.toLowerCase())
        );
        
        if (product) {
            addToCart(product);
        } else {
            alert("Sistemde bu ürün bulunamadı!");
        }
        setBarcodeInput('');
        if (barcodeRef.current) barcodeRef.current.focus();
    };

    const addToCart = (product: any) => {
        let quantityToAdd = 1;

        if (scaleMode) {
            const weightInput = prompt(`${product.product_name || 'Ürün'} için gramaj/kilo giriniz (Örn: 1.5):`, "1");
            if (!weightInput || isNaN(Number(weightInput))) return;
            quantityToAdd = Number(weightInput);
        }

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing && !scaleMode) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [{ ...product, cart_id: Math.random().toString(), quantity: quantityToAdd }, ...prev];
        });
    };

    const removeFromCart = (cartId: string) => {
        setCart(prev => prev.filter(item => item.cart_id !== cartId));
    };

    const calculateTotal = () => cart.reduce((sum, item) => sum + (Number(item.sale_price || 0) * (item.quantity || 1)), 0);

    const handleCheckout = async (paymentMethod: string) => {
        if (cart.length === 0) return;
        setProcessing(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800)); 

            alert(`SATIŞ BAŞARILI!\nÖdeme Tipi: ${paymentMethod}\nToplam: ${calculateTotal().toLocaleString('tr-TR')} ₺`);
            setCart([]);
            if (barcodeRef.current) barcodeRef.current.focus();
        } catch (error: any) {
            alert("Satış sırasında hata oluştu!");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
      <div className="h-screen bg-[#0B0E14] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#BC13FE]" size={48} />
        <p className="text-white/50 font-bold uppercase tracking-widest text-xs mt-4">Kasa Terminali Başlatılıyor...</p>
      </div>
    );

    return (
        <div className="min-h-screen bg-[#0B0E14] text-white flex font-sans selection:bg-[#BC13FE]/30 overflow-hidden">
            
            {/* --- SIDEBAR --- */}
            {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
            <aside className={`fixed top-0 left-0 h-full w-72 bg-[#0F1219] border-r border-white/5 p-8 flex flex-col z-[70] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#3063E9] to-[#BC13FE] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(188,19,254,0.3)]"><Rocket size={22} /></div>
                        <span className="text-xl font-black tracking-tighter uppercase italic">Durmaz<span className="text-[#BC13FE]">SaaS</span></span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500"><X /></button>
                </div>
                
                <nav className="space-y-2 flex-1">
                    <Link href={`/portal/${code}`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all">
                        <LayoutDashboard size={20} className="group-hover:text-[#BC13FE]"/> Ana Sayfa
                    </Link>
                    <Link href={`/portal/${code}/stores`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
                       <Store size={20} className="group-hover:text-[#BC13FE]" /> Sipariş Ver
                    </Link>
                    <Link href={`/portal/${code}/orders`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
                       <ShoppingBag size={20} className="group-hover:text-[#BC13FE]" /> Sipariş & Mutabakat
                    </Link>
                    <div className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-[#BC13FE]/20 to-transparent border-l-4 border-[#BC13FE] text-white rounded-r-xl font-bold transition-all shadow-lg">
                       <Barcode size={20} className="text-[#BC13FE]" /> Hızlı Satış (POS)
                    </div>
                </nav>
                <button onClick={() => supabase.auth.signOut().then(() => router.push('/portal'))} className="flex items-center gap-4 px-5 py-4 text-red-500/50 hover:text-red-500 border border-red-500/10 rounded-xl font-bold transition-all"><LogOut size={20}/> Çıkış Yap</button>
            </aside>

            {/* --- KASA ANA EKRANI --- */}
            <main className={`transition-all duration-300 ${isSidebarOpen ? 'blur-sm' : ''} flex-1 lg:ml-72 flex flex-col h-screen p-4 md:p-6`}>
                
                {/* ÜST BAR */}
                <div className="flex justify-between items-center mb-6 bg-[#0F1219] p-4 md:p-6 rounded-[25px] border border-white/5 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-white/5 rounded-xl border border-white/5"><Menu size={18} /></button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                                <Barcode className="text-[#BC13FE]" /> Kasa Terminali <span className="text-[10px] bg-[#BC13FE]/20 text-[#BC13FE] px-2 py-1 rounded-md uppercase tracking-widest border border-[#BC13FE]/30 hidden sm:block">Pro</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => { setScaleMode(!scaleMode); if(barcodeRef.current) barcodeRef.current.focus(); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                scaleMode ? 'bg-[#3063E9]/20 text-[#3063E9] border-[#3063E9]/50 shadow-[0_0_15px_rgba(48,99,233,0.3)]' : 'bg-[#0B0E14] text-gray-500 border-white/5 hover:text-white'
                            }`}
                        >
                            <Scale size={16} /> Gramaj/Terazi Modu
                        </button>
                    </div>
                </div>

                {/* ALT KISIM (IZGARA) */}
                <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                    
                    {/* SOL TARAF: BARKOD VE ÜRÜNLER */}
                    <div className="flex-1 flex flex-col gap-6 min-h-0">
                        <form onSubmit={handleBarcodeSubmit} className="relative shrink-0">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-[#BC13FE]">
                                <ScanLine size={32} className="animate-pulse" />
                            </div>
                            <input 
                                ref={barcodeRef}
                                type="text" 
                                value={barcodeInput}
                                onChange={(e) => setBarcodeInput(e.target.value)}
                                placeholder="Barkod Okutun veya Ürün Adı Yazın..."
                                className="w-full bg-[#0F1219] border-2 border-[#BC13FE]/30 focus:border-[#BC13FE] rounded-[30px] py-6 pl-20 pr-6 text-xl font-black text-white placeholder:text-gray-700 uppercase tracking-widest outline-none transition-all shadow-[0_0_30px_rgba(188,19,254,0.05)] focus:shadow-[0_0_40px_rgba(188,19,254,0.15)]"
                                autoFocus
                            />
                        </form>

                        {/* HIZLI ERİŞİM ÜRÜN LİSTESİ */}
                        <div className="flex-1 bg-[#0F1219] rounded-[30px] border border-white/5 p-6 overflow-y-auto custom-scrollbar">
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Hızlı Satış Ürünleri (Stoktaki Ürünleriniz)</h3>
                            
                            {inventory.length === 0 ? (
                                <div className="text-center py-10 opacity-50">
                                    <Store size={40} className="mx-auto text-gray-600 mb-4" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Kasanızda ürün yok. Önce mal kabul yapın.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {inventory.map(item => (
                                        <button 
                                            key={item.id}
                                            onClick={() => addToCart(item)}
                                            className="bg-[#0B0E14] p-4 rounded-2xl border border-white/5 hover:border-[#3063E9]/50 hover:bg-[#3063E9]/5 transition-all flex flex-col items-center justify-center text-center group active:scale-95"
                                        >
                                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-[#3063E9] mb-3 font-black text-xs uppercase shadow-inner">
                                                {(item.product_name || 'ÜR').substring(0,2)}
                                            </div>
                                            <p className="text-[11px] font-bold uppercase text-gray-300 truncate w-full">{item.product_name || 'İsimsiz Ürün'}</p>
                                            <p className="text-[#3063E9] font-black mt-1">{Number(item.sale_price || 0).toLocaleString('tr-TR')} ₺</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SAĞ TARAF: FİŞ / SEPET VE ÖDEME */}
                    <div className="w-full lg:w-96 flex flex-col bg-[#0F1219] rounded-[30px] border border-white/5 overflow-hidden shrink-0 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        
                        <div className="bg-gradient-to-r from-[#BC13FE]/10 to-[#3063E9]/10 p-6 border-b border-white/10 shrink-0">
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                                <FileText size={18} className="text-[#BC13FE]" /> Fiş Özeti
                            </h2>
                            <p className="text-[9px] text-gray-500 mt-1 uppercase font-bold tracking-widest">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2 bg-[#0B0E14]">
                            {cart.length === 0 ? (
                                <div className="text-center py-20 opacity-30">
                                    <ShoppingBag size={48} className="mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Fiş Boş</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.cart_id} className="flex justify-between items-center bg-[#0F1219] p-3 rounded-xl border border-white/5 group">
                                        <div className="flex-1 overflow-hidden pr-2">
                                            <p className="text-[11px] font-bold uppercase text-gray-300 truncate">{item.product_name || 'İsimsiz'}</p>
                                            <p className="text-[9px] text-[#BC13FE] font-black uppercase tracking-widest mt-0.5">
                                                {item.quantity} {scaleMode && String(item.quantity).includes('.') ? 'KG' : 'ADET'} x {Number(item.sale_price || 0)} ₺
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="font-black text-sm">{(Number(item.quantity || 1) * Number(item.sale_price || 0)).toLocaleString('tr-TR')} ₺</p>
                                            <button 
                                                onClick={() => removeFromCart(item.cart_id)}
                                                className="text-red-500/50 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-6 bg-[#0F1219] border-t border-white/5 shrink-0">
                            <div className="flex justify-between items-end mb-6">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Genel Toplam</p>
                                <p className="text-4xl font-black text-white">{calculateTotal().toLocaleString('tr-TR')} <span className="text-[#BC13FE] text-xl">₺</span></p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <button 
                                    onClick={() => handleCheckout('Nakit')}
                                    disabled={cart.length === 0 || processing}
                                    className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-500 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex flex-col items-center gap-2 active:scale-95 disabled:opacity-50"
                                >
                                    <Banknote size={20} /> Nakit (F1)
                                </button>
                                <button 
                                    onClick={() => handleCheckout('Kredi Kartı')}
                                    disabled={cart.length === 0 || processing}
                                    className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-500 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex flex-col items-center gap-2 active:scale-95 disabled:opacity-50"
                                >
                                    <CreditCard size={20} /> Kredi Kartı (F2)
                                </button>
                            </div>
                            <button 
                                onClick={() => handleCheckout('Veresiye')}
                                disabled={cart.length === 0 || processing}
                                className="w-full bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-500 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                <BookOpen size={16} /> Veresiye Yazdır (F3)
                            </button>
                        </div>
                    </div>

                </div>
            </main>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #BC13FE33; border-radius: 10px; }
            `}} />
        </div>
    );
}