"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function IsletmeKurulum() {
  const [ad, setAd] = useState("");
  const [sektor, setSektor] = useState("Genel");
  const [yukleniyor, setYukleniyor] = useState(false);
  const router = useRouter();

  const dukkaniKur = async (e: React.FormEvent) => {
    e.preventDefault();
    setYukleniyor(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("isletmeler")
      .insert([{ 
        isletme_adi: ad, 
        sektor: sektor,
        sahip_id: user?.id // Giriş yapmış kullanıcının ID'si
      }]);

    if (error) {
      alert("Hata oluştu: " + error.message);
    } else {
      alert("Dükkan başarıyla kuruldu! 🎉");
      router.push("/"); // Ana panele yönlendir
    }
    setYukleniyor(false);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-blue-700">DÜKKANI KUR.</h2>
        <p className="text-slate-500 mt-2">İşletme bilgilerini girerek SaaS dünyasına adım at.</p>
      </div>

      <form onSubmit={dukkaniKur} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">İşletme Adı</label>
          <input 
            required
            type="text" 
            placeholder="Örn: Durmaz Toptan"
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={ad}
            onChange={(e) => setAd(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Sektör</label>
          <select 
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            value={sektor}
            onChange={(e) => setSektor(e.target.value)}
          >
            <option value="Manav">Manav / Hal</option>
            <option value="Tekstil">Tekstil / Butik</option>
            <option value="Yedek Parça">Yedek Parça</option>
            <option value="Hizmet">Hizmet / Randevu</option>
            <option value="Genel">Diğer / Genel</option>
          </select>
        </div>

        <button 
          disabled={yukleniyor}
          type="submit"
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-200 transition-all uppercase tracking-widest disabled:opacity-50"
        >
          {yukleniyor ? "Kayıt Ediliyor..." : "Dükkanı Oluştur 🚀"}
        </button>
      </form>
    </div>
  );
}