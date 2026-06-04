"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import { Search, Bell, BookOpen, Clock, AlertCircle, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { mockMutabaahHistory } from "@/lib/mock-data";
import { canViewGlobalData, isKadiv, isBPH, formatRoleName } from "@/lib/rbac";
import MutabaahFormModal from "@/components/MutabaahFormModal";
import MutabaahDetailModal from "@/components/MutabaahDetailModal";
import NotificationDropdown from "@/components/NotificationDropdown";
import { supabase } from "@/lib/supabase";
import { verifyUserSession } from "@/lib/auth";

export default function MutabaahPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("personal");
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [myLatestLog, setMyLatestLog] = useState<any>(null);
  const [selectedDetailLog, setSelectedDetailLog] = useState<any>(null);
  const [exportMonth, setExportMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("rohiser_user");
    if (stored) {
      const parsedUser = JSON.parse(stored);
      verifyUserSession(
        parsedUser,
        () => router.push("/login"),
        (updatedUser) => {
          setUser(updatedUser);
          fetchMutabaah(updatedUser);
        }
      );
    } else {
      router.push("/login");
    }
  }, [router]);

  async function fetchMutabaah(currentUser: User) {
    try {
      const { data: deptData } = await supabase.from("departments").select("id, name").order("name");
      if (deptData) setDepartments(deptData);

      const { data, error } = await supabase
        .from("mutabaah_logs")
        .select("*, user:users!user_id(name, department:departments!department_id(name))")
        .order("log_date", { ascending: false });
        
      if (data) {
        setHistory(data.map((d: any) => {
          let totalScore = 0;
          let count = 0;
          
          const standards: Record<number, number | null> = {
            1: 35, 2: 7, 3: 7, 4: 35, 5: 2, 6: 35, 7: 15, 8: null, 9: 7, 10: 7, 11: 7, 12: 1, 13: 1
          };
          
          for (let i = 1; i <= 13; i++) {
            const val = d[`param_${i}_val`] || 0;
            const std = standards[i];
            if (std !== null) {
               const percentage = Math.min(100, (val / std) * 100);
               totalScore += percentage;
               count++;
            }
          }
          const avg = count > 0 ? Math.round(totalScore / count) : 0;
          
          return {
            id: d.id,
            userId: d.user_id,
            name: d.user?.name || "System",
            department: d.user?.department?.name || "BPH",
            date: d.log_date,
            average: avg,
            raw: d
          };
        }));
        
        // Find latest log for current user to enable "Edit" if within same week
        const myLogs = data.filter(d => d.user_id === currentUser.id);
        if (myLogs.length > 0) {
          const latest = myLogs[0];
          const logDate = new Date(latest.log_date);
          const todayDate = new Date();
          const diffTime = Math.abs(todayDate.getTime() - logDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 6) {
            setMyLatestLog(latest);
          } else {
            setMyLatestLog(null);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (!mounted || !user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const handleExportExcel = () => {
    const targetPrefix = exportMonth;
    const dataToExport = history.filter(log => log.date.startsWith(targetPrefix));

    if (dataToExport.length === 0) {
      alert(`Tidak ada data mutabaah untuk bulan ${exportMonth}`);
      return;
    }

    // Sort by department, then by name
    dataToExport.sort((a, b) => {
      const deptA = a.department || "Lainnya";
      const deptB = b.department || "Lainnya";
      if (deptA < deptB) return -1;
      if (deptA > deptB) return 1;
      return a.name.localeCompare(b.name);
    });
    
    // Parameter names for headers
    const paramNames = [
      "Shalat Tepat Waktu", "Shalat Tahajud", "Shalat Duha", "Shalat Rawatib", 
      "Saum Sunnah", "Tilawah", "Tambahan Hafalan", "Capaian Hafalan", 
      "Al-Matsurat Pagi", "Al-Matsurat Sore", "Birrul Walidain", "Infaq", "Menambah Wawasan Islami"
    ];

    const rows = dataToExport.map(log => {
      const row: any = {
        "Tanggal Pengisian": new Date(log.date).toLocaleDateString("id-ID"),
        "Departemen": log.department || "Lainnya",
        "Nama Anggota": log.name,
        "Rata-rata Capaian (%)": log.average,
      };

      // Add all 13 parameters
      for (let i = 1; i <= 13; i++) {
        row[paramNames[i-1]] = log.raw[`param_${i}_val`] || 0;
      }
      row["Keterangan Hafalan"] = log.raw.hafalan_text || "-";
      return row;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    
    // Make columns wider
    const wscols = [
      {wch: 15}, // Tanggal
      {wch: 20}, // Departemen
      {wch: 25}, // Nama
      {wch: 20}, // Rata-rata
      ...Array(13).fill({wch: 20}), // 13 params
      {wch: 40}  // Keterangan
    ];
    ws['!cols'] = wscols;
    
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Mutabaah");
    XLSX.writeFile(wb, `Laporan_Mutabaah_${exportMonth}.xlsx`);
  };

  // Logic: Mutabaah can be filled anytime, limit 1 per week (handled by myLatestLog edit logic)
  const isTimeWindowOpen = true;

  // Filter Data Logic
  const filteredHistory = history.filter((log) => {
    if (activeTab === "personal" && log.userId !== user.id) return false;
    if (activeTab === "divisi" && log.department !== user.department?.name) return false;
    if (activeTab.startsWith("divisi_")) {
      const targetDept = activeTab.replace("divisi_", "");
      if (log.department !== targetDept) return false;
    }
    
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      if (!log.name.toLowerCase().includes(q) && !log.department.toLowerCase().includes(q)) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <main className="main-content min-h-screen bg-[var(--bg-main)]">
        {/* Header */}
        <header className="animate-fade-in-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", position: "relative", zIndex: 100 }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-main)", letterSpacing: "-0.02em" }}>Mutabaah Ibadah</h1>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>Pantau dan catat target ibadah mingguan Anda</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {(canViewGlobalData(user.role.name) || isKadiv(user.role.name)) && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", padding: "4px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", gap: "4px" }}>
                  <select
                    value={exportMonth.split("-")[1] || "01"}
                    onChange={(e) => {
                      const newM = e.target.value;
                      const newY = exportMonth.split("-")[0] || new Date().getFullYear().toString();
                      setExportMonth(`${newY}-${newM}`);
                    }}
                    style={{ border: "none", background: "transparent", outline: "none", fontSize: "0.85rem", color: "var(--text-main)", padding: "4px" }}
                  >
                    <option value="01">Jan</option>
                    <option value="02">Feb</option>
                    <option value="03">Mar</option>
                    <option value="04">Apr</option>
                    <option value="05">Mei</option>
                    <option value="06">Jun</option>
                    <option value="07">Jul</option>
                    <option value="08">Agu</option>
                    <option value="09">Sep</option>
                    <option value="10">Okt</option>
                    <option value="11">Nov</option>
                    <option value="12">Des</option>
                  </select>
                  <select
                    value={exportMonth.split("-")[0] || new Date().getFullYear().toString()}
                    onChange={(e) => {
                      const newY = e.target.value;
                      const newM = exportMonth.split("-")[1] || "01";
                      setExportMonth(`${newY}-${newM}`);
                    }}
                    style={{ border: "none", background: "transparent", outline: "none", fontSize: "0.85rem", color: "var(--text-main)", padding: "4px" }}
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={handleExportExcel}
                  style={{ 
                    display: "flex", alignItems: "center", gap: "6px", 
                    padding: "6px 12px", background: "#10b981", color: "#ffffff", 
                    border: "none", borderRadius: "6px", fontSize: "0.85rem", 
                    fontWeight: 600, cursor: "pointer", transition: "all 0.2s" 
                  }}
                  title="Export data bulan ini ke Excel"
                >
                  <Download size={16} /> Export
                </button>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
              <Search size={15} style={{ color: "var(--text-muted)" }} />
              <input 
                type="text"
                placeholder="Cari anggota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: "none", background: "transparent", outline: "none", fontSize: "0.8rem", color: "var(--text-main)", width: "120px" }}
              />
            </div>
            <NotificationDropdown currentUser={user} />
          </div>
        </header>

        {/* Time Window Card */}
        <div className="solid-card animate-fade-in-up animate-delay-100" style={{ padding: "20px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderLeft: "4px solid #16a34a" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div style={{ padding: "10px", borderRadius: "10px", background: "#dcfce7" }}>
              <Clock size={24} color="#15803d" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "4px" }}>
                Pengisian Mutabaah Dibuka
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {myLatestLog 
                  ? "Anda sudah mengisi mutabaah pekan ini. Anda dapat mengeditnya jika ada kesalahan." 
                  : "Silakan isi mutabaah ibadah Anda untuk pekan ini. (Batas 1 kali pengisian per minggu)"}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ 
              padding: "10px 20px", 
              background: "#008CBA", 
              color: "var(--bg-card)", 
              borderRadius: "8px", 
              border: "none", 
              fontSize: "0.9rem", 
              fontWeight: 600, 
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {myLatestLog ? "Edit Mutabaah Pekan Ini" : "+ Isi Mutabaah Pekan Ini"}
          </button>
        </div>

        {/* Tabs for Data Visibility */}
        {(canViewGlobalData(user.role.name) || isKadiv(user.role.name)) && (
          <div className="animate-fade-in-up animate-delay-200" style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
            <button 
              onClick={() => setActiveTab("personal")}
              style={{ padding: "8px 16px", borderRadius: "8px", border: "none", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", background: activeTab === "personal" ? "#008CBA" : "transparent", color: activeTab === "personal" ? "var(--bg-card)" : "var(--text-muted)", transition: "all 0.2s" }}
            >
              Data Saya
            </button>
            {isBPH(user.role.name) ? (
              <select
                value={activeTab.startsWith("divisi_") ? activeTab : "default"}
                onChange={(e) => setActiveTab(e.target.value)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: activeTab.startsWith("divisi_") ? "#008CBA" : "transparent",
                  color: activeTab.startsWith("divisi_") ? "var(--bg-card)" : "var(--text-muted)",
                  outline: "none"
                }}
              >
                <option value="default" disabled>Data Per Divisi...</option>
                {departments.map(d => (
                  <option key={d.id} value={`divisi_${d.name}`}>{d.name}</option>
                ))}
              </select>
            ) : (
              <button 
                onClick={() => setActiveTab("divisi")}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "none", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", background: activeTab === "divisi" ? "#008CBA" : "transparent", color: activeTab === "divisi" ? "var(--bg-card)" : "var(--text-muted)", transition: "all 0.2s" }}
              >
                Data Divisi ({user.department?.name})
              </button>
            )}
            {canViewGlobalData(user.role.name) && (
              <button 
                onClick={() => setActiveTab("semua")}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "none", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", background: activeTab === "semua" ? "#008CBA" : "transparent", color: activeTab === "semua" ? "var(--bg-card)" : "var(--text-muted)", transition: "all 0.2s" }}
              >
                Data Seluruh Rohis
              </button>
            )}
          </div>
        )}

        {/* Data List */}
        <div className="solid-card animate-fade-in-up animate-delay-300" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "16px" }}>Riwayat Mutabaah</h2>
          {filteredHistory.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>Belum ada data mutabaah yang diisi.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                    <th style={{ padding: "12px", fontWeight: 600 }}>Nama Anggota</th>
                    <th style={{ padding: "12px", fontWeight: 600 }}>Divisi</th>
                    <th style={{ padding: "12px", fontWeight: 600 }}>Tanggal Isi</th>
                    <th style={{ padding: "12px", fontWeight: 600 }}>Pencapaian Rata-rata</th>
                    <th style={{ padding: "12px", fontWeight: 600, textAlign: "right" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((log, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--hover-bg)" }}>
                      <td style={{ padding: "12px", fontWeight: 600, color: "var(--text-main)" }}>{log.name}</td>
                      <td style={{ padding: "12px", color: "var(--text-muted)" }}>{log.department}</td>
                      <td style={{ padding: "12px", color: "var(--text-muted)" }}>{log.date}</td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ flex: 1, height: "6px", background: "var(--hover-bg)", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${log.average}%`, height: "100%", background: log.average >= 80 ? "#16a34a" : log.average >= 50 ? "#008CBA" : "#d97706", borderRadius: "3px" }} />
                          </div>
                          <span style={{ fontWeight: 600, color: "var(--text-main)", width: "40px" }}>{log.average}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <button 
                          onClick={() => setSelectedDetailLog(log)}
                          style={{ padding: "6px 12px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-main)", cursor: "pointer" }}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      
      {isModalOpen && (
        <MutabaahFormModal 
          userId={user.id} 
          existingLog={myLatestLog} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchMutabaah(user);
          }} 
        />
      )}

      {selectedDetailLog && (
        <MutabaahDetailModal 
          log={selectedDetailLog} 
          onClose={() => setSelectedDetailLog(null)} 
        />
      )}
    </div>
  );
}
