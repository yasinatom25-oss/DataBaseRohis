"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { mockUsers } from "@/lib/mock-data";
import { BookOpen, Eye, EyeOff, ArrowRight, Lock, User as UserIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      // 1. Try Supabase first
      const { data, error: sbError } = await supabase
        .from("users")
        .select("*, role:roles(*), department:departments(*)")
        .ilike("name", name.trim())
        .single();

      let userToLogin = null;
      if (data && password === "demo123") {
        userToLogin = {
          ...data,
          role: Array.isArray(data.role) ? data.role[0] : data.role,
          department: Array.isArray(data.department) ? data.department[0] : data.department,
        };
      }

      if (userToLogin) {
        localStorage.setItem("rohiser_user", JSON.stringify(userToLogin));
        router.push("/dashboard");
      } else {
        setError("Nama atau password salah. Coba lagi.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan sistem.");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        position: "relative",
        overflowX: "hidden",
        background: "var(--bg-card)",
      }}
    >
      {/* ========== Left panel – Blue gradient ========== */}
      <div
        className="login-left-panel"
        style={{
          flex: "0 0 50%",
          background: "linear-gradient(160deg, #005673 0%, #008CBA 40%, #4db3d1 80%, #80c9de 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 48px",
          position: "relative",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "-60px",
            right: "-60px",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            animation: "float 10s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            left: "-40px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            animation: "float 8s ease-in-out infinite reverse",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "20%",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            animation: "float 12s ease-in-out infinite",
          }}
        />

        {/* Geometric pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M20 0L40 20L20 40L0 20z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "380px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 28px",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <BookOpen size={36} color="white" />
          </div>
          <h1
            style={{
              fontSize: "2.2rem",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              marginBottom: "12px",
            }}
          >
            Rohiser
          </h1>
          <p
            style={{
              fontSize: "0.95rem",
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.6,
              marginBottom: "32px",
            }}
          >
            Sistem Informasi & Manajemen
            <br />
            Amanah Rohis SMAIT Ummul Quro
          </p>

          {/* Feature badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
            {["Mutabaah", "Absensi", "Amanah", "Evaluasi"].map((f) => (
              <span
                key={f}
                style={{
                  padding: "5px 14px",
                  borderRadius: "99px",
                  background: "rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.85)",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ========== Right panel – White login form ========== */}
      <div
        className="login-right-panel"
        style={{
          flex: "0 0 50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          background: "var(--bg-card)",
        }}
      >
        <div
          className="animate-fade-in-up"
          style={{ width: "100%", maxWidth: "380px" }}
        >
          {/* Welcome */}
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--text-main)",
              marginBottom: "4px",
            }}
          >
            Selamat Datang! 👋
          </h2>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--text-muted)",
              marginBottom: "32px",
            }}
          >
            Masuk ke akun Anda untuk melanjutkan
          </p>

          <form onSubmit={handleLogin} id="login-form">
            {/* Email */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="login-name"
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "var(--text-main)",
                  marginBottom: "6px",
                }}
              >
                Nama Lengkap
              </label>
              <div style={{ position: "relative" }}>
                <UserIcon
                  size={16}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
                <input
                  id="login-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Satya Ghazi"
                  required
                  style={{
                    width: "100%",
                    padding: "11px 14px 11px 42px",
                    background: "var(--bg-main)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "10px",
                    color: "var(--text-main)",
                    fontSize: "16px",
                    outline: "none",
                    transition: "all var(--transition-fast)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#008CBA";
                    e.target.style.boxShadow = "0 0 0 3px rgba(0,140,186,0.1)";
                    e.target.style.background = "var(--bg-card)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border-color)";
                    e.target.style.boxShadow = "none";
                    e.target.style.background = "var(--bg-main)";
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: "24px" }}>
              <label
                htmlFor="login-password"
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "var(--text-main)",
                  marginBottom: "6px",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  style={{
                    width: "100%",
                    padding: "11px 44px 11px 42px",
                    background: "var(--bg-main)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "10px",
                    color: "var(--text-main)",
                    fontSize: "16px",
                    outline: "none",
                    transition: "all var(--transition-fast)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#008CBA";
                    e.target.style.boxShadow = "0 0 0 3px rgba(0,140,186,0.1)";
                    e.target.style.background = "var(--bg-card)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border-color)";
                    e.target.style.boxShadow = "none";
                    e.target.style.background = "var(--bg-main)";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "var(--danger-bg)",
                  border: "1px solid var(--danger-border)",
                  borderRadius: "10px",
                  color: "var(--danger-text)",
                  fontSize: "0.8rem",
                  marginBottom: "16px",
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: loading ? "#80c9de" : "#008CBA",
                border: "none",
                borderRadius: "10px",
                color: "#ffffff",
                fontSize: "0.88rem",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all var(--transition-base)",
                boxShadow: loading ? "none" : "0 2px 8px rgba(0,140,186,0.25)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.currentTarget).style.background = "#007aa3";
                  (e.currentTarget).style.transform = "translateY(-1px)";
                  (e.currentTarget).style.boxShadow = "0 4px 16px rgba(0,140,186,0.3)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget).style.background = loading ? "#80c9de" : "#008CBA";
                (e.currentTarget).style.transform = "translateY(0)";
                (e.currentTarget).style.boxShadow = "0 2px 8px rgba(0,140,186,0.25)";
              }}
            >
              {loading ? (
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "var(--bg-card)",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite",
                  }}
                />
              ) : (
                <>
                  Masuk
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>


        </div>
      </div>

      {/* Responsive – Stack on mobile */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .login-left-panel {
            display: none !important;
          }
          .login-right-panel {
            flex: none !important;
            width: 100vw !important;
            max-width: 100vw !important;
            padding: 24px 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
