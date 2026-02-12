"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function TeklifOlustur() {
  const [cariler, setCariler] = useState<any[]>([]);
  const [urunler, setUrunler] = useState<any[]>([]);
  const [seciliCari, setSeciliCari] = useState("");
  const [sepet, setSepet] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [isletmeId, setIsletmeId] = useState<string | null>(null);
  const [olusanLink, setOlusanLink] = useState<string | null>(null); // Bu satır eksik kalmış olabilir
  const router = useRouter();

  useEffect(() => {
    const verileriHazirla = async () => {
      const { data: dukkan } = await supabase.from("isletmeler").select("id").limit(1).single();
      if (dukkan) setIsletmeId(dukkan.id);

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
      alert("Teklif Başarıyla Oluşturuldu! 🚀");

    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="space-y-8 p-4">
      <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">TEKLİF HAZIRLA.</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border">
            <label className="block text-xs font-black text-blue-600 mb-2 uppercase">Müşteri Seçin</label>
            <select className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold" onChange={(e) => setSeciliCari(e.target.value)}>
              <option value="">Seçiniz...</option>
              {cariler.map(c => <option key={c.id} value={c.id}>{c.unvan}</option>)}
            </select>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border">
            <h3 className="font-black text-slate-700 mb-4 uppercase">Ürünler</h3>
            <div className="grid grid-cols-1 gap-2">
              {urunler.map(u => (
                <button key={u.id} onClick={() => sepeteEkle(u)} className="flex justify-between p-4 bg-slate-50 hover:bg-blue-50 rounded-xl font-bold transition-all text-left">
                  <span>{u.kalem_adi}</span>
                  <span className="text-blue-600">{u.satis_fiyati} ₺</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white h-fit">
          <h3 className="font-black mb-6 uppercase border-b border-slate-800 pb-2">Özet</h3>
          <div className="space-y-4 mb-8">
            {sepet.map((u, i) => (
              <div key={i} className="flex justify-between items-center">
                <span>{u.kalem_adi}</span>
                <div className="flex items-center gap-3">
                  <span className="font-black text-blue-400">{u.satis_fiyati} ₺</span>
                  <button onClick={() => sepettenCikar(u.id)} className="text-red-500 text-xs">✕</button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between text-2xl font-black mb-8 pt-4 border-t border-slate-800">
            <span>TOPLAM:</span>
            <span>{sepet.reduce((acc, curr) => acc + curr.satis_fiyati, 0)} ₺</span>
          </div>

          {!olusanLink ? (
            <button onClick={teklifKaydet} disabled={yukleniyor || sepet.length === 0} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-500 transition-all uppercase tracking-widest disabled:opacity-20">
              {yukleniyor ? "Hazırlanıyor..." : "TEKLİFİ ONAYLA 🚀"}
            </button>
          ) : (
            <div className="space-y-3 animate-in zoom-in duration-300">
              <p className="text-emerald-400 text-center font-black text-xs uppercase">Teklif Hazır! ✅</p>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(olusanLink);
                  alert("Link Kopyalandı!");
                }}
                className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl hover:bg-emerald-500 transition-all uppercase tracking-widest"
              >
                LİNKİ KOPYALA 🔗
              </button>
              <button 
                onClick={() => setOlusanLink(null)}
                className="w-full text-slate-500 font-bold text-xs uppercase"
              >
                YENİ TEKLİF OLUŞTUR
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}