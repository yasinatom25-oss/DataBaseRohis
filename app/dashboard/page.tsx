"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import {
  mockTasks,
} from "@/lib/mock-data";
import Sidebar from "@/components/Sidebar";
import ProgressBar from "@/components/ProgressBar";
import AmanahList from "@/components/AmanahList";
import AttendancePieChart from "@/components/AttendancePieChart";
import EditTaskModal from "@/components/EditTaskModal";
import {
  TrendingUp,
  ClipboardList,
  CalendarCheck,
  BookOpen,
  Bell,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatRoleName } from "@/lib/rbac";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<any[]>(mockTasks);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const [attendanceStats, setAttendanceStats] = useState({ hadir: 0, izin: 0, sakit: 0, alpa: 0, total: 0, percentage: 0 });
  const [mutabaahStats, setMutabaahStats] = useState<any[]>([]);
  const [mutabaahAverage, setMutabaahAverage] = useState(0);
  const [trenIbadah, setTrenIbadah] = useState({ status: "Konsisten", sub: "Masih stabil minggu ini", trendUp: true });

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("rohiser_user");
    if (stored) {
      const parsedUser = JSON.parse(stored);
      setUser(parsedUser);
      fetchDashboardData(parsedUser);
    } else {
      router.push("/login");
    }
  }, [router]);

  async function fetchDashboardData(currentUser: User) {
    try {
      // 1. Fetch Tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("assignee_id", currentUser.id);
      
      if (tasksData && tasksData.length > 0) {
        setTasks(tasksData.map(d => ({
          id: d.id,
          title: d.title,
          description: d.description,
          status: d.status,
          deadline: d.deadline,
          assigneeId: d.assignee_id,
          assignerId: d.assigner_id,
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
      const percentage = total > 0 ? Math.round(((hadir + izin) / total) * 100) : 0;
      setAttendanceStats({ hadir, izin, sakit, alpa, total, percentage });

      // 3. Fetch Mutabaah Targets
      const { data: targetData } = await supabase
        .from("mutabaah_targets")
        .select("param_name, target_value")
        .eq("gender", currentUser.gender);

      const targetMap = new Map();
      (targetData || []).forEach(t => targetMap.set(t.param_name, t.target_value));

      // 4. Fetch Mutabaah Logs for current month
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const { data: logsData } = await supabase
        .from("mutabaah_logs")
        .select("*")
        .eq("user_id", currentUser.id)
        .gte("log_date", firstDay);

      const PARAMS = [
        { id: 1, name: "Shalat Tepat Waktu" }, { id: 2, name: "Shalat Tahajud" },
        { id: 3, name: "Shalat Duha" }, { id: 4, name: "Shalat Rawatib" },
        { id: 5, name: "Saum Sunnah" }, { id: 6, name: "Tilawah" },
        { id: 7, name: "Tambahan Hafalan" }, { id: 8, name: "Capaian Hafalan" },
        { id: 9, name: "Al-Matsurat Pagi" }, { id: 10, name: "Al-Matsurat Sore" },
        { id: 11, name: "Birrul Walidain" }, { id: 12, name: "Infaq" },
        { id: 13, name: "Menambah Wawasan Islami" },
      ];

      // Aggregate values
      const currentVals: Record<number, number> = {};
      PARAMS.forEach(p => currentVals[p.id] = 0);

      (logsData || []).forEach((log: any) => {
        for (let i = 1; i <= 13; i++) {
          currentVals[i] += (log[`param_${i}_val`] || 0);
        }
      });

      let totalPct = 0;
      const mutabaahSummary = PARAMS.map(p => {
        const tgt = targetMap.get(p.name) || 1; // Default to 1 to avoid div by zero if missing
        // target is usually weekly/daily depending on how they filled it. If mutabaah_targets are monthly, we use as is.
        // Assuming targets in DB are monthly targets:
        const cur = currentVals[p.id];
        let pct = Math.round((cur / tgt) * 100);
        if (pct > 100) pct = 100;
        totalPct += pct;
        return { paramName: p.name, current: cur, target: tgt, percentage: pct };
      });

      setMutabaahStats(mutabaahSummary);
      setMutabaahAverage(Math.round(totalPct / 13));

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

    } catch (e) {
      console.error("Failed to fetch Supabase data:", e);
    }
  }

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
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      <Sidebar
        userName={user.name}
        userRole={formatRoleName(typeof user.role === 'string' ? user.role : user.role?.name) || user.role?.label || "Role"}
        userInitials={initials}
      />

      {/* Main */}
      <main
        className="main-content"
        style={{
          flex: 1,
          marginLeft: "256px",
          padding: "24px 28px",
          minHeight: "100vh",
          background: "var(--bg-main)",
        }}
      >
        {/* ===== Header ===== */}
        <header
          className="animate-fade-in-up"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
          }}
        >
          <div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "2px" }}>
              {greeting}, {user.name.split(" ")[0]}! 👋
            </p>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--text-main)",
                letterSpacing: "-0.02em",
              }}
            >
              Dashboard Personal
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Search */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              <Search size={15} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Cari...
              </span>
            </div>

            {/* Notification */}
            <button
              id="notification-bell"
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <Bell size={17} style={{ color: "var(--text-muted)" }} />
              <div
                style={{
                  position: "absolute",
                  top: "7px",
                  right: "7px",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "var(--danger-text)",
                  border: "1.5px solid var(--bg-card)",
                }}
              />
            </button>
          </div>
        </header>

        {/* ===== Profile Card ===== */}
        <div className="solid-card animate-fade-in-up animate-delay-100" style={{ padding: "20px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "12px", background: "linear-gradient(135deg, #008CBA, #80c9de)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "1.5rem", fontWeight: 700, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>{user.name}</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#008CBA" }} />
                {formatRoleName(typeof user.role === 'string' ? user.role : user.role?.name) || user.role?.label || "Role"}
              </span>
              <span style={{ color: "var(--border-color)" }}>•</span>
              <span>Departemen {user.department?.name || "BPH"}</span>
              <span style={{ color: "var(--border-color)" }}>•</span>
              <span>{user.email}</span>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "10px", background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#16a34a" }}>{attendanceStats.hadir}</div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "2px" }}>Hadir</div>
              </div>
              <div style={{ textAlign: "center", padding: "10px", background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#008CBA" }}>{attendanceStats.izin}</div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "2px" }}>Izin</div>
              </div>
              <div style={{ textAlign: "center", padding: "10px", background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#d97706" }}>{attendanceStats.sakit}</div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "2px" }}>Sakit</div>
              </div>
              <div style={{ textAlign: "center", padding: "10px", background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--danger-text)" }}>{attendanceStats.alpa}</div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "2px" }}>Alpa</div>
              </div>
        </div>

        {/* ===== Summary Cards ===== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          {[
            {
              label: "Mutabaah Bulan Ini",
              value: `${mutabaahAverage}%`,
              sub: "Rata-rata capaian Anda",
              icon: BookOpen,
              iconBg: "var(--primary-50)",
              iconColor: "#008CBA",
              delay: "100ms",
            },
            {
              label: "Amanah Pending",
              value: pendingTasks.length.toString(),
              sub: `${pendingTasks.length} tugas belum selesai`,
              icon: ClipboardList,
              iconBg: "#fef3c7",
              iconColor: "#d97706",
              delay: "150ms",
            },
            {
              label: "Kehadiran",
              value: `${attendanceStats.percentage}%`,
              sub: `${attendanceStats.hadir}/${attendanceStats.total} rapat`,
              icon: CalendarCheck,
              iconBg: "#dcfce7",
              iconColor: "#16a34a",
              delay: "200ms",
            },
            {
              label: "Tren Ibadah",
              value: trenIbadah.trendUp ? "↑" : "↓",
              sub: trenIbadah.sub,
              icon: TrendingUp,
              iconBg: trenIbadah.trendUp ? "#ede9fe" : "#fee2e2",
              iconColor: trenIbadah.trendUp ? "#7c3aed" : "#ef4444",
              delay: "250ms",
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="solid-card animate-fade-in-up"
                style={{
                  padding: "18px 20px",
                  animationDelay: card.delay,
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: card.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "14px",
                  }}
                >
                  <Icon size={19} style={{ color: card.iconColor }} />
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "var(--text-main)",
                    lineHeight: 1,
                    marginBottom: "4px",
                  }}
                >
                  {card.value}
                </div>
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 500,
                    color: "var(--text-muted)",
                  }}
                >
                  {card.label}
                </div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                  }}
                >
                  {card.sub}
                </div>
              </div>
            );
          })}
        </div>

        {/* ===== Widget Row ===== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          {/* Mutabaah Progress */}
          <div
            className="solid-card animate-fade-in-up animate-delay-300"
            style={{ padding: "22px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
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
                  Ibadah bulan ini — rata-rata {mutabaahAverage}%
                </p>
              </div>
              <span className="badge badge-primary">
                {user.gender === "ikhwan" ? "Ikhwan" : "Akhwat"}
              </span>
            </div>
            <div
              style={{
                maxHeight: "370px",
                overflowY: "auto",
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

          {/* Absensi Chart */}
          <div
            className="solid-card animate-fade-in-up animate-delay-400"
            style={{ padding: "22px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
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
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
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

            <AttendancePieChart data={attendanceStats} />

            {/* Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: "8px",
                marginTop: "10px",
              }}
            >
              {[
                { label: "Hadir", value: attendanceStats.hadir, color: "#16a34a" },
                { label: "Izin", value: attendanceStats.izin, color: "#008CBA" },
                { label: "Sakit", value: attendanceStats.sakit, color: "#d97706" },
                { label: "Alpa", value: attendanceStats.alpa, color: "var(--danger-text)" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    textAlign: "center",
                    padding: "10px 0",
                    borderRadius: "8px",
                    background: "var(--bg-main)",
                    border: "1px solid var(--hover-bg)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      color: stat.color,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--text-muted)",
                      marginTop: "2px",
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Amanah – full width */}
          <div
            className="solid-card animate-fade-in-up animate-delay-500"
            style={{
              padding: "22px",
              gridColumn: "1 / -1",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
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
              <button
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
                }}
              >
                Lihat Semua
              </button>
            </div>
            <AmanahList tasks={tasks} onTaskClick={(task) => setSelectedTask(task)} />
          </div>
        </div>

        {/* Footer */}
        <footer
          style={{
            textAlign: "center",
            padding: "28px 0 14px",
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
            padding: 16px 12px 80px !important;
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
