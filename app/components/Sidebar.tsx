'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase'; 
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Building2,
  Package // <--- YENİ İKON BURADA
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [companyName, setCompanyName] = useState('Yükleniyor...');
  
  useEffect(() => {
    async function getCompanyName() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('companies(name)')
        .eq('id', user.id)
        .single();

      const companyData: any = profile?.companies;
      
      if (companyData?.name) {
        setCompanyName(companyData.name);
      } else {
        setCompanyName('Durmazsaas');
      }
    }

    getCompanyName();
  }, []);

  const menuItems = [
    { name: 'Ana Sayfa', href: '/', icon: LayoutDashboard },
    { name: 'Cari Kartlar', href: '/cariler', icon: Users },
    { name: 'Faturalar', href: '/faturalar', icon: FileText },
    { name: 'Ürünler', href: '/urunler', icon: Package }, // <--- YENİ LİNK BURADA
    { name: 'Ayarlar', href: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col border-r border-slate-800 z-50">
      
      {/* Logo Alanı */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
          <Building2 size={24} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-sm tracking-tight leading-tight text-white">
            {companyName}
          </h2>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Yönetim Paneli</p>
        </div>
      </div>

      {/* Menü Linkleri */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Çıkış Butonu */}
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-xl transition-all text-sm font-bold"
        >
          <LogOut size={20} />
          Güvenli Çıkış
        </button>
      </div>
    </aside>
  );
}