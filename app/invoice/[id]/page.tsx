'use client';
import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams } from 'next/navigation';
import { Loader2, Printer, Share2, CreditCard, Phone, MapPin, Mail } from 'lucide-react';

export default function PublicInvoicePage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!params.id) return;
      const { data, error } = await supabase
        .from('invoices')
        .select('*, invoice_items(*), companies(*), customers(*)')
        .eq('id', params.id)
        .single();

      if (error) console.error(error);
      else setInvoice(data);
      setLoading(false);
    };
    fetchInvoice();
  }, [params.id]);

  const handlePrint = () => window.print();
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link kopyalandı!");
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;
  if (!invoice) return <div className="h-screen flex flex-col items-center justify-center text-red-500 font-bold">🚫 Fatura bulunamadı.</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex justify-center print:bg-white print:p-0">
      <div className="bg-white w-full max-w-4xl shadow-2xl rounded-xl overflow-hidden print:shadow-none print:w-full">
        {/* ÜST BUTONLAR */}
        <div className="bg-[#1B2559] p-4 flex justify-between items-center text-white print:hidden">
          <div className="font-bold text-lg">📄 Fatura Önizleme</div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"><Printer size={18}/> Yazdır</button>
            <button onClick={handleShare} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition-colors font-bold"><Share2 size={18}/> Paylaş</button>
          </div>
        </div>

        {/* FATURA KAĞIDI */}
        <div className="p-10 print:p-8">
          <div className="flex justify-between border-b pb-8 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#1B2559] uppercase">{invoice.companies?.name}</h1>
              <p className="text-gray-500 text-sm mt-1">{invoice.companies?.address}</p>
              <p className="text-gray-500 text-sm">{invoice.companies?.phone}</p>
            </div>
            <div className="text-right">
              <h2 className="text-4xl font-extrabold text-gray-200 uppercase">FATURA</h2>
              <p className="text-gray-600 mt-2">No: <strong>#{invoice.id.substring(0,6).toUpperCase()}</strong></p>
              <p className="text-gray-600">Tarih: {new Date(invoice.invoice_date).toLocaleDateString('tr-TR')}</p>
            </div>
          </div>

          <div className="mb-8 bg-gray-50 p-4 rounded-lg print:bg-transparent print:p-0">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Sayın</h3>
            <h2 className="text-xl font-bold text-[#1B2559]">{invoice.customers?.name}</h2>
            <p className="text-gray-500 text-sm">{invoice.customers?.phone}</p>
          </div>

          <table className="w-full mb-8">
            <thead>
              <tr className="bg-gray-100 text-xs text-gray-500 uppercase font-bold print:bg-gray-50">
                <th className="py-3 pl-3 text-left">Hizmet</th>
                <th className="py-3 text-center">Adet</th>
                <th className="py-3 text-right">Fiyat</th>
                <th className="py-3 pr-3 text-right">Toplam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.invoice_items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-3 pl-3 font-bold text-gray-800">{item.description}</td>
                  <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-600">₺{item.unit_price?.toLocaleString()}</td>
                  <td className="py-3 pr-3 text-right font-bold text-gray-800">₺{item.total_price?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-gray-600"><span>Ara Toplam</span><span>₺{(invoice.total_amount - invoice.tax_amount).toLocaleString()}</span></div>
              <div className="flex justify-between text-gray-600"><span>KDV</span><span>₺{invoice.tax_amount?.toLocaleString()}</span></div>
              <div className="flex justify-between text-[#1B2559] font-bold text-xl border-t pt-2"><span>TOPLAM</span><span>₺{invoice.total_amount?.toLocaleString()}</span></div>
            </div>
          </div>

          {(invoice.companies?.bank_name || invoice.companies?.iban) && (
            <div className="border-t pt-6 print:break-inside-avoid">
              <h4 className="font-bold text-sm text-[#1B2559] mb-2 flex items-center gap-2"><CreditCard size={16}/> Banka Bilgileri</h4>
              <p className="text-sm text-gray-800 font-bold">{invoice.companies?.bank_name}</p>
              <p className="text-sm text-gray-600 font-mono mt-1">{invoice.companies?.iban}</p>
            </div>
          )}
          
          <div className="mt-12 text-center text-xs text-gray-400 print:mt-24">
            Bu belge {new Date().getFullYear()} tarihinde elektronik olarak oluşturulmuştur.
          </div>
        </div>
      </div>
    </div>
  );
}