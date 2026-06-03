"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types";
import { X, Save, AlertCircle } from "lucide-react";
import { formatRoleName } from "@/lib/rbac";

interface FillAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: any | null;
  currentUser: User;
}

interface AttendanceEntry {
  user_id: string;
  name: string;
  role: string;
  status: "Hadir" | "Izin" | "Sakit" | "Alpa" | "";
  notes: string;
  record_id?: string;
}

export default function FillAttendanceModal({ isOpen, onClose, meeting, currentUser }: FillAttendanceModalProps) {
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && meeting) {
      fetchData();
    }
  }, [isOpen, meeting]);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch Users
      let usersQuery = supabase.from("users").select("id, name, role:roles(name), department:departments(name)");
      
      const { data: usersData, error: usersError } = await usersQuery;
      if (usersError) throw usersError;

      let targetUsers = usersData || [];
      // Filter if departemen
      if (meeting.eventType === "Rapat Departemen") {
        targetUsers = targetUsers.filter((u: any) => {
          const deptName = Array.isArray(u.department) ? u.department[0]?.name : u.department?.name;
          return deptName === meeting.department;
        });
      }

      // 2. Fetch existing records for this meeting
      const { data: recordsData, error: recordsError } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("attendance_id", meeting.id);

      if (recordsError) throw recordsError;

      const recordsMap = new Map();
      (recordsData || []).forEach((r: any) => {
        recordsMap.set(r.user_id, r);
      });

      // 3. Map to entries
      const mappedEntries = targetUsers.map((u: any) => {
        const record = recordsMap.get(u.id);
        const roleName = Array.isArray(u.role) ? u.role[0]?.name : u.role?.name;
        return {
          user_id: u.id,
          name: u.name,
          role: roleName ? formatRoleName(roleName) : "Anggota",
          status: record?.status || "",
          notes: record?.notes || "",
          record_id: record?.id,
        };
      });

      setEntries(mappedEntries);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal mengambil data peserta.");
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = (userId: string, newStatus: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.user_id === userId ? { ...e, status: newStatus as any } : e))
    );
  };

  const handleNotesChange = (userId: string, notes: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.user_id === userId ? { ...e, notes } : e))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      // Filter out entries that have NO status selected to avoid inserting nulls if not wanted,
      // but usually we want to record Alpa for those who didn't attend.
      // Let's assume if status is empty, they haven't been marked yet. We will only save those with a status.
      const toUpsert = entries
        .filter((e) => e.status !== "")
        .map((e) => {
          const payload: any = {
            attendance_id: meeting.id,
            user_id: e.user_id,
            status: e.status,
            notes: e.notes,
          };
          if (e.record_id) {
            payload.id = e.record_id;
          }
          return payload;
        });

      if (toUpsert.length === 0) {
        alert("Belum ada status kehadiran yang diisi.");
        setSaving(false);
        return;
      }

      const { error: upsertError } = await supabase.from("attendance_records").upsert(toUpsert, { onConflict: "id" });
      if (upsertError) throw upsertError;

      alert("Data kehadiran berhasil disimpan!");
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !meeting) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="animate-fade-in-up"
        style={{
          background: "var(--bg-card)",
          borderRadius: "16px",
          width: "90%",
          maxWidth: "800px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border-color)" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)" }}>Isi Presensi: {meeting.eventName}</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
              {meeting.eventType} • {meeting.eventDate}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          {error && (
            <div style={{ background: "var(--danger-bg)", color: "var(--danger-text)", padding: "12px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "20px", border: "1px solid var(--danger-border)" }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Memuat data peserta...</div>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Tidak ada peserta yang ditemukan untuk rapat ini.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr 2fr", gap: "16px", padding: "0 12px", marginBottom: "8px", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
                <div>NAMA</div>
                <div>STATUS</div>
                <div>CATATAN</div>
              </div>
              
              {entries.map((entry) => (
                <div key={entry.user_id} style={{ display: "grid", gridTemplateColumns: "2fr 3fr 2fr", gap: "16px", alignItems: "center", background: "var(--bg-main)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-main)" }}>{entry.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{entry.role}</div>
                  </div>
                  
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {["Hadir", "Izin", "Sakit", "Alpa"].map((opt) => (
                      <label key={opt} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", color: "var(--text-main)", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name={`status-${entry.user_id}`}
                          value={opt}
                          checked={entry.status === opt}
                          onChange={() => handleStatusChange(entry.user_id, opt)}
                          style={{ cursor: "pointer" }}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Catatan..."
                      value={entry.notes}
                      onChange={(e) => handleNotesChange(entry.user_id, e.target.value)}
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-card)",
                        color: "var(--text-main)",
                        fontSize: "0.85rem",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "12px", background: "var(--bg-main)" }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{ padding: "10px 16px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)", borderRadius: "8px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            style={{ padding: "10px 16px", border: "none", background: "#008CBA", color: "#ffffff", borderRadius: "8px", fontSize: "0.9rem", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Save size={16} />
            {saving ? "Menyimpan..." : "Simpan Presensi"}
          </button>
        </div>
      </div>
    </div>
  );
}
