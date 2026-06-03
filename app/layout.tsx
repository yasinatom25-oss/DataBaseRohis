import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Rohiser – Sistem Informasi & Manajemen Amanah Rohis",
  description:
    "Platform manajemen organisasi Rohis SMAIT Ummul Quro. Integrasi presensi, mutabaah, amanah, dan evaluasi kinerja.",
  keywords: ["rohis", "manajemen", "organisasi", "mutabaah", "amanah", "presensi"],
};

import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Sidebar />
        {children}
      </body>
    </html>
  );
}
