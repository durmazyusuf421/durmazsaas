'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Users, 
  Package, 
  FileText,
  Loader2
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    customerCount: 0,
    productCount: 0
  });
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      
      if (profile?.company_id) {
        // 1. Gelirleri Çek (Faturalar toplamı)
        const { data: invoices } = await supabase.from('invoices').select('total_amount').eq('company_id', profile.company_id);
        const income = invoices?.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0) || 0;

        // 2. Giderleri Çek
        const { data: expenses } = await supabase.from('expenses').select('amount').eq('company_id', profile.company_id);
        const expense = expenses?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;

        // 3. Müşteri Sayısı
        const { count: customers } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id);

        // 4. Ürün Sayısı
        const { count: products } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id);

        setStats({
          totalIncome: income,
          totalExpense: expense,
          customerCount: customers || 0,
          productCount: products || 0
        });
      }
    } catch (error) {
      console.error("Veri çekme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const netProfit = stats.totalIncome - stats.totalExpense;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ÜST BAŞLIK */}
      <div>
        <h1 className="text-2xl font-bold text-[#1B2559]">Genel Bakış</h1>
        <p className="text-gray-500 text-sm">Dükkanının finansal durumu burada özetlenir.</p>
      </div>

      {/* ÖZET KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* TOPLAM GELİR */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-50 flex items-center gap-5">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Toplam Gelir</p>
            <h3 className="text-2xl font-bold text-[#1B2559]">₺{stats.totalIncome.toLocaleString()}</h3>
          </div>
        </div>

        {/* TOPLAM GİDER */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-50 flex items-center gap-5">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingDown size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Toplam Gider</p>
            <h3 className="text-2xl font-bold text-[#1B2559]">₺{stats.totalExpense.toLocaleString()}</h3>
          </div>
        </div>

        {/* NET KÂR */}
        <div className="bg-[#3063E9] p-6 rounded-[24px] shadow-xl shadow-blue-200 flex items-center gap-5 text-white">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <Wallet size={28} />
          </div>
          <div>
            <p className="text-sm font-bold opacity-80 uppercase tracking-wider">Net Kâr</p>
            <h3 className="text-2xl font-bold">₺{netProfit.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* DİĞER İSTATİSTİKLER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={24} />
            </div>
            <span className="font-bold text-[#1B2559]">Kayıtlı Müşteri</span>
          </div>
          <span className="text-2xl font-bold text-[#1B2559]">{stats.customerCount}</span>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Package size={24} />
            </div>
            <span className="font-bold text-[#1B2559]">Ürün / Hizmet</span>
          </div>
          <span className="text-2xl font-bold text-[#1B2559]">{stats.productCount}</span>
        </div>
      </div>

      {/* MOTİVASYON ALANI */}
      <div className="bg-gray-50 p-8 rounded-[30px] border border-dashed border-gray-200 text-center">
        <h4 className="text-[#1B2559] font-bold text-lg">Hayırlı İşler Yusuf! 🦅</h4>
        <p className="text-gray-500 text-sm mt-1">Verilerin tıkır tıkır işleniyor. Dükkanın durumu gayet net.</p>
      </div>

    </div>
  );
}