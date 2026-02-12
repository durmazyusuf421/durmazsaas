"use client";
import { useState, useEffect } from "react";
// Senin onayladığın çalışan yol:
import { supabase } from "../lib/supabase"; 
import { useRouter } from "next/navigation";

export default function TeklifOlustur() {
  const [cariler, setCariler] = useState<any[]>([]);
  const [urunler, setUrunler] = useState<any[]>([]);
  const [seciliCari, setSeciliCari] = useState("");
  const [sepet, setSepet] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [isletmeId, setIsletmeId] = useState<string | null>(null);
  const [olusanLink, setOlusanLink] = useState<string | null>(null);

  useEffect(() => {
    const verileriHazirla = async () => {
      // 1. İşletme (Dükkan) Bilgisini Al
      const { data: dukkan } = await supabase.from("isletmeler").select("id").limit(1).single();
      if (dukkan) setIsletmeId(dukkan.id);

      // 2. Müşteri ve Ürünleri Veritabanından Çek
      const { data: c } = await supabase.from("cariler").select("*");
      const { data: u } = await supabase.from("envanter").select("*");
      if (c) setCariler(c);
      if (u) setUrunler(u);
    };
    verileriHazirla();
  }, []);

  const sepeteEkle = (urun: any) => {
    if (sepet.find(item => item.id === urun.id)) return;
    setSepet([...sepet, { ...urun, miktar: 1 }]);
  };

  const sepettenCikar = (id: string) => {
    setSepet(sepet.filter(item => item.id !== id));
  };

  const teklifKaydet = async () => {
    if (!seciliCari || sepet.length === 0 || !isletmeId) return alert("Lütfen müşteri ve ürün seçin!");
    setYukleniyor(true);

    try {
      const bitis = new Date();
      bitis.setHours(bitis.getHours() + 24);

      // 1. Teklif Kaydı
      const { data: yeniTeklif, error: tHata } = await supabase
        .from("teklifler")
        .insert([{ 
          isletme_id: isletmeId,
          cari_id: seciliCari, 
          bitis_tarihi: bitis.toISOString(),
          toplam_tutar: sepet.reduce((acc, curr) => acc + curr.satis_fiyati, 0)
        }])
        .select().single();

      if (tHata) throw tHata;

      // 2. Teklifin İçindeki Ürünler
      const kalemler = sepet.map(u => ({
        teklif_id: yeniTeklif.id,
        envanter_id: u.id,
        miktar: 1,
        birim_fiyat: u.satis_fiyati
      }));

      await supabase.from("teklif_kalemleri").insert(kalemler);

      // LİNK OLUŞTURMA
      const link = `${window.location.origin}/teklif/${yeniTeklif.id}`;
      setOlusanLink(link);
      alert("Teklif Oluşturuldu! 🔗");

    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="space-y-8 p-4">
      <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">TEKLİF HAZIRLA.</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Müşteri Seçimi */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <label className="block text-xs font-black text-blue-600 mb-3 uppercase tracking-widest">Müşteri Seçimi</label>
            <select className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold text-slate-700" onChange={(e) => setSeciliCari(e.target.value)}>
              <option value="">— Müşteri Seçin —</option>
              {cariler.map(c => <option key={c.id} value={c.id}>{c.unvan}</option>)}
            </select>
          </div>

          {/* Ürün Listesi */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 mb-6 uppercase">ÜRÜN LİSTESİ</h3>
            <div className="grid grid-cols-1 gap-3">
              {urunler.map(u => (
                <button key={u.id} onClick={() => sepeteEkle(u)} className="flex justify-between items-center p-5 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-2xl font-bold transition-all group text-left">
                  <span>{u.kalem_adi}</span>
                  <span className="text-blue-600 group-hover:text-white">{u.satis_fiyati} ₺</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Özet ve Paylaşım */}
        <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white h-fit sticky top-10">
          <h3 className="font-black text-2xl mb-8 border-b border-slate-800 pb-4">TEKLİF ÖZETİ</h3>
          <div className="space-y-4 mb-10 min-h-[100px]">
            {sepet.length === 0 && <p className="text-slate-500 font-bold text-center py-10">Sepetiniz boş.</p>}
            {sepet.map((u, i) => (
              <div key={i} className="flex justify-between items-center group">
                <span className="font-bold">{u.kalem_adi}</span>
                <div className="flex items-center gap-4">
                  <span className="font-black text-blue-400">{u.satis_fiyati} ₺</span>
                  <button onClick={() => sepettenCikar(u.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-all">✕</button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-slate-800 pt-6 mb-10">
            <p className="text-slate-500 text-xs font-black uppercase">Toplam Tutar</p>
            <h4 className="text-4xl font-black text-white">{sepet.reduce((acc, curr) => acc + curr.satis_fiyati, 0)} ₺</h4>
          </div>

          {!olusanLink ? (
            <button onClick={teklifKaydet} disabled={yukleniyor || sepet.length === 0} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-3xl transition-all shadow-xl shadow-blue-900/20 uppercase tracking-widest disabled:opacity-20">
              {yukleniyor ? "HAZIRLANIYOR..." : "TEKLİFİ ONAYLA 🚀"}
            </button>
          ) : (
            <div className="space-y-4 animate-in zoom-in duration-300">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(olusanLink);
                  alert("Link Kopyalandı! 🔗");
                }}
                className="w-full bg-white text-slate-900 font-black py-5 rounded-2xl hover:bg-slate-100 transition-all uppercase tracking-widest"
              >
                LİNKİ KOPYALA 🔗
              </button>

              <button 
                onClick={() => {
                  const mesaj = encodeURIComponent(`Merhaba, Durmazsaas üzerinden size özel fiyat teklifimiz hazır! Linke tıklayarak inceleyebilirsiniz: ${olusanLink}\n\nNot: Bu teklif 24 saat geçerlidir.`);
                  window.open(`https://wa.me/?text=${mesaj}`, '_blank');
                }}
                className="w-full bg-emerald-500 text-white font-black py-5 rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                <span>💬</span> WhatsApp ile Gönder
              </button>

              <button onClick={() => { setOlusanLink(null); setSepet([]); }} className="w-full text-slate-500 font-bold text-xs uppercase pt-4">
                + YENİ TEKLİF OLUŞTUR
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}