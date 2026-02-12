import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Durmazsaas Panel",
  description: "Ön Muhasebe Yönetim Sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.className} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100`}>
        <div className="flex min-h-screen">
          {/* Sidebar: Sabit durur, yer kaplamaz (fixed) */}
          <Sidebar /> 
          
          {/* Ana İçerik: Sidebar'ın genişliği (64 birim) kadar soldan boşluk bırakır */}
          <main className="flex-1 ml-64 w-full transition-all duration-300">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}