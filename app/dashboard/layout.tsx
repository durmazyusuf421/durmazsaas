'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Wallet, 
  Menu, 
  X, 
  ShoppingCart
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // 🌟 TEMİZLENMİŞ VE GÜNCELLENMİŞ MENÜ LİSTESİ
  const navItems = [
    { name: 'Ana Sayfa', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Gelen Siparişler', href: '/dashboard/orders', icon: ShoppingCart },
    { name: 'Müşteriler', href: '/dashboard/customers', icon: Users },
    { name: 'Ürünler & Katalog', href: '/dashboard/products', icon: Package },
    { name: 'Faturalar', href: '/dashboard/invoices', icon: FileText },
    { name: 'Kasa & Finans', href: '/dashboard/payments', icon: Wallet }, // Tahsilat ve Giderler burada birleşti!
    { name: 'Ayarlar', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#F4F7FE] overflow-hidden">
      
      {/* 1. MOBİL MENÜ BUTONU */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="bg-white p-3 rounded-full shadow-lg text-[#3063E9] hover:bg-gray-50 active:scale-95 transition-all"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 2. SIDEBAR (SOL MENÜ) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-2xl transition-transform duration-300 ease-in-out border-r border-gray-100
        md:translate-x-0 md:static md:block
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col justify-between p-6">
          
          {/* Logo */}
          <div>
            <div className="flex items-center gap-2 mb-10 px-2">
              <div className="w-10 h-10 bg-[#3063E9] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-blue-500/30 shadow-lg">Y</div>
              <span className="text-2xl font-bold text-[#1B2559]">Yusuf<span className="text-[#3063E9]">Panel</span></span>
            </div>

            {/* Linkler */}
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                      isActive 
                        ? 'bg-[#3063E9] text-white shadow-lg shadow-blue-500/30' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-[#3063E9]'
                    }`}
                  >
                    <item.icon size={20} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Çıkış */}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all font-medium mt-auto"
          >
            <LogOut size={20} />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* 3. ANA İÇERİK ALANI */}
      <main className="flex-1 overflow-y-auto h-full p-4 md:p-8 pt-20 md:pt-8 w-full">
        {/* Mobilde Menü Açıkken Arka Planı Karart */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}
        
        {children}
      </main>
    </div>
  );
}