'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  LogOut, 
  Rocket, 
  Store, 
  Barcode,
  FileText, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Package, 
  X, 
  Loader2 
} from 'lucide-react';
import Link from 'next/link';

export default function MyOrdersPage() {
    const params = useParams();
    const router = useRouter();
    const code = params?.code as string;
    
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [processing, setProcessing] = useState(false);
    const [currentBalance, setCurrentBalance] = useState<number>(0);

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
            await supabase.from('profiles').update({ current_balance: newBalance }).eq('global_cari_code', code);

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
                        sale_price: Number(item.price) * 1.25
                    });
                }
            }

            await supabase.from('orders').update({ status: 'Tamamlandı' }).eq('id', selectedOrder.id);
            setCurrentBalance(newBalance);
            setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'Tamamlandı' } : o));
            setSelectedOrder(null);
            alert(`Mutabakat Sağlandı! Ürünler stoklarınıza eklendi.`);
        } catch (error: any) { alert("Hata: " + error.message); }
        setProcessing(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/portal');
    };

    const pendingApprovalOrders = orders.filter(o => o.status === 'Onay Bekliyor');
    const otherOrders = orders.filter(o => o.status !== 'Onay Bekliyor');

    if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-[#F4F7FE] gap-4"><Loader2 className="animate-spin text-blue-600" size={48} /><p className="text-[#1B2559] font-bold uppercase tracking-widest text-xs">Veriler Alınıyor...</p></div>;

    return (
        <div className="min-h-screen bg-[#F4F7FE] flex font-sans">
            
            {/* SOL MENÜ (Sidebar - POS Linki Eklendi) */}
            <aside className="w-72 bg-[#1B2559] text-white p-8 flex-col justify-between hidden lg:flex fixed h-full shadow-2xl">
                <div>
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg"><Rocket className="text-white" size={22} /></div>
                        <span className="text-2xl font-black tracking-tighter uppercase italic text-white">Durmaz<span className="text-blue-500">SaaS</span></span>
                    </div>
                    
                    <nav className="space-y-3">
                        <Link href={`/portal/${code}`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all group">
                            <LayoutDashboard size={22} className="group-hover:text-white"/> Özet Panel
                        </Link>
                        
                        <Link href={`/portal/${code}/stores`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all group">
                           <Store size={22} className="group-hover:text-white" /> Sipariş Ver
                        </Link>

                        {/* AKTİF SAYFA */}
                        <div className="w-full flex items-center gap-4 px-5 py-4 bg-[#3063E9] text-white rounded-2xl font-bold transition-all shadow-lg cursor-default">
                           <ShoppingBag size={22}/> Sipariş & Mutabakat
                        </div>

                        <Link href={`/portal/${code}/pos`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all group">
                           <Barcode size={22} className="group-hover:text-white"/> Hızlı Satış (POS)
                        </Link>
                    </nav>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-4 px-5 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl font-bold transition-all mt-auto border border-red-500/20"><LogOut size={22}/> Güvenli Çıkış</button>
            </aside>

            {/* ANA İÇERİK */}
            <main className="flex-1 lg:ml-72 p-6 md:p-12">
                <div className="max-w-5xl mx-auto space-y-8">
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter leading-none">Sipariş & Mutabakat</h1>
                            <p className="text-gray-400 font-bold text-[10px] uppercase mt-2 tracking-widest">Toptancı Faturaları ve Mal Kabulü</p>
                        </div>
                        <div className="bg-white px-8 py-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="bg-red-50 p-3 rounded-2xl text-red-500"><FileText size={24} /></div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Genel Cari Borcunuz</p>
                                <p className="text-2xl font-black text-[#1B2559]">{currentBalance.toLocaleString('tr-TR')} ₺</p>
                            </div>
                        </div>
                    </div>

                    {pendingApprovalOrders.length > 0 && (
                        <div className="bg-orange-50 p-8 rounded-[32px] border-2 border-orange-200">
                            <h2 className="text-xl font-black text-orange-600 mb-6 uppercase flex items-center gap-2">
                                <AlertTriangle size={24} /> İşletmeden Gelen Yeni Faturalar
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pendingApprovalOrders.map(order => (
                                    <div key={order.id} className="bg-white p-6 rounded-3xl shadow-xl border-2 border-orange-400 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest animate-pulse">Onay Gerekiyor</div>
                                        <h4 className="font-black text-[#1B2559] text-sm uppercase mt-2 truncate">{order.companies?.name}</h4>
                                        <p className="text-3xl font-black text-[#1B2559] mt-4 mb-6">{order.total_amount.toLocaleString('tr-TR')} ₺</p>
                                        <button onClick={() => setSelectedOrder(order)} className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-lg shadow-orange-500/30 transition-all flex justify-center items-center gap-2">
                                            <FileText size={18} /> Ekstreyi İncele & Kabul Et
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                            <h2 className="text-lg font-black text-[#1B2559] uppercase tracking-tighter">Tüm İşlem Geçmişi</h2>
                        </div>
                        {otherOrders.length === 0 ? (
                            <div className="p-20 text-center">
                                <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4 opacity-30" />
                                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Kayıt bulunamadı.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {otherOrders.map(order => (
                                    <div key={order.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0"><Package size={24}/></div>
                                            <div>
                                                <h4 className="font-black text-[#1B2559] uppercase text-sm">{order.companies?.name}</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{new Date(order.created_at).toLocaleString('tr-TR')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right mr-4">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Tutar</p>
                                                <p className="font-black text-[#1B2559] text-lg">{order.total_amount.toLocaleString('tr-TR')} ₺</p>
                                            </div>
                                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest w-32 text-center ${
                                                order.status === 'Beklemede' ? 'bg-gray-100 text-gray-500' :
                                                order.status === 'Hazırlanıyor' ? 'bg-blue-50 text-blue-500' :
                                                'bg-green-50 text-green-600'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedOrder && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B2559]/80 backdrop-blur-md">
                            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                                <div className="bg-orange-500 p-8 text-white text-center relative shrink-0">
                                    <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20}/></button>
                                    <ShieldCheck size={48} className="mx-auto mb-4 opacity-90" />
                                    <h2 className="text-2xl font-black uppercase tracking-widest">Mal Kabul & Mutabakat</h2>
                                    <p className="text-orange-100 text-[10px] font-bold mt-2 uppercase text-center">Onayladığınızda ürünler otomatik stoklarınıza eklenecektir.</p>
                                </div>
                                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
                                    <div className="space-y-3">
                                        {selectedOrder.parsed_items.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm text-[#1B2559]">{item.name}</p>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase mt-1">{item.quantity} {item.unit} x {item.price} ₺</p>
                                                </div>
                                                <div className="font-black text-blue-600 text-lg">{((item.quantity || 0) * (item.price || 0)).toLocaleString('tr-TR')} ₺</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-8 bg-white border-t border-gray-100 shrink-0">
                                    <div className="flex justify-between items-center mb-8 bg-gray-50 p-6 rounded-3xl border border-gray-200">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Yeni Genel Toplam</p>
                                            <p className="text-4xl font-black text-[#1B2559]">{selectedOrder.total_amount.toLocaleString('tr-TR')} <span className="text-xl">₺</span></p>
                                        </div>
                                    </div>
                                    <button onClick={handleApproveAndBill} disabled={processing} className="w-full py-5 bg-[#3063E9] text-white font-black rounded-3xl uppercase tracking-widest shadow-2xl shadow-blue-500/40 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-sm">
                                        {processing ? <Loader2 className="animate-spin" size={24} /> : <><CheckCircle2 size={24} /> Ekstreyi Onayla ve Stoklarıma İşle</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}