"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@/lib/types";
import { canViewIkaris, canEditIkaris, isBPH } from "@/lib/rbac";
import { Wallet, CheckCircle, XCircle } from "lucide-react";

export default function IkarisPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // States for filter
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  
  const [membersData, setMembersData] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("rohiser_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setCurrentUser(parsed);
      
      if (!canViewIkaris(parsed.role.name)) {
        router.push("/dashboard");
        return;
      }
      
      fetchIkarisData(parsed, currentMonth);
    } else {
      router.push("/login");
    }
  }, [router]);

  async function fetchIkarisData(user: User, monthFilter: string, isBackground = false) {
    if (!isBackground) setLoading(true);
    try {
      // 1. Fetch Users based on role
      let usersQuery = supabase
        .from("users")
        .select("id, name, department_id, department:departments(name), role:roles(name)");

      // If NOT BPH, only fetch users in their department
      if (!isBPH(user.role.name)) {
        usersQuery = usersQuery.eq("department_id", (user as any).department_id || user.department?.id);
      }

      const { data: users, error: uError } = await usersQuery;
      if (uError) throw uError;

      // 2. Fetch Ikaris Records for the selected month
      // Fetch only for the users we got, or just fetch all for the month
      const { data: ikarisRecords, error: iError } = await supabase
        .from("ikaris_records")
        .select("*")
        .eq("month_year", monthFilter);

      if (iError) throw iError;

      // 3. Map records to users
      const mapped = (users || []).map(u => {
        const record = (ikarisRecords || []).find(r => r.user_id === u.id);
        
        // Safety for role/dept aliases
        const rawRole = u.role || (u as any).roles;
        const roleObj = Array.isArray(rawRole) ? rawRole[0] : rawRole;
        const rawDept = u.department || (u as any).departments;
        const deptObj = Array.isArray(rawDept) ? rawDept[0] : rawDept;

        return {
          ...u,
          departmentName: deptObj?.name || "BPH",
          roleName: roleObj?.name || "anggota",
          ikaris_id: record?.id || null,
          status: record?.status || "Belum Bayar",
          paid_at: record?.paid_at || null,
        };
      });
      
      // Sort: Belum Bayar first, then by department
      mapped.sort((a, b) => {
        if (a.status !== b.status) return a.status === "Belum Bayar" ? -1 : 1;
        return a.departmentName.localeCompare(b.departmentName);
      });

      setMembersData(mapped);
    } catch (err: any) {
      console.error(err);
      alert("Gagal memuat data Ikaris: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function togglePaymentStatus(member: any) {
    if (!currentUser || !canEditIkaris(currentUser.role.name)) {
      alert("Anda tidak memiliki akses untuk mengubah status pembayaran.");
      return;
    }

    const newStatus = member.status === "Sudah Bayar" ? "Belum Bayar" : "Sudah Bayar";
    const paidAt = newStatus === "Sudah Bayar" ? new Date().toISOString() : null;

    try {
      if (member.ikaris_id) {
        // Update existing
        const { error } = await supabase
          .from("ikaris_records")
          .update({ status: newStatus, paid_at: paidAt })
          .eq("id", member.ikaris_id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("ikaris_records")
          .insert([{
            user_id: member.id,
            month_year: selectedMonth,
            status: newStatus,
            paid_at: paidAt
          }]);
        if (error) throw error;
      }
      
      // Optimistic update
      setMembersData(prev => prev.map(m => m.id === member.id ? { ...m, status: newStatus } : m));
      
      // Background Refresh
      fetchIkarisData(currentUser, selectedMonth, true);
    } catch (err: any) {
      console.error(err);
      alert("Gagal memperbarui status: " + err.message);
    }
  }

  if (!mounted || !currentUser) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Memuat...</div>;
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSelectedMonth(val);
    fetchIkarisData(currentUser, val);
  };

  const totalMembers = membersData.length;
  const paidMembers = membersData.filter(m => m.status === "Sudah Bayar").length;
  const percentage = totalMembers > 0 ? Math.round((paidMembers / totalMembers) * 100) : 0;
  
  const canEdit = canEditIkaris(currentUser.role.name);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      <main className="main-content fade-in" style={{ flex: 1, marginLeft: "256px", padding: "24px 28px", minHeight: "100vh", background: "var(--bg-main)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "10px" }}>
            <Wallet size={28} color="#008CBA" /> Manajemen Uang Kas (Ikaris)
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>
            {isBPH(currentUser.role.name) 
              ? "Pantau pembayaran uang kas seluruh anggota Rohis." 
              : "Pantau pembayaran uang kas anggota di departemen Anda."}
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <label style={{ fontWeight: 600, color: "var(--text-main)" }}>Pilih Bulan:</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <select
              value={selectedMonth.split("-")[1]}
              onChange={(e) => {
                const newM = e.target.value;
                const newY = selectedMonth.split("-")[0];
                const val = `${newY}-${newM}`;
                setSelectedMonth(val);
                fetchIkarisData(currentUser, val);
              }}
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-card)",
                color: "var(--text-main)",
                outline: "none",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <option value="01">Januari</option>
              <option value="02">Februari</option>
              <option value="03">Maret</option>
              <option value="04">April</option>
              <option value="05">Mei</option>
              <option value="06">Juni</option>
              <option value="07">Juli</option>
              <option value="08">Agustus</option>
              <option value="09">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
            <select
              value={selectedMonth.split("-")[0]}
              onChange={(e) => {
                const newY = e.target.value;
                const newM = selectedMonth.split("-")[1];
                const val = `${newY}-${newM}`;
                setSelectedMonth(val);
                fetchIkarisData(currentUser, val);
              }}
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-card)",
                color: "var(--text-main)",
                outline: "none",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ 
        background: "linear-gradient(135deg, #008CBA 0%, #005f7a 100%)", 
        borderRadius: "16px", 
        padding: "24px", 
        color: "white",
        marginBottom: "24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, opacity: 0.9 }}>Status Terkumpul ({selectedMonth})</h2>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, marginTop: "4px" }}>{paidMembers} <span style={{ fontSize: "1.2rem", fontWeight: 500, opacity: 0.8 }}>/ {totalMembers} Anggota</span></div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "2rem", fontWeight: 800 }}>{percentage}%</div>
          <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>Tingkat Partisipasi</div>
        </div>
      </div>

      <div className="solid-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Memuat data Ikaris...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
              <thead>
                <tr style={{ background: "var(--bg-main)", borderBottom: "1px solid var(--border-color)" }}>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)" }}>NAMA ANGGOTA</th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)" }}>DEPARTEMEN</th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)" }}>STATUS</th>
                  {canEdit && <th style={{ padding: "16px 20px", textAlign: "right", fontSize: "0.85rem", color: "var(--text-muted)" }}>AKSI</th>}
                </tr>
              </thead>
              <tbody>
                {membersData.map(m => (
                  <tr key={m.id} style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.2s" }} className="hover-row">
                    <td style={{ padding: "16px 20px", fontWeight: 500, color: "var(--text-main)" }}>{m.name}</td>
                    <td style={{ padding: "16px 20px", color: "var(--text-muted)", fontSize: "0.9rem" }}>{m.departmentName}</td>
                    <td style={{ padding: "16px 20px" }}>
                      {m.status === "Sudah Bayar" ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#dcfce7", color: "#16a34a", padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 600 }}>
                          <CheckCircle size={14} /> Lunas
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#fee2e2", color: "#ef4444", padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 600 }}>
                          <XCircle size={14} /> Belum
                        </span>
                      )}
                    </td>
                    {canEdit && (
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <button
                          onClick={() => togglePaymentStatus(m)}
                          style={{
                            background: m.status === "Sudah Bayar" ? "transparent" : "#008CBA",
                            color: m.status === "Sudah Bayar" ? "var(--text-muted)" : "white",
                            border: m.status === "Sudah Bayar" ? "1px solid var(--border-color)" : "none",
                            padding: "8px 16px",
                            borderRadius: "8px",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            transition: "all 0.2s"
                          }}
                        >
                          {m.status === "Sudah Bayar" ? "Batalkan" : "Tandai Lunas"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                
                {membersData.length === 0 && (
                  <tr>
                    <td colSpan={canEdit ? 4 : 3} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                      Tidak ada data anggota untuk departemen Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </main>
    </div>
  );
}
