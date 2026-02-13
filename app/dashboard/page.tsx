'use client';
import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Users, FileText, Package, Wallet, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    revenue: 0,
    customers: 0,
    invoices: 0,
    products: 0
  });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      
      if (profile?.company_id) {
        // 1. Ciro (Gelir)
        const { data: invData } = await supabase.from('invoices').select('total_amount').eq('company_id', profile.company_id);
        const totalRevenue = invData?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;

        // 2. Müşteri Sayısı
        const { count: custCount } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id);

        // 3. Fatura Sayısı
        const { count: invCount } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id);

        // 4. Ürün Sayısı
        const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id);

        // 5. Son 5 Fatura
        const { data: recent } = await supabase
          .from('invoices')
          .select('*, customers(name)')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          revenue: totalRevenue,
          customers: custCount || 0,
          invoices: invCount || 0,
          products: prodCount || 0
        });
        
        if (recent) setRecentInvoices(recent);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div>
      {/* BAŞLIK */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B2559]">Ana Sayfa</h1>
        <p className="text-gray-500 text-sm">İşletmenizin genel durumunu buradan takip edin.</p>
      </div>

      {/* --- İSTATİSTİK KARTLARI (MOBİL UYUMLU) --- */}
      {/* Mobilde 1, Tablette 2, Bilgisayarda 4 Kolon */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        
        {/* KART 1: CİRO */}
        <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Toplam Ciro</p>
            <h3 className="text-2xl font-bold text-[#1B2559]">₺{stats.revenue.toLocaleString()}</h3>
          </div>
        </div>

        {/* KART 2: MÜŞTERİLER */}
        <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Müşteriler</p>
            <h3 className="text-2xl font-bold text-[#1B2559]">{stats.customers}</h3>
          </div>
        </div>

        {/* KART 3: FATURALAR */}
        <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Kesilen Fatura</p>
            <h3 className="text-2xl font-bold text-[#1B2559]">{stats.invoices}</h3>
          </div>
        </div>

        {/* KART 4: ÜRÜNLER */}
        <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Ürün/Hizmet</p>
            <h3 className="text-2xl font-bold text-[#1B2559]">{stats.products}</h3>
          </div>
        </div>
      </div>

      {/* --- SON FATURALAR TABLOSU --- */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-lg font-bold text-[#1B2559] flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600"/> Son İşlemler
          </h2>
          <Link href="/dashboard/invoices" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
            Tümünü Gör <ArrowRight size={16}/>
          </Link>
        </div>

        {/* MOBİL İÇİN KAYDIRILABİLİR ALAN (overflow-x-auto) */}
        <div className="overflow-x-auto">
          <div className="min-w-[600px]"> {/* Tablo minimum 600px olacak, sığmazsa kayacak */}
            
            <div className="grid grid-cols-12 gap-4 pb-2 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <div className="col-span-4">MÜŞTERİ</div>
              <div className="col-span-3">TARİH</div>
              <div className="col-span-3">TUTAR</div>
              <div className="col-span-2 text-right">DURUM</div>
            </div>

            <div className="space-y-4 mt-4">
              {recentInvoices.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">Henüz işlem yok.</p>
              ) : (
                recentInvoices.map((inv) => (
                  <div key={inv.id} className="grid grid-cols-12 gap-4 items-center hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className="col-span-4 font-bold text-[#1B2559] truncate">{inv.customers?.name}</div>
                    <div className="col-span-3 text-sm text-gray-500">{new Date(inv.invoice_date).toLocaleDateString('tr-TR')}</div>
                    <div className="col-span-3 font-bold text-[#1B2559]">₺{inv.total_amount?.toLocaleString()}</div>
                    <div className="col-span-2 text-right">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        inv.status === 'Ödendi' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}