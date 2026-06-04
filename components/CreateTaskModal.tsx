"use client";

import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types";
import { isKadiv, canViewGlobalData } from "@/lib/rbac";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onTaskCreated: () => void;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  currentUser,
  onTaskCreated,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState<"terencana" | "rutin">("terencana");
  const [deadline, setDeadline] = useState("");
  const [recurrenceInterval, setRecurrenceInterval] = useState("monthly");
  const [recurrenceDay, setRecurrenceDay] = useState("1");
  const [deadlineDuration, setDeadlineDuration] = useState("7");
  const [assigneeId, setAssigneeId] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [members, setMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Load available members to assign
  useEffect(() => {
    if (!isOpen) return;

    async function loadMembers() {
      setLoadingMembers(true);
      try {
        let query = supabase.from("users").select("*, department:departments(*), role:roles(*)");
        
        // If Kadiv, only load members in their department
        if (isKadiv(currentUser.role.name) && !canViewGlobalData(currentUser.role.name)) {
          query = query.eq("department_id", currentUser.department?.id);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Process data formatting
        if (data) {
          const formatted = data.map((u: any) => ({
            ...u,
            role: Array.isArray(u.role) ? u.role[0] : u.role,
            department: Array.isArray(u.department) ? u.department[0] : u.department,
          })) as User[];
          setMembers(formatted);
        }
      } catch (err) {
        console.error("Failed to load members:", err);
      } finally {
        setLoadingMembers(false);
      }
    }

    loadMembers();
  }, [isOpen, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title || !assigneeId) {
      setError("Judul dan penugasan wajib diisi.");
      return;
    }
    if (taskType === "terencana" && !deadline) {
      setError("Tenggat waktu wajib diisi untuk amanah terencana.");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        title,
        description,
        assignee_id: assigneeId,
        assigner_id: currentUser.id,
        status: "pending",
        task_type: taskType,
      };

      if (taskType === "terencana") {
        payload.deadline = deadline;
        const { error: insertError } = await supabase.from("tasks").insert([payload]);
        if (insertError) throw insertError;
      } else {
        payload.is_template = true;
        payload.recurrence_interval = recurrenceInterval;
        payload.recurrence_day = parseInt(recurrenceDay, 10);
        payload.deadline_duration_days = parseInt(deadlineDuration, 10);
        payload.last_spawned_at = new Date().toISOString().split("T")[0]; // mark as spawned today

        const { data: insertedTemplate, error: insertError } = await supabase
          .from("tasks")
          .insert([payload])
          .select("*")
          .single();

        if (insertError) throw insertError;

        // Automatically spawn the FIRST concrete task so it appears on the board!
        const deadlineDate = new Date();
        deadlineDate.setDate(deadlineDate.getDate() + parseInt(deadlineDuration, 10));
        
        const firstInstancePayload = {
          title,
          description,
          assignee_id: assigneeId,
          assigner_id: currentUser.id,
          status: "pending",
          task_type: "rutin",
          is_template: false,
          deadline: deadlineDate.toISOString().split("T")[0],
          parent_template_id: insertedTemplate.id
        };
        const { error: spawnError } = await supabase.from("tasks").insert([firstInstancePayload]);
        if (spawnError) throw spawnError;
      }

      // Success
      setTitle("");
      setDescription("");
      setDeadline("");
      setTaskType("terencana");
      setAssigneeId("");
      onTaskCreated();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const e = err as Record<string, unknown>;
      setError(typeof e?.message === 'string' ? e.message : typeof e?.details === 'string' ? e.details : "Terjadi kesalahan saat menyimpan tugas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delegasikan Amanah Baru">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {error && (
          <div style={{ padding: "10px", background: "var(--danger-bg)", color: "var(--danger-text)", borderRadius: "8px", fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
            Judul Amanah *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Desain Poster LDKS"
            style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border-color)", borderRadius: "8px", fontSize: "0.9rem", outline: "none" }}
            required
          />
        </div>

        {/* Task Type */}
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
            Tipe Amanah *
          </label>
          <div style={{ display: "flex", gap: "16px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", cursor: "pointer" }}>
              <input type="radio" name="taskType" value="terencana" checked={taskType === "terencana"} onChange={() => setTaskType("terencana")} />
              Terencana (Satu Kali)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", cursor: "pointer" }}>
              <input type="radio" name="taskType" value="rutin" checked={taskType === "rutin"} onChange={() => setTaskType("rutin")} />
              Rutin (Berulang)
            </label>
          </div>
        </div>

        {/* Assignee */}
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
            Tugaskan Kepada *
          </label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="form-select w-full"
            required
            disabled={loadingMembers}
          >
            <option value="">-- Pilih Anggota --</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.department?.name || "BPH"})
              </option>
            ))}
          </select>
        </div>

        {/* Deadline / Recurrence Logic */}
        {taskType === "terencana" ? (
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
              Tenggat Waktu (Deadline) *
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border-color)", borderRadius: "8px", fontSize: "0.9rem", outline: "none" }}
              required={taskType === "terencana"}
            />
          </div>
        ) : (
          <div style={{ padding: "16px", background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "12px", color: "#008CBA" }}>Pengaturan Rutin</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-main)", marginBottom: "4px" }}>Siklus</label>
                <select value={recurrenceInterval} onChange={e => setRecurrenceInterval(e.target.value)} className="form-select w-full">
                  <option value="monthly">Bulanan</option>
                  <option value="weekly">Pekanan</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-main)", marginBottom: "4px" }}>
                  {recurrenceInterval === "monthly" ? "Pada Tanggal (1-31)" : "Pada Hari (0=Ahad, 1=Senin)"}
                </label>
                <input type="number" min="0" max="31" value={recurrenceDay} onChange={e => setRecurrenceDay(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", outline: "none" }} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-main)", marginBottom: "4px" }}>Lama Pengerjaan (Hari Deadline)</label>
                <input type="number" min="1" value={deadlineDuration} onChange={e => setDeadlineDuration(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", outline: "none" }} />
              </div>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "12px", fontStyle: "italic" }}>
              *Sistem akan otomatis mencetak tugas baru untuk anggota ini setiap jadwal yang ditentukan, dengan batas waktu pengerjaan {deadlineDuration} hari.
            </p>
          </div>
        )}

        {/* Description */}
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
            Deskripsi / Detail Tugas
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan detail spesifik mengenai amanah ini..."
            rows={4}
            style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border-color)", borderRadius: "8px", fontSize: "0.9rem", outline: "none", resize: "vertical" }}
          />
        </div>

        {/* Submit */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: "10px 18px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)", fontWeight: 600, cursor: "pointer" }}
            disabled={loading}
          >
            Batal
          </button>
          <button
            type="submit"
            style={{ padding: "10px 18px", borderRadius: "8px", border: "none", background: "#008CBA", color: "#ffffff", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? "Menyimpan..." : "Simpan Amanah"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
