"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import {
  mockTasks,
} from "@/lib/mock-data";
import ProgressBar from "@/components/ProgressBar";
import AmanahList from "@/components/AmanahList";
import AttendancePieChart from "@/components/AttendancePieChart";
import EditTaskModal from "@/components/EditTaskModal";
import NotificationDropdown from "@/components/NotificationDropdown";
import {
  TrendingUp,
  ClipboardList,
  CalendarCheck,
  BookOpen,
  Search,
  Star,
  TrendingDown
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatRoleName } from "@/lib/rbac";
import { verifyUserSession } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<any[]>(mockTasks);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const [attendanceStats, setAttendanceStats] = useState({ hadir: 0, izin: 0, sakit: 0, alpa: 0, total: 0, percentage: 0 });
  const [mutabaahStats, setMutabaahStats] = useState<any[]>([]);
  const [mutabaahAverage, setMutabaahAverage] = useState(0);
  const [mutabaahTimeframe, setMutabaahTimeframe] = useState<"pekan" | "bulan">("pekan");
  const [rawMutabaahLogs, setRawMutabaahLogs] = useState<any[]>([]);
  const [trenIbadah, setTrenIbadah] = useState({ status: "Konsisten", sub: "Masih stabil minggu ini", trendUp: true });
  const [ikarisStatus, setIkarisStatus] = useState<"Sudah Bayar" | "Belum Bayar" | null>(null);
  const [nilaiBulanan, setNilaiBulanan] = useState<any | null>(null);
  const [prevNilaiBulanan, setPrevNilaiBulanan] = useState<any | null>(null);

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
          fetchDashboardData(updatedUser);
        }
      );
    } else {
      router.push("/login");
    }
  }, [router]);

  async function fetchDashboardData(currentUser: User) {
    try {
      // 1. Fetch Tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*, assigner:users!assigner_id(name), assignee:users!assignee_id(name)")
        .eq("assignee_id", currentUser.id);
      
      if (tasksData && tasksData.length > 0) {
        setTasks(tasksData.map((d: any) => ({
          id: d.id,
          title: d.title,
          description: d.description,
          status: d.status,
          deadline: d.deadline,
          assigneeId: d.assignee_id,
          assignerId: d.assigner_id,
          assignerName: d.assigner?.name || "System",
          assigneeName: d.assignee?.name || "Anggota",
        })));
      } else {
        setTasks([]);
      }

      // 2. Fetch Attendance
      const { data: attData } = await supabase
        .from("attendance_records")
        .select("status")
        .eq("user_id", currentUser.id);

      let hadir = 0, izin = 0, sakit = 0, alpa = 0;
      (attData || []).forEach(r => {
        if (r.status === "Hadir") hadir++;
        else if (r.status === "Izin") izin++;
        else if (r.status === "Sakit") sakit++;
        else if (r.status === "Alpa") alpa++;
      });
      const total = hadir + izin + sakit + alpa;
      const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;
      setAttendanceStats({ hadir, izin, sakit, alpa, total, percentage });

      // 3. Fetch Mutabaah Logs for current month
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const { data: logsData } = await supabase
        .from("mutabaah_logs")
        .select("*")
        .eq("user_id", currentUser.id)
        .gte("log_date", firstDay)
        .order("log_date", { ascending: false });

      setRawMutabaahLogs(logsData || []);

      // 5. Tren Ibadah Simple Check
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      let lastWeekSum = 0, prevWeekSum = 0;
      (logsData || []).forEach((log: any) => {
        const d = new Date(log.log_date);
        let sum = 0;
        for (let i = 1; i <= 13; i++) sum += (log[`param_${i}_val`] || 0);
        
        if (d >= oneWeekAgo) {
          lastWeekSum += sum;
        } else if (d >= twoWeeksAgo && d < oneWeekAgo) {
          prevWeekSum += sum;
        }
      });

      if (lastWeekSum > prevWeekSum * 1.1) {
        setTrenIbadah({ status: "Meningkat", sub: "Lebih baik dari minggu lalu!", trendUp: true });
      } else if (lastWeekSum < prevWeekSum * 0.9) {
        setTrenIbadah({ status: "Menurun", sub: "Kurang dari minggu lalu", trendUp: false });
      } else {
        setTrenIbadah({ status: "Konsisten", sub: "Masih stabil minggu ini", trendUp: true });
      }

      // 6. Fetch Ikaris Status
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
      const { data: ikarisData } = await supabase
        .from("ikaris_records")
        .select("status")
        .eq("user_id", currentUser.id)
        .eq("month_year", currentMonth)
        .maybeSingle();
      
      setIkarisStatus(ikarisData?.status || "Belum Bayar");

      // 7. Fetch Nilai Bulanan
      const { data: nilaiData } = await supabase
        .from("monthly_assessments")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("month_year", currentMonth)
        .maybeSingle();
      
      setNilaiBulanan(nilaiData || null);

      const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
      const { data: prevNilaiData } = await supabase
        .from("monthly_assessments")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("month_year", prevMonthStr)
        .maybeSingle();
      
      setPrevNilaiBulanan(prevNilaiData || null);

    } catch (e) {
      console.error("Failed to fetch Supabase data:", e);
    }
  }

  useEffect(() => {
    if (!rawMutabaahLogs.length) {
      setMutabaahStats([]);
      setMutabaahAverage(0);
      return;
    }

    const PARAMS = [
      { id: 1, name: "Shalat Tepat Waktu" }, { id: 2, name: "Shalat Tahajud" },
      { id: 3, name: "Shalat Duha" }, { id: 4, name: "Shalat Rawatib" },
      { id: 5, name: "Saum Sunnah" }, { id: 6, name: "Tilawah" },
      { id: 7, name: "Tambahan Hafalan" }, { id: 8, name: "Capaian Hafalan" },
      { id: 9, name: "Al-Matsurat Pagi" }, { id: 10, name: "Al-Matsurat Sore" },
      { id: 11, name: "Birrul Walidain" }, { id: 12, name: "Infaq" },
      { id: 13, name: "Menambah Wawasan Islami" },
    ];
    
    const standards: Record<number, number | null> = {
      1: 35, 2: 7, 3: 7, 4: 35, 5: 2, 6: 35, 7: 15, 8: null, 9: 7, 10: 7, 11: 7, 12: 1, 13: 1
    };

    const currentVals: Record<number, number> = {};
    PARAMS.forEach(p => currentVals[p.id] = 0);

    let logsToProcess = rawMutabaahLogs;
    if (mutabaahTimeframe === "pekan") {
       const oneWeekAgo = new Date();
       oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
       const recentLog = rawMutabaahLogs.find(l => new Date(l.log_date) >= oneWeekAgo);
       if (recentLog) logsToProcess = [recentLog];
       else logsToProcess = [];
    }
    
    logsToProcess.forEach((log: any) => {
      for (let i = 1; i <= 13; i++) {
        currentVals[i] += (log[`param_${i}_val`] || 0);
      }
    });

    let totalScore = 0;
    let count = 0;
    
    const mutabaahSummary = PARAMS.filter(p => standards[p.id] !== null).map(p => {
      const baseStd = standards[p.id] as number;
      const tgt = mutabaahTimeframe === "bulan" ? baseStd * 4 : baseStd;
      const cur = currentVals[p.id];
      let pct = Math.round((cur / tgt) * 100);
      if (pct > 100) pct = 100;
      
      totalScore += pct;
      count++;
      
      return { paramName: p.name, current: cur, target: tgt, percentage: pct };
    });

    setMutabaahStats(mutabaahSummary);
    setMutabaahAverage(count > 0 ? Math.round(totalScore / count) : 0);
  }, [rawMutabaahLogs, mutabaahTimeframe]);

  if (!mounted || !user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-card)",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid var(--border-color)",
            borderTopColor: "#008CBA",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
          }}
        />
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Selamat Pagi"
      : now.getHours() < 15
        ? "Selamat Siang"
        : now.getHours() < 18
          ? "Selamat Sore"
          : "Selamat Malam";

  return (
    <div className="h-auto overflow-y-auto md:h-screen md:overflow-hidden bg-bg-canvas">

      {/* Main */}
      <main className="main-content h-auto md:h-screen flex flex-col bg-bg-canvas pb-24 md:pb-3">
        {/* ===== Header ===== */}
        <header
          className="animate-fade-in-up"
          style={{
            flexShrink: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
            position: "relative",
            zIndex: 100,
          }}
        >
          <div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "2px" }}>
              {greeting}, {user.name.split(" ")[0]}! 👋
            </p>
            <h1
               className="text-brand-primary dark:text-blue-400" style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }} 
            >
              Dashboard Personal
            </h1>
          </div>

          <div className="hidden md:flex" style={{ alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "10px", cursor: "pointer" }}>
              <Search size={15} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Cari...</span>
            </div>
            <NotificationDropdown currentUser={user} />
          </div>
        </header>

        {/* ===== Profile Card ===== */}
        <div className="solid-card animate-fade-in-up animate-delay-100 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ flexShrink: 0, padding: "12px 16px", marginBottom: "12px" }}>
          
          {/* Avatar and Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 md:w-[60px] md:h-[60px] text-[1.2rem] md:text-[1.5rem] rounded-xl flex items-center justify-center font-bold flex-shrink-0 text-white" style={{ background: "linear-gradient(135deg, #008CBA, #80c9de)" }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="truncate" style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>{user.name}</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#008CBA" }} />
                  {formatRoleName(typeof user.role === 'string' ? user.role : user.role?.name) || user.role?.label || "Role"}
                </span>
                <span style={{ color: "var(--border-color)" }}>•</span>
                <span>Departemen {user.department?.name || "BPH"}</span>
                <span style={{ color: "var(--border-color)" }}>•</span>
                <span className="truncate max-w-full">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Daily Quote */}
          <div className="flex w-full md:w-1/2 mt-3 md:mt-0 shrink-0 flex-col justify-center text-center md:text-right italic pr-0 md:pr-4">
            <span style={{ fontSize: "0.9rem", color: "var(--text-main)", fontWeight: 500, lineHeight: 1.5 }}>
              "Sebaik-baik manusia adalah yang paling bermanfaat bagi orang lain."
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>
              — HR. Ahmad
            </span>
          </div>
        </div>

        {/* ===== Ikaris Reminder ===== */}
        {ikarisStatus === "Belum Bayar" && (() => {
          const safeRole = typeof user.role === 'string' ? user.role : (user.role?.name || user.role?.label || "");
          if (safeRole !== "pembina") {
            return (
              <div style={{
                flexShrink: 0,
                background: "#fee2e2",
                border: "1px solid #fecaca",
                borderRadius: "12px",
                padding: "10px 14px",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <div style={{ background: "#ef4444", color: "white", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontWeight: "bold" }}>!</span>
                </div>
                <div>
                  <h3 style={{ color: "#b91c1c", fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>Pengingat Uang Kas</h3>
                  <p style={{ color: "#991b1b", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
                    Anda belum membayar uang kas (Ikaris) untuk bulan ini. Mohon segera diselesaikan ya!
                  </p>
                </div>
              </div>
            );
          }
          return null;
        })()}


        {/* ===== Dynamic Scrollable Area ===== */}
        <div className="flex flex-col gap-4 md:flex-1 md:min-h-0 w-full">
          {/* Top Row: Widgets */}
          <div className="flex flex-col md:flex-row gap-4 md:flex-1 md:min-h-0 w-full">
            {/* Mutabaah Progress */}
            <div
              className="solid-card animate-fade-in-up animate-delay-300 flex flex-col h-auto md:h-full md:min-h-0"
              style={{ flex: 1, padding: "14px 16px" }}
            >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "var(--text-main)",
                  }}
                >
                  📖 Progres Mutabaah
                </h2>
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Ibadah {mutabaahTimeframe === "pekan" ? "pekan ini" : "bulan ini"} — rata-rata {mutabaahAverage}%
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <select
                  value={mutabaahTimeframe}
                  onChange={(e) => setMutabaahTimeframe(e.target.value as any)}
                  className="form-select"
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "4px 28px 4px 12px",
                    height: "auto",
                    lineHeight: "normal",
                  }}
                >
                  <option value="pekan">Pekan Ini</option>
                  <option value="bulan">Bulan Ini</option>
                </select>
                <Link 
                  href="/mutabaah" 
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    border: "1px solid #b3deec",
                    background: "var(--primary-50)",
                    color: "#00688b",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                    textDecoration: "none",
                  }}
                >
                  Lihat Semua
                </Link>
              </div>
            </div>
            <div
              className="h-auto md:flex-1 md:overflow-y-auto"
              style={{
                paddingRight: "4px",
              }}
            >
              {mutabaahStats.length > 0 ? mutabaahStats.map((item) => (
                <ProgressBar
                  key={item.paramName}
                  label={item.paramName}
                  current={item.current}
                  target={item.target}
                  percentage={item.percentage}
                />
              )) : (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Belum ada data ibadah bulan ini</div>
              )}
            </div>
          </div>

            {/* Nilai Bulanan */}
            <div
              className="solid-card animate-fade-in-up animate-delay-400 flex flex-col h-auto md:h-full md:min-h-0"
              style={{ flex: 1, padding: "14px 16px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: "var(--text-main)",
                    }}
                  >
                    ⭐ Penilaian Bulanan
                  </h2>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Evaluasi Kinerja Bulan Ini
                  </p>
                </div>
              </div>
              
              <div className="flex-1 flex min-h-[140px] items-stretch gap-4">
                {(() => {
                  const dataToUse = nilaiBulanan || {};
                  
                  const CRITERIA = [
                    { key: "perkataan", label: "Perkataan" },
                    { key: "mutabaah", label: "Mutabaah" },
                    { key: "dua_arah", label: "2 Arah" },
                    { key: "antar", label: "Antar" },
                    { key: "kerjasama", label: "Kerjasama" },
                    { key: "kontribusi", label: "Kontribusi" },
                    { key: "amanah", label: "Amanah" },
                    { key: "akademik", label: "Akademik" },
                    { key: "penyampaian", label: "Penyampaian" },
                    { key: "diksi", label: "Diksi" },
                    { key: "kepekaan", label: "Kepekaan" },
                    { key: "inovasi", label: "Inovasi" },
                    { key: "rapat", label: "Rapat" },
                    { key: "kritis", label: "Kritis" }
                  ];

                  let sum = 0;
                  CRITERIA.forEach(c => sum += (dataToUse[c.key] || 0));
                  const maxScore = CRITERIA.length * 4;
                  const scale100 = sum > 0 ? Math.round((sum / maxScore) * 100) : 0;
                  let grade = "-";
                  let gradeColor = "var(--text-muted)";
                  
                  if (scale100 > 0) {
                    grade = "D";
                    gradeColor = "var(--danger-text)";
                    if (scale100 >= 93) { grade = "A"; gradeColor = "#16a34a"; }
                    else if (scale100 >= 86) { grade = "B"; gradeColor = "#008CBA"; }
                    else if (scale100 >= 77) { grade = "C"; gradeColor = "#d97706"; }
                  }

                  return (
                    <>
                      <div className="flex flex-col items-center justify-center border-r border-slate-200 dark:border-slate-700 pr-5 min-w-[110px] gap-2">
                        <div className="text-[3.5rem] font-black leading-none" style={{ color: gradeColor }}>
                          {grade}
                        </div>
                        <div className="text-[1.8rem] font-black text-text-main leading-none">
                          {scale100}
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto pr-3 min-h-0 h-full flex flex-col gap-1 pb-2">
                        {CRITERIA.map((c, idx) => {
                          const currentVal = dataToUse[c.key] || 0;
                          const prevVal = prevNilaiBulanan ? (prevNilaiBulanan[c.key] || 0) : 0;
                          
                          let trendIcon = <span className="text-slate-400 font-bold opacity-50 w-5 text-center">-</span>;
                          if (currentVal > prevVal) trendIcon = <TrendingUp size={18} className="text-green-500" />;
                          else if (currentVal < prevVal) trendIcon = <TrendingDown size={18} className="text-red-500" />;

                          const rowBg = idx % 2 === 0 ? "bg-slate-100 dark:bg-white/5" : "bg-transparent";

                          return (
                            <div key={c.key} className={`flex justify-between items-center py-2 px-6 mx-2 rounded-lg transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-600 ${rowBg}`}>
                              <span className="font-semibold text-text-muted text-[0.95rem]" style={{ paddingLeft: "1.25rem" }}>{c.label}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-text-main font-black text-[1.35rem] leading-none">{currentVal}</span>
                                {trendIcon}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Bottom Row: Amanah & Nilai Bulanan */}
          <div className="flex flex-col md:flex-row gap-4 md:flex-1 md:min-h-0 w-full">
            {/* Amanah */}
            <div
              className="solid-card animate-fade-in-up animate-delay-500 flex flex-col h-auto md:h-full md:min-h-0"
              style={{
                flex: 1,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: "var(--text-main)",
                    }}
                  >
                    📋 Amanah Terbaru
                  </h2>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    {pendingTasks.length} tugas belum selesai
                  </p>
                </div>
                <Link
                  href="/amanah"
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    border: "1px solid #b3deec",
                    background: "var(--primary-50)",
                    color: "#00688b",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                    textDecoration: "none",
                  }}
                >
                  Lihat Semua
                </Link>
              </div>
              <div className="h-auto md:flex-1 md:overflow-y-auto" style={{ paddingRight: "4px" }}>
                <AmanahList tasks={tasks} onTaskClick={(task) => setSelectedTask(task)} />
              </div>
            </div>

            {/* Absensi Chart */}
            <div
              className="solid-card animate-fade-in-up animate-delay-600 flex flex-col h-auto md:h-full md:min-h-0"
              style={{ flex: 1, padding: "14px 16px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: "var(--text-main)",
                    }}
                  >
                    📊 Absensi Kehadiran
                  </h2>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Rapat Pleno & Divisi
                  </p>
                </div>
                <div
                  className="max-md:text-lg text-xl font-bold"
                  style={{
                    color:
                      attendanceStats.percentage >= 80
                        ? "#16a34a"
                        : attendanceStats.percentage >= 60
                          ? "#d97706"
                          : "var(--danger-text)",
                  }}
                >
                  {attendanceStats.percentage}%
                </div>
              </div>

              <div className="flex-1 flex flex-row items-center w-full min-h-0 mt-2 gap-2 md:gap-4">
                {/* Stats */}
                <div className="flex flex-col gap-2 shrink-0 min-w-[140px] max-w-[180px] h-full">
                  {[
                    { label: "Hadir", value: attendanceStats.hadir, color: "#16a34a" },
                    { label: "Izin", value: attendanceStats.izin, color: "#008CBA" },
                    { label: "Sakit", value: attendanceStats.sakit, color: "#d97706" },
                    { label: "Alpa", value: attendanceStats.alpa, color: "var(--danger-text)" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="flex-1 flex flex-col items-center justify-center px-2 py-1 rounded-lg bg-bg-canvas border border-[var(--hover-bg)]"
                    >
                      <div style={{ fontSize: "1.2rem", fontWeight: 800, color: stat.color }}>
                        {stat.value}
                      </div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginTop: "2px" }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex-1 flex justify-center items-center h-full min-h-[140px] max-md:scale-90 max-md:-mr-4">
                  <AttendancePieChart data={attendanceStats} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer
          style={{
            flexShrink: 0,
            textAlign: "center",
            padding: "12px 0 0",
            fontSize: "0.7rem",
            color: "var(--border-color)",
          }}
        >
          Rohiser v0.1.0 • Rohis SMAIT Ummul Quro • 2024/2025
        </footer>
      </main>

      <EditTaskModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        currentUser={user}
        task={selectedTask}
        onTaskUpdated={() => {
          if (user) fetchDashboardData(user);
        }}
      />

      {/* Responsive */}
      <style jsx>{`
        @media (max-width: 1200px) {
          div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 1024px) {
          main {
            padding: 20px 16px !important;
          }
        }
        @media (max-width: 768px) {
          main {
            margin-left: 0 !important;
            padding: 76px 12px 80px !important;
            height: auto !important;
            overflow: visible !important;
          }
          .mobile-stack {
            flex-direction: column !important;
            height: auto !important;
          }
          .mobile-auto-height {
            flex: none !important;
            height: auto !important;
            overflow: visible !important;
          }
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
