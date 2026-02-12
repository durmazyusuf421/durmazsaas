'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, Plus, Package, Box, Tag, 
  Trash2, Edit2, X, Save, AlertTriangle 
} from 'lucide-react';

export default function StokPage() {
  const [urunler, setUrunler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal (Pencere) Durumları
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [yeniUrun, setYeniUrun] = useState({
    ad: '',
    alis: 0,
    satis: 0,
    stok: 0
  });

  // Verileri Çek
  const fetchUrunler = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('urunler')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setUrunler(data);
    setLoading(false);
  };

  useEffect(() => { fetchUrunler(); }, []);

  // Ürün Ekle
  const urunEkle = async () => {
    if (!yeniUrun.ad) return alert("Ürün adı giriniz!");
    
    const { error } = await supabase.from('urunler').insert([yeniUrun]);
    
    if (!error) {
       setIsModalOpen(false);
       setYeniUrun({ ad: '', alis: 0, satis: 0, stok: 0 });
       fetchUrunler();
    } else {
       alert("Hata: " + error.message);
    }
  };

  // Ürün Sil
  const urunSil = async (id: string) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from('urunler').delete().eq('id', id);
    if (!error) fetchUrunler();
  };

  const filteredUrunler = urunler.filter(u => 
    (u.ad || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-700 pb-24">
      
      {/* BAŞLIK */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
             STOK YÖNETİMİ <Package className="text-amber-500 animate-bounce" size={28}/>
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Ürün Envanteri ve Fiyat Listesi</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all active:scale-95 border border-amber-400/20 flex items-center gap-2"
        >
           <Plus size={18} strokeWidth={3}/> YENİ ÜRÜN GİRİŞİ
        </button>
      </div>

      {/* ARAMA */}
      <div className="relative group">
         <div className="absolute inset-0 bg-amber-500/10 rounded-2xl blur-xl group-hover:bg-amber-500/20 transition-all"></div>
         <div className="relative bg-slate-900/60 backdrop-blur-md border border-slate-700 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
            <Search className="text-slate-400 group-hover:text-white transition-colors ml-2" size={24}/>
            <input 
              type="text" 
              placeholder="ÜRÜN ADI VEYA KODU ARA..." 
              className="w-full bg-transparent font-bold text-lg outline-none text-white placeholder-slate-500 uppercase tracking-wide"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
         </div>
      </div>

      {/* LİSTE */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredUrunler.map((urun) => (
          <div key={urun.id} className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-6 rounded-[2rem] hover:border-amber-500/40 hover:bg-slate-800/60 transition-all group relative overflow-hidden flex flex-col justify-between h-full">
             
             {/* Kritik Stok Uyarısı */}
             {urun.stok <= 5 && (
                <div className="absolute top-4 right-4 animate-pulse text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full text-[10px] font-bold border border-rose-500/20 flex items-center gap-1">
                   <AlertTriangle size={12}/> KRİTİK STOK
                </div>
             )}

             <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-amber-500 shadow-lg group-hover:scale-110 transition-transform">
                      <Box size={24}/>
                   </div>
                   <div>
                      <h3 className="font-black text-white text-lg uppercase tracking-wide leading-tight">
                        {urun.ad}
                      </h3>
                      <p className="text-slate-500 text-xs font-bold mt-1">STOK KODU: #{urun.id.substring(0,6).toUpperCase()}</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-6">
                   <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">ALIŞ FİYATI</p>
                      <p className="text-white font-bold">₺{urun.alis?.toLocaleString()}</p>
                   </div>
                   <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">SATIŞ FİYATI</p>
                      <p className="text-emerald-400 font-bold">₺{urun.satis?.toLocaleString()}</p>
                   </div>
                </div>
             </div>

             <div className="flex items-end justify-between mt-6 pt-4 border-t border-slate-800/50">
                <div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">MEVCUT STOK</p>
                   <h4 className={`text-3xl font-black tracking-tighter ${urun.stok <= 5 ? 'text-rose-500' : 'text-white'}`}>
                      {urun.stok} <span className="text-sm text-slate-500 font-bold">ADET</span>
                   </h4>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => urunSil(urun.id)} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white hover:bg-rose-600 transition-colors"><Trash2 size={18}/></button>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
           <div className="bg-[#0f172a] border border-slate-700 w-full max-w-lg rounded-[2rem] p-8 shadow-2xl relative animate-in zoom-in-95 z-50">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-black text-white uppercase tracking-tight">ÜRÜN TANIMLA</h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
              </div>

              <div className="space-y-4">
                  <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">ÜRÜN ADI</label>
                      <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white font-bold outline-none focus:border-amber-500 transition-colors uppercase"
                        value={yeniUrun.ad} onChange={(e) => setYeniUrun({...yeniUrun, ad: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">ALIŞ FİYATI</label>
                          <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white font-bold outline-none focus:border-amber-500 transition-colors"
                            value={yeniUrun.alis} onChange={(e) => setYeniUrun({...yeniUrun, alis: Number(e.target.value)})} />
                      </div>
                      <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">SATIŞ FİYATI</label>
                          <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white font-bold outline-none focus:border-amber-500 transition-colors"
                            value={yeniUrun.satis} onChange={(e) => setYeniUrun({...yeniUrun, satis: Number(e.target.value)})} />
                      </div>
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">BAŞLANGIÇ STOK ADEDİ</label>
                      <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white font-bold outline-none focus:border-amber-500 transition-colors"
                        value={yeniUrun.stok} onChange={(e) => setYeniUrun({...yeniUrun, stok: Number(e.target.value)})} />
                  </div>

                 <button onClick={urunEkle} className="w-full bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-xl font-black text-lg uppercase tracking-widest shadow-lg shadow-amber-900/40 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4">
                   <Save size={20} /> ÜRÜNÜ KAYDET
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}