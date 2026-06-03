"use client";

import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { supabase } from "@/lib/supabase";
import { User, TaskStatus, Task } from "@/lib/types";
import { canCreateRecords, canViewGlobalData } from "@/lib/rbac";

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

  const isOwner = task?.assignerId === currentUser.id || canViewGlobalData(currentUser.role.name);
  const isAssignee = task?.assigneeId === currentUser.id;

  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDeadline, setEditDeadline] = useState("");

  useEffect(() => {
    if (isOpen && task) {
      setStatus(task.status as TaskStatus);
      setEditTitle(task.title || "");
      setEditDesc(task.description || "");
      setEditDeadline(task.deadline || "");
      setError("");
    }
  }, [isOpen, task]);

  if (!task) return null;

  const handleUpdate = async () => {
    if (!isOwner && !isAssignee) return;
    setLoading(true);
    setError("");

    try {
      let updatePayload: Record<string, unknown> = {};
      
      // If Owner, they can edit everything including status.
      // If only Assignee, they can only edit status.
      if (isOwner) {
        updatePayload = { 
          title: editTitle, 
          description: editDesc, 
          deadline: editDeadline, 
          status 
        };
      } else if (isAssignee) {
        updatePayload = { status };
      }

      if (Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await supabase
          .from("tasks")
          .update(updatePayload)
          .eq("id", task.id);
        
        if (updateError) throw updateError;
      }

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
    if (!isOwner) return;
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

        {/* Info or Edit Form */}
        <div style={{ background: "var(--bg-main)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          {isOwner ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>Judul Tugas</label>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", outline: "none", fontWeight: 600 }} />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>Deskripsi</label>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", outline: "none" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>Tenggat Waktu</label>
                  <input type="date" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>Penugasan Dari</label>
                  <div style={{ padding: "8px", background: "var(--bg-card)", borderRadius: "6px", border: "1px solid var(--border-color)", color: "var(--text-main)", fontSize: "0.85rem" }}>
                    {task.assignerName || "Sistem"}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "8px", marginTop: 0 }}>
                {task.title}
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-main)", lineHeight: "1.5", marginBottom: "16px", marginTop: 0 }}>
                {task.description || "Tidak ada deskripsi."}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.82rem" }}>
                <div>
                  <div style={{ color: "var(--text-muted)", marginBottom: "2px" }}>Tenggat Waktu:</div>
                  <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{formatDate(task.deadline)}</div>
                </div>
                <div>
                  <div style={{ color: "var(--text-muted)", marginBottom: "2px" }}>Penugasan Dari:</div>
                  <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{task.assignerName || "Sistem"}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Editing */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
              Status Saat Ini
            </label>
            
            {isOwner || isAssignee ? (
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

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
          {isOwner ? (
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
            
            {(isOwner || isAssignee) && (
              <button
                onClick={handleUpdate}
                style={{ padding: "10px 18px", borderRadius: "8px", border: "none", background: "#008CBA", color: "#ffffff", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
                disabled={loading}
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
