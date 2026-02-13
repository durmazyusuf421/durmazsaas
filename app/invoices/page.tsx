'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { FileText, Plus, Search, Filter, Loader2, RefreshCcw } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Veritabanından faturaları çeken fonksiyon
  const fetchInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false }); // En yeniyi en üstte göster

    if (error) {
      console.error("Fatura çekme hatası:", error.message);
    } else {
      setInvoices(data || []);
    }
    setLoading(false);
  };

  // Sayfa yüklendiğinde faturaları getir
  useEffect(() => {
    fetchInvoices();
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-blue-600" /> Faturalar
          </h1>
          <p className="text-gray-500">Kayıtlı tüm faturalar gerçek zamanlı listeleniyor.</p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={fetchInvoices}
            className="p-3 text-gray-500 hover:text-blue-600 hover:bg-white rounded-xl transition border border-transparent hover:border-gray-200"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <Link href="/invoices/new">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-500/20">
              <Plus size={20} /> Yeni Fatura Oluştur
            </button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p>Faturalar yükleniyor...</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b flex gap-4 bg-white">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input placeholder="Fatura veya müşteri ara..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-sm font-semibold uppercase">
                <tr>
                  <th className="p-4">Müşteri / Cari</th>
                  <th className="p-4">Tarih</th>
                  <th className="p-4">Tutar</th>
                  <th className="p-4">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-gray-400">Henüz fatura kaydı bulunmuyor.</td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-bold text-gray-800">{inv.customer_name}</td>
                      <td className="p-4 text-gray-500">{inv.invoice_date || inv.created_at.split('T')[0]}</td>
                      <td className="p-4 font-bold text-blue-700">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(inv.amount || 0)}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          inv.status === 'Ödendi' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {inv.status || 'Beklemede'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}