'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Store, FileText, LogOut, Loader2, Rocket, Menu, X, 
  Wallet, ArrowDownRight, ArrowUpRight, Building2, Printer, ArrowRight, 
  ChevronDown, ChevronUp, CheckSquare, Square, ShoppingCart, FileClock
} from 'lucide-react';
import Link from 'next/link';

interface ToptanciCari {
  company_id: string;
  company_name: string;
  balance: number;
}

interface CariHareket {
  id: string;
  raw_date: string;
  created_at: string;
  company_id: string;
  company_name: string;
  type: string;
  amount: number;
  description: string;
  items?: any[]; 
}

export default function CustomerBillingPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string) || ''; 
  
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [cariler, setCariler] = useState<any[]>([]);
  const [hareketler, setHareketler] = useState<any[]>([]);

  const [selectedCari, setSelectedCari] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Filtre State'leri
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    const fetchCariData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        const cariKodu = decodeURIComponent(code).trim().toUpperCase();
        const { data: customerRecords } = await supabase.from('customers').select(`id, balance, company_id, companies ( name )`).eq('code', cariKodu);

        if (customerRecords && customerRecords.length > 0) {
            setCariler(customerRecords.map((r: any) => ({
                id: r.id, company_id: r.company_id, company_name: r.companies?.name || 'İşletme', balance: r.balance || 0
            })));

            const customerIds = customerRecords.map(r => r.id);
            const { data: tRecords } = await supabase.from('transactions').select(`*`).in('customer_id', customerIds).order('created_at', { ascending: false });

            if (tRecords) {
                setHareketler(tRecords.map((t: any) => {
                    let safeItems = [];
                    if (t.items) {
                        if (Array.isArray(t.items)) {
                            safeItems = t.items;
                        } else if (typeof t.items === 'object') {
                            safeItems = [t.items]; 
                        } else if (typeof t.items === 'string') {
                            try { 
                                const parsed = JSON.parse(t.items); 
                                if (Array.isArray(parsed)) safeItems = parsed;
                                else if (parsed && typeof parsed === 'object') safeItems = [parsed];
                            } catch(e) { safeItems = []; }
                        }
                    }

                    return {
                        ...t,
                        items: safeItems.length > 0 ? safeItems : null,
                        date_label: new Date(t.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    };
                }));
            }
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchCariData();
  }, [code, router, supabase]);

  const totalBorc = cariler.reduce((acc, curr) => acc + curr.balance, 0);

  // Filtreleme Motoru
  const filteredHareketler = useMemo(() => {
      return hareketler.filter(h => {
          if (h.company_id !== selectedCari?.company_id) return false;
          if (filterType !== 'ALL' && h.type !== filterType) return false;
          if (startDate && new Date(h.raw_date) < new Date(startDate)) return false;
          if (endDate) {
              const end = new Date(endDate); end.setHours(23, 59, 59);
              if (new Date(h.raw_date) > end) return false;
          }
          return true;
      });
  }, [hareketler, selectedCari, filterType, startDate, endDate]);

  const printItems = useMemo(() => {
      return selectedItems.length > 0 ? filteredHareketler.filter(h => selectedItems.includes(h.id)) : filteredHareketler;
  }, [filteredHareketler, selectedItems]);

  const modalTotal = useMemo(() => {
    return filteredHareketler.reduce((acc, curr) => curr.type === 'FATURA' ? acc - curr.amount : acc + curr.amount, 0);
  }, [filteredHareketler]);

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  if (loading) return <div className="h-screen bg-[#0B0E14] flex items-center justify-center text-[#BC13FE] font-black uppercase tracking-widest text-xs animate-pulse">Sistem Hazırlanıyor...</div>;

  return (
    <>
      {/* 🖥️ WEB ARAYÜZÜ (Baskı esnasında tamamen gizlenir) */}
      <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-[#BC13FE]/30 overflow-x-hidden relative flex print:hidden">
        
        {/* SIDEBAR */}
        <aside className={`fixed top-0 left-0 h-full w-72 bg-[#0F1219] border-r border-white/5 p-8 flex flex-col z-[70] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-[#BC13FE] rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/30"><Rocket size={22} className="text-white" /></div>
            <span className="text-xl font-black italic uppercase leading-none">Durmaz<span className="text-[#BC13FE]">SaaS</span></span>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto text-gray-500"><X /></button>
          </div>
          
          <nav className="space-y-2 flex-1">
            <Link href={`/portal/${code}`} className="flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white rounded-xl font-bold transition-all"><LayoutDashboard size={20}/> Ana Sayfa</Link>
            <Link href={`/portal/${code}/stores`} className="flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white rounded-xl font-bold transition-all"><Store size={20}/> İşletmeler & Market</Link>
            <Link href={`/portal/${code}/orders`} className="flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white rounded-xl font-bold transition-all"><ShoppingCart size={20}/> Siparişlerim</Link>
            <button className="w-full flex items-center gap-4 px-5 py-4 bg-[#BC13FE]/10 border-l-4 border-[#BC13FE] text-white rounded-r-xl font-bold transition-all shadow-lg"><FileText size={20} className="text-[#BC13FE]" /> Hesap & Faturalar</button>
          </nav>

          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="mt-auto flex items-center gap-4 px-5 py-4 text-red-500/50 hover:text-red-500 rounded-xl font-bold transition-all">
            <LogOut size={20} /> Sistemden Çık
          </button>
        </aside>

        {/* ANA İÇERİK */}
        <main className="flex-1 lg:ml-72 p-6 md:p-10 relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#BC13FE]/5 blur-[120px] rounded-full pointer-events-none -z-10" />
          
          <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-6">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-[#0F1219] rounded-lg border border-white/5"><Menu size={20} /></button>
             <h2 className="text-3xl font-black uppercase italic">Cari Merkez</h2>
          </div>

          <div className="bg-gradient-to-br from-[#0F1219] to-black border border-white/5 rounded-[40px] p-8 md:p-10 mb-10 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-[#BC13FE]/20 text-[#BC13FE] rounded-xl flex items-center justify-center"><Wallet size={20}/></div>
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Ağ Geneli Toplam Borç</h3>
            </div>
            <p className="text-4xl md:text-6xl font-black italic text-white tracking-tighter relative z-10">
              {totalBorc.toLocaleString('tr-TR')} <span className="text-2xl text-gray-500 not-italic">₺</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cariler.map((cari, i) => (
              <div key={i} className="bg-[#0F1219] rounded-[32px] border border-white/5 p-6 hover:border-[#BC13FE]/40 transition-all group shadow-lg flex flex-col justify-between h-full">
                <div>
                    <Building2 className="text-gray-600 mb-6" size={36} />
                    <h4 className="text-lg font-black uppercase text-white mb-6 line-clamp-2 leading-tight">{cari.company_name}</h4>
                </div>
                
                <div className="flex justify-between items-end border-t border-white/5 pt-6 mt-2">
                  <button onClick={() => { setSelectedCari(cari); setSelectedItems([]); setExpandedId(null); }} className="flex items-center gap-2 p-3 bg-[#BC13FE]/10 text-[#BC13FE] rounded-xl hover:bg-[#BC13FE] hover:text-white transition-all group/btn shadow-lg">
                     <FileClock size={20} className="group-hover/btn:scale-110 transition-transform"/>
                     <span className="text-[10px] font-black uppercase tracking-wider">Ekstre Detayı</span>
                  </button>
                  <div className="text-right">
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Cari Bakiye</p>
                      <p className="text-2xl font-black text-white">{cari.balance.toLocaleString('tr-TR')} ₺</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* 🚀 MODAL EKRANI */}
      {selectedCari && (
        <div className="fixed inset-0 z-[100] flex justify-center items-center p-4 print:hidden">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSelectedCari(null)} />
            <div className="relative w-full max-w-5xl h-[90vh] bg-[#0B0E14] border border-[#BC13FE]/30 rounded-[40px] flex flex-col overflow-hidden animate-in zoom-in-95 shadow-2xl">
                
                {/* MODAL BAŞLIK */}
                <div className="p-6 md:p-8 border-b border-white/5 bg-[#0F1219] flex justify-between items-center">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black uppercase italic text-[#BC13FE]">Hesap Hareketleri</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">İşletme: <span className="text-white">{selectedCari.company_name}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => window.print()} className="px-6 py-3 bg-[#BC13FE] text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg hover:bg-purple-600 transition-colors">
                            <Printer size={16}/> {selectedItems.length > 0 ? `Seçilenleri Yazdır (${selectedItems.length})` : 'Tümünü Yazdır'}
                        </button>
                        <button onClick={() => setSelectedCari(null)} className="p-3 bg-white/5 text-gray-400 hover:text-white hover:bg-red-500 rounded-xl transition-all"><X size={20}/></button>
                    </div>
                </div>

                {/* FİLTRELER */}
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#020408] border-b border-white/5">
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-[#0F1219] border border-white/10 rounded-xl p-3 text-[10px] font-black text-white outline-none focus:border-[#BC13FE]">
                        <option value="ALL">TÜM HAREKETLER</option>
                        <option value="FATURA">BORÇ (FATURA)</option>
                        <option value="TAHSİLAT">ÖDEME (TAHSİLAT)</option>
                    </select>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-[#0F1219] border border-white/10 rounded-xl p-3 text-[10px] font-black text-white outline-none [color-scheme:dark]" />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-[#0F1219] border border-white/10 rounded-xl p-3 text-[10px] font-black text-white outline-none [color-scheme:dark]" />
                    <button onClick={() => {setSelectedItems([]); setFilterType('ALL'); setStartDate(''); setEndDate('');}} className="text-[9px] font-black uppercase text-gray-500 hover:text-white transition-colors">Sıfırla</button>
                </div>

                {/* HAREKETLER */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-3">
                    {filteredHareketler.length === 0 ? (
                       <div className="py-20 text-center text-gray-600 font-black uppercase text-xs tracking-widest">Kayıt Bulunamadı</div>
                    ) : filteredHareketler.map((h) => {
                        const hasValidItems = h.items && h.items.length > 0;
                        
                        return (
                        <div key={h.id} className={`border transition-all ${selectedItems.includes(h.id) ? 'border-[#BC13FE] bg-[#BC13FE]/5' : 'border-white/5 bg-[#0F1219]'} rounded-2xl overflow-hidden`}>
                            <div className="p-4 flex items-center justify-between gap-4 cursor-pointer" onClick={() => hasValidItems && setExpandedId(expandedId === h.id ? null : h.id)}>
                                <div className="flex items-center gap-4">
                                    <button onClick={(e) => toggleSelect(e, h.id)} className="text-[#BC13FE] hover:scale-110 transition-transform">
                                        {selectedItems.includes(h.id) ? <CheckSquare size={22} /> : <Square size={22} className="opacity-20 hover:opacity-100" />}
                                    </button>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${h.type === 'FATURA' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                        {h.type === 'FATURA' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase flex items-center gap-2 text-white">
                                            {h.description} 
                                            {hasValidItems && (expandedId === h.id ? <ChevronUp size={14} className="text-[#BC13FE]"/> : <ChevronDown size={14} className="text-gray-500"/>)}
                                        </h4>
                                        <p className="text-[10px] text-gray-500 font-bold mt-1">{h.date_label}</p>
                                    </div>
                                </div>
                                <div className={`text-lg font-black italic ${h.type === 'FATURA' ? 'text-red-500' : 'text-green-500'}`}>
                                    {h.type === 'FATURA' ? '-' : '+'}{h.amount.toLocaleString('tr-TR')} ₺
                                </div>
                            </div>
                            
                            {/* 📦 ÜRÜN DETAY TABLOSU */}
                            {expandedId === h.id && hasValidItems && (
                                <div className="px-14 pb-5 animate-in slide-in-from-top-1">
                                    <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                                        <table className="w-full text-[10px] font-bold uppercase">
                                            <thead>
                                                <tr className="text-gray-500 border-b border-white/10">
                                                    <th className="text-left py-2">Ürün Adı</th>
                                                    <th className="text-center py-2">Miktar</th>
                                                    <th className="text-right py-2">Birim Fiyat</th>
                                                    <th className="text-right py-2">Toplam</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-gray-300">
                                                {h.items?.map((item: any, idx: number) => (
                                                    <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                                        <td className="py-2 pl-2 text-white">{item.name || item.item_name || 'Ürün'}</td>
                                                        <td className="text-center py-2 text-gray-300">{item.qty || item.quantity || item.adet || 1} {item.unit || 'AD'}</td>
                                                        <td className="text-right py-2 text-gray-400">{(item.price || 0).toLocaleString('tr-TR')} ₺</td>
                                                        <td className="text-right py-2 pr-2 font-black text-[#BC13FE]">{((item.qty || item.quantity || item.adet || 1) * (item.price || 0)).toLocaleString('tr-TR')} ₺</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                    })}
                </div>

                <div className="p-8 bg-[#0F1219] border-t border-white/5 flex justify-between items-center">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Listenin Toplam Bakiyesi</p>
                    <p className={`text-2xl md:text-3xl font-black italic ${modalTotal < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {modalTotal.toLocaleString('tr-TR')} ₺
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* 🖨️ SİBER BASKI MOTORU (TİCARİ MANTIK DÜZELTİLDİ) */}
      <div className="hidden print:block bg-white text-black p-8 w-full" id="print-sheet">
          <div className="text-center border-b-2 border-black pb-4 mb-6">
              <h1 className="text-3xl font-black uppercase">DURMAZ SAAS</h1>
              <p className="text-xs font-black tracking-widest mt-1">CARİ HESAP MUTABAKAT BEYANI</p>
              
              <div className="mt-6 flex justify-between text-left bg-gray-100 p-3 rounded-lg border border-gray-300">
                 <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Müşteri / Cari Kodu</p>
                    <p className="font-black text-sm uppercase">{code}</p>
                 </div>
                 <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Mutabakat Yapılan İşletme</p>
                    <p className="font-black text-sm uppercase">{selectedCari?.company_name}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Düzenleme Tarihi</p>
                    <p className="font-black text-sm">{new Date().toLocaleDateString('tr-TR')}</p>
                 </div>
              </div>
          </div>

          <table className="w-full text-left border-collapse">
              <thead>
                  <tr className="border-b-2 border-black text-[11px] uppercase font-black bg-gray-200">
                      <th className="py-2 px-2">Tarih</th>
                      <th className="py-2 px-2">İşlem</th>
                      <th className="py-2 px-2 text-right">Tutar</th>
                  </tr>
              </thead>
              <tbody>
                  {printItems.map((h, i) => (
                      <React.Fragment key={i}>
                          <tr className="border-b border-gray-300">
                              <td className="py-2 px-2 font-bold text-[10px]">{h.date_label}</td>
                              <td className="py-2 px-2 font-black text-[10px] uppercase">{h.description}</td>
                              <td className="py-2 px-2 text-right font-black text-sm">{h.type === 'FATURA' ? '-' : '+'}{h.amount.toLocaleString('tr-TR')} ₺</td>
                          </tr>
                          {/* YAZDIRMA DETAY TABLOSU */}
                          {h.items && h.items.length > 0 && (
                             <tr>
                               <td colSpan={3} className="px-8 py-2 pb-4 bg-gray-50 border-b-2 border-gray-400">
                                  <table className="w-full text-[9px] border-l-2 border-black pl-3">
                                     <thead>
                                        <tr className="text-gray-600 border-b border-gray-300">
                                           <th className="text-left py-1">Ürün</th>
                                           <th className="text-center py-1">Miktar</th>
                                           <th className="text-right py-1">B.Fiyat</th>
                                           <th className="text-right py-1">Ara Toplam</th>
                                        </tr>
                                     </thead>
                                     <tbody>
                                        {h.items.map((it:any, idx:number) => (
                                           <tr key={idx} className="border-b border-gray-200 last:border-0">
                                              <td className="py-1 font-bold uppercase">{it.name || it.item_name || 'Bilinmeyen Ürün'}</td>
                                              <td className="py-1 text-center font-bold">{it.qty || it.quantity || it.adet || 1} {it.unit || 'AD'}</td>
                                              <td className="py-1 text-right">{(it.price || 0).toLocaleString('tr-TR')} ₺</td>
                                              <td className="py-1 text-right font-black">{((it.qty || it.quantity || it.adet || 1) * (it.price || 0)).toLocaleString('tr-TR')} ₺</td>
                                           </tr>
                                        ))}
                                     </tbody>
                                  </table>
                               </td>
                             </tr>
                          )}
                      </React.Fragment>
                  ))}
              </tbody>
          </table>

          {/* 🚀 SİBER YAMA: SADECE MÜŞTERİ ONAY BÖLÜMÜ */}
          <div className="mt-8 pt-4 border-t-2 border-black flex justify-between items-end">
              <div className="w-2/3 pr-8">
                 <p className="text-[10px] font-bold text-gray-600 uppercase leading-relaxed text-justify">
                    Yukarıda dökümü bulunan hesap hareketleri ve güncel bakiye tarafımızca incelenmiş olup, işletmeniz ile olan cari hesabımızın belirtilen bakiye ile mutabık olduğunu beyan ve kabul ederiz.
                 </p>
              </div>
              <div className="w-1/3 text-right">
                  <p className="text-xs font-bold uppercase text-gray-500">Güncel Toplam Bakiye</p>
                  <p className="text-2xl font-black">{selectedCari?.balance.toLocaleString('tr-TR')} ₺</p>
              </div>
          </div>

          <div className="mt-20 flex justify-end px-10">
             <div className="text-center border-t-2 border-black pt-4 px-12 font-black uppercase text-xs">
                Müşteri / Cari Onayı<br/>
                <span className="text-[9px] font-normal text-gray-500 mt-1 block">Yetkili Kaşe ve İmza</span>
             </div>
          </div>
      </div>

      {/* SADECE YAZDIRMA İÇİN CSS KURALLARI */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #BC13FE33; border-radius: 10px; }
        
        @media print {
          @page { margin: 1cm; }
          body { background: white !important; padding: 0 !important; margin: 0 !important; }
          
          /* Web Tarafını Sakla */
          .print\\:hidden { display: none !important; }
          
          /* Baskı Ekranını Göster */
          .print\\:block { display: block !important; }
          
          /* Baskı Bozulmasını Engelle */
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
      `}} />
    </>
  );
}