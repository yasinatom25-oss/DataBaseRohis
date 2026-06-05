"use client";

import React from "react";
import type { Task, TaskStatus } from "@/lib/types";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ClipboardList,
} from "lucide-react";

interface AmanahListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onAddAmanah?: () => void;
}

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    badgeClass: "badge-warning",
    icon: <Clock size={14} />,
  },
  in_progress: {
    label: "Sedang Berjalan",
    badgeClass: "badge-primary",
    icon: <Clock size={14} />,
  },
  waiting_approval: {
    label: "Menunggu Approval",
    badgeClass: "badge-primary",
    icon: <AlertCircle size={14} />,
  },
  completed: {
    label: "Selesai",
    badgeClass: "badge-success",
    icon: <CheckCircle2 size={14} />,
  },
};

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "Siklus Rutin";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AmanahList({ tasks, onTaskClick, onAddAmanah }: AmanahListProps) {
  const sorted = [...tasks].sort(
    (a, b) => {
      if (a.isTemplate && !b.isTemplate) return -1;
      if (!a.isTemplate && b.isTemplate) return 1;
      if (a.isTemplate && b.isTemplate) return 0;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {sorted.map((task, idx) => {
        const cfg = STATUS_CONFIG[task.status];
        const days = task.isTemplate ? 0 : daysUntil(task.deadline);
        const isUrgent = !task.isTemplate && days <= 3 && task.status !== "completed";

        return (
          <React.Fragment key={task.id}>
            {/* ========================================================
                MOBILE VIEW (refactored)
               ======================================================== */}
            <div
              className="animate-fade-in-up flex flex-col md:hidden gap-3 p-4"
              style={{
                animationDelay: `${idx * 80}ms`,
                background: isUrgent ? "var(--danger-bg)" : "var(--bg-main)",
                borderRadius: "10px",
                border: isUrgent
                  ? "1px solid var(--danger-border)"
                  : "1px solid var(--border-color)",
                cursor: "pointer",
                transition: "all var(--transition-base)",
                padding: "16px",
                boxSizing: "border-box"
              }}
              onClick={() => onTaskClick?.(task)}
            >
              {/* --- Mobile Header: Title & Badge --- */}
              <div className="flex justify-between items-start gap-3 w-full">
                <div className="font-semibold text-sm text-[var(--text-main)] leading-snug">
                  {task.isTemplate && <span style={{ color: "#008CBA", fontSize: "0.7rem", background: "var(--primary-50)", padding: "2px 6px", borderRadius: "4px", marginRight: "6px" }}>[Master Rutin]</span>}
                  {task.title}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`badge ${cfg.badgeClass}`} style={{ fontSize: "0.65rem", padding: "4px 8px", boxSizing: "border-box" }}>{cfg.label}</span>
                  <ChevronRight size={14} style={{ color: "var(--border-color)" }} />
                </div>
              </div>

              {/* --- Mobile Content Row --- */}
              <div className="flex items-start gap-3 w-full">
                {/* Status icon */}
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      task.status === "pending"
                        ? "var(--status-pending-bg)"
                        : task.status === "in_progress"
                          ? "var(--status-progress-bg)"
                          : task.status === "waiting_approval"
                            ? "var(--status-waiting-bg)"
                            : "var(--status-completed-bg)",
                    color:
                      task.status === "pending"
                        ? "var(--status-pending-text)"
                        : task.status === "in_progress"
                          ? "var(--status-progress-text)"
                          : task.status === "waiting_approval"
                            ? "var(--status-waiting-text)"
                            : "var(--status-completed-text)",
                    flexShrink: 0,
                  }}
                >
                  {cfg.icon}
                </div>

                {/* Info Details Mobile */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex flex-col text-[0.7rem] text-[var(--text-muted)] gap-1.5">
                    <span>Dari: {task.assignerName}</span>
                    <span>Untuk: {task.assigneeName}</span>
                    <span
                      style={{
                        color: isUrgent ? "var(--danger-text)" : "var(--text-muted)",
                        fontWeight: isUrgent ? 600 : 400,
                      }}
                    >
                      {task.isTemplate ? "Siklus Rutin" : formatDate(task.deadline)}
                      {isUrgent && days > 0 && ` (${days} hari lagi)`}
                      {isUrgent && days <= 0 && " (Lewat deadline!)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================
                DESKTOP VIEW (exact replica of original)
               ======================================================== */}
            <div
              className="animate-fade-in-up hidden md:flex"
              style={{
                animationDelay: `${idx * 80}ms`,
                alignItems: "center",
                gap: "16px",
                padding: "16px 20px",
                background: isUrgent ? "var(--danger-bg)" : "var(--bg-main)",
                borderRadius: "10px",
                border: isUrgent
                  ? "1px solid var(--danger-border)"
                  : "1px solid var(--border-color)",
                cursor: "pointer",
                transition: "all var(--transition-base)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--primary-50)";
                e.currentTarget.style.borderColor = "#b3deec";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isUrgent ? "var(--danger-bg)" : "var(--bg-main)";
                e.currentTarget.style.borderColor = isUrgent ? "var(--danger-border)" : "var(--border-color)";
              }}
              onClick={() => onTaskClick?.(task)}
            >
              {/* Status icon */}
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    task.status === "pending"
                      ? "var(--status-pending-bg)"
                      : task.status === "in_progress"
                        ? "var(--status-progress-bg)"
                        : task.status === "waiting_approval"
                          ? "var(--status-waiting-bg)"
                          : "var(--status-completed-bg)",
                  color:
                    task.status === "pending"
                      ? "var(--status-pending-text)"
                      : task.status === "in_progress"
                        ? "var(--status-progress-text)"
                        : task.status === "waiting_approval"
                          ? "var(--status-waiting-text)"
                          : "var(--status-completed-text)",
                  flexShrink: 0,
                }}
              >
                {cfg.icon}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--text-main)",
                    overflow: "hidden",
                    marginBottom: "2px",
                  }}
                >
                  {task.isTemplate && <span style={{ color: "#008CBA", fontSize: "0.75rem", background: "var(--primary-50)", padding: "2px 6px", borderRadius: "4px", marginRight: "6px" }}>[Master Rutin]</span>}
                  {task.title}
                </div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span>Dari: {task.assignerName}</span>
                  <span>•</span>
                  <span>Untuk: {task.assigneeName}</span>
                  <span>•</span>
                  <span
                    style={{
                      color: isUrgent ? "var(--danger-text)" : "var(--text-muted)",
                      fontWeight: isUrgent ? 600 : 400,
                    }}
                  >
                    {task.isTemplate ? "Siklus Rutin" : formatDate(task.deadline)}
                    {isUrgent && days > 0 && ` (${days} hari lagi)`}
                    {isUrgent && days <= 0 && " (Lewat deadline!)"}
                  </span>
                </div>
              </div>

              {/* Badge + arrow */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexShrink: 0,
                }}
              >
                <span className={`badge ${cfg.badgeClass}`}>{cfg.label}</span>
                <ChevronRight size={16} style={{ color: "var(--border-color)" }} />
              </div>
            </div>
          </React.Fragment>
        );
      })}

      {sorted.length === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "48px 24px",
            background: "var(--bg-main)",
            borderRadius: "12px",
            border: "1px dashed var(--border-color)",
            color: "var(--text-muted)",
          }}
        >
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--primary-50)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <ClipboardList size={32} color="#008CBA" />
          </div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "8px" }}>Belum Ada Amanah</h3>
          <p style={{ fontSize: "0.85rem", maxWidth: "300px", margin: "0 auto 20px" }}>Saat ini tidak ada daftar amanah yang perlu dikerjakan atau berstatus pending.</p>
          {onAddAmanah && (
            <button
              onClick={onAddAmanah}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "10px",
                background: "#008CBA",
                color: "white",
                fontWeight: 600,
                fontSize: "0.85rem",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(0,140,186,0.3)"
              }}
              className="w-full md:w-auto"
            >
              + Tambah Amanah
            </button>
          )}
        </div>
      )}
    </div>
  );
}
