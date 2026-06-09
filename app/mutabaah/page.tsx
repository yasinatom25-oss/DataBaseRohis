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
  const [userLogs, setUserLogs] = useState<any[]>([]);
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

        const getMonday = (d: Date) => {
          const date = new Date(d);
          const day = date.getDay();
          const diff = date.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(date.setDate(diff));
          const yyyy = monday.getFullYear();
          const mm = String(monday.getMonth() + 1).padStart(2, '0');
          const dd = String(monday.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        };

        const currentMondayStr = getMonday(new Date());

        const myLogs = data.filter((d: any) => d.user_id === currentUser.id);
        setUserLogs(myLogs);
        const currentWeekLog = myLogs.find((l: any) => getMonday(new Date(l.log_date)) === currentMondayStr);

        if (currentWeekLog) {
          setMyLatestLog(currentWeekLog);
        } else {
          setMyLatestLog(null);
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
        row[paramNames[i - 1]] = log.raw[`param_${i}_val`] || 0;
      }
      row["Keterangan Hafalan"] = log.raw.hafalan_text || "-";
      return row;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Make columns wider
    const wscols = [
      { wch: 15 }, // Tanggal
      { wch: 20 }, // Departemen
      { wch: 25 }, // Nama
      { wch: 20 }, // Rata-rata
      ...Array(13).fill({ wch: 20 }), // 13 params
      { wch: 40 }  // Keterangan
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
    <div className="min-h-screen bg-bg-canvas">
      <main className="main-content min-h-screen bg-bg-canvas">
        {/* Header */}
        <header className="animate-fade-in-up flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-50 w-full" style={{ marginBottom: "28px" }}>
          <div>
            <h1 className="text-2xl font-bold text-text-main tracking-tight">Mutabaah Ibadah</h1>
            <p className="text-sm text-text-muted mt-1">Pantau dan catat target ibadah mingguan Anda</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {(canViewGlobalData(user.role.name) || isKadiv(user.role.name)) && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto bg-bg-surface p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex gap-2 flex-1">
                  <select
                    value={exportMonth.split("-")[1] || "01"}
                    onChange={(e) => {
                      const newM = e.target.value;
                      const newY = exportMonth.split("-")[0] || new Date().getFullYear().toString();
                      setExportMonth(`${newY}-${newM}`);
                    }}
                    className="form-select"
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
                    className="form-select"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleExportExcel}
                  style={{ padding: "8px 16px", background: "#10b981", color: "#ffffff", borderRadius: "8px", border: "none", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}
                  title="Export data bulan ini ke Excel"
                >
                  <Download size={14} /> Export
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 h-[38px] bg-bg-surface border border-slate-200 dark:border-slate-700 rounded-lg w-full md:w-64">
              <Search size={16} className="text-text-muted shrink-0" />
              <input
                type="text"
                placeholder="Cari anggota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-text-main w-full placeholder:text-text-muted h-full"
              />
            </div>
            <div className="hidden md:block">
              <NotificationDropdown currentUser={user} />
            </div>
          </div>
        </header>
        <div className="flex flex-col gap-5">
          {/* Time Window Card */}
          <div className="solid-card animate-fade-in-up animate-delay-100" style={{ padding: "24px" }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-[#dcfce7] shrink-0">
                  <Clock size={24} color="#15803d" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-main mb-1">
                    Pengisian Mutabaah Dibuka
                  </h2>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {myLatestLog
                      ? "Anda sudah mengisi mutabaah pekan ini. Anda dapat mengeditnya jika ada kesalahan."
                      : "Silakan isi mutabaah ibadah Anda untuk pekan ini. (Batas 1 kali pengisian per minggu)"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                style={{ padding: "8px 16px", background: "#008CBA", color: "#ffffff", borderRadius: "8px", border: "none", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                className="w-full md:w-auto mt-2 md:mt-0"
              >
                Isi / Edit Mutabaah
              </button>
            </div>
          </div>

          {/* Tabs for Data Visibility */}
          {(canViewGlobalData(user.role.name) || isKadiv(user.role.name)) && (
            <div className="animate-fade-in-up animate-delay-200 flex flex-wrap gap-3">
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
                  className="form-select"
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
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto w-full">
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left", minWidth: "600px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                        <th className="whitespace-nowrap" style={{ padding: "12px", fontWeight: 600 }}>Nama Anggota</th>
                        <th className="whitespace-nowrap" style={{ padding: "12px", fontWeight: 600 }}>Divisi</th>
                        <th className="whitespace-nowrap" style={{ padding: "12px", fontWeight: 600 }}>Tanggal Isi</th>
                        <th className="whitespace-nowrap" style={{ padding: "12px", fontWeight: 600 }}>Pencapaian Rata-rata</th>
                        <th className="whitespace-nowrap" style={{ padding: "12px", fontWeight: 600, textAlign: "right" }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((log, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--hover-bg)" }}>
                          <td className="whitespace-nowrap" style={{ padding: "12px", fontWeight: 600, color: "var(--text-main)" }}>{log.name}</td>
                          <td className="whitespace-nowrap" style={{ padding: "12px", color: "var(--text-muted)" }}>{log.department}</td>
                          <td className="whitespace-nowrap" style={{ padding: "12px", color: "var(--text-muted)" }}>{log.date}</td>
                          <td className="whitespace-nowrap" style={{ padding: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "150px" }}>
                              <div style={{ flex: 1, height: "6px", background: "var(--hover-bg)", borderRadius: "3px", overflow: "hidden" }}>
                                <div style={{ width: `${log.average}%`, height: "100%", background: log.average >= 80 ? "#16a34a" : log.average >= 50 ? "#008CBA" : "#d97706", borderRadius: "3px" }} />
                              </div>
                              <span style={{ fontWeight: 600, color: "var(--text-main)", width: "40px" }}>{log.average}%</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap" style={{ padding: "12px", textAlign: "right" }}>
                            <button
                              onClick={() => setSelectedDetailLog(log)}
                              style={{ padding: "6px 12px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-main)", cursor: "pointer", whiteSpace: "nowrap" }}
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden flex flex-col">
                  {filteredHistory.map((log, idx) => (
                    <div key={idx} className="py-6 border-b border-slate-200 dark:border-slate-700 last:border-0 flex flex-col gap-4.5 -mx-4 px-4 sm:-mx-6 sm:px-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-text-main text-[1.05rem] leading-snug mb-1.5">{log.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-text-muted font-medium">
                            <span>{log.department}</span>
                            <span>•</span>
                            <span>{log.date}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span style={{ fontSize: "1.1rem", fontWeight: 800, color: log.average >= 80 ? "#16a34a" : log.average >= 50 ? "#008CBA" : "#d97706" }}>
                            {log.average}%
                          </span>
                          <span className="text-[0.65rem] text-text-muted uppercase tracking-wider mt-[-2px]">Capaian</span>
                        </div>
                      </div>

                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => setSelectedDetailLog(log)}
                          className="w-full flex justify-center items-center"
                          style={{ padding: "14px 20px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", cursor: "pointer" }}
                        >
                          Lihat Detail Mutabaah
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <MutabaahFormModal
          userId={user.id}
          userLogs={userLogs}
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
