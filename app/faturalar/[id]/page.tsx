'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { Printer, ArrowLeft, Building2, Mail, Phone, MapPin } from 'lucide-react';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getInvoiceDetails() {
      if (!params?.id) return;

      // Faturayı ve Müşteriyi Çek
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('*, contacts(*)')
        .eq('id', params.id)
        .single();

      if (invoiceData) {
        setInvoice(invoiceData);

        // Şirket Bilgilerini Çek
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', invoiceData.company_id)
          .single();
        
        setCompany(companyData);
      }
      setLoading(false);
    }

    getInvoiceDetails();
  }, [params?.id]);

  if (loading) return <div className="p-10 text-center">Fatura hazırlanıyor...</div>;
  if (!invoice) return <div className="p-10 text-center text-red-500">Fatura bulunamadı!</div>;

  // Birim Fiyat Hesaplama (Eğer veritabanında yoksa, Toplam / Miktar yaparak buluruz)
  const unitPrice = invoice.quantity > 0 ? (invoice.total_amount / invoice.quantity) : invoice.total_amount;

  return (
    <div className="p-8 ml-64 min-h-screen bg-slate-100 dark:bg-slate-950 print:ml-0 print:p-0 print:bg-white">
      
      {/* Üst Butonlar (Yazdırınca Gizlenir) */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-800">
          <ArrowLeft size={20} /> Listeye Dön
        </button>
        <button 
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"
        >
          <Printer size={20} /> YAZDIR / PDF İNDİR
        </button>
      </div>

      {/* A4 FATURA KAĞIDI TASARIMI */}
      <div className="bg-white text-slate-900 w-full max-w-[210mm] mx-auto min-h-[297mm] p-12 shadow-2xl print:shadow-none print:w-full print:max-w-none rounded-sm">
        
        {/* Başlık ve Logo Alanı */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight mb-2">{company?.name || 'ŞİRKET ADI'}</h1>
            <div className="text-sm text-slate-500 space-y-1">
              {company?.address && <p className="flex items-center gap-2"><MapPin size={12}/> {company.address}</p>}
              {company?.phone && <p className="flex items-center gap-2"><Phone size={12}/> {company.phone}</p>}
              {company?.email && <p className="flex items-center gap-2"><Mail size={12}/> {company.email}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-5xl font-black text-slate-200 uppercase tracking-widest">FATURA</h2>
            <p className="text-slate-500 font-bold mt-2">NO: #{invoice.invoice_no || 'TASLAK'}</p>
            <p className="text-slate-500 text-sm">TARİH: {new Date(invoice.issue_date).toLocaleDateString('tr-TR')}</p>
          </div>
        </div>

        {/* Sayın / Kime Kısmı */}
        <div className="mb-12">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">SAYIN / MÜŞTERİ</p>
          <h3 className="text-2xl font-bold">{invoice.contacts?.name}</h3>
          <p className="text-slate-600 w-2/3 mt-1">
            {invoice.contacts?.phone} <br/>
            {invoice.contacts?.email} <br/>
            Vergi No: {invoice.contacts?.tax_number || '-'}
          </p>
        </div>

        {/* Hizmet / Ürün Tablosu (GÜNCELLENDİ) */}
        <table className="w-full text-left mb-12">
          <thead className="bg-slate-100 border-y border-slate-200">
            <tr>
              <th className="py-3 px-4 font-black text-xs uppercase text-slate-600 w-1/2">Açıklama / Ürün</th>
              <th className="py-3 px-4 font-black text-xs uppercase text-slate-600 text-center">Miktar</th>
              <th className="py-3 px-4 font-black text-xs uppercase text-slate-600 text-right">Birim Fiyat</th>
              <th className="py-3 px-4 font-black text-xs uppercase text-slate-600 text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-6 px-4 border-b border-slate-100 text-lg font-medium">
                {invoice.description}
              </td>
              <td className="py-6 px-4 border-b border-slate-100 text-center text-lg font-bold text-slate-600">
                {invoice.quantity} {invoice.unit}
              </td>
              <td className="py-6 px-4 border-b border-slate-100 text-right text-lg font-bold text-slate-600">
                {unitPrice.toLocaleString('tr-TR')} ₺
              </td>
              <td className="py-6 px-4 border-b border-slate-100 text-right text-lg font-bold">
                {invoice.total_amount.toLocaleString('tr-TR')} ₺
              </td>
            </tr>
          </tbody>
        </table>

        {/* Alt Toplamlar */}
        <div className="flex justify-end">
          <div className="w-1/2 space-y-3">
            <div className="flex justify-between border-t border-slate-900 pt-4">
              <span className="text-xl font-black">GENEL TOPLAM</span>
              <span className="text-xl font-black">{invoice.total_amount.toLocaleString('tr-TR')} ₺</span>
            </div>
          </div>
        </div>

        {/* Alt Notlar */}
        <div className="mt-20 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-sm italic">İşbu fatura dijital olarak oluşturulmuştur.</p>
            <p className="text-slate-900 font-bold mt-2">Teşekkür Ederiz!</p>
        </div>

      </div>
    </div>
  );
}