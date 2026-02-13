import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YusufPanel SaaS",
  description: "Ön Muhasebe ve Yönetim Paneli",
};

// 📱 BU KISIM TELEFONDA DÜZGÜN GÖRÜNMESİNİ SAĞLAR
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      {/* overflow-x-hidden: Sağa taşmayı engeller */}
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}