"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationDropdown from "@/components/NotificationDropdown";
import type { User } from "@/lib/types";
import { Search, Bell, Settings } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("rohiser_user");
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      router.push("/login");
    }
  }, [router]);

  if (!mounted || !user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      <main className="main-content" style={{ flex: 1, marginLeft: "256px", padding: "24px 28px", minHeight: "100vh", background: "var(--bg-main)" }}>
        {/* Header */}
        <header className="animate-fade-in-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", position: "relative", zIndex: 100 }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-main)", letterSpacing: "-0.02em" }}>Pengaturan Akun</h1>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>Atur preferensi akun dan aplikasi</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "10px", cursor: "pointer" }}>
              <Search size={15} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Cari...</span>
            </div>
            <NotificationDropdown currentUser={user} />
          </div>
        </header>

        {/* Theme Settings */}
        <div className="solid-card animate-fade-in-up animate-delay-100" style={{ padding: "24px", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border-color)" }}>Tampilan & Tema</h2>
          <div style={{ maxWidth: "300px" }}>
            <ThemeToggle />
          </div>
        </div>

        {/* Content Placeholder */}
        <div className="solid-card animate-fade-in-up animate-delay-200" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          <Settings size={48} style={{ color: "#008CBA", opacity: 0.2, margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "8px" }}>Halaman Pengaturan</h2>
          <p style={{ fontSize: "0.85rem" }}>Fitur ganti password dan edit profil sedang dalam tahap pengembangan.</p>
        </div>
      </main>
    </div>
  );
}
