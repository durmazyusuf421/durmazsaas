'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams } from 'next/navigation';
import { Loader2, Package, CheckCircle2, FileText, X, AlertTriangle, ShieldCheck, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function MyOrdersPage() {
    const params = useParams();
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

            // 1. Müşterinin Profilini ve Güncel Bakiyesini Çek
            const { data: profile } = await supabase
                .from('profiles')
                .select('current_balance')
                .eq('global_cari_code', code)
                .single();

            if (profile) {
                setCurrentBalance(profile.current_balance || 0);
            }

            // 2. Siparişleri Çek
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

    // 🚀 ASIL BÜYÜ BURADA: MÜŞTERİ ONAYLIYOR VE BORÇLANIYOR
    const handleApproveAndBill = async () => {
        setProcessing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Oturum hatası");

            // 1. Güncel Bakiyeyi Hesapla
            const newBalance = Number(currentBalance) + Number(selectedOrder.total_amount);

            // 2. Bakiyeyi Güncelle
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ current_balance: newBalance })
                .eq('global_cari_code', code);

            if (profileError) throw profileError;

            // 3. Sipariş Durumunu 'Tamamlandı' Yap
            const { error: orderError } = await supabase
                .from('orders')
                .update({ status: 'Tamamlandı' })
                .eq('id', selectedOrder.id);

            if (orderError) throw orderError;

            // Başarılı!
            setCurrentBalance(newBalance);
            setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'Tamamlandı' } : o));
            setSelectedOrder(null);
            
            alert(`Mutabakat Sağlandı! ${selectedOrder.total_amount} ₺ cari hesabınıza işlendi.`);

        } catch (error: any) {
            alert("Onaylama sırasında bir hata oluştu: " + error.message);
        }
        setProcessing(false);
    };

    const pendingApprovalOrders = orders.filter(o => o.status === 'Onay Bekliyor');
    const otherOrders = orders.filter(o => o.status !== 'Onay Bekliyor');

    if (loading) return <div className="p-20 flex flex-col items-center justify-center"><Loader2 className="animate-spin text-blue-600 mb-4" size={48} /><p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Yükleniyor...</p></div>;

    return (
        <div className="min-h-screen bg-[#F4F7FE] p-4 md:p-10">
            <div className="max-w-5xl mx-auto space-y-8">
                
                {/* ÜST BİLGİ VE GÜNCEL BORÇ */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Link href={`/portal/${code}`} className="text-gray-400 hover:text-blue-600 font-bold uppercase text-xs tracking-widest transition-colors mb-2 inline-block">← Panele Dön</Link>
                        <h1 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter">Sipariş & Ekstrelerim</h1>
                    </div>
                    <div className="bg-white px-8 py-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="bg-red-50 p-3 rounded-2xl text-red-500"><FileText size={24} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Güncel Cari Borcunuz</p>
                            <p className="text-2xl font-black text-[#1B2559]">{currentBalance.toLocaleString('tr-TR')} ₺</p>
                        </div>
                    </div>
                </div>

                {/* DİKKAT: ONAY BEKLEYEN SİPARİŞLER (MUTABAKAT EKRANI) */}
                {pendingApprovalOrders.length > 0 && (
                    <div className="bg-orange-50 p-6 md:p-8 rounded-[32px] border-2 border-orange-200">
                        <h2 className="text-xl font-black text-orange-600 mb-6 uppercase flex items-center gap-2">
                            <AlertTriangle size={24} /> İşletme Tarafından Güncellenen, Onayınızı Bekleyen Siparişler
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingApprovalOrders.map(order => (
                                <div key={order.id} className="bg-white p-6 rounded-3xl shadow-xl border-2 border-orange-400 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest animate-pulse">
                                        Eylem Bekliyor
                                    </div>
                                    <h4 className="font-black text-[#1B2559] text-sm uppercase mt-2">{order.companies?.name}</h4>
                                    <p className="text-3xl font-black text-[#1B2559] mt-4 mb-6">{order.total_amount} ₺</p>
                                    <button 
                                        onClick={() => setSelectedOrder(order)}
                                        className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl uppercase text-sm shadow-lg shadow-orange-500/30 transition-all flex justify-center items-center gap-2"
                                    >
                                        <FileText size={18} /> Ekstreyi İncele ve Onayla
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* DİĞER GEÇMİŞ / BEKLEYEN SİPARİŞLER */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                        <h2 className="text-lg font-black text-[#1B2559] uppercase">Tüm Sipariş Geçmişi</h2>
                    </div>
                    {otherOrders.length === 0 ? (
                        <div className="p-20 text-center">
                            <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Geçmiş sipariş bulunamadı.</p>
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
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-gray-400 uppercase">Tutar</p>
                                            <p className="font-black text-[#1B2559] text-lg">{order.total_amount} ₺</p>
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

                {/* MUTABAKAT MODALI */}
                {selectedOrder && selectedOrder.status === 'Onay Bekliyor' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B2559]/80 backdrop-blur-md">
                        <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            
                            <div className="bg-orange-500 p-8 text-white text-center relative shrink-0">
                                <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 hover:bg-white/20 p-2 rounded-full transition-colors"><X /></button>
                                <ShieldCheck size={48} className="mx-auto mb-4 opacity-90" />
                                <h2 className="text-2xl font-black uppercase tracking-widest">Sipariş Mutabakatı</h2>
                                <p className="text-orange-100 text-xs font-bold mt-2 uppercase">Lütfen işletmenin güncellediği miktarları ve fiyatları kontrol edin.</p>
                            </div>

                            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
                                <div className="space-y-3">
                                    {selectedOrder.parsed_items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                            <div className="flex-1">
                                                <p className="font-bold text-sm text-[#1B2559]">{item.name}</p>
                                                <p className="text-[10px] font-black text-gray-400 uppercase mt-1">{item.quantity} Adet x {item.price || 0} ₺</p>
                                            </div>
                                            <div className="font-black text-blue-600 text-lg">
                                                {((item.quantity || 0) * (item.price || 0)).toLocaleString('tr-TR')} ₺
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-8 bg-white border-t border-gray-100 shrink-0">
                                <div className="flex justify-between items-center mb-8 bg-gray-50 p-6 rounded-3xl border border-gray-200">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Yeni Genel Toplam</p>
                                        <p className="text-4xl font-black text-[#1B2559]">{selectedOrder.total_amount.toLocaleString('tr-TR')} <span className="text-xl">₺</span></p>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={handleApproveAndBill}
                                    disabled={processing}
                                    className="w-full py-5 bg-[#3063E9] text-white font-black rounded-3xl uppercase tracking-widest shadow-2xl shadow-blue-500/40 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-sm"
                                >
                                    {processing ? <Loader2 className="animate-spin" size={24} /> : (
                                        <>
                                            <CheckCircle2 size={24} /> 
                                            Siparişi Onayla ve Bakiyeme Ekle
                                        </>
                                    )}
                                </button>
                                <p className="text-[10px] font-bold text-gray-400 text-center mt-4 uppercase">
                                    Onayladığınız tutar anında cari borcunuza yansıtılacaktır.
                                </p>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}