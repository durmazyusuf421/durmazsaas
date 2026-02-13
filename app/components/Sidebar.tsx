'use client';
import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Package, 
  Settings, 
  LogOut,
  Loader2,
  ShieldCheck // Personel yönetimi için yeni ikon
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [permissions, setPermissions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function getPermissions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('permissions')
          .eq('id', user.id)
          .single();
        
        // Eğer veritabanında yetki yoksa boş bir obje ata
        setPermissions(data?.permissions || {});
      }
      setLoading(false);
    }
    getPermissions();
  }, []);

  // MENÜ ELEMANLARI - Personeller buraya eklendi
  const menuItems = [
    { name: 'Ana Sayfa', path: '/dashboard', icon: LayoutDashboard, key: 'ana_sayfa' },
    { name: 'Cari Kartlar', path: '/customers', icon: Users, key: 'cari_kartlar' },
    { name: 'Faturalar', path: '/invoices', icon: FileText, key: 'faturalar' },
    { name: 'Ürünler', path: '/products', icon: Package, key: 'urunler' },
    { name: 'Personeller', path: '/staff', icon: ShieldCheck, key: 'personel_yonetimi' }, // YENİ EKLEDİĞİMİZ SATIR
    { name: 'Ayarlar', path: '/settings', icon: Settings, key: 'ayarlar' },
  ];

  if (loading) {
    return (
      <div className="w-64 bg-slate-900 h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-white w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col p-4 shadow-xl">
      {/* Logo Alanı */}
      <div className="mb-10 px-2">
        <h1 className="text-2xl font-black tracking-tight text-blue-500 uppercase">Durmazsaas</h1>
        <p className="text-xs text-slate-400 font-medium tracking-widest">YÖNETİM PANELİ</p>
      </div>

      {/* Menü Listesi */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          // Sadece yetkisi (true) olan menüleri göster
          if (permissions && permissions[item.key] === true) {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          }
          return null;
        })}
      </nav>

      {/* Çıkış Butonu */}
      <button 
        onClick={() => supabase.auth.signOut().then(() => window.location.href = '/login')}
        className="flex items-center space-x-3 p-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all mt-auto"
      >
        <LogOut size={20} />
        <span className="font-medium">Güvenli Çıkış</span>
      </button>
    </div>
  );
}