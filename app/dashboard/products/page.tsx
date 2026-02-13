'use client';
import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Plus, Package, X, Loader2, Tag, Layers, Settings, Trash2, Edit, PlusCircle, MinusCircle, Save } from 'lucide-react';

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'definitions'>('products');
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Veriler
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  // Modallar ve Durumlar
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // Hangi ürünü düzenliyoruz?

  // --- FORM VERİLERİ ---
  const [newProduct, setNewProduct] = useState({ 
    name: '', 
    price: '', 
    vat_rate: 20, 
    unit: '', 
    category: '' 
  });
  
  // EK BİRİMLER LİSTESİ
  const [extraUnits, setExtraUnits] = useState<{unit: string, price: string}[]>([]);

  const [newCategory, setNewCategory] = useState('');
  const [newUnit, setNewUnit] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // VERİLERİ ÇEK
  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
    
    if (profile?.company_id) {
      setCompanyId(profile.company_id);

      // Ürünler
      const { data: prodData } = await supabase.from('products').select('*').eq('company_id', profile.company_id).order('created_at', { ascending: false });
      if (prodData) setProducts(prodData);

      // Kategoriler
      const { data: catData } = await supabase.from('product_categories').select('*').eq('company_id', profile.company_id).order('created_at', { ascending: true });
      if (catData) setCategories(catData);

      // Birimler
      const { data: unitData } = await supabase.from('product_units').select('*').eq('company_id', profile.company_id).order('created_at', { ascending: true });
      if (unitData) setUnits(unitData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FORM İŞLEMLERİ (Aç/Kapat/Doldur) ---

  const openNewProductModal = () => {
    setEditingId(null); // Düzenleme modunu kapat
    setNewProduct({ name: '', price: '', vat_rate: 20, unit: '', category: '' }); // Formu temizle
    setExtraUnits([]);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: any) => {
    setEditingId(product.id); // Düzenleme modunu aç (ID'yi kaydet)
    
    // Formu mevcut verilerle doldur (NULL KONTROLÜ EKLENDİ - || '')
    setNewProduct({
      name: product.name || '',
      price: product.price || '',
      vat_rate: product.vat_rate || 20,
      unit: product.unit || '',      // Null gelirse boş yap
      category: product.category || '' // Null gelirse boş yap (HATA ÇÖZÜMÜ)
    });

    // Varsa ek birimleri doldur
    if (product.multi_units && Array.isArray(product.multi_units)) {
      setExtraUnits(product.multi_units);
    } else {
      setExtraUnits([]);
    }

    setIsProductModalOpen(true);
  };

  // --- KAYIT İŞLEMLERİ ---

  const addExtraUnitRow = () => {
    setExtraUnits([...extraUnits, { unit: '', price: '' }]);
  };

  const removeExtraUnitRow = (index: number) => {
    const list = [...extraUnits];
    list.splice(index, 1);
    setExtraUnits(list);
  };

  const updateExtraUnit = (index: number, field: 'unit' | 'price', value: string) => {
    const list = [...extraUnits];
    // @ts-ignore
    list[index][field] = value;
    setExtraUnits(list);
  };

  // Ürün Kaydet (Hem EKLEME hem GÜNCELLEME yapar)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setSaving(true);

    const cleanExtraUnits = extraUnits.filter(item => item.unit !== '' && item.price !== '');
    
    const productData = {
      ...newProduct, 
      company_id: companyId,
      price: parseFloat(newProduct.price),
      vat_rate: Number(newProduct.vat_rate),
      multi_units: cleanExtraUnits
    };

    let error;

    if (editingId) {
      // DÜZENLEME MODU (Update)
      const res = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingId);
      error = res.error;
    } else {
      // YENİ EKLEME MODU (Insert)
      const res = await supabase
        .from('products')
        .insert([productData]);
      error = res.error;
    }

    if (!error) {
      setIsProductModalOpen(false);
      fetchData(); 
    } else {
      alert("Hata: " + error.message);
    }
    setSaving(false);
  };

  // Kategori/Birim Kaydet
  const handleSaveDef = async (table: string, name: string, setter: any) => {
    if (!name.trim() || !companyId) return;
    setSaving(true);
    const { error } = await supabase.from(table).insert([{ name, company_id: companyId }]);
    if (!error) { setter(''); fetchData(); }
    setSaving(false);
  };

  // --- SİLME İŞLEMLERİ ---

  const handleDeleteProduct = async (id: string) => {
    if(!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) alert("Silinemedi: " + error.message);
    else setProducts(products.filter(p => p.id !== id));
  };

  const handleDeleteDef = async (table: string, id: string) => {
    if(!confirm("Silmek istediğine emin misin?")) return;
    await supabase.from(table).delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="space-y-6">
      {/* ÜST BAŞLIK */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#1B2559]">Ürün Yönetimi</h1>
            <p className="text-gray-500 text-sm">Ürünlerinizi düzenleyin veya yeni kalemler ekleyin.</p>
          </div>
          {activeTab === 'products' && (
             <button onClick={openNewProductModal} className="flex items-center gap-2 bg-[#3063E9] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#2552D0] transition-all shadow-lg shadow-blue-500/30">
               <Plus size={20} /> Yeni Ürün Ekle
             </button>
          )}
        </div>

        <div className="flex gap-1 bg-white p-1 rounded-xl w-fit border border-gray-100 shadow-sm">
          <button onClick={() => setActiveTab('products')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>📦 Ürün Listesi</button>
          <button onClick={() => setActiveTab('definitions')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'definitions' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>⚙️ Tanımlamalar</button>
        </div>
      </div>

      {/* --- TAB 1: ÜRÜN LİSTESİ --- */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
          <div className="grid grid-cols-12 gap-4 p-5 border-b border-gray-100 bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <div className="col-span-4">ÜRÜN ADI</div>
            <div className="col-span-3">KATEGORİ</div>
            <div className="col-span-3">FİYATLAR</div>
            <div className="col-span-1">KDV</div>
            <div className="col-span-1 text-right">İŞLEMLER</div>
          </div>

          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package size={40} className="text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-[#1B2559]">Ürün Bulunamadı</h3>
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="grid grid-cols-12 gap-4 p-5 border-b border-gray-50 hover:bg-blue-50/30 transition-colors items-center group">
                <div className="col-span-4 font-bold text-[#1B2559]">{product.name}</div>
                <div className="col-span-3"><span className="bg-orange-50 text-orange-600 px-2 py-1 rounded text-xs font-bold">{product.category}</span></div>
                
                <div className="col-span-3 flex flex-col gap-1">
                  <div className="font-bold text-gray-800">
                    ₺{product.price?.toLocaleString()} <span className="text-xs text-gray-400 font-normal">/ {product.unit}</span>
                  </div>
                  {product.multi_units && Array.isArray(product.multi_units) && product.multi_units.map((mu: any, i: number) => (
                    <div key={i} className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                      ₺{Number(mu.price).toLocaleString()} / {mu.unit}
                    </div>
                  ))}
                </div>

                <div className="col-span-1 font-bold text-gray-600">%{product.vat_rate}</div>
                
                {/* İŞLEM BUTONLARI (DÜZENLE & SİL) */}
                <div className="col-span-1 text-right flex items-center justify-end gap-2">
                  <button 
                    onClick={() => openEditProductModal(product)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Düzenle"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(product.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Sil"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* --- TAB 2: TANIMLAMALAR --- */}
      {activeTab === 'definitions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Kategori Ekleme */}
          <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100">
            <h3 className="font-bold text-[#1B2559] mb-4 flex items-center gap-2"><Layers size={20}/> Kategoriler</h3>
            <div className="flex gap-2 mb-6">
              <input type="text" placeholder="Örn: Gıda, Tekstil..." value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="flex-1 p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-blue-500/20"/>
              <button onClick={() => handleSaveDef('product_categories', newCategory, setNewCategory)} disabled={saving} className="bg-blue-600 text-white px-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">Ekle</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.map(cat => (
                <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl group">
                  <span>{cat.name}</span>
                  <button onClick={() => handleDeleteDef('product_categories', cat.id)}><Trash2 size={16} className="text-gray-300 hover:text-red-500"/></button>
                </div>
              ))}
            </div>
          </div>

          {/* Birim Ekleme */}
          <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100">
            <h3 className="font-bold text-[#1B2559] mb-4 flex items-center gap-2"><Settings size={20}/> Birimler</h3>
            <div className="flex gap-2 mb-6">
              <input type="text" placeholder="Örn: Koli, Kasa, Adet..." value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="flex-1 p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-blue-500/20"/>
              <button onClick={() => handleSaveDef('product_units', newUnit, setNewUnit)} disabled={saving} className="bg-blue-600 text-white px-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">Ekle</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {units.map(unit => (
                <div key={unit.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl group">
                  <span>{unit.name}</span>
                  <button onClick={() => handleDeleteDef('product_units', unit.id)}><Trash2 size={16} className="text-gray-300 hover:text-red-500"/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL (EKLE & DÜZENLE) --- */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1B2559]">
                {editingId ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
              </h2>
              <button onClick={() => setIsProductModalOpen(false)}><X size={24} className="text-gray-500 hover:text-red-500" /></button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Temel Bilgiler</h3>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ürün Adı</label>
                  <input required autoFocus type="text" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full p-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 ring-blue-500/20 font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Fiyat (TL)</label>
                    <input required type="number" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="w-full p-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 ring-blue-500/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Birim</label>
                    <select 
                      required 
                      value={newProduct.unit || ""} 
                      onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})} 
                      className="w-full p-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 ring-blue-500/20"
                    >
                      <option value="">Seçiniz</option>
                      {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Kategori</label>
                      <select 
                        required 
                        value={newProduct.category || ""} 
                        onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} 
                        className="w-full p-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 ring-blue-500/20"
                      >
                        <option value="">Seçiniz</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">KDV (%)</label>
                      <select value={newProduct.vat_rate} onChange={(e) => setNewProduct({...newProduct, vat_rate: Number(e.target.value)})} className="w-full p-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 ring-blue-500/20">
                        <option value={0}>%0</option>
                        <option value={1}>%1</option>
                        <option value={10}>%10</option>
                        <option value={20}>%20</option>
                      </select>
                   </div>
                </div>
              </div>

              {/* EK BİRİMLER */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Alternatif Birimler</h3>
                  <button type="button" onClick={addExtraUnitRow} className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                    <PlusCircle size={16} /> Birim Ekle
                  </button>
                </div>

                {extraUnits.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                    <select 
                      value={item.unit}
                      onChange={(e) => updateExtraUnit(index, 'unit', e.target.value)}
                      className="flex-1 p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-blue-500/20 text-sm"
                    >
                       <option value="">Birim Seç</option>
                       {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                    </select>
                    <input 
                      type="number" 
                      placeholder="Fiyat"
                      value={item.price}
                      onChange={(e) => updateExtraUnit(index, 'price', e.target.value)}
                      className="w-24 p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-blue-500/20 text-sm"
                    />
                    <button type="button" onClick={() => removeExtraUnitRow(index)} className="text-red-400 hover:text-red-600">
                      <MinusCircle size={20} />
                    </button>
                  </div>
                ))}
              </div>

              <button disabled={saving || categories.length === 0 || units.length === 0} className="w-full bg-[#3063E9] text-white py-4 rounded-xl font-bold hover:bg-[#2552D0] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="animate-spin" /> : editingId ? <Save size={20} /> : <Plus size={20} />}
                {saving ? "İşleniyor..." : editingId ? "Değişiklikleri Kaydet" : "Ürünü Kaydet"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}