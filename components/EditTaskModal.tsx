"use client";

import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { supabase } from "@/lib/supabase";
import { User, TaskStatus, Task } from "@/lib/types";
import { canCreateRecords } from "@/lib/rbac";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  task: Task | null;
  onTaskUpdated: () => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "Sedang Berjalan" },
  { value: "waiting_approval", label: "Menunggu Approval" },
  { value: "completed", label: "Selesai" },
];

export default function EditTaskModal({
  isOpen,
  onClose,
  currentUser,
  task,
  onTaskUpdated,
}: EditTaskModalProps) {
  const [status, setStatus] = useState<TaskStatus>("pending");
  const [recurrenceInterval, setRecurrenceInterval] = useState<"monthly" | "weekly" | "daily">("monthly");
  const [recurrenceDay, setRecurrenceDay] = useState(1);
  const [deadlineDurationDays, setDeadlineDurationDays] = useState(7);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditor = canCreateRecords(currentUser.role.name);

  useEffect(() => {
    if (isOpen && task) {
      setStatus(task.status as TaskStatus);
      if (task.isTemplate) {
        setRecurrenceInterval((task.recurrenceInterval as any) || "monthly");
        setRecurrenceDay(task.recurrenceDay || 1);
        setDeadlineDurationDays(task.deadlineDurationDays || 7);
      }
      setError("");
    }
  }, [isOpen, task]);

  if (!task) return null;

  const handleUpdate = async () => {
    if (!isEditor) return;
    setLoading(true);
    setError("");

    try {
      let updatePayload: Record<string, unknown> = {};
      if (task.isTemplate) {
        updatePayload = {
          recurrence_interval: recurrenceInterval,
          recurrence_day: recurrenceDay,
          deadline_duration_days: deadlineDurationDays,
        };
      } else {
        updatePayload = { status };
      }

      const { error: updateError } = await supabase
        .from("tasks")
        .update(updatePayload)
        .eq("id", task.id);

      if (updateError) throw updateError;

      onTaskUpdated();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Gagal memperbarui tugas.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditor) return;
    if (!window.confirm("Apakah Anda yakin ingin menghapus amanah ini?")) return;
    
    setLoading(true);
    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", task.id);

      if (deleteError) throw deleteError;

      onTaskUpdated();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Gagal menghapus tugas.");
    } finally {
      setLoading(false);
    }
  };

  function formatDate(dateStr?: string): string {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task.isTemplate ? "Edit Master Rutin" : "Detail Amanah"}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {error && (
          <div style={{ padding: "10px", background: "var(--danger-bg)", color: "var(--danger-text)", borderRadius: "8px", fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        {/* Info */}
        <div style={{ background: "var(--bg-main)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "8px", marginTop: 0 }}>
            {task.isTemplate && <span style={{ color: "#008CBA", fontSize: "0.75rem", background: "var(--primary-50)", padding: "2px 6px", borderRadius: "4px", marginRight: "6px" }}>[Master Rutin]</span>}
            {task.title}
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-main)", lineHeight: "1.5", marginBottom: "16px", marginTop: 0 }}>
            {task.description || "Tidak ada deskripsi."}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.82rem" }}>
            {!task.isTemplate && (
              <div>
                <div style={{ color: "var(--text-muted)", marginBottom: "2px" }}>Tenggat Waktu:</div>
                <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{formatDate(task.deadline)}</div>
              </div>
            )}
            <div>
              <div style={{ color: "var(--text-muted)", marginBottom: "2px" }}>Penugasan Dari:</div>
              <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{task.assignerName || "Sistem"}</div>
            </div>
          </div>
        </div>

        {/* Template Editing or Status Editing */}
        {task.isTemplate ? (
          isEditor ? (
            <div style={{ padding: "16px", background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "12px", color: "#008CBA" }}>Pengaturan Rutin</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-main)", marginBottom: "4px" }}>Siklus</label>
                  <select value={recurrenceInterval} onChange={e => setRecurrenceInterval(e.target.value as any)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", outline: "none" }}>
                    <option value="monthly">Bulanan</option>
                    <option value="weekly">Pekanan</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-main)", marginBottom: "4px" }}>
                    {recurrenceInterval === "monthly" ? "Pada Tanggal (1-31)" : "Pada Hari (0=Ahad, 1=Senin)"}
                  </label>
                  <input type="number" min="0" max="31" value={recurrenceDay} onChange={e => setRecurrenceDay(parseInt(e.target.value) || 0)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", outline: "none" }} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-main)", marginBottom: "4px" }}>Lama Pengerjaan (Hari Deadline)</label>
                  <input type="number" min="1" value={deadlineDurationDays} onChange={e => setDeadlineDurationDays(parseInt(e.target.value) || 1)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", outline: "none" }} />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "10px", background: "var(--hover-bg)", borderRadius: "8px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Ini adalah cetakan tugas rutin. Hanya pembuat tugas yang dapat mengubah siklusnya.
            </div>
          )
        ) : (
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
              Status Saat Ini
            </label>
            
            {isEditor ? (
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  outline: "none",
                  backgroundColor: "var(--bg-card)",
                }}
                disabled={loading}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <div style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--hover-bg)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                fontSize: "0.9rem",
                color: "var(--text-main)",
                fontWeight: 500,
              }}>
                {STATUS_OPTIONS.find((o) => o.value === status)?.label || status}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
          {isEditor ? (
            <button
              type="button"
              onClick={handleDelete}
              style={{ padding: "8px 12px", borderRadius: "8px", border: "none", background: "transparent", color: "#ef4444", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontSize: "0.85rem", textDecoration: "underline" }}
              disabled={loading}
            >
              Hapus Tugas
            </button>
          ) : <div></div>}
          
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "10px 18px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)", fontWeight: 600, cursor: "pointer" }}
              disabled={loading}
            >
              Tutup
            </button>
            
            {isEditor && (
              <button
                onClick={handleUpdate}
                style={{ padding: "10px 18px", borderRadius: "8px", border: "none", background: "#008CBA", color: "#ffffff", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
                disabled={loading || (!task.isTemplate && status === task.status)}
              >
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
