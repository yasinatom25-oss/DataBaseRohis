"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  CalendarCheck,
  BarChart3,
  Settings,
  LogOut,
  Users,
} from "lucide-react";

interface SidebarProps {
  userName: string;
  userRole: string;
  userInitials: string;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mutabaah", label: "Mutabaah", icon: BookOpen },
  { href: "/amanah", label: "Amanah", icon: ClipboardList },
  { href: "/absensi", label: "Absensi", icon: CalendarCheck },
  { href: "/laporan", label: "Laporan", icon: BarChart3 },
];

export default function Sidebar({
  userName,
  userRole,
  userInitials,
}: SidebarProps) {
  const pathname = usePathname();
  const safeRole = userRole || "";
  const isKetumOrPembina = safeRole.toLowerCase().includes("ketua umum") || safeRole.toLowerCase().includes("pembina");

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

        {/* Block 2: Menu Utama */}
        <div className="floating-pill" style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              fontSize: "0.65rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              padding: "0 6px",
            }}
          >
            Menu Utama
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "11px",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    fontSize: "0.85rem",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "#008CBA" : "var(--text-muted)",
                    background: isActive ? "var(--primary-50)" : "transparent",
                    textDecoration: "none",
                    transition: "all var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "var(--hover-bg)";
                      e.currentTarget.style.color = "var(--text-main)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--text-muted)";
                    }
                  }}
                >
                  <Icon size={18} style={{ flexShrink: 0 }} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div style={{ flex: 1 }} /> {/* Spacer */}

        {/* Block 3: Pengaturan & Profil */}
        <div className="floating-pill" style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {isKetumOrPembina && (
            <Link
              href="/anggota"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
                padding: "10px 14px",
                borderRadius: "12px",
                fontSize: "0.85rem",
                fontWeight: pathname === "/anggota" ? 600 : 500,
                color: pathname === "/anggota" ? "#008CBA" : "var(--text-muted)",
                background: pathname === "/anggota" ? "var(--primary-50)" : "transparent",
                textDecoration: "none",
                transition: "all var(--transition-fast)",
              }}
            >
              <Users size={18} />
              Anggota
            </Link>
          )}

          <Link
            href="/settings"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "11px",
              padding: "10px 14px",
              borderRadius: "12px",
              fontSize: "0.85rem",
              fontWeight: 500,
              color: "var(--text-muted)",
              textDecoration: "none",
              transition: "all var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--hover-bg)";
              e.currentTarget.style.color = "var(--text-main)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <Settings size={18} />
            Pengaturan
          </Link>

          {/* User card mini */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px",
              marginTop: "4px",
              borderRadius: "12px",
              background: "var(--bg-main)",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "9px",
                background: "linear-gradient(135deg, #008CBA, #80c9de)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.72rem",
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
                  fontSize: "0.8rem",
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
              <LogOut size={16} />
            </Link>
          </div>
        </div>
      </aside>

      {/* ========== Mobile Bottom Nav – White & Blue ========== */}
      <nav
        className="mobile-nav"
        style={{
          display: "none",
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--bg-card)",
          borderTop: "1px solid var(--border-color)",
          padding: "6px 0 max(6px, env(safe-area-inset-bottom))",
          zIndex: 50,
          justifyContent: "space-around",
          boxShadow: "0 -2px 12px rgba(0,0,0,0.04)",
        }}
      >
        {NAV_ITEMS.map((item) => {
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
        })}
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
