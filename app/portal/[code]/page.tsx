'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingBag, FileText, LogOut, Loader2, Building2, Store, 
  ChevronRight, Wallet, UserCircle, Rocket, Printer, X, History, CheckCircle2 
} from 'lucide-react';
import Link from 'next/link';

export default function CustomerDashboard() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  
  const [profile, setProfile] = useState<any>(null);
  const [linkedBusinesses, setLinkedBusinesses] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [selectedPrintIds, setSelectedPrintIds] = useState<string[]>([]);
  const [singlePrintId, setSinglePrintId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/portal'); return; }

      try {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('global_cari_code', code).single();
        if (profileData) setProfile(profileData);

        const { data: businesses } = await supabase.from('customers').select('id, created_at, company_id, companies(name)').eq('current_cari_code', code);
        if (businesses) setLinkedBusinesses(businesses);

        const { data: orders } = await supabase.from('orders').select('*').eq('customer_cari_code', code).order('created_at', { ascending: false });
        if (orders) {
          const parsedOrders = orders.map(o => {
            let items = [];
            try { items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items; } catch (e) { items = []; }
            return { ...o, parsed_items: items };
          });
          setAllOrders(parsedOrders);
        }
      } catch (error) {
        console.error("Veri yükleme hatası:", error);
      } finally {
        setLoading(false);
      }
    };

    if (code) fetchDashboardData();
  }, [code, supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/portal');
  };

  const calculateBalanceForBusiness = (companyId: string) => {
    const businessOrders = allOrders.filter(o => o.company_id === companyId && o.status === 'Tamamlandı');
    return businessOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  };

  const openStatement = (business: any) => {
    setSelectedBusiness(business);
    setSelectedPrintIds([]); 
    setSinglePrintId(null);
    setStatementModalOpen(true);
  };

  const toggleSelection = (id: string) => {
    setSelectedPrintIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handlePrintSelected = () => {
    setSinglePrintId(null); 
    setTimeout(() => window.print(), 100);
  };

  const handlePrintAll = () => {
    setSinglePrintId(null);
    setSelectedPrintIds([]); 
    setTimeout(() => window.print(), 100);
  };

  const handlePrintSingle = (id: string) => {
    setSinglePrintId(id);
    setTimeout(() => {
      window.print();
      setSinglePrintId(null); 
    }, 100);
  };

  if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-[#F4F7FE] gap-4"><Loader2 className="animate-spin text-[#3063E9]" size={48} /><p className="text-[#1B2559] font-bold animate-pulse uppercase tracking-widest text-xs">Portala Giriş Yapılıyor...</p></div>;

  const statementOrders = selectedBusiness ? allOrders.filter(o => o.company_id === selectedBusiness.company_id && o.status === 'Tamamlandı') : [];
  const statementTotal = selectedBusiness ? calculateBalanceForBusiness(selectedBusiness.company_id) : 0;

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex font-sans print:bg-white print:p-0">
      
      {/* SOL MENÜ */}
      <aside className="w-72 bg-[#1B2559] text-white p-8 flex-col justify-between hidden lg:flex fixed h-full shadow-2xl print:hidden">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg"><Rocket className="text-white" size={22} /></div>
            <span className="text-2xl font-black tracking-tighter uppercase italic text-white">Durmaz<span className="text-blue-500">SaaS</span></span>
          </div>
          
          <nav className="space-y-3">
            <Link href={`/portal/${code}`} className="w-full flex items-center gap-4 px-5 py-4 bg-[#3063E9] text-white rounded-2xl font-bold transition-all shadow-lg">
              <LayoutDashboard size={22}/> Özet Panel
            </Link>
            
            <Link href={`/portal/${code}/stores`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all group">
               <Store size={22} className="group-hover:text-white" /> Sipariş Ver
            </Link>

            <Link href={`/portal/${code}/orders`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all group">
              <ShoppingBag size={22} className="group-hover:text-white"/> Sipariş & Mutabakat
            </Link>
          </nav>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-4 px-5 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl font-bold transition-all mt-auto border border-red-500/20"><LogOut size={22}/> Güvenli Çıkış</button>
      </aside>

      {/* ANA İÇERİK */}
      <main className="flex-1 lg:ml-72 p-6 md:p-12 print:m-0 print:p-0">
        <div className="max-w-6xl mx-auto space-y-10 print:hidden">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[40px] shadow-sm border border-white gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600"><UserCircle size={40} /></div>
              <div>
                <h1 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter leading-none">{profile?.full_name || 'Müşteri'}</h1>
                <p className="text-blue-500 font-bold text-sm mt-2 tracking-widest uppercase">Global Cari: {code}</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 text-right">Müşteri Durumu</span>
                <span className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-xs font-black uppercase border border-green-100">Aktif Üye</span>
            </div>
          </div>

          <div className="space-y-6">
             <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black text-[#1B2559] uppercase tracking-tighter flex items-center gap-3">
                    <Store size={28} className="text-blue-500" /> B2B İş Ortaklarım ve Bakiyeler
                </h2>
             </div>

             {linkedBusinesses.length === 0 ? (
                <div className="bg-white p-20 rounded-[50px] border-2 border-dashed border-gray-100 text-center">
                    <Store size={48} className="mx-auto text-gray-200 mb-4"/>
                    <h3 className="text-2xl font-black text-[#1B2559] uppercase tracking-tighter">Bağlantı Bulunamadı</h3>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {linkedBusinesses.map((b, index) => {
                      const businessBalance = calculateBalanceForBusiness(b.company_id);
                      return (
                        <div key={index} className="bg-white p-8 rounded-[40px] shadow-sm hover:shadow-xl transition-all border border-gray-50 flex flex-col justify-between group">
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gray-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all"><Building2 size={24}/></div>
                                <div>
                                    <h4 className="text-xl font-black text-[#1B2559] uppercase">{b.companies?.name || 'Toptancı'}</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Kayıt: {new Date(b.created_at).toLocaleDateString('tr-TR')}</p>
                                </div>
                            </div>
                            <Link href={`/portal/${code}/store/${b.company_id}`} className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-colors" title="Sipariş Ver">
                              <ShoppingBag size={18}/>
                            </Link>
                          </div>
                          <div className="bg-[#F4F7FE] p-5 rounded-3xl flex items-center justify-between border border-blue-50/50">
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bu İşletmeye Olan Borcunuz</p>
                              <p className="text-2xl font-black text-[#1B2559]">{businessBalance.toLocaleString('tr-TR')} ₺</p>
                            </div>
                            <button 
                              onClick={() => openStatement(b)}
                              className="bg-white px-5 py-3 rounded-2xl text-xs font-black text-blue-600 uppercase tracking-widest hover:bg-blue-600 hover:text-white border border-blue-100 transition-all flex items-center gap-2 shadow-sm"
                            >
                              <History size={16} /> Ekstre
                            </button>
                          </div>
                        </div>
                      )
                    })}
                </div>
             )}
          </div>
        </div>

        {/* YAZDIRILABİLİR EKSTRE MODALI */}
        {statementModalOpen && selectedBusiness && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-[#1B2559]/80 backdrop-blur-md print:static print:bg-white print:p-0 print:block">
            <div className="bg-white w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] rounded-none md:rounded-[40px] shadow-2xl flex flex-col print:shadow-none print:w-full print:max-w-none print:h-auto">
              
              <div className="bg-blue-600 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 print:hidden md:rounded-t-[40px]">
                <h2 className="text-white font-black uppercase flex items-center gap-3"><FileText /> Cari Hesap Ekstresi</h2>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  {selectedPrintIds.length > 0 && (
                    <button onClick={handlePrintSelected} className="bg-orange-500 text-white px-4 py-2 rounded-xl font-black uppercase text-xs flex items-center gap-2 hover:bg-orange-600 shadow-lg">
                      <Printer size={16}/> Seçili ({selectedPrintIds.length}) Yazdır
                    </button>
                  )}
                  <button onClick={handlePrintAll} className="bg-white text-blue-600 px-4 py-2 rounded-xl font-black uppercase text-xs flex items-center gap-2 hover:bg-blue-50 shadow-lg">
                    <Printer size={16}/> Tümünü Yazdır
                  </button>
                  <button onClick={() => setStatementModalOpen(false)} className="bg-blue-700 text-white p-2 rounded-xl hover:bg-blue-800 ml-auto md:ml-2"><X /></button>
                </div>
              </div>

              <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar flex-1 bg-white print:overflow-visible print:p-0">
                <div className="border-b-2 border-gray-200 pb-8 mb-8 flex justify-between items-start">
                  <div>
                    <h1 className="text-4xl font-black text-[#1B2559] uppercase tracking-tighter">{selectedBusiness.companies?.name}</h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest mt-2 text-xs">Cari Hesap Mutabakat Ekstresi</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-500 uppercase">Müşteri</p>
                    <p className="text-xl font-black text-[#1B2559] uppercase">{profile?.full_name}</p>
                    <p className="text-xs font-bold text-gray-400 mt-1">Cari Kodu: {code}</p>
                    <p className="text-xs font-bold text-gray-400 mt-1">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-2">
                    <h3 className="text-lg font-black text-[#1B2559] uppercase flex items-center gap-2"><History size={20}/> Onaylanmış Fişler / Faturalar</h3>
                    <p className="print:hidden text-[10px] font-bold text-gray-400 uppercase tracking-widest">Yazdırmak istediklerinizi seçin</p>
                  </div>
                  
                  {statementOrders.length === 0 ? (
                    <p className="text-gray-400 font-bold text-center py-10 uppercase text-xs">Bu işletmeyle henüz onaylanmış bir hareketiniz bulunmuyor.</p>
                  ) : (
                    <div className="space-y-6">
                      {statementOrders.map((order) => {
                        const isVisibleInPrint = singlePrintId ? order.id === singlePrintId : (selectedPrintIds.length === 0 || selectedPrintIds.includes(order.id));

                        return (
                          <div key={order.id} className={`border border-gray-200 rounded-2xl p-6 ${!isVisibleInPrint ? 'print:hidden' : 'print:block'} print:border-gray-300 print:break-inside-avoid`}>
                            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                              <div className="flex items-center gap-4">
                                <input 
                                  type="checkbox" 
                                  checked={selectedPrintIds.includes(order.id)}
                                  onChange={() => toggleSelection(order.id)}
                                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 print:hidden cursor-pointer accent-blue-600"
                                />
                                <div>
                                  <p className="font-black text-[#1B2559] uppercase flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> İşlem No: {order.id.slice(0,8)}</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{new Date(order.created_at).toLocaleString('tr-TR')}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <p className="text-xl font-black text-[#1B2559]">{order.total_amount} ₺</p>
                                <button onClick={() => handlePrintSingle(order.id)} className="print:hidden text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 p-2 rounded-xl transition-all" title="Sadece bu fişi yazdır"><Printer size={18} /></button>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-xl print:bg-transparent">
                              <div className="grid grid-cols-12 gap-2 text-[10px] font-black text-gray-400 uppercase mb-2 border-b border-gray-200 pb-2">
                                <div className="col-span-6">Ürün Açıklaması</div>
                                <div className="col-span-3 text-center">Miktar</div>
                                <div className="col-span-3 text-right">Tutar</div>
                              </div>
                              {order.parsed_items?.map((item: any, idx: number) => (
                                <div key={idx} className="grid grid-cols-12 gap-2 text-xs font-bold text-[#1B2559] py-1">
                                  <div className="col-span-6">{item.name}</div>
                                  <div className="col-span-3 text-center">{item.quantity} x {item.price || 0}₺</div>
                                  <div className="col-span-3 text-right text-blue-600">{((item.quantity || 0) * (item.price || 0)).toLocaleString('tr-TR')} ₺</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-12 pt-8 border-t-2 border-[#1B2559] print:mt-8">
                  <div className="w-full md:w-1/2 bg-gray-50 p-6 rounded-3xl border border-gray-200 print:bg-transparent print:border-none print:p-0 text-right">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Toplam Güncel Borç Bakiyesi</p>
                    <p className="text-5xl font-black text-[#1B2559]">{statementTotal.toLocaleString('tr-TR')} <span className="text-2xl text-blue-600">₺</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}