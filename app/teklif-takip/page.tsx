"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function TeklifTakipPage() {
  const [teklifler, setTeklifler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const teklifleriGetir = async () => {
    setYukleniyor(true);
    // Teklifleri çek ve cariler tablosuyla birleştir (Müşteri adını almak için)
    const { data, error } = await supabase
      .from("teklifler")
      .select(`
        *,
        cariler (unvan)
      `)
      .order("created_at", { ascending: false });

    if (!error) {
      setTeklifler(data || []);
    }
    setYukleniyor(false);
  };

  useEffect(() => {
    teklifleriGetir();
  }, []);

  // Süre kontrolü yapan yardımcı fonksiyon
  const durumHesapla = (bitisTarihi: string, mevcutDurum: string) => {
    const simdi = new Date();
    const bitis = new Date(bitisTarihi);
    if (simdi > bitis && mevcutDurum === "Beklemede") {
      return { label: "SÜRESİ DOLDU", color: "bg-red-100 text-red-700" };
    }
    if (mevcutDurum === "Onaylandı") {
      return { label: "ONAYLANDI", color: "bg-emerald-100 text-emerald-700" };
    }
    return { label: "BEKLEMEDE", color: "bg-amber-100 text-amber-700" };
  };

  return (
    <div className="space-y-8 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">TEKLİF TAKİP MERKEZİ.</h2>
        <button 
          onClick={teklifleriGetir}
          className="bg-slate-100 hover:bg-slate-200 p-3 rounded-xl transition-all"
        >
          🔄 Yenile
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-slate-400 text-xs font-black uppercase border-b">
            <tr>
              <th className="p-6">Müşteri</th>
              <th className="p-6">Tutar</th>
              <th className="p-6">Oluşturma</th>
              <th className="p-6">Durum</th>
              <th className="p-6 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {yukleniyor ? (
              <tr><td colSpan={5} className="p-10 text-center font-bold text-slate-400">Veriler yükleniyor...</td></tr>
            ) : teklifler.length === 0 ? (
              <tr><td colSpan={5} className="p-10 text-center font-bold text-slate-400">Henüz hiç teklif oluşturulmamış.</td></tr>
            ) : (
              teklifler.map((t) => {
                const durum = durumHesapla(t.bitis_tarihi, t.durum);
                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="p-6">
                      <p className="font-black text-slate-800 uppercase text-sm">{t.cariler?.unvan || "Bilinmeyen Müşteri"}</p>
                      <p className="text-[10px] text-slate-400 font-bold">ID: {t.id.slice(0, 8)}...</p>
                    </td>
                    <td className="p-6 font-black text-blue-700">{t.toplam_tutar} ₺</td>
                    <td className="p-6 text-slate-500 text-xs font-bold">
                      {new Date(t.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${durum.color}`}>
                        {durum.label}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <button 
                        onClick={() => window.open(`/teklif/${t.id}`, '_blank')}
                        className="text-blue-600 hover:text-blue-800 font-black text-xs uppercase underline decoration-2 underline-offset-4"
                      >
                        İncele 👀
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* İstatistik Özet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-8 rounded-3xl text-white">
          <p className="text-slate-500 text-xs font-black uppercase mb-2">Toplam Teklif Hacmi</p>
          <h3 className="text-3xl font-black">
            {teklifler.reduce((acc, curr) => acc + curr.toplam_tutar, 0)} ₺
          </h3>
        </div>
        <div className="bg-blue-700 p-8 rounded-3xl text-white">
          <p className="text-blue-200 text-xs font-black uppercase mb-2">Toplam Teklif Sayısı</p>
          <h3 className="text-3xl font-black">{teklifler.length} Adet</h3>
        </div>
      </div>
    </div>
  );
}