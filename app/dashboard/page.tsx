'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Users, FileText, Wallet, UserCheck, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({ customers: 0, invoices: 0, revenue: 0 });
  const [processingId, setProcessingId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      if (!profile?.company_id) return;

      // 1. BEKLEYEN BAĞLANTI İSTEKLERİNİ ÇEK
      const { data: requests } = await supabase
        .from('customer_connections')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('status', 'onay_bekliyor');
      
      // Müşteri isimlerini Cari Kod üzerinden eşleştir
      if (requests && requests.length > 0) {
        const codes = requests.map((r: any) => r.cari_code);
        const { data: linkedCustomers } = await supabase
          .from('customers')
          .select('name, current_cari_code')
          .in('current_cari_code', codes);

        const enrichedRequests = requests.map((req: any) => {
          const cust = linkedCustomers?.find(c => c.current_cari_code === req.cari_code);
          return { ...req, customerName: cust?.name || 'Bilinmeyen Müşteri' };
        });
        setPendingRequests(enrichedRequests);
      } else {
        setPendingRequests([]);
      }

      // 2. İSTATİSTİKLERİ ÇEK
      const { count: custCount } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id);
      const { data: invData } = await supabase.from('invoices').select('total_amount').eq('company_id', profile.company_id);
      
      const totalRev = invData?.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0) || 0;

      setStats({
        customers: custCount || 0,
        invoices: invData?.length || 0,
        revenue: totalRev
      });

    } catch (error) {
      console.error("Veri çekilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 🟢 İSTEĞİ ONAYLA
  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase.from('customer_connections').update({ status: 'onayli' }).eq('id', id);
      if (!error) {
        alert("Bağlantı başarıyla onaylandı!");
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  // 🔴 İSTEĞİ REDDET
  const handleReject = async (id: string) => {
    if (!confirm("Bu bağlantı isteğini reddetmek istediğinize emin misiniz?")) return;
    setProcessingId(id);
    try {
      const { error } = await supabase.from('customer_connections').delete().eq('id', id);
      if (!error) fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="p-4 md:p-8 space-y-6 text-[#1B2559]">
      <h1 className="text-2xl font-black italic uppercase tracking-tighter mb-6">Dükkan Özeti</h1>

      {/* 🎯 ONAY BEKLEYENLER BİLDİRİM KUTUSU */}
      {pendingRequests.length > 0 && (
        <div className="bg-gradient-to-r from-[#3063E9] to-blue-800 p-6 md:p-8 rounded-[32px] shadow-2xl shadow-blue-200/50 flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 border border-blue-400/30">
          <div className="flex items-center gap-4 text-white w-full md:w-auto">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
              <UserCheck size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">{pendingRequests.length} Yeni Bağlantı İsteği!</h2>
              <p className="text-blue-100 text-sm font-medium">Müşterileriniz dükkana bağlanmak için onayınızı bekliyor.</p>
            </div>
          </div>
          
          <div className="flex flex-col w-full md:w-auto gap-3">
            {pendingRequests.map(req => (
              <div key={req.id} className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl flex items-center justify-between gap-6">
                <span className="text-white font-bold ml-2 truncate max-w-[150px]">{req.customerName}</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleApprove(req.id)}
                    disabled={processingId === req.id}
                    className="bg-green-500 hover:bg-green-400 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-green-900/20 active:scale-95"
                  >
                    {processingId === req.id ? <Loader2 size={16} className="animate-spin"/> : <><CheckCircle2 size={16} /> Onayla</>}
                  </button>
                  <button 
                    onClick={() => handleReject(req.id)}
                    disabled={processingId === req.id}
                    className="bg-white/10 hover:bg-red-500 text-white p-2.5 rounded-xl text-xs font-bold transition-all flex items-center active:scale-95"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
         <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
            <div>
               <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Toplam Müşteri</p>
               <h2 className="text-4xl font-black">{stats.customers}</h2>
            </div>
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
               <Users size={32} />
            </div>
         </div>
         
         <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-green-200 transition-colors">
            <div>
               <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Kesilen Fatura</p>
               <h2 className="text-4xl font-black">{stats.invoices}</h2>
            </div>
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
               <FileText size={32} />
            </div>
         </div>

         <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-amber-200 transition-colors">
            <div>
               <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Toplam Hacim</p>
               <h2 className="text-3xl font-black tracking-tighter">₺{stats.revenue.toLocaleString('tr-TR')}</h2>
            </div>
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
               <Wallet size={32} />
            </div>
         </div>
      </div>
    </div>
  );
}