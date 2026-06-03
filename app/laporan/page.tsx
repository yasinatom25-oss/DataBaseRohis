"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User, Task } from "@/lib/types";
import { Search, FileText, CheckCircle2, Clock, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { mockTasks, mockUsers } from "@/lib/mock-data";
import { canViewGlobalData, isKadiv, formatRoleName } from "@/lib/rbac";
import NotificationDropdown from "@/components/NotificationDropdown";

import { supabase } from "@/lib/supabase";

export default function LaporanPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [groupedTasks, setGroupedTasks] = useState<Record<string, { user: User; tasks: Task[] }>>({});

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("rohiser_user");
    if (stored) {
      const parsedUser = JSON.parse(stored);
      setUser(parsedUser);
      fetchLaporan(parsedUser);
    } else {
      router.push("/login");
    }
  }, [router]);

  async function fetchLaporan(currentUser: User) {
    try {
      let query = supabase
        .from("tasks")
        .select("*, assignee:users!assignee_id(*, role:roles(*), department:departments(*))")
        .neq("status", "completed")
        .eq("is_template", false);

      // Filter tasks based on role visibility
      if (!canViewGlobalData(currentUser.role.name) && !isKadiv(currentUser.role.name)) {
         query = query.eq("assignee_id", currentUser.id);
      }
      
      const { data, error } = await query;
      
      if (data) {
        const grouped: Record<string, { user: User; tasks: Task[] }> = {};
        
        data.forEach((t: any) => {
          if (!t.assignee) return;
          const assignee = {
             ...t.assignee,
             role: Array.isArray(t.assignee.role) ? t.assignee.role[0] : t.assignee.role,
             department: Array.isArray(t.assignee.department) ? t.assignee.department[0] : t.assignee.department,
          };
          
          if (isKadiv(currentUser.role.name) && assignee.department?.name !== currentUser.department?.name) {
             return; 
          }
          
          if (!grouped[assignee.id]) {
            grouped[assignee.id] = { user: assignee, tasks: [] };
          }
          grouped[assignee.id].tasks.push({
             id: t.id,
             title: t.title,
             description: t.description,
             status: t.status,
             deadline: t.deadline,
             assigneeId: t.assignee_id,
             assignerId: t.assigner_id,
             assignerName: "System"
          } as Task);
        });
        
        setGroupedTasks(grouped);
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (!mounted || !user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  // Derived state for filtering
  const filteredGroups = Object.values(groupedTasks)
    .map(({ user: assignee, tasks }) => {
      // Filter tasks by month
      const monthTasks = tasks.filter(t => t.deadline?.startsWith(selectedMonth));
      return { user: assignee, tasks: monthTasks };
    })
    .filter(g => g.tasks.length > 0) // Only users with tasks in this month
    .filter(g => {
      // Filter by search query
      if (!searchQuery.trim()) return true;
      return g.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

  const handleExportExcel = () => {
    if (filteredGroups.length === 0) {
      alert("Tidak ada data untuk diekspor pada bulan ini.");
      return;
    }
    
    const wb = XLSX.utils.book_new();
    const sheetsData: Record<string, any[]> = {};
    
    filteredGroups.forEach(g => {
      const deptName = g.user.department?.name || "BPH";
      if (!sheetsData[deptName]) sheetsData[deptName] = [];
      
      g.tasks.forEach(t => {
        sheetsData[deptName].push({
          "Nama Anggota": g.user.name,
          "Tugas": t.title,
          "Deskripsi": t.description || "-",
          "Deadline": t.deadline,
          "Status": t.status === "pending" ? "Belum Mulai" : "Menunggu Review"
        });
      });
    });

    Object.keys(sheetsData).forEach(dept => {
      const safeSheetName = dept.replace(/[\[\]\*\\\/\?]/g, "").substring(0, 31);
      const ws = XLSX.utils.json_to_sheet(sheetsData[dept]);
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
    });

    XLSX.writeFile(wb, `Laporan_Sisa_Amanah_${selectedMonth}.xlsx`);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      <main className="main-content" style={{ flex: 1, marginLeft: "256px", padding: "24px 28px", minHeight: "100vh", background: "var(--bg-main)" }}>
        {/* Header */}
        <header className="animate-fade-in-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", position: "relative", zIndex: 100 }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-main)", letterSpacing: "-0.02em" }}>Laporan & Evaluasi</h1>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>Pantau sisa amanah bulanan per anggota</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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

        {/* Filter Bar */}
        <div className="solid-card animate-fade-in-up animate-delay-100" style={{ padding: "16px 24px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
           <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
             <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>Laporan Bulan:</span>
             <input 
               type="month"
               value={selectedMonth}
               onChange={(e) => setSelectedMonth(e.target.value)}
               style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "0.85rem", color: "var(--text-main)", outline: "none", background: "var(--bg-main)" }}
             />
           </div>
           <button 
             onClick={handleExportExcel}
             style={{ padding: "8px 16px", background: "#10b981", color: "#ffffff", borderRadius: "8px", border: "none", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
           >
             <Download size={16} /> Export Excel
           </button>
        </div>

        {/* Grouped Tasks */}
        <div className="animate-fade-in-up animate-delay-200" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {filteredGroups.length === 0 ? (
             <div className="solid-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
               <CheckCircle2 size={48} style={{ color: "#16a34a", opacity: 0.5, margin: "0 auto 16px" }} />
               <h3 style={{ fontSize: "1.1rem", color: "var(--text-main)", fontWeight: 600, marginBottom: "4px" }}>Semua Amanah Selesai!</h3>
               <p style={{ fontSize: "0.85rem" }}>Tidak ada amanah yang tertunda untuk kriteria pencarian ini.</p>
             </div>
          ) : (
            filteredGroups.map(({ user: assignee, tasks }) => (
              <div key={assignee.id} className="solid-card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--hover-bg)", paddingBottom: "16px", marginBottom: "16px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "linear-gradient(135deg, #008CBA, #80c9de)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: 700, fontSize: "0.9rem" }}>
                    {assignee.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)" }}>{assignee.name}</h3>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{assignee.role.label} • {assignee.department?.name || "-"}</div>
                  </div>
                  <div style={{ marginLeft: "auto", background: "var(--danger-bg)", color: "var(--danger-text)", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600 }}>
                    {tasks.length} Amanah Tertunda
                  </div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                  {tasks.map((task) => (
                    <div key={task.id} style={{ border: "1px solid var(--border-color)", borderRadius: "8px", padding: "16px", background: "#fafafa" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <h4 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-main)" }}>{task.title}</h4>
                        <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "3px 8px", borderRadius: "4px", 
                           background: task.status === "pending" ? "#fef3c7" : "#b3deec",
                           color: task.status === "pending" ? "#92400e" : "#00688b"
                        }}>
                          {task.status === "pending" ? "Belum Mulai" : "Menunggu Review"}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "12px", lineHeight: 1.4 }}>{task.description}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "#d97706", fontWeight: 600 }}>
                        <Clock size={12} /> Deadline: {task.deadline}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
