"use client";

import React from "react";
import Link from "next/link";
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
          background: "var(--bg-card)",
          borderRight: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          padding: "20px 14px",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 50,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "4px 8px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "11px",
              background: "linear-gradient(135deg, #008CBA, #4db3d1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              fontWeight: 800,
              color: "#ffffff",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(0,140,186,0.25)",
            }}
          >
            R
          </div>
          <div>
            <div
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "var(--text-main)",
                letterSpacing: "-0.01em",
              }}
            >
              Rohiser
            </div>
            <div
              style={{
                fontSize: "0.62rem",
                color: "var(--text-muted)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              SMAIT Ummul Quro
            </div>
          </div>
        </div>

        {/* Section label */}
        <div
          style={{
            fontSize: "0.65rem",
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            padding: "0 10px",
            marginBottom: "8px",
          }}
        >
          Menu Utama
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
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
                  padding: "10px 12px",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: isActive ? 600 : 450,
                  color: isActive ? "#008CBA" : "var(--text-muted)",
                  background: isActive ? "var(--primary-50)" : "transparent",
                  textDecoration: "none",
                  transition: "all var(--transition-fast)",
                  position: "relative",
                  borderLeft: isActive ? "3px solid #008CBA" : "3px solid transparent",
                }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div
          style={{
            borderTop: "1px solid var(--border-color)",
            paddingTop: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {isKetumOrPembina && (
            <Link
              href="/anggota"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
                padding: "10px 12px",
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: pathname === "/anggota" ? 600 : 450,
                color: pathname === "/anggota" ? "#008CBA" : "var(--text-muted)",
                background: pathname === "/anggota" ? "var(--primary-50)" : "transparent",
                textDecoration: "none",
                transition: "all var(--transition-fast)",
                borderLeft: pathname === "/anggota" ? "3px solid #008CBA" : "3px solid transparent",
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
              padding: "10px 12px",
              borderRadius: "10px",
              fontSize: "0.85rem",
              fontWeight: 450,
              color: "var(--text-muted)",
              textDecoration: "none",
              transition: "all var(--transition-fast)",
              borderLeft: "3px solid transparent",
            }}
          >
            <Settings size={18} />
            Pengaturan
          </Link>

          {/* User card */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              marginTop: "8px",
              borderRadius: "10px",
              background: "var(--bg-main)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
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
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                {userRole}
              </div>
            </div>
            <Link
              href="/login"
              onClick={() => localStorage.removeItem("rohiser_user")}
              style={{ color: "var(--text-muted)", transition: "color var(--transition-fast)" }}
              title="Logout"
            >
              <LogOut size={15} />
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
