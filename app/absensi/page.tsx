"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import { Search, Plus, Users, LayoutDashboard, Trash2 } from "lucide-react";
import AttendancePieChart from "@/components/AttendancePieChart";
import CreateMeetingModal from "@/components/CreateMeetingModal";
import FillAttendanceModal from "@/components/FillAttendanceModal";
import { mockAttendanceSummary } from "@/lib/mock-data";
import { canViewGlobalData, isKadiv, isBPH, canCreateRecords, formatRoleName } from "@/lib/rbac";
import NotificationDropdown from "@/components/NotificationDropdown";
import { supabase } from "@/lib/supabase";
import { verifyUserSession } from "@/lib/auth";

export default function AbsensiPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("personal");
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [meetingType, setMeetingType] = useState<"Rapat Umum" | "Rapat Departemen">("Rapat Departemen");
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);

  const [attendanceStats, setAttendanceStats] = useState({ hadir: 0, izin: 0, sakit: 0, alpa: 0, total: 0, percentage: 0 });

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
          fetchMeetings(updatedUser);
        }
      );
    } else {
      router.push("/login");
    }
  }, [router]);

  async function fetchMeetings(currentUser: User) {
    try {
      const { data: deptData } = await supabase.from("departments").select("id, name").order("name");
      if (deptData) setDepartments(deptData);

      const { data, error } = await supabase
        .from("attendances")
        .select("*")
        .order("event_date", { ascending: false });

      if (error) { console.error("fetchMeetings error:", error); return; }
      if (!data) return;

      // Fetch creator names separately to avoid FK join issues
      const creatorIds = [...new Set(data.map((d: any) => d.creator_id).filter(Boolean))];
      let creatorMap: Record<string, string> = {};
      if (creatorIds.length > 0) {
        const { data: creators } = await supabase
          .from("users")
          .select("id, name")
          .in("id", creatorIds);
        if (creators) creators.forEach((c: any) => { creatorMap[c.id] = c.name; });
      }

      setMeetings(data.map((d: any) => ({
        id: d.id,
        eventType: d.event_type,
        eventName: d.event_name,
        eventDate: d.event_date,
        status: d.status || "Scheduled",
        creatorId: d.creator_id,
        creatorName: creatorMap[d.creator_id] || "System",
        notetakerId: d.notetaker_id || null,
        locationType: d.location_type || null,
        locationDetail: d.location_detail || null,
        targetAudience: d.target_audience || "Semua Pengurus",
        department: d.event_type === "Rapat Umum" ? (d.target_audience || "Semua Pengurus") : currentUser.department?.name || "Divisi",
      })));
    } catch (e) {
      console.error("fetchMeetings exception:", e);
    }
  }

  async function handleDeleteMeeting(meetingId: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus rapat ini beserta seluruh data presensinya?")) return;
    try {
      const { error: err1 } = await supabase.from("attendance_records").delete().eq("attendance_id", meetingId);
      if (err1) throw err1;

      const { error: err2 } = await supabase.from("attendances").delete().eq("id", meetingId);
      if (err2) throw err2;

      if (user) {
        fetchMeetings(user);
      }
    } catch (err: any) {
      console.error(err);
      alert("Gagal menghapus rapat: " + err.message);
    }
  }

  async function handleMarkCompleted(meetingId: string) {
    try {
      const { data, error } = await supabase.from("attendances").update({ status: "Completed" }).eq("id", meetingId).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Data rapat tidak ditemukan atau akses ditolak oleh server.");

      alert("Berhasil! Rapat telah dipindahkan ke Riwayat.");
      if (user) fetchMeetings(user);
    } catch (err: any) {
      console.error(err);
      alert("Gagal mengupdate status: " + (err.message || "Unknown error"));
    }
  }

  useEffect(() => {
    if (!user) return;
    async function fetchStats() {
      try {
        const { data, error } = await supabase.from("attendance_records").select("status, user_id, user:users(department:departments(name))");

        if (error) throw error;

        let filtered = data || [];
        if (activeTab === "personal") {
          filtered = filtered.filter((r: any) => r.user_id === user!.id);
        } else if (activeTab === "divisi" && user!.department?.name) {
          filtered = filtered.filter((r: any) => {
            const deptName = Array.isArray(r.user?.department) ? r.user.department[0]?.name : r.user?.department?.name;
            return deptName === user!.department?.name;
          });
        } else if (activeTab.startsWith("divisi_")) {
          const targetDept = activeTab.replace("divisi_", "");
          filtered = filtered.filter((r: any) => {
            const deptName = Array.isArray(r.user?.department) ? r.user.department[0]?.name : r.user?.department?.name;
            return deptName === targetDept;
          });
        }

        const stats = { hadir: 0, izin: 0, sakit: 0, alpa: 0, total: 0, percentage: 0 };
        filtered.forEach((r: any) => {
          if (r.status === "Hadir") stats.hadir++;
          else if (r.status === "Izin") stats.izin++;
          else if (r.status === "Sakit") stats.sakit++;
          else if (r.status === "Alpa") stats.alpa++;
        });
        stats.total = stats.hadir + stats.izin + stats.sakit + stats.alpa;
        stats.percentage = stats.total > 0 ? Math.round(((stats.hadir + stats.izin) / stats.total) * 100) : 0;
        setAttendanceStats(stats);
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    }
    fetchStats();
  }, [activeTab, user]);

  if (!mounted || !user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  // Filter meetings logic
  const filteredMeetings = meetings.filter((m) => {
    // Basic visibility by tab
    if (activeTab === "divisi") return m.department === user.department?.name || m.department === "Semua Pengurus" || m.department === `Divisi: ${user.department?.name}`;
    if (activeTab.startsWith("divisi_")) {
      const targetDept = activeTab.replace("divisi_", "");
      return m.department === targetDept || m.department === "Semua Pengurus" || m.department === `Divisi: ${targetDept}`;
    }
    
    // For regular users (personal tab) or default view, check if they are in the target audience
    if (m.eventType === "Rapat Umum") {
      const aud = m.targetAudience;
      if (aud === "Semua Pengurus") return true;
      if (aud === "BPH + Kadiv") {
        return isBPH(user.role.name) || isKadiv(user.role.name);
      }
      if (aud.startsWith("Divisi: ")) {
        const targetDept = aud.replace("Divisi: ", "");
        if (targetDept === "BPH") return isBPH(user.role.name);
        return user.department?.name === targetDept;
      }
    } else {
      // Rapat Departemen
      return m.department === user.department?.name || m.department === `Divisi: ${user.department?.name}`;
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <main className="main-content min-h-screen bg-[var(--bg-main)]">
        {/* Header */}
        <header className="animate-fade-in-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", position: "relative", zIndex: 100 }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-main)", letterSpacing: "-0.02em" }}>Absensi Kehadiran</h1>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>Rekap kehadiran rapat pleno dan divisi</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "10px", cursor: "pointer" }}>
              <Search size={15} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Cari...</span>
            </div>
            <NotificationDropdown currentUser={user} />
          </div>
        </header>

        {/* Tabs for Data Visibility (Kadiv & BPH & Pembina only) */}
        {(canViewGlobalData(user.role.name) || isKadiv(user.role.name)) && (
          <div className="animate-fade-in-up animate-delay-100 flex flex-col md:flex-row gap-4 mb-5 border-b border-[var(--border-color)] pb-4 md:justify-between md:items-center">
            
            {/* Mobile Dropdown Tab */}
            <div className="md:hidden w-full">
              <select 
                value={activeTab.startsWith("divisi_") && !isBPH(user.role.name) ? activeTab : activeTab} 
                onChange={(e) => setActiveTab(e.target.value)}
                className="form-select w-full"
              >
                <option value="personal">Data Saya</option>
                {isBPH(user.role.name) ? (
                  <optgroup label="Data Per Divisi">
                    {departments.map(d => <option key={d.id} value={`divisi_${d.name}`}>{d.name}</option>)}
                  </optgroup>
                ) : (
                  <option value="divisi">Data Divisi ({user.department?.name})</option>
                )}
                {canViewGlobalData(user.role.name) && (
                  <option value="semua">Data Seluruh Rohis</option>
                )}
              </select>
            </div>

            {/* Desktop Tabs */}
            <div className="hidden md:flex gap-2 items-center">
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

            {/* Action Buttons based on Role */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-2 md:mt-0">
              {canCreateRecords(user.role.name) && user.role.name !== "ketua_umum" && (
                <button
                  onClick={() => {
                    setMeetingType("Rapat Departemen");
                    setIsModalOpen(true);
                  }}
                  style={{ padding: "8px 16px", background: "var(--bg-card)", color: "var(--text-main)", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}
                  className="w-full sm:w-auto justify-center"
                >
                  <Plus size={14} /> Rapat Departemen
                </button>
              )}
              {isBPH(user.role.name) && (
                <button
                  onClick={() => {
                    setMeetingType("Rapat Umum");
                    setIsModalOpen(true);
                  }}
                  style={{ padding: "8px 16px", background: "#008CBA", color: "#ffffff", borderRadius: "8px", border: "none", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}
                  className="w-full sm:w-auto justify-center"
                >
                  <Plus size={14} /> Rapat Umum
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Chart */}
          <div className="solid-card animate-fade-in-up animate-delay-200 col-span-1" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "16px" }}>
              Ringkasan Kehadiran {activeTab === "personal" ? "Anda" : activeTab === "divisi" ? "Divisi" : activeTab.startsWith("divisi_") ? activeTab.replace("divisi_", "") : "Rohis"}
            </h2>
            <div>
              <AttendancePieChart data={attendanceStats} />
              <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "16px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#16a34a" }}>{attendanceStats.hadir}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Hadir</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#008CBA" }}>{attendanceStats.izin}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Izin</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#d97706" }}>{attendanceStats.sakit}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Sakit</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--danger-text)" }}>{attendanceStats.alpa}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Alpa</div>
                </div>
              </div>
            </div>
          </div>

          {/* Meetings Table */}
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">

            {/* Jadwal Rapat */}
            <div className="solid-card animate-fade-in-up animate-delay-300" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "16px" }}>Jadwal Rapat (Akan Datang)</h2>
              <div>
                {filteredMeetings.filter(m => m.status === "Scheduled").length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>Belum ada jadwal rapat mendatang.</div>
                ) : (
                  <div className="flex flex-col">
                  {filteredMeetings.filter(m => m.status === "Scheduled").map((m) => (
                    <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-[var(--border-color)] last:border-0 gap-3 md:gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 md:w-[42px] md:h-[42px] rounded-lg md:rounded-[10px] flex items-center justify-center shrink-0" style={{ background: m.eventType === "Rapat Umum" ? "var(--primary-50)" : "var(--status-pending-bg)" }}>
                          {m.eventType === "Rapat Umum" ? <Users size={18} color="#008CBA" className="md:w-5 md:h-5" /> : <LayoutDashboard size={18} color="#d97706" className="md:w-5 md:h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base leading-snug font-semibold text-[var(--text-main)] mb-1 truncate">{m.eventName}</h3>
                          <div className="flex flex-wrap gap-1 md:gap-3 text-sm text-[var(--text-muted)]">
                            <span className="truncate">{m.eventDate}</span>
                            <span>•</span>
                            <span className="truncate">Oleh: {m.creatorName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-start md:items-end gap-2.5 md:gap-3 mt-2 md:mt-0 w-full md:w-auto">
                        <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: "6px", fontSize: "0.65rem", fontWeight: 600, background: m.eventType === "Rapat Umum" ? "var(--primary-50)" : "var(--bg-main)", color: m.eventType === "Rapat Umum" ? "var(--primary-700)" : "var(--text-main)" }}>
                          {m.department}
                        </span>
                        {canCreateRecords(user.role.name) ? (
                          <div className="flex flex-wrap gap-x-4 gap-y-2 md:gap-3 items-center w-full md:w-auto md:justify-end">
                            <Link href={`/absensi/${m.id}`} className="text-sm font-semibold text-[#10b981] no-underline whitespace-nowrap">Detail & Notulensi</Link>
                            <button onClick={() => handleMarkCompleted(m.id)} className="border-none outline-none text-sm font-semibold text-[#16a34a] cursor-pointer bg-[#dcfce7] px-2 py-1 md:px-3 md:py-1.5 rounded-lg whitespace-nowrap">✓ Terlaksana</button>
                            <div onClick={() => setSelectedMeeting(m)} className="text-sm font-semibold text-[#008CBA] cursor-pointer whitespace-nowrap">Isi Presensi</div>
                            <Trash2 onClick={() => handleDeleteMeeting(m.id)} size={16} color="var(--danger-text)" className="ml-auto md:ml-0 cursor-pointer" />
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-x-4 gap-y-2 w-full md:w-auto md:justify-end">
                            <Link href={`/absensi/${m.id}`} className="text-sm text-[#008CBA] font-semibold no-underline">Lihat Detail & Notulensi</Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            </div>

            {/* Riwayat Rapat */}
            <div className="solid-card animate-fade-in-up animate-delay-400" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "16px" }}>Riwayat Rapat (Selesai)</h2>
              <div>
                {filteredMeetings.filter(m => m.status === "Completed").length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>Belum ada riwayat rapat.</div>
                ) : (
                  <div className="flex flex-col">
                  {filteredMeetings.filter(m => m.status === "Completed").map((m) => (
                    <div key={m.id} className="py-4 pb-5 border-b border-[var(--border-color)] last:border-0 flex flex-col gap-2.5 opacity-80">
                      {/* Top row: icon + info + badge */}
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#e5e7eb] mt-0.5">
                          {m.eventType === "Rapat Umum" ? <Users size={16} color="#6b7280" /> : <LayoutDashboard size={16} color="#6b7280" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm leading-snug font-semibold text-[var(--text-muted)] mb-0.5 line-through truncate">{m.eventName}</h3>
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-[var(--text-muted)]">
                            <span>{m.eventDate}</span>
                            <span>•</span>
                            <span>Oleh: {m.creatorName}</span>
                            <span>•</span>
                            <span>{m.department}</span>
                          </div>
                        </div>
                        <span className="text-[0.6rem] font-semibold px-2 py-0.5 rounded-full bg-[var(--border-color)] text-[var(--text-muted)] shrink-0 self-start mt-0.5">Selesai</span>
                      </div>
                      {/* Action row */}
                      {canCreateRecords(user.role.name) ? (
                        <div className="flex items-center gap-4 pl-12">
                          <Link href={`/absensi/${m.id}`} className="text-xs font-semibold text-[#10b981] no-underline whitespace-nowrap">Detail & Notulensi</Link>
                          <div onClick={() => setSelectedMeeting(m)} className="text-xs font-semibold text-[#008CBA] cursor-pointer whitespace-nowrap">Edit Presensi</div>
                          <Trash2 onClick={() => handleDeleteMeeting(m.id)} size={14} color="var(--danger-text)" className="ml-auto cursor-pointer" />
                        </div>
                      ) : (
                        <div className="pl-12">
                          <Link href={`/absensi/${m.id}`} className="text-xs font-semibold text-[#008CBA] no-underline">Lihat Detail & Notulensi</Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Meeting Modal */}
      <CreateMeetingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUser={user}
        meetingType={meetingType}
        onMeetingCreated={() => {
          if (user) fetchMeetings(user);
        }}
      />

      {/* Fill Attendance Modal */}
      <FillAttendanceModal
        isOpen={!!selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
        meeting={selectedMeeting}
        currentUser={user}
      />
    </div>
  );
}
