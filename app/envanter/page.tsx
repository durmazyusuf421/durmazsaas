"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function EnvanterPage() {
  const [urunler, setUrunler] = useState<any[]>([]);
  const [ad, setAd] = useState("");
  const [fiyat, setFiyat] = useState("");
  const [stok, setStok] = useState("");

  const urunleriYukle = async () => {
    const { data } = await supabase.from("envanter").select("*").order("kalem_adi");
    if (data) setUrunler(data);
  };

  useEffect(() => { urunleriYukle(); }, []);

  const urunEkle = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: d } = await supabase.from("isletmeler").select("id").limit(1).single();
    if (d) {
      await supabase.from("envanter").insert([{ kalem_adi: ad, satis_fiyati: Number(fiyat), stok_miktari: Number(stok), isletme_id: d.id }]);
      setAd(""); setFiyat(""); setStok(""); urunleriYukle();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">ENVANTER & STOK.</h2>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border shadow-sm h-fit">
          <form onSubmit={urunEkle} className="space-y-3">
            <input required placeholder="Ürün Adı" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border focus:border-blue-500" value={ad} onChange={(e) => setAd(e.target.value)} />
            <input required type="number" placeholder="Fiyat (₺)" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border focus:border-blue-500" value={fiyat} onChange={(e) => setFiyat(e.target.value)} />
            <input required type="number" placeholder="Stok" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border focus:border-blue-500" value={stok} onChange={(e) => setStok(e.target.value)} />
            <button className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all">STOKLA +</button>
          </form>
        </div>
        <div className="lg:col-span-3 bg-white rounded-3xl border shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b font-black text-xs text-slate-400 uppercase">
              <tr><th className="p-6">Ürün</th><th className="p-6">Stok</th><th className="p-6 text-right">Fiyat</th></tr>
            </thead>
            <tbody className="divide-y">
              {urunler.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-6 font-bold text-slate-700 uppercase">{u.kalem_adi}</td>
                  <td className={`p-6 font-black ${u.stok_miktari < 10 ? 'text-red-500' : 'text-slate-700'}`}>{u.stok_miktari} Kg/Adet</td>
                  <td className="p-6 text-right font-black text-xl text-blue-700">{u.satis_fiyati} ₺</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}