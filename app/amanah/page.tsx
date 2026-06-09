"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import { Search, ClipboardList } from "lucide-react";
import AmanahList from "@/components/AmanahList";
import CreateTaskModal from "@/components/CreateTaskModal";
import EditTaskModal from "@/components/EditTaskModal";
import NotificationDropdown from "@/components/NotificationDropdown";
import { mockTasks } from "@/lib/mock-data";
import { canViewGlobalData, isKadiv, canCreateRecords, formatRoleName } from "@/lib/rbac";
import { spawnRecurringTasks } from "@/lib/recurring-tasks";

import { supabase } from "@/lib/supabase";

export default function AmanahPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<any[]>(mockTasks);
  const [statusFilter, setStatusFilter] = useState<string>("Semua");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("rohiser_user");
    if (stored) {
      const parsedUser = JSON.parse(stored);
      setUser(parsedUser);
      fetchTasks(parsedUser);
    } else {
      router.push("/login");
    }
  }, [router]);

  async function fetchTasks(currentUser: User) {
    try {
      // Jalankan spawner otomatis sebelum query data
      await spawnRecurringTasks();

      let query = supabase.from("tasks").select("*, assigner:users!assigner_id(name), assignee:users!assignee_id(name, department:departments(*))");
      
      // Basic RBAC for Amanah List
      if (!canViewGlobalData(currentUser.role.name) && !isKadiv(currentUser.role.name)) {
        // Just an anggota or specific assignment
        query = query.eq("assignee_id", currentUser.id);
      }
      
      const { data, error } = await query;
      
      if (data) {
        const processedTasks = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          description: d.description,
          status: d.status,
          deadline: d.deadline,
          isTemplate: d.is_template,
          taskType: d.task_type,
          recurrenceInterval: d.recurrence_interval,
          recurrenceDay: d.recurrence_day,
          assigneeId: d.assignee_id,
          assignerId: d.assigner_id,
          assignerName: d.assigner?.name || "System",
          assigneeName: d.assignee?.name || "Anggota",
          departmentName: ((Array.isArray(d.assignee?.department) ? d.assignee?.department[0]?.name : d.assignee?.department?.name) || "Tanpa Divisi")
            .replace(/^Tarbiyah$/, "Tarbiyah Islamiyah")
            .replace(/^Syiar$/, "Syiar dan Dakwah")
        }));

        const filteredTasks = processedTasks.filter((t) => {
          // Never show templates in UI (they are hidden background routines)
          if (t.isTemplate) return false;

          if (canViewGlobalData(currentUser.role.name)) return true;
          if (isKadiv(currentUser.role.name)) {
             return t.departmentName === currentUser.department?.name;
          }
          return t.assigneeId === currentUser.id;
        });

        setTasks(filteredTasks);
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (!mounted || !user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  let groupedTasks: { groupName: string; tasks: any[] }[] = [];
  const finalFilteredTasks = tasks.filter(t => statusFilter === "Semua" || t.status === statusFilter);

  if (canViewGlobalData(user.role.name)) {
    const groups: Record<string, any[]> = {
      "Badan Pengurus Harian (BPH)": [],
      "Tarbiyah Islamiyah": [],
      "Syiar dan Dakwah": [],
      "Fundrising": [],
      "Human Resource": []
    };
    finalFilteredTasks.forEach(t => {
      let key = t.departmentName || "BPH";
      if (key === "BPH") key = "Badan Pengurus Harian (BPH)";
      if (key === "Tarbiyah") key = "Tarbiyah Islamiyah";
      if (key === "Syiar") key = "Syiar dan Dakwah";
      if(!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    groupedTasks = Object.keys(groups).map(k => ({ groupName: k, tasks: groups[k] }));
  } else if (isKadiv(user.role.name)) {
    const groups: Record<string, any[]> = {};
    finalFilteredTasks.forEach(t => {
      const key = t.assigneeName || "Lainnya";
      if(!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    groupedTasks = Object.keys(groups).map(k => ({ groupName: k, tasks: groups[k] }));
  } else {
    groupedTasks = [{ groupName: "Tugas Saya", tasks: finalFilteredTasks }];
  }

  return (
    <div className="min-h-screen bg-bg-canvas">
      <main className="main-content min-h-screen bg-bg-canvas">
        {/* Header */}
        <header className="animate-fade-in-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", position: "relative", zIndex: 100 }}>
          <div>
            <h1  className="text-brand-primary dark:text-blue-400" style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }} >Manajemen Amanah</h1>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>Daftar tugas kepanitiaan dan organisasi</p>
          </div>
          <div className="hidden md:flex" style={{ alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "10px", cursor: "pointer" }}>
              <Search size={15} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Cari...</span>
            </div>
            <NotificationDropdown currentUser={user} />
          </div>
        </header>

        {/* Content */}
        <div className="solid-card animate-fade-in-up animate-delay-100" style={{ padding: "24px" }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
             <h2 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-main)" }}>Daftar Amanah</h2>
             <div className="flex flex-wrap gap-3 w-full md:w-auto">
               <select
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value)}
                 className="form-select flex-1 md:flex-none"
               >
                 <option value="Semua">Semua Status</option>
                 <option value="pending">Pending</option>
                 <option value="in_progress">Sedang Berjalan</option>
                 <option value="waiting_approval">Menunggu Approval</option>
                 <option value="completed">Selesai</option>
               </select>
               {canCreateRecords(user.role.name) && (
                 <button 
                   onClick={() => setIsCreateModalOpen(true)}
                   className="whitespace-nowrap flex-1 md:flex-none"
                   style={{ padding: "8px 16px", background: "#008CBA", color: "#ffffff", borderRadius: "8px", border: "none", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
                 >
                   + Tambah Amanah
                 </button>
               )}
             </div>
          </div>
          
          {groupedTasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Belum ada amanah.</div>
          ) : (
            groupedTasks.map((group, idx) => (
              <div key={idx} className="animate-fade-in-up" style={{ marginBottom: "28px", animationDelay: `${idx * 100}ms` }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                  {canViewGlobalData(user.role.name) && group.groupName !== "BPH" && group.groupName !== "Tanpa Divisi" ? "Departemen " : ""}
                  {group.groupName}
                  <span style={{ marginLeft: "8px", background: "var(--border-color)", color: "var(--text-muted)", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem" }}>
                    {group.tasks.length}
                  </span>
                </h3>
                <AmanahList tasks={group.tasks} onTaskClick={(task) => setSelectedTask(task)} onAddAmanah={canCreateRecords(user.role.name) ? () => setIsCreateModalOpen(true) : undefined} />
              </div>
            ))
          )}
        </div>
      </main>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUser={user}
        onTaskCreated={() => {
          if (user) fetchTasks(user);
        }}
      />
      
      <EditTaskModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        currentUser={user}
        task={selectedTask}
        onTaskUpdated={() => {
          if (user) fetchTasks(user);
        }}
      />
    </div>
  );
}
