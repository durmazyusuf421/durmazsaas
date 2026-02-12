'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { 
  TrendingUp, 
  Package, 
  Users, 
  Wallet, 
  ArrowRight,
  Clock,
  Activity
} from 'lucide-react';
import Link from 'next/link';
// Grafik Kütüphanesi
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalStockValue: 0,
    customerCount: 0,
    lowStockCount: 0
  });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]); // Grafik verisi
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getDashboardData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; 

      // 1. SATIŞLARI ÇEK
      const { data: sales } = await supabase
        .from('invoices')
        .select('total_amount, issue_date')
        .eq('type', 'sales')
        .order('issue_date', { ascending: true }); // Tarihe göre sıralı
      
      const totalSales = sales?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;

      // 2. GRAFİK VERİSİNİ HAZIRLA (Son 7 Satış)
      // Bu kısım veriyi grafiğin anlayacağı şekle sokar
      const chartMap = sales?.slice(-7).map(sale => ({
        date: new Date(sale.issue_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        satis: Number(sale.total_amount)
      }));
      setChartData(chartMap || []);

      // 3. STOK VERİSİ
      const { data: products } = await supabase.from('products').select('price, stock');
      let totalStockValue = 0;
      let lowStockCount = 0;
      products?.forEach(p => {
        totalStockValue += (p.price * p.stock);
        if (p.stock < 5) lowStockCount++; 
      });

      // 4. MÜŞTERİ VE SON İŞLEMLER
      const { count: customerCount } = await supabase.from('contacts').select('*', { count: 'exact', head: true });
      const { data: recents } = await supabase
        .from('invoices')
        .select('*, contacts(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalSales,
        totalStockValue,
        customerCount: customerCount || 0,
        lowStockCount
      });
      setRecentInvoices(recents || []);
      setLoading(false);
    }

    getDashboardData();
  }, []);

  if (loading) return <div className="p-10 text-slate-400">Yükleniyor...</div>;

  return (
    <div className="p-8 min-h-screen">
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Genel Bakış</h1>
          <p className="text-slate-500 mt-1 font-medium">İşletmenizin performans raporu.</p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-xs font-bold text-slate-400 uppercase">Bugün</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* 1. İSTATİSTİK KARTLARI (Renkli & Modern) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Ciro Kartı */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-3xl shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Toplam Ciro</p>
            <h3 className="text-3xl font-black mt-2">{stats.totalSales.toLocaleString('tr-TR')} ₺</h3>
            <div className="mt-4 flex items-center gap-2 text-emerald-100 text-sm font-medium bg-emerald-800/30 w-fit px-3 py-1 rounded-full">
              <TrendingUp size={16} /> Artışta
            </div>
          </div>
          <Activity className="absolute -bottom-4 -right-4 text-emerald-400/30" size={120} />
        </div>

        {/* Depo Kartı */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Depo Değeri</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">{stats.totalStockValue.toLocaleString('tr-TR')} ₺</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
              <Package size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 font-bold">Mevcut Envanter Tutarı</p>
        </div>

        {/* Müşteri Kartı */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
           <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Müşteriler</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">{stats.customerCount}</h3>
            </div>
            <div className="bg-amber-50 p-3 rounded-2xl text-amber-600">
              <Users size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 font-bold">Aktif Cari Kartlar</p>
        </div>

        {/* Kritik Stok */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
           <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kritik Stok</p>
              <h3 className={`text-3xl font-black mt-2 ${stats.lowStockCount > 0 ? 'text-red-500' : 'text-slate-900'}`}>{stats.lowStockCount}</h3>
            </div>
            <div className={`p-3 rounded-2xl ${stats.lowStockCount > 0 ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}>
              <Activity size={24} />
            </div>
          </div>
           <p className="text-xs text-slate-400 mt-4 font-bold">5 adetin altına düşenler</p>
        </div>
      </div>

      {/* 2. GRAFİK VE LİSTE BÖLÜMÜ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL: SATIŞ GRAFİĞİ (YENİ!) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={20}/> Satış Grafiği
          </h3>
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                    tickFormatter={(value) => `${value}₺`}
                  />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                  />
                  <Bar dataKey="satis" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">Henüz yeterli satış verisi yok.</div>
            )}
          </div>
        </div>

        {/* SAĞ: SON İŞLEMLER */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Son İşlemler</h3>
            <Link href="/faturalar" className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-full">Tümü</Link>
          </div>
          <div className="space-y-4">
            {recentInvoices.map((inv) => (
               <div key={inv.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${inv.type === 'sales' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {inv.type === 'sales' ? <TrendingUp size={16}/> : <ArrowRight size={16} className="rotate-45"/>}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{inv.contacts?.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{inv.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${inv.type === 'sales' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {inv.type === 'sales' ? '+' : '-'} {Number(inv.total_amount).toLocaleString('tr-TR')} ₺
                    </p>
                    <p className="text-[10px] text-slate-400">{new Date(inv.issue_date).toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'})}</p>
                  </div>
               </div>
            ))}
            {recentInvoices.length === 0 && <p className="text-center text-slate-400 text-sm py-4">İşlem yok.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}