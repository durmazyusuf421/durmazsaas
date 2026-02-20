'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, LogOut, 
  Loader2, Rocket, FileText, Bell, Menu, X, 
  Search, Eye, CheckCircle2, Clock, Truck, Plus, Minus, Trash2, TrendingDown, FileCheck, ReceiptText, ShieldAlert, Printer
} from 'lucide-react';
import Link from 'next/link';

// --- SİBER ZIRH: TYPESCRIPT ARAYÜZLERİ ---
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  defaultUnit: string;
}

interface DbCustomer {
  id: string;
  name: string;
  code: string;
}

interface CartItem {
  product: Product;
  qty: number;
  unit: string;
  customPrice: number;
}

interface TempState {
  qty: number;
  unit: string;
  customPrice: number;
}

interface OrderItem {
  name: string;
  qty: number;
  price: number;
  unit?: string;
}

interface OrderType {
  id: string;
  customer_id: string;
  customer_name: string;
  cari_code: string;
  total_amount: number;
  status: string;
  date: string;
  created_at?: string;
  items: OrderItem[];
  is_invoiced?: boolean;
  invoice_id?: string; // Mutabakat için
  invoice_status?: string; // Mutabakat için
}

// --- SABİT VERİLER (ÜRÜN KATALOGU) ---
const COMPANY_UNITS: string[] = ['AD', 'KG', 'KOLİ', 'LT', 'ÇUVAL'];

const COMPANY_PRODUCTS: Product[] = [
  { id: 'P1', name: 'Premium Espresso Çekirdeği 1KG', price: 850, stock: 124, category: 'Gıda', defaultUnit: 'KG' },
  { id: 'P2', name: 'Karton Bardak 8oz (1000 Adet)', price: 420, stock: 45, category: 'Ambalaj', defaultUnit: 'KOLİ' },
  { id: 'P3', name: 'Temizlik Otomat İlacı 20L', price: 680, stock: 12, category: 'Temizlik', defaultUnit: 'LT' },
  { id: 'P4', name: 'A4 Fotokopi Kağıdı (500 Yaprak)', price: 140, stock: 300, category: 'Kırtasiye', defaultUnit: 'AD' },
  { id: 'P5', name: 'Islak Mendil 100\'lü Paket', price: 45, stock: 500, category: 'Temizlik', defaultUnit: 'KOLİ' },
];

export default function BusinessOrders() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string) || '';
  
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState('Yönetici');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [dbCustomers, setDbCustomers] = useState<DbCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);

  // Buton Yükleme Stateleri
  const [createLoading, setCreateLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // POS State'leri
  const [manualCart, setManualCart] = useState<CartItem[]>([]);
  const [selectedCariForManual, setSelectedCariForManual] = useState('');
  const [manualProductSearch, setManualProductSearch] = useState('');
  const [tempProductStates, setTempProductStates] = useState<Record<string, TempState>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        const { data: profile } = await supabase.from('profiles').select('full_name, company_id').eq('id', user.id).maybeSingle();
        if (profile) setProfileName(profile.full_name || 'Yönetici');

        let myCompany = null;
        const { data: byCode } = await supabase.from('companies').select('id').eq('name', code).maybeSingle();
        
        if (byCode) myCompany = byCode;
        else if (profile?.company_id) {
            const { data: byProfile } = await supabase.from('companies').select('id').eq('id', profile.company_id).maybeSingle();
            myCompany = byProfile;
        }

        if (!myCompany) {
            const { data: first } = await supabase.from('companies').select('id').limit(1).maybeSingle();
            myCompany = first;
        }

        if (myCompany) {
          setCompanyId(myCompany.id);

          const { data: custData } = await supabase.from('customers').select('*').eq('company_id', myCompany.id).order('name', { ascending: true });
          if (custData) setDbCustomers(custData as DbCustomer[]);

          // Fatura durumlarını çeken zırhlı sorgu
          const { data: ordersData } = await supabase
            .from('orders')
            .select(`*, invoices(id, status)`)
            .eq('company_id', myCompany.id)
            .order('created_at', { ascending: false });

          if (ordersData) {
            const formatted = ordersData.map((o: any) => {
              const invoice = o.invoices && o.invoices.length > 0 ? o.invoices[0] : null;
              return {
                id: o.id,
                customer_id: o.customer_id,
                customer_name: o.customer_name,
                cari_code: o.cari_code,
                total_amount: o.total_amount,
                status: o.status,
                date: new Date(o.created_at).toLocaleDateString('tr-TR'),
                items: o.items,
                is_invoiced: !!invoice,
                invoice_id: invoice?.id,
                invoice_status: invoice?.status
              };
            });
            setOrders(formatted);
          }
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, [code, router, supabase]);

  // --- 🚀 AŞAMA 1: ONAYA GÖNDER (Bakiye Düşmez) ---
  const handleSendToApproval = async (order: OrderType) => {
    if (order.is_invoiced || !companyId || !order.customer_id) return;
    
    setActionLoading(order.id);
    try {
      const invoiceNo = `FAT-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;

      const { data: invData, error: invError } = await supabase
        .from('invoices')
        .insert([{
          company_id: companyId,
          customer_id: order.customer_id,
          order_id: order.id,
          invoice_no: invoiceNo,
          total_amount: order.total_amount,
          status: 'Müşteri Onayı Bekliyor'
        }])
        .select();

      if (invError) throw invError;

      setOrders(prev => prev.map(o => o.id === order.id ? { 
          ...o, 
          is_invoiced: true, 
          invoice_id: invData[0].id, 
          invoice_status: 'Müşteri Onayı Bekliyor' 
      } : o));
      
      alert(`🎯 Fatura Onaya Gönderildi! Müşteri onaylayana kadar bakiye düşmeyecektir.`);
    } catch (e: any) {
      alert(`Hata oluştu: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // --- 🚀 AŞAMA 2: MÜŞTERİ ONAYLADI (Bakiye Düşer) ---
  const handleCustomerApproved = async (order: OrderType) => {
    if (!companyId || !order.customer_id || !order.invoice_id) return;
    
    setActionLoading(order.id);
    try {
      const { error: invError } = await supabase.from('invoices').update({ status: 'Ödenmedi' }).eq('id', order.invoice_id);
      if (invError) throw invError;

      const { error: transError } = await supabase.from('transactions').insert([{
          company_id: companyId,
          customer_id: order.customer_id,
          type: 'FATURA',
          amount: order.total_amount,
          description: `Müşteri Onaylı Sipariş Faturası (${order.id})`
      }]);
      if (transError) throw transError;

      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, invoice_status: 'Ödenmedi' } : o));
      alert(`✅ Mutabakat Sağlandı! Müşterinin bakiyesine ${order.total_amount} ₺ borç yansıtıldı.`);
    } catch (e: any) {
      alert(`Onaylama sırasında hata: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getTempState = (pId: string): TempState => {
    const p = COMPANY_PRODUCTS.find(x => x.id === pId);
    return tempProductStates[pId] || { qty: 1, unit: p?.defaultUnit || 'AD', customPrice: p?.price || 0 };
  };

  const updateTempState = (pId: string, field: keyof TempState, val: string | number) => {
    setTempProductStates(prev => ({ ...prev, [pId]: { ...getTempState(pId), [field]: val } }));
  };

  const addToCart = (p: Product) => {
    const ts = getTempState(p.id);
    setManualCart(prev => {
      const existing = prev.findIndex(i => i.product.id === p.id && i.unit === ts.unit && i.customPrice === ts.customPrice);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing].qty += ts.qty;
        return updated;
      }
      return [...prev, { product: p, qty: ts.qty, unit: ts.unit, customPrice: ts.customPrice }];
    });
  };

  const manualCartTotal = manualCart.reduce((acc, curr) => acc + (curr.qty * curr.customPrice), 0);

  const handleCreateManualOrder = async () => {
    if (!selectedCariForManual || manualCart.length === 0 || !companyId) return;
    
    setCreateLoading(true);
    const customer = dbCustomers.find(c => c.id === selectedCariForManual);
    
    const dbOrder = {
      company_id: companyId,
      customer_id: customer?.id,
      customer_name: customer?.name || 'Bilinmeyen',
      cari_code: customer?.code || 'YOK',
      total_amount: manualCartTotal,
      status: 'Yeni',
      items: manualCart.map(c => ({
        name: c.product.name,
        qty: c.qty,
        price: c.customPrice,
        unit: c.unit
      }))
    };

    try {
      const { data, error } = await supabase.from('orders').insert([dbOrder]).select();
      if (error) throw error;

      if (data) {
        const newOrder: OrderType = {
          id: data[0].id,
          customer_id: data[0].customer_id,
          customer_name: data[0].customer_name,
          cari_code: data[0].cari_code,
          total_amount: data[0].total_amount,
          status: data[0].status,
          date: new Date().toLocaleDateString('tr-TR'),
          items: data[0].items,
          is_invoiced: false
        };
        setOrders([newOrder, ...orders]);
      }
      setManualCart([]);
      setSelectedCariForManual('');
      setIsCreateOrderOpen(false);
    } catch (e: any) {
      alert("Sipariş işlenemedi: " + e.message);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-[#3063E9]/30 print:bg-white print:text-black">
      
      {/* SIDEBAR (Yazdırırken Gizlenir) */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-[#0F1219] border-r border-white/5 p-8 flex flex-col z-[70] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 print:hidden`}>
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-[#3063E9] rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20"><Rocket size={22} /></div>
          <span className="text-xl font-black italic uppercase leading-none">Durmaz<span className="text-[#3063E9]">SaaS</span></span>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto text-gray-500"><X /></button>
        </div>
        <nav className="space-y-2 flex-1">
          <Link href={`/portal/${code}/business`} className="flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white rounded-xl font-bold transition-all"><LayoutDashboard size={20}/> Komuta Merkezi</Link>
          <button className="w-full flex items-center gap-4 px-5 py-4 bg-[#3063E9]/10 border-l-4 border-[#3063E9] text-white rounded-r-xl font-bold transition-all"><ShoppingCart size={20} className="text-[#3063E9]" /> Gelen Siparişler</button>
          <Link href={`/portal/${code}/business/products`} className="flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white rounded-xl font-bold transition-all"><Package size={20}/> Ürün Yönetimi</Link>
          <Link href={`/portal/${code}/business/customers`} className="flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white rounded-xl font-bold transition-all"><Users size={20}/> Bayi Ağı</Link>
          <Link href={`/portal/${code}/business/expenses`} className="flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white rounded-xl font-bold transition-all"><TrendingDown size={20}/> Gider Takibi</Link>
        </nav>
      </aside>

      <main className="lg:ml-72 p-6 md:p-10 relative print:hidden">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-[#3063E9]/5 blur-[150px] rounded-full pointer-events-none -z-10" />
        <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-[#0F1219] rounded-lg border border-white/5"><Menu size={20} /></button>
            <h2 className="text-xl md:text-3xl font-black uppercase italic">Sipariş Radarı</h2>
          </div>
          <div className="bg-[#0F1219] p-2 px-4 rounded-2xl border border-white/5 flex items-center gap-3">
            <div className="text-right"><p className="text-[10px] font-black uppercase leading-none">{profileName}</p><p className="text-[8px] text-[#3063E9] font-bold uppercase tracking-widest mt-1">Yönetici</p></div>
            <Users className="text-[#3063E9]" size={20} />
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input type="text" placeholder="Sipariş veya müşteri ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-[#0F1219] border border-white/5 rounded-2xl py-4 pl-12 text-sm text-white outline-none focus:border-[#3063E9]/50 transition-all" />
          </div>
          <button onClick={() => setIsCreateOrderOpen(true)} className="px-8 py-4 bg-[#3063E9] text-white rounded-2xl font-black text-[11px] uppercase shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 hover:scale-105 transition-all"><Plus size={18} /> Yeni Sipariş</button>
        </div>

        <div className="space-y-4">
          {orders.filter(o => (o.customer_name || "").toLowerCase().includes((searchQuery || "").toLowerCase())).map((o, idx) => (
            <div key={idx} className="bg-[#0F1219] border border-white/5 p-5 rounded-3xl flex flex-col md:grid md:grid-cols-12 gap-4 items-center group hover:border-[#3063E9]/30 transition-all relative overflow-hidden">
              
              <div className="md:col-span-4 flex items-center gap-4 w-full relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all 
                    ${o.is_invoiced && o.invoice_status !== 'Müşteri Onayı Bekliyor' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 
                      o.is_invoiced && o.invoice_status === 'Müşteri Onayı Bekliyor' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 
                      'bg-[#3063E9]/10 border-[#3063E9]/20 text-[#3063E9]'}`}
                >
                  {o.is_invoiced && o.invoice_status !== 'Müşteri Onayı Bekliyor' ? <ReceiptText size={20} /> : 
                   o.is_invoiced && o.invoice_status === 'Müşteri Onayı Bekliyor' ? <ShieldAlert size={20} /> : 
                   <ShoppingCart size={20} />}
                </div>
                <div><h3 className="text-sm font-black uppercase line-clamp-1">{o.customer_name}</h3><p className="text-[9px] text-gray-500 font-bold tracking-widest">{o.cari_code}</p></div>
              </div>
              
              <div className="md:col-span-2 w-full font-bold text-gray-400 text-[10px] relative z-10">{o.id}<p className="text-[8px] text-gray-600 mt-1">{o.date}</p></div>
              
              <div className="md:col-span-3 w-full text-center relative z-10">
                {o.is_invoiced && o.invoice_status !== 'Müşteri Onayı Bekliyor' ? (
                  <span className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1 w-max mx-auto"><CheckCircle2 size={10}/> Mutabakat Sağlandı</span>
                ) : o.is_invoiced && o.invoice_status === 'Müşteri Onayı Bekliyor' ? (
                  <span className="px-3 py-1 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1 w-max mx-auto"><Clock size={10}/> Onay Bekliyor</span>
                ) : (
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1 w-max mx-auto">Beklemede</span>
                )}
              </div>
              
              <div className="md:col-span-2 w-full text-right text-lg font-black italic relative z-10">{o.total_amount.toLocaleString('tr-TR')} ₺</div>
              
              <div className="md:col-span-1 w-full flex justify-end gap-2 relative z-10">
                {!o.is_invoiced ? (
                  <button 
                    onClick={() => handleSendToApproval(o)} 
                    disabled={actionLoading === o.id}
                    title="Müşteri Onayına Gönder"
                    className="p-2 bg-[#3063E9]/20 text-[#3063E9] hover:bg-[#3063E9] hover:text-white rounded-xl transition-all disabled:opacity-50"
                  >
                    {actionLoading === o.id ? <Loader2 size={18} className="animate-spin" /> : <FileCheck size={18} />}
                  </button>
                ) : o.is_invoiced && o.invoice_status === 'Müşteri Onayı Bekliyor' ? (
                  <button 
                    onClick={() => handleCustomerApproved(o)} 
                    disabled={actionLoading === o.id}
                    title="Müşteri Onayını Teyit Et ve Bakiyeye İşle"
                    className="p-2 bg-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white rounded-xl transition-all disabled:opacity-50"
                  >
                    {actionLoading === o.id ? <Loader2 size={18} className="animate-spin" /> : <ShieldAlert size={18} />}
                  </button>
                ) : null}

                <button onClick={() => setSelectedOrder(o)} className="p-2 bg-white/5 hover:bg-[#3063E9] rounded-xl transition-all"><Eye size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* POS MEGA DRAWER */}
      {isCreateOrderOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end print:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsCreateOrderOpen(false)} />
          <div className="relative w-full max-w-[1200px] bg-[#0B0E14] border-l border-white/10 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-500">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0F1219]">
              <div><h3 className="text-2xl font-black italic uppercase leading-none">Siber POS Terminali</h3><p className="text-[10px] text-[#3063E9] font-black uppercase tracking-[0.3em] mt-2">Hızlı Satış & Sipariş Modu</p></div>
              <button onClick={() => setIsCreateOrderOpen(false)} className="p-3 bg-white/5 hover:bg-red-500 rounded-2xl transition-all"><X size={24} /></button>
            </div>
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              <div className="lg:w-2/3 flex flex-col border-r border-white/5 bg-[#0F1219]/30 overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-[#0F1219]/50">
                    <input type="text" placeholder="Katalogda ara..." value={manualProductSearch} onChange={e => setManualProductSearch(e.target.value)} className="w-full bg-[#020408] border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-[#3063E9]/50" />
                </div>
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 custom-scrollbar">
                  {COMPANY_PRODUCTS.filter(p => p.name.toLowerCase().includes(manualProductSearch.toLowerCase())).map(p => {
                    const st = getTempState(p.id);
                    return (
                      <div key={p.id} className="bg-[#0F1219] border border-white/5 p-5 rounded-[32px] space-y-4 hover:border-[#3063E9]/40 transition-all shadow-xl group">
                        <div className="flex justify-between items-start">
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-[#3063E9]/30 transition-all"><Package size={24} className="text-gray-500" /></div>
                          <div className="text-right"><p className="text-[8px] font-black text-gray-500 uppercase mb-1">Liste Fiyatı</p><span className="text-sm font-black text-[#3063E9]">{p.price} ₺</span></div>
                        </div>
                        <h4 className="text-xs font-black uppercase h-8 line-clamp-2 leading-tight">{p.name}</h4>
                        <div className="bg-[#020408] p-4 rounded-2xl border border-white/5 space-y-3">
                          <div className="flex gap-2">
                            <div className="flex-1 flex items-center justify-between bg-[#0F1219] p-1 rounded-xl border border-white/5">
                              <button onClick={() => updateTempState(p.id, 'qty', Math.max(1, st.qty - 1))} className="p-1.5 hover:text-[#3063E9] transition-colors"><Minus size={14}/></button>
                              <span className="text-xs font-black">{st.qty}</span>
                              <button onClick={() => updateTempState(p.id, 'qty', st.qty + 1)} className="p-1.5 hover:text-[#3063E9] transition-colors"><Plus size={14}/></button>
                            </div>
                            <select value={st.unit} onChange={e => updateTempState(p.id, 'unit', e.target.value)} className="bg-[#0F1219] border border-white/5 rounded-xl px-3 text-[10px] font-black outline-none uppercase">{COMPANY_UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select>
                          </div>
                          <div className="flex items-center gap-3 bg-[#0F1219] p-2 rounded-xl border border-white/5">
                            <span className="text-[9px] font-black text-gray-500 uppercase pl-1">B.Fiyat:</span>
                            <input type="number" value={st.customPrice} onChange={e => updateTempState(p.id, 'customPrice', Number(e.target.value))} className="bg-transparent w-full text-right text-xs font-black text-[#3063E9] outline-none" />
                          </div>
                        </div>
                        <button onClick={() => addToCart(p)} className="w-full py-4 bg-[#3063E9] text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg active:scale-95"><ShoppingCart size={16}/> Sepete Ekle</button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:w-1/3 flex flex-col bg-[#020408]">
                <div className="p-8 border-b border-white/5">
                  <label className="text-[10px] font-black text-gray-500 uppercase mb-3 block">Müşteri Seçimi</label>
                  <select value={selectedCariForManual} onChange={e => setSelectedCariForManual(e.target.value)} className="w-full bg-[#0F1219] border border-white/10 rounded-2xl p-4 text-xs font-black outline-none focus:border-[#3063E9] uppercase transition-all">
                    <option value="">-- AĞDAN MÜŞTERİ SEÇİNİZ --</option>
                    {dbCustomers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                  {manualCart.map((i, idx) => (
                    <div key={idx} className="bg-[#0F1219]/50 p-4 rounded-2xl relative border border-white/5 group">
                      <h5 className="text-[11px] font-black uppercase text-white leading-tight">{i.product.name}</h5>
                      <div className="flex justify-between items-end mt-2"><div className="text-[9px] font-bold text-gray-500">{i.qty} {i.unit} x {i.customPrice} ₺</div><div className="text-sm font-black italic text-[#3063E9]">{(i.qty * i.customPrice).toLocaleString('tr-TR')} ₺</div></div>
                      <button onClick={() => setManualCart(prev => prev.filter((_, ci) => ci !== idx))} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"><Trash2 size={12}/></button>
                    </div>
                  ))}
                  {manualCart.length === 0 && <div className="h-full flex flex-col items-center justify-center opacity-10"><ShoppingCart size={64} /><p className="text-xs font-black mt-4 uppercase">Fiş Boş</p></div>}
                </div>
                <div className="p-8 border-t border-white/5 bg-[#0F1219]">
                  <div className="flex justify-between items-center mb-6"><div><p className="text-[9px] text-gray-500 uppercase font-black mb-1">Genel Toplam</p><p className="text-4xl font-black italic text-white">{manualCartTotal.toLocaleString('tr-TR')} <span className="text-sm text-[#3063E9] not-italic">₺</span></p></div></div>
                  <button onClick={handleCreateManualOrder} disabled={!selectedCariForManual || manualCart.length === 0 || createLoading} className="w-full py-5 bg-[#3063E9] disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl flex items-center justify-center gap-3 transition-all hover:bg-blue-600 active:scale-95">
                    {createLoading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />} Siparişi Onayla ve İşle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🖨️ SİPARİŞ DETAY VE YAZDIRMA MODALI */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex justify-center items-center p-4 print:static print:p-0 print:block">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm print:hidden" onClick={() => setSelectedOrder(null)} />
          
          <div className="relative w-full max-w-[500px] bg-[#0F1219] border border-white/10 shadow-2xl rounded-[40px] flex flex-col max-h-[90vh] print:max-h-none print:w-full print:border-none print:shadow-none print:bg-white print:text-black print:rounded-none">
            
            <div className="p-6 border-b border-white/5 flex justify-between items-center print:hidden bg-[#0B0E14]">
                <h3 className="text-lg font-black uppercase">Sipariş Ekstresi</h3>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="p-2 bg-[#3063E9]/20 text-[#3063E9] hover:bg-[#3063E9] hover:text-white rounded-xl transition-all"><Printer size={20} /></button>
                    <button onClick={() => setSelectedOrder(null)} className="p-2 bg-white/5 hover:bg-red-500 rounded-xl transition-all"><X size={20} /></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 print:overflow-visible print:p-0 custom-scrollbar">
                
                <div className="text-center mb-8 border-b border-white/10 print:border-black/20 pb-8">
                    <div className="w-16 h-16 bg-[#3063E9] rounded-2xl flex items-center justify-center mx-auto mb-4 print:bg-black print:text-white print:rounded-none"><Rocket size={32} /></div>
                    <h2 className="text-2xl font-black italic uppercase">DURMAZ SAAS</h2>
                    <p className="text-xs text-gray-500 font-bold mt-2 print:text-gray-700">Resmi Sipariş & Fatura Ekstresi</p>
                    <div className="mt-6 flex justify-between text-left text-xs bg-white/5 p-4 rounded-2xl print:bg-transparent print:p-0 print:border-t print:border-black/20 print:pt-4">
                        <div><p className="text-gray-500 uppercase text-[9px] print:text-gray-700">Müşteri</p><p className="font-black uppercase">{selectedOrder.customer_name}</p></div>
                        <div className="text-right"><p className="text-gray-500 uppercase text-[9px] print:text-gray-700">Tarih / No</p><p className="font-black">{selectedOrder.date} <br/> {selectedOrder.id.slice(0,8)}</p></div>
                    </div>
                </div>

                <div className="space-y-3 mb-8">
                    {selectedOrder.items && selectedOrder.items.map((it: OrderItem, i: number) => (
                        <div key={i} className="flex justify-between items-center pb-3 border-b border-white/5 print:border-black/10">
                            <div className="flex-1">
                                <h5 className="text-xs font-black uppercase">{it.name}</h5>
                                <p className="text-[9px] text-gray-500 font-bold print:text-gray-700">{it.qty} {it.unit || 'AD'} x {it.price} ₺</p>
                            </div>
                            <span className="text-sm font-black italic">{(it.qty * it.price).toLocaleString('tr-TR')} ₺</span>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center bg-[#3063E9]/10 p-6 rounded-3xl border border-[#3063E9]/20 print:bg-gray-100 print:border-black/30 print:rounded-none">
                    <p className="text-sm text-[#3063E9] uppercase font-black print:text-black">Genel Toplam</p>
                    <p className="text-3xl font-black italic text-[#3063E9] print:text-black">{selectedOrder.total_amount.toLocaleString('tr-TR')} ₺</p>
                </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(48, 99, 233, 0.2); border-radius: 10px; }
        
        @media print {
          body { background: white !important; color: black !important; }
        }
      `}</style>
    </div>
  );
}