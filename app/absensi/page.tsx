"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import type { User } from "@/lib/types";
import { Search, Bell, Plus, Users, LayoutDashboard, Trash2 } from "lucide-react";
import AttendancePieChart from "@/components/AttendancePieChart";
import CreateMeetingModal from "@/components/CreateMeetingModal";
import FillAttendanceModal from "@/components/FillAttendanceModal";
import { mockAttendanceSummary } from "@/lib/mock-data";
import { canViewGlobalData, isKadiv, isBPH, canCreateRecords, formatRoleName } from "@/lib/rbac";

import { supabase } from "@/lib/supabase";

export default function AbsensiPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "divisi" | "semua">("personal");
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
      setUser(parsedUser);
      fetchMeetings(parsedUser);
    } else {
      router.push("/login");
    }
  }, [router]);

  async function fetchMeetings(currentUser: User) {
    try {
      // Basic fetch
      const { data, error } = await supabase.from("attendances").select("*, creator:users!creator_id(name)");
      if (data) {
        setMeetings(data.map((d: any) => ({
          id: d.id,
          eventType: d.event_type,
          eventName: d.event_name,
          eventDate: d.event_date,
          creatorId: d.creator_id,
          creatorName: d.creator?.name || "System",
          department: d.event_type === "Rapat Umum" ? "Seluruh Rohis" : currentUser.department?.name || "Divisi",
        })));
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteMeeting(meetingId: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus rapat ini beserta seluruh data presensinya?")) return;
    try {
      const { error: err1 } = await supabase.from("attendance_records").delete().eq("attendance_id", meetingId);
      if (err1) throw err1;
      
      const { error: err2 } = await supabase.from("attendances").delete().eq("id", meetingId);
      if (err2) throw err2;
      
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert("Gagal menghapus rapat: " + err.message);
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
    if (activeTab === "personal") return true; 
    if (activeTab === "divisi") return m.department === user.department?.name || m.department === "Seluruh Rohis";
    return true; 
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      <Sidebar 
        userName={user.name} 
        userRole={formatRoleName(typeof user.role === 'string' ? user.role : user.role?.name) || user.role?.label || "Role"} 
        userInitials={initials} 
      />
      <main className="main-content" style={{ flex: 1, marginLeft: "256px", padding: "24px 28px", minHeight: "100vh", background: "var(--bg-main)" }}>
        {/* Header */}
        <header className="animate-fade-in-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-main)", letterSpacing: "-0.02em" }}>Absensi Kehadiran</h1>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>Rekap kehadiran rapat pleno dan divisi</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "10px", cursor: "pointer" }}>
              <Search size={15} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Cari...</span>
            </div>
            <button style={{ width: "38px", height: "38px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Bell size={17} style={{ color: "var(--text-muted)" }} />
            </button>
          </div>
        </header>

        {/* Tabs for Data Visibility (Kadiv & BPH & Pembina only) */}
        {(canViewGlobalData(user.role.name) || isKadiv(user.role.name)) && (
          <div className="animate-fade-in-up animate-delay-100" style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                onClick={() => setActiveTab("personal")}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "none", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", background: activeTab === "personal" ? "#008CBA" : "transparent", color: activeTab === "personal" ? "var(--bg-card)" : "var(--text-muted)", transition: "all 0.2s" }}
              >
                Data Saya
              </button>
              <button 
                onClick={() => setActiveTab("divisi")}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "none", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", background: activeTab === "divisi" ? "#008CBA" : "transparent", color: activeTab === "divisi" ? "var(--bg-card)" : "var(--text-muted)", transition: "all 0.2s" }}
              >
                Data Divisi ({user.department?.name})
              </button>
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
            <div style={{ display: "flex", gap: "10px" }}>
              {canCreateRecords(user.role.name) && (
                <button 
                  onClick={() => {
                    setMeetingType("Rapat Departemen");
                    setIsModalOpen(true);
                  }}
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", background: "var(--hover-bg)", color: "#00688b", border: "1px solid var(--border-color)", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
                >
                  <Plus size={16} /> Rapat Departemen
                </button>
              )}
              {isBPH(user.role.name) && (
                <button 
                  onClick={() => {
                    setMeetingType("Rapat Umum");
                    setIsModalOpen(true);
                  }}
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", background: "#008CBA", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
                >
                  <Plus size={16} /> Rapat Umum
                </button>
              )}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
          {/* Chart */}
          <div className="solid-card animate-fade-in-up animate-delay-200" style={{ padding: "24px" }}>
             <h2 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "16px" }}>
               Ringkasan Kehadiran {activeTab === "personal" ? "Anda" : activeTab === "divisi" ? "Divisi" : "Rohis"}
             </h2>
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
          
          {/* Meetings Table */}
          <div className="solid-card animate-fade-in-up animate-delay-300" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "16px" }}>Jadwal & Riwayat Rapat</h2>
            {filteredMeetings.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>Belum ada data rapat.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {filteredMeetings.map((m) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", border: "1px solid var(--border-color)", borderRadius: "10px", background: "var(--hover-bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: m.eventType === "Rapat Umum" ? "var(--primary-50)" : "var(--status-pending-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {m.eventType === "Rapat Umum" ? <Users size={20} color="#008CBA" /> : <LayoutDashboard size={20} color="#d97706" />}
                      </div>
                      <div>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "2px" }}>{m.eventName}</h3>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "10px" }}>
                          <span>{m.eventDate}</span>
                          <span>•</span>
                          <span>Oleh: {m.creatorName}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 600, background: m.eventType === "Rapat Umum" ? "var(--primary-50)" : "var(--hover-bg)", color: m.eventType === "Rapat Umum" ? "var(--primary-700)" : "var(--text-main)" }}>
                        {m.department}
                      </span>
                      {canCreateRecords(user.role.name) ? (
                        <div style={{ display: "flex", gap: "10px", marginTop: "6px", justifyContent: "flex-end", alignItems: "center" }}>
                          <div onClick={() => setSelectedMeeting(m)} style={{ fontSize: "0.75rem", color: "#008CBA", fontWeight: 600, cursor: "pointer" }}>Isi Presensi</div>
                          <Trash2 onClick={() => handleDeleteMeeting(m.id)} size={15} color="var(--danger-text)" style={{ cursor: "pointer" }} />
                        </div>
                      ) : (
                        <div onClick={() => alert("Fitur detail presensi untuk anggota sedang dikembangkan.")} style={{ marginTop: "6px", fontSize: "0.75rem", color: "#008CBA", fontWeight: 600, cursor: "pointer" }}>Lihat Detail</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
