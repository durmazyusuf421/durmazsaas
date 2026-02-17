'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingBag, LogOut, Rocket, Store, 
  Barcode, FileText, AlertTriangle, ShieldCheck, 
  CheckCircle2, Package, X, Loader2, Menu, Activity
} from 'lucide-react';
import Link from 'next/link';

export default function NeonOrdersPage() {
    const params = useParams();
    const router = useRouter();
    const code = params?.code as string;
    
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [processing, setProcessing] = useState(false);
    const [currentBalance, setCurrentBalance] = useState<number>(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchCustomerData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }

            const { data: profile } = await supabase
                .from('profiles')
                .select('current_balance')
                .eq('global_cari_code', code)
                .single();

            if (profile) setCurrentBalance(profile.current_balance || 0);

            const { data: ordersData } = await supabase
                .from('orders')
                .select('*, companies(name)')
                .eq('customer_cari_code', code)
                .order('created_at', { ascending: false });

            if (ordersData) {
                const enriched = ordersData.map(order => {
                    let parsedItems = [];
                    try { parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items; } 
                    catch (e) { parsedItems = []; }
                    return { ...order, parsed_items: parsedItems };
                });
                setOrders(enriched);
            }
            setLoading(false);
        };

        if (code) fetchCustomerData();
    }, [code, supabase]);

    // 🚀 ONAYLA VE STOKLARA İŞLE (DEVRİM)
    const handleApproveAndBill = async () => {
        setProcessing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Oturum hatası");

            const newBalance = Number(currentBalance) + Number(selectedOrder.total_amount);
            
            // 1. Bakiyeyi Güncelle
            await supabase.from('profiles').update({ current_balance: newBalance }).eq('global_cari_code', code);

            // 2. Ürünleri Müşterinin Stoğuna (retailer_inventory) İşle
            const itemsToProcess = selectedOrder.parsed_items;
            for (const item of itemsToProcess) {
                const { data: existingItem } = await supabase
                    .from('retailer_inventory')
                    .select('*')
                    .eq('owner_id', user.id)
                    .eq('product_name', item.name)
                    .maybeSingle();

                if (existingItem) {
                    await supabase.from('retailer_inventory').update({ 
                        quantity: Number(existingItem.quantity) + Number(item.quantity),
                        cost_price: item.price 
                    }).eq('id', existingItem.id);
                } else {
                    await supabase.from('retailer_inventory').insert({
                        owner_id: user.id,
                        product_name: item.name,
                        barcode: item.barcode || '',
                        quantity: item.quantity,
                        unit: item.unit || 'Adet',
                        cost_price: item.price,
                        sale_price: Number(item.price) * 1.25 // %25 Kar marjı varsayılan
                    });
                }
            }

            // 3. Sipariş Durumunu Tamamlandı Yap
            await supabase.from('orders').update({ status: 'Tamamlandı' }).eq('id', selectedOrder.id);
            
            setCurrentBalance(newBalance);
            setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'Tamamlandı' } : o));
            setSelectedOrder(null);
            alert(`Mutabakat Sağlandı! Ürünler neon ağ üzerinden stoklarınıza aktarıldı.`);
        } catch (error: any) { alert("Hata: " + error.message); }
        setProcessing(false);
    };

    const pendingApprovalOrders = orders.filter(o => o.status === 'Onay Bekliyor');
    const otherOrders = orders.filter(o => o.status !== 'Onay Bekliyor');

    if (loading) return (
      <div className="h-screen bg-[#0B0E14] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#BC13FE]" size={48} />
        <p className="text-white/50 font-bold uppercase tracking-widest text-xs mt-4">Ağ Verileri Çekiliyor...</p>
      </div>
    );

    return (
        <div className="min-h-screen bg-[#0B0E14] text-white flex font-sans selection:bg-[#BC13FE]/30 overflow-x-hidden">
            
            {/* --- SIDEBAR (RESPONSIVE) --- */}
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
                    <div className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-[#BC13FE]/20 to-transparent border-l-4 border-[#BC13FE] text-white rounded-r-xl font-bold transition-all shadow-lg">
                       <ShoppingBag size={20} className="text-[#BC13FE]" /> Sipariş & Mutabakat
                    </div>
                    <Link href={`/portal/${code}/pos`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
                       <Barcode size={20} className="group-hover:text-[#BC13FE]" /> Hızlı Satış (POS)
                    </Link>
                </nav>
                <button onClick={() => supabase.auth.signOut().then(() => router.push('/portal'))} className="flex items-center gap-4 px-5 py-4 text-red-500/50 hover:text-red-500 border border-red-500/10 rounded-xl font-bold transition-all"><LogOut size={20}/> Çıkış Yap</button>
            </aside>

            {/* --- ANA İÇERİK --- */}
            <main className={`transition-all duration-300 ${isSidebarOpen ? 'blur-sm' : ''} flex-1 lg:ml-72 p-4 md:p-8 lg:p-10`}>
                <div className="max-w-6xl mx-auto space-y-8">
                    
                    {/* ÜST BAR VE BAKİYE */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-[#0F1219] rounded-xl border border-white/5"><Menu size={20} /></button>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none">Ağ Mutabakatı</h1>
                                <p className="text-gray-500 font-bold text-[10px] uppercase mt-2 tracking-widest">Gelen Faturalar ve Mal Kabul Sistemi</p>
                            </div>
                        </div>
                        
                        <div className="w-full lg:w-auto bg-gradient-to-r from-[#BC13FE]/10 to-[#3063E9]/10 px-8 py-5 rounded-[25px] border border-[#BC13FE]/30 shadow-[0_0_30px_rgba(188,19,254,0.1)] flex items-center gap-5">
                            <div className="bg-[#BC13FE]/20 p-3 rounded-xl text-[#BC13FE]"><Activity size={24} /></div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Aktif Borç Bakiyesi</p>
                                <p className="text-2xl font-black text-white">{currentBalance.toLocaleString('tr-TR')} <span className="text-lg text-[#BC13FE]">₺</span></p>
                            </div>
                        </div>
                    </div>

                    {/* ONAY BEKLEYEN İŞLEMLER (ACİLİYET) */}
                    {pendingApprovalOrders.length > 0 && (
                        <div className="bg-[#0F1219] p-8 rounded-[35px] border border-orange-500/30 shadow-[0_0_40px_rgba(249,115,22,0.1)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px]"></div>
                            
                            <h2 className="text-sm font-black text-orange-500 mb-6 uppercase flex items-center gap-3 tracking-widest relative z-10">
                                <AlertTriangle className="animate-pulse" /> Eylem Gerekiyor: Yeni Faturalar
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
                                {pendingApprovalOrders.map(order => (
                                    <div key={order.id} className="bg-[#0B0E14] p-6 rounded-[25px] border border-orange-500/20 hover:border-orange-500/50 transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="bg-orange-500/10 text-orange-500 text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">Onay Bekliyor</div>
                                            <span className="text-[10px] text-gray-600 font-bold uppercase">{new Date(order.created_at).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                        <h4 className="font-black text-white text-sm uppercase truncate mb-4">{order.companies?.name}</h4>
                                        <p className="text-3xl font-black text-white mb-6">{order.total_amount.toLocaleString('tr-TR')} <span className="text-orange-500 text-lg">₺</span></p>
                                        <button 
                                            onClick={() => setSelectedOrder(order)} 
                                            className="w-full py-4 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white border border-orange-500/30 font-black rounded-xl uppercase text-[10px] tracking-widest transition-all flex justify-center items-center gap-2"
                                        >
                                            <FileText size={16} /> Veriyi İncele & Kabul Et
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* GEÇMİŞ İŞLEMLER LİSTESİ */}
                    <div className="bg-[#0F1219] rounded-[35px] border border-white/5 overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-white/[0.02] to-transparent">
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Sistem İşlem Geçmişi</h2>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Tüm Kayıtlar</span>
                        </div>
                        
                        {otherOrders.length === 0 ? (
                            <div className="p-20 text-center">
                                <Package size={48} className="mx-auto text-gray-700 mb-4 opacity-50" />
                                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Ağda kayıtlı geçmiş işlem bulunamadı.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {otherOrders.map(order => (
                                    <div key={order.id} className="p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-[#BC13FE]/10 text-[#BC13FE] rounded-2xl flex items-center justify-center shrink-0 border border-[#BC13FE]/20"><Package size={20}/></div>
                                            <div>
                                                <h4 className="font-black text-white uppercase text-sm tracking-tight">{order.companies?.name}</h4>
                                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">{new Date(order.created_at).toLocaleString('tr-TR')} - ID: {order.id.slice(0,6)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                                            <div className="text-left sm:text-right">
                                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">İşlem Tutarı</p>
                                                <p className="font-black text-white text-lg">{order.total_amount.toLocaleString('tr-TR')} ₺</p>
                                            </div>
                                            <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-center border ${
                                                order.status === 'Beklemede' ? 'bg-gray-800/50 text-gray-400 border-gray-700' :
                                                order.status === 'Hazırlanıyor' ? 'bg-[#3063E9]/10 text-[#3063E9] border-[#3063E9]/30' :
                                                'bg-green-500/10 text-green-500 border-green-500/30'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 🚀 MUTABAKAT MODALI (CYBERPUNK) */}
                    {selectedOrder && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                            <div className="bg-[#0F1219] w-full max-w-2xl rounded-[35px] border border-[#BC13FE]/30 shadow-[0_0_50px_rgba(188,19,254,0.15)] overflow-hidden flex flex-col max-h-[90vh]">
                                
                                <div className="bg-gradient-to-r from-[#BC13FE]/20 to-[#3063E9]/20 p-8 text-white text-center relative shrink-0 border-b border-white/10">
                                    <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 hover:bg-white/10 p-2 rounded-full transition-colors text-white/50 hover:text-white"><X size={20}/></button>
                                    <ShieldCheck size={40} className="mx-auto mb-4 text-[#BC13FE] drop-shadow-[0_0_10px_#BC13FE]" />
                                    <h2 className="text-xl font-black uppercase tracking-[0.2em]">Güvenli Mal Kabul</h2>
                                    <p className="text-blue-200/70 text-[9px] font-bold mt-2 uppercase tracking-widest text-center">Onaylandığında veriler direkt satış kasanıza aktarılır.</p>
                                </div>
                                
                                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-[#0B0E14]">
                                    <div className="flex justify-between text-[9px] font-black text-gray-600 uppercase tracking-widest px-4 mb-4">
                                        <span>Aktarılan Ürünler</span>
                                        <span>Toplam Tutar</span>
                                    </div>
                                    <div className="space-y-3">
                                        {selectedOrder.parsed_items.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center bg-[#0F1219] p-4 rounded-2xl border border-white/5">
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm text-gray-200">{item.name}</p>
                                                    <p className="text-[9px] font-black text-[#BC13FE] uppercase mt-1 tracking-widest">{item.quantity} ADET x {item.price} ₺</p>
                                                </div>
                                                <div className="font-black text-white text-base">{((item.quantity || 0) * (item.price || 0)).toLocaleString('tr-TR')} ₺</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="p-8 bg-[#0F1219] border-t border-white/5 shrink-0">
                                    <div className="flex justify-between items-center mb-6 bg-[#0B0E14] p-6 rounded-2xl border border-white/5">
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">Yeni Bakiye Yükü</p>
                                            <p className="text-3xl font-black text-white">{selectedOrder.total_amount.toLocaleString('tr-TR')} <span className="text-xl text-[#BC13FE]">₺</span></p>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={handleApproveAndBill} 
                                        disabled={processing} 
                                        className="w-full py-5 bg-gradient-to-r from-[#BC13FE] to-[#3063E9] text-white font-black rounded-2xl uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(188,19,254,0.4)] hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-xs"
                                    >
                                        {processing ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> Protokolü Onayla ve Stoklara Al</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* GÜVENLİ CSS ENJEKSİYONU */}
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #BC13FE33; border-radius: 10px; }
            `}} />
        </div>
    );
}