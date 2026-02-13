'use client';
import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams } from 'next/navigation';
import { Loader2, TrendingUp, Calendar, FileText, Phone, MapPin, Share2 } from 'lucide-react';

export default function PublicStatementPage() {
  const params = useParams(); // URL'den Müşteri ID'sini al
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!params.id) return;

      // 1. Müşteri Bilgilerini ve Şirketi Çek
      const { data: customer, error: custError } = await supabase
        .from('customers')
        .select(`*, companies(*)`)
        .eq('id', params.id)
        .single();

      if (custError) {
        console.error(custError);
        setLoading(false);
        return;
      }

      // 2. Müşterinin Faturalarını Çek
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', params.id)
        .order('invoice_date', { ascending: false });

      // 3. Bakiyeyi Hesapla (Sadece 'Bekliyor' olanları topla)
      // Not: İleride "Tahsilat" sistemi gelince burası (Borç - Alacak) olacak.
      const totalDebt = invoices
        ?.filter(inv => inv.status !== 'İptal')
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

      // Şimdilik sadece fatura toplamını gösteriyoruz (Ödemeler düşünce burası güncellenir)
      const pendingDebt = invoices
        ?.filter(inv => inv.status === 'Bekliyor')
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

      setData({ customer, invoices, totalDebt, pendingDebt });
      setLoading(false);
    };

    fetchData();
  }, [params.id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Hesap Ekstresi - ${data?.customer.name}`,
        text: `Sayın ${data?.customer.name}, güncel hesap ekstreniz ektedir.`,
        url: window.location.href,
      });
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;
  if (!data) return <div className="h-screen flex items-center justify-center text-red-500 font-bold">Müşteri bulunamadı veya link geçersiz.</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl space-y-6">
        
        {/* ÜST BİLGİ KARTI (ŞİRKET & MÜŞTERİ) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-8 -mt-8"></div>
          
          <div className="relative z-10">
            <h1 className="text-xl font-bold text-gray-400 uppercase tracking-widest mb-1">{data.customer.companies?.name}</h1>
            <h2 className="text-3xl font-bold text-[#1B2559] mb-6">Sayın {data.customer.name},</h2>
            
            <div className="flex flex-col md:flex-row gap-6 text-sm text-gray-600">
               <div className="flex items-center gap-2"><Phone size={16} className="text-blue-500"/> {data.customer.companies?.phone}</div>
               <div className="flex items-center gap-2"><MapPin size={16} className="text-blue-500"/> {data.customer.companies?.address}</div>
            </div>
          </div>
        </div>

        {/* BAKİYE KARTI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#1B2559] text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
            <div className="text-blue-200 text-sm font-bold uppercase tracking-wider">TOPLAM AÇIK BAKİYE</div>
            <div className="text-4xl font-bold mt-2">₺{data.pendingDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="mt-4 text-xs text-blue-200 bg-white/10 p-2 rounded-lg w-fit">
              Ödenmesi beklenen tutardır.
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
              <TrendingUp size={24} />
            </div>
            <div className="text-gray-500 text-sm">Toplam İşlem Hacmi</div>
            <div className="text-2xl font-bold text-gray-800">₺{data.totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        {/* İŞLEM GEÇMİŞİ LİSTESİ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-[#1B2559] text-lg">Hesap Hareketleri</h3>
            <button onClick={handleShare} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
              <Share2 size={20} />
            </button>
          </div>
          
          <div className="divide-y divide-gray-50">
            {data.invoices.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Henüz kayıtlı işlem bulunmuyor.</div>
            ) : (
              data.invoices.map((inv: any) => (
                <div key={inv.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      FTR
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        Fatura #{inv.id.substring(0,6).toUpperCase()}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${inv.status === 'Ödendi' ? 'bg-green-100 text-green-700' : inv.status === 'İptal' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {inv.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Calendar size={12} /> {new Date(inv.invoice_date).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#1B2559]">₺{inv.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div className="text-xs text-gray-400">Borç</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 py-4">
          Bu ekstre {data.customer.companies?.name} tarafından oluşturulmuştur.<br/>
          Sistem Saati: {new Date().toLocaleString('tr-TR')}
        </div>

      </div>
    </div>
  );
}