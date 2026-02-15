'use client';
import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams } from 'next/navigation';
import { ShoppingBag, ChevronRight, Clock, CheckCircle2, Package } from 'lucide-react';
import Link from 'next/link';

export default function MyOrdersPage() {
    const params = useParams();
    const code = params?.code as string;
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    useEffect(() => {
        const fetchOrders = async () => {
            const { data } = await supabase
                .from('orders')
                .select('*, companies(name)')
                .eq('customer_cari_code', code)
                .order('created_at', { ascending: false });
            if (data) setOrders(data);
            setLoading(false);
        };
        fetchOrders();
    }, [code, supabase]);

    if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-[#F4F7FE] p-4 md:p-10">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Link href={`/portal/${code}`} className="text-gray-400 hover:text-blue-600 font-bold uppercase text-xs tracking-widest">← Geri Dön</Link>
                    <h1 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter">Sipariş Geçmişim</h1>
                </div>

                {orders.length === 0 ? (
                    <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-gray-100">
                        <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-500 font-bold uppercase">Henüz bir siparişiniz yok.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {orders.map(order => (
                            <div key={order.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Package size={24}/></div>
                                    <div>
                                        <h4 className="font-black text-[#1B2559] uppercase">{order.companies?.name}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(order.created_at).toLocaleString('tr-TR')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-400 uppercase">Tutar</p>
                                        <p className="font-black text-[#1B2559]">{order.total_amount} ₺</p>
                                    </div>
                                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${order.status === 'Beklemede' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                                        {order.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}