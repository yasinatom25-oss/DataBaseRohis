"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  CalendarCheck,
  Wallet,
  Settings,
  LogOut,
  Users,
  Search,
} from "lucide-react";
import { User } from "@/lib/types";
import { canViewIkaris } from "@/lib/rbac";
import NotificationDropdown from "./NotificationDropdown";

const BASE_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mutabaah", label: "Mutabaah", icon: BookOpen },
  { href: "/amanah", label: "Amanah", icon: ClipboardList },
  { href: "/absensi", label: "Absensi", icon: CalendarCheck },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("rohiser_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, [pathname]);

  if (pathname === "/login" || pathname === "/") return null;
  if (!user) return null;

  const safeRole = typeof user.role === 'string' ? user.role : (user.role?.name || user.role?.label || "");
  const safeRoleLower = safeRole.toLowerCase();
  const isKetumOrPembina = safeRoleLower.includes("ketua umum") || safeRoleLower.includes("ketua_umum") || safeRoleLower.includes("pembina");

  const userName = user.name;
  const userInitials = userName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <>
      {/* ========== Desktop Sidebar ========== */}
      <aside className="sidebar-desktop fixed top-0 left-0 w-64 min-h-screen bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col p-6 gap-6 z-50">
        
        {/* Block 1: Logo & Branding */}
        <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm gap-3">
          <Image 
            src="/logo-original.png" 
            alt="Rohani Islam Logo" 
            width={72} 
            height={72} 
            className="object-contain rounded-xl" 
            priority 
          />
          <div className="text-center">
            <h1 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg leading-tight">
              Rohani Islam
            </h1>
            <p className="text-[0.65rem] font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
              Let's return to the right way
            </p>
          </div>
        </div>

        {/* Menu Utama */}
        <nav className="flex flex-col gap-2">
          {(() => {
            const items = [...BASE_NAV_ITEMS];
            if (canViewIkaris(safeRole)) {
              items.push({ href: "/ikaris", label: "Ikaris (Uang Kas)", icon: Wallet });
            }
            return items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 border ${
                    isActive 
                      ? "font-bold text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 shadow-sm" 
                      : "font-medium text-slate-600 bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800/80 shadow-sm"
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  {item.label}
                </Link>
              );
            });
          })()}
        </nav>

        <div className="flex-1" /> {/* Spacer */}

        {/* Pengaturan & Profil */}
        <div className="flex flex-col gap-2">
          {isKetumOrPembina && (
            <Link
              href="/anggota"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 border ${
                pathname === "/anggota"
                  ? "font-bold text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 shadow-sm" 
                  : "font-medium text-slate-600 bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800/80 shadow-sm"
              }`}
            >
              <Users size={18} />
              Anggota
            </Link>
          )}

          <Link
            href="/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 border font-medium text-slate-600 bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600 shadow-sm`}
          >
            <Settings size={18} />
            Pengaturan
          </Link>

          {/* User card mini */}
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm mt-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                {userName}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {safeRole}
              </div>
            </div>
            <Link
              href="/login"
              onClick={() => localStorage.removeItem("rohiser_user")}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </Link>
          </div>
        </div>
      </aside>

      {/* ========== Mobile Top Header ========== */}
      <div className="mobile-header fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-50 px-5 flex justify-between items-center hidden">
        <div className="flex items-center gap-3">
          <Image src="/logo-original.png" alt="Logo" width={32} height={32} className="rounded-lg" />
          <div className="flex flex-col">
            <span className="font-extrabold text-[1.1rem] text-slate-800 dark:text-slate-100 leading-none">Rohani Islam</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Search size={20} className="text-slate-500 dark:text-slate-400 cursor-pointer" />
          <NotificationDropdown currentUser={user} />
          <Link href="/settings" className="text-slate-500 dark:text-slate-400">
            <Settings size={22} />
          </Link>
          <Link href="/login" onClick={() => localStorage.removeItem("rohiser_user")} className="text-red-500">
            <LogOut size={22} />
          </Link>
        </div>
      </div>

      {/* ========== Mobile Navigation Bar ========== */}
      <nav className="mobile-nav fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 px-4 py-2 flex justify-around items-center shadow-[0_-4px_12px_rgba(0,0,0,0.05)] hidden pb-safe">
        {(() => {
          const items = [...BASE_NAV_ITEMS];
          if (canViewIkaris(safeRole)) {
            items.push({ href: "/ikaris", label: "Ikaris", icon: Wallet });
          }
          return (
            <>
              {items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative flex flex-col items-center gap-1 p-2"
                  >
                    {isActive && (
                      <div className="absolute -top-2 w-8 h-1 rounded-b-full bg-blue-500" />
                    )}
                    <Icon size={22} className={isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"} />
                    <span className={`text-[0.65rem] ${isActive ? "font-bold text-blue-600 dark:text-blue-400" : "font-medium text-slate-400 dark:text-slate-500"}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </>
          );
        })()}
      </nav>

      {/* Responsive Styles (hiding elements based on viewport) */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .sidebar-desktop {
            display: none !important;
          }
          .mobile-nav {
            display: flex !important;
          }
          .mobile-header {
            display: flex !important;
          }
        }
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .pb-safe {
            padding-bottom: calc(10px + env(safe-area-inset-bottom)) !important;
          }
        }
      `}</style>
    </>
  );
}
