'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  FileText, 
  LogOut, 
  Loader2, 
  Building2, 
  Store, 
  UserCircle, 
  Rocket, 
  Printer, 
  X, 
  History, 
  CheckCircle2, 
  Barcode 
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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/portal'); return; }

      try {
        // 1. Profil Bilgileri (Global Cari Kodu Üzerinden)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('global_cari_code', code)
          .single();
        if (profileData) setProfile(profileData);

        // 2. Bağlı Toptancılar
        const { data: businesses } = await supabase
          .from('customers')
          .select('id, created_at, company_id, companies(name)')
          .eq('current_cari_code', code);
        if (businesses) setLinkedBusinesses(businesses);

        // 3. Sipariş Geçmişi (Bakiye ve Ekstre Hesaplama İçin)
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_cari_code', code)
          .order('created_at', { ascending: false });
          
        if (orders) {
          const parsedOrders = orders.map(o => {
            let items = [];
            try { items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items; } 
            catch (e) { items = []; }
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
    setStatementModalOpen(true);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F4F7FE] gap-4">
      <Loader2 className="animate-spin text-[#3063E9]" size={48} />
      <p className="text-[#1B2559] font-bold uppercase tracking-widest text-xs">DurmazSaaS Hazırlanıyor...</p>
    </div>
  );

  const statementOrders = selectedBusiness 
    ? allOrders.filter(o => o.company_id === selectedBusiness.company_id && o.status === 'Tamamlandı') 
    : [];

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex font-sans print:bg-white print:p-0">
      
      {/* SOL MENÜ (Sidebar) */}
      <aside className="w-72 bg-[#1B2559] text-white p-8 flex-col justify-between hidden lg:flex fixed h-full shadow-2xl print:hidden">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Rocket className="text-white" size={22} />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic text-white">Durmaz<span className="text-blue-500">SaaS</span></span>
          </div>
          
          <nav className="space-y-3">
            {/* AKTİF SAYFA: ÖZET PANEL */}
            <div className="w-full flex items-center gap-4 px-5 py-4 bg-[#3063E9] text-white rounded-2xl font-bold transition-all shadow-lg cursor-default">
              <LayoutDashboard size={22}/> Özet Panel
            </div>
            
            <Link href={`/portal/${code}/stores`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all group">
               <Store size={22} className="group-hover:text-white" /> Sipariş Ver
            </Link>

            <Link href={`/portal/${code}/orders`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all group">
              <ShoppingBag size={22} className="group-hover:text-white"/> Sipariş & Mutabakat
            </Link>

            {/* YENİ EKLENEN: HIZLI SATIŞ (POS) */}
            <Link href={`/portal/${code}/pos`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all group">
              <Barcode size={22} className="group-hover:text-white"/> Hızlı Satış (POS)
            </Link>
          </nav>
        </div>
        
        <button onClick={handleLogout} className="flex items-center gap-4 px-5 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl font-bold transition-all mt-auto border border-red-500/20">
          <LogOut size={22}/> Güvenli Çıkış
        </button>
      </aside>

      {/* ANA İÇERİK ALANI */}
      <main className="flex-1 lg:ml-72 p-6 md:p-12 print:m-0 print:p-0">
        <div className="max-w-6xl mx-auto space-y-10 print:hidden">
          
          {/* ÜST KARŞILAMA KARTI */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[40px] shadow-sm border border-white gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600">
                <UserCircle size={40} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter leading-none">
                  {profile?.full_name || 'Müşteri'}
                </h1>
                <p className="text-blue-500 font-bold text-xs mt-2 tracking-widest uppercase">Global Cari Kodu: {code}</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Hesap Durumu</span>
              <span className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase border border-green-100">Aktif Kullanıcı</span>
            </div>
          </div>

          {/* İŞ ORTAKLARI LİSTESİ */}
          <div className="space-y-6">
             <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black text-[#1B2559] uppercase tracking-tighter flex items-center gap-3">
                    <Store size={28} className="text-blue-500" /> Toptancı Bakiyelerim
                </h2>
             </div>

             {linkedBusinesses.length === 0 ? (
                <div className="bg-white p-20 rounded-[50px] border-2 border-dashed border-gray-100 text-center">
                    <Store size={48} className="mx-auto text-gray-200 mb-4 opacity-50"/>
                    <h3 className="text-xl font-black text-[#1B2559] uppercase">Henüz bir işletmeye bağlı değilsiniz.</h3>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {linkedBusinesses.map((b, index) => {
                      const balance = calculateBalanceForBusiness(b.company_id);
                      return (
                        <div key={index} className="bg-white p-8 rounded-[40px] shadow-sm hover:shadow-xl transition-all border border-gray-50 flex flex-col justify-between group">
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gray-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                  <Building2 size={24}/>
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-[#1B2559] uppercase leading-tight">{b.companies?.name}</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">İş Ortağı</p>
                                </div>
                            </div>
                            <Link href={`/portal/${code}/store/${b.company_id}`} className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                              <ShoppingBag size={18}/>
                            </Link>
                          </div>
                          
                          <div className="bg-[#F4F7FE] p-6 rounded-[30px] flex items-center justify-between border border-blue-50/50">
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Toplam Borç</p>
                              <p className="text-2xl font-black text-[#1B2559]">{balance.toLocaleString('tr-TR')} ₺</p>
                            </div>
                            <button 
                              onClick={() => openStatement(b)}
                              className="bg-white px-5 py-3 rounded-2xl text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-600 hover:text-white border border-blue-100 transition-all flex items-center gap-2 shadow-sm"
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

        {/* --- YAZDIRILABİLİR EKSTRE MODALI --- */}
        {statementModalOpen && selectedBusiness && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-[#1B2559]/80 backdrop-blur-md print:static print:bg-white print:p-0 print:block">
            <div className="bg-white w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] rounded-none md:rounded-[40px] shadow-2xl flex flex-col print:shadow-none print:w-full print:h-auto overflow-hidden">
              
              {/* Modal Header */}
              <div className="bg-blue-600 p-6 flex justify-between items-center print:hidden shrink-0">
                <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
                  <FileText /> Cari Hesap Ekstresi
                </h2>
                <div className="flex items-center gap-3">
                  <button onClick={() => window.print()} className="bg-white/20 p-2 rounded-xl text-white hover:bg-white/30 transition-all">
                    <Printer size={20} />
                  </button>
                  <button onClick={() => setStatementModalOpen(false)} className="text-white bg-blue-700 p-2 rounded-xl hover:bg-blue-800">
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              {/* Modal Body / Printable Content */}
              <div className="p-10 md:p-16 overflow-y-auto flex-1 bg-white print:p-0 print:overflow-visible custom-scrollbar">
                 <div className="border-b-2 border-gray-200 pb-8 mb-10 flex justify-between items-start">
                    <div>
                      <h1 className="text-4xl font-black text-[#1B2559] uppercase tracking-tighter">{selectedBusiness.companies?.name}</h1>
                      <p className="text-gray-400 font-bold uppercase tracking-widest mt-2 text-xs italic">Cari Hesap Mutabakat Cetveli</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-[#1B2559] uppercase leading-none">{profile?.full_name}</p>
                      <p className="text-xs font-bold text-gray-400 mt-2 uppercase">Cari Kodu: {code}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Belge Tarihi: {new Date().toLocaleDateString('tr-TR')}</p>
                    </div>
                 </div>

                 {/* İşlem Satırları */}
                 <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                      <div className="col-span-3">İşlem Tarihi</div>
                      <div className="col-span-6">İşlem Açıklaması</div>
                      <div className="col-span-3 text-right">Tutar</div>
                    </div>
                    
                    {statementOrders.length === 0 ? (
                      <div className="py-20 text-center border-2 border-dashed border-gray-50 rounded-[30px]">
                        <p className="text-gray-300 font-bold uppercase text-xs">Bu cari hesaba ait onaylanmış işlem bulunamadı.</p>
                      </div>
                    ) : (
                      statementOrders.map((order, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-5 bg-gray-50/50 rounded-2xl text-sm font-bold text-[#1B2559] border border-gray-50">
                          <div className="col-span-3 text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('tr-TR')}</div>
                          <div className="col-span-6 uppercase text-xs tracking-tight">Sipariş Onayı - İşlem No: {order.id.slice(0,8)}</div>
                          <div className="col-span-3 text-right text-blue-600">{order.total_amount.toLocaleString('tr-TR')} ₺</div>
                        </div>
                      ))
                    )}
                 </div>

                 {/* Toplam Bakiye */}
                 <div className="mt-12 pt-8 border-t-2 border-[#1B2559] flex justify-end">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-[0.2em]">Net Borç Bakiyesi</p>
                      <p className="text-5xl font-black text-[#1B2559]">
                        {calculateBalanceForBusiness(selectedBusiness.company_id).toLocaleString('tr-TR')} <span className="text-2xl text-blue-600">₺</span>
                      </p>
                    </div>
                 </div>

                 {/* Alt Not (Sadece Print'te Görünür) */}
                 <div className="hidden print:block mt-20 pt-10 border-t border-gray-100">
                   <p className="text-[9px] text-gray-400 font-medium uppercase text-center tracking-widest">Bu belge DurmazSaaS altyapısı ile otomatik olarak oluşturulmuştur. Mutabakat için lütfen işletme ile iletişime geçiniz.</p>
                 </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}