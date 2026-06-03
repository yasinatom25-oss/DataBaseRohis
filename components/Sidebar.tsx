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
  BarChart3,
  Settings,
  LogOut,
  Users,
} from "lucide-react";
import { User } from "@/lib/types";
import { canViewIkaris } from "@/lib/rbac";

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
      {/* ========== Desktop Sidebar – White & Blue ========== */}
      <aside
        className="sidebar-desktop"
        style={{
          width: "256px",
          minHeight: "100vh",
          background: "transparent",
          border: "none",
          display: "flex",
          flexDirection: "column",
          padding: "24px 16px",
          gap: "16px",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 50,
        }}
      >
        {/* Block 1: Logo */}
        <div className="floating-pill" style={{ display: "flex", justifyContent: "center", padding: "16px 8px" }}>
          <Image src="/logo-original.png" alt="Rohani Islam Logo" width={120} height={120} className="logo-original" style={{ objectFit: "contain", borderRadius: "12px" }} priority />
        </div>

        {/* Menu Utama (Dipisah per item) */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                className="floating-pill"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  fontSize: "0.85rem",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#008CBA" : "var(--text-muted)",
                  background: isActive ? "var(--primary-50)" : "var(--bg-card)",
                  borderLeft: isActive ? "4px solid #008CBA" : "4px solid transparent",
                  textDecoration: "none",
                }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {item.label}
              </Link>
            );
            });
          })()}
        </nav>

        <div style={{ flex: 1 }} /> {/* Spacer */}

        {/* Pengaturan & Profil (Dipisah per item) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {isKetumOrPembina && (
            <Link
              href="/anggota"
              className="floating-pill"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                fontSize: "0.85rem",
                fontWeight: pathname === "/anggota" ? 600 : 500,
                color: pathname === "/anggota" ? "#008CBA" : "var(--text-muted)",
                background: pathname === "/anggota" ? "var(--primary-50)" : "var(--bg-card)",
                borderLeft: pathname === "/anggota" ? "4px solid #008CBA" : "4px solid transparent",
                textDecoration: "none",
              }}
            >
              <Users size={18} />
              Anggota
            </Link>
          )}

          <Link
            href="/settings"
            className="floating-pill"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              fontSize: "0.85rem",
              fontWeight: 500,
              color: "var(--text-muted)",
              textDecoration: "none",
              borderLeft: "4px solid transparent",
            }}
          >
            <Settings size={18} />
            Pengaturan
          </Link>

          {/* User card mini */}
          <div
            className="floating-pill"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              background: "var(--bg-main)",
              marginTop: "4px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #008CBA, #80c9de)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "#ffffff",
                flexShrink: 0,
              }}
            >
              {userInitials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--text-main)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {userName}
              </div>
            </div>
            <Link
              href="/login"
              onClick={() => localStorage.removeItem("rohiser_user")}
              style={{ color: "var(--danger-text)", transition: "all var(--transition-fast)", padding: "4px" }}
              title="Logout"
            >
              <LogOut size={18} />
            </Link>
          </div>
        </div>
      </aside>

      {/* ========== Mobile Navigation Bar ========== */}
      <nav
        className="mobile-nav"
        style={{
          display: "none",
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--bg-main)",
          borderTop: "1px solid var(--border-color)",
          zIndex: 50,
          padding: "10px 16px",
          justifyContent: "space-around",
          alignItems: "center",
          boxShadow: "0 -4px 12px rgba(0,0,0,0.05)",
        }}
      >
        {(() => {
          const items = [...BASE_NAV_ITEMS];
          if (canViewIkaris(safeRole)) {
            items.push({ href: "/ikaris", label: "Ikaris", icon: Wallet });
          }
          return items.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                padding: "4px 12px",
                fontSize: "0.6rem",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#008CBA" : "var(--text-muted)",
                textDecoration: "none",
                transition: "color var(--transition-fast)",
                position: "relative",
              }}
            >
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    top: "-6px",
                    width: "20px",
                    height: "3px",
                    borderRadius: "0 0 3px 3px",
                    background: "#008CBA",
                  }}
                />
              )}
              <Icon size={20} />
              {item.label}
            </Link>
            );
          });
        })()}
      </nav>

      {/* Responsive */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .sidebar-desktop {
            display: none !important;
          }
          .mobile-nav {
            display: flex !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding-bottom: 80px !important;
          }
        }
      `}</style>
    </>
  );
}
