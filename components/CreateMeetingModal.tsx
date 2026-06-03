"use client";

import React, { useState } from "react";
import Modal from "./Modal";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types";

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  meetingType: "Rapat Umum" | "Rapat Departemen";
  onMeetingCreated: () => void;
}

export default function CreateMeetingModal({
  isOpen,
  onClose,
  currentUser,
  meetingType,
  onMeetingCreated,
}: CreateMeetingModalProps) {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!eventName || !eventDate) {
      setError("Nama rapat dan tanggal wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const { error: insertError } = await supabase.from("attendances").insert([
        {
          event_type: meetingType,
          event_name: eventName,
          event_date: eventDate,
          creator_id: currentUser.id,
        },
      ]);

      if (insertError) throw insertError;

      // Success
      setEventName("");
      setEventDate("");
      onMeetingCreated();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat membuat rapat.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Jadwalkan ${meetingType}`}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {error && (
          <div style={{ padding: "10px", background: "var(--danger-bg)", color: "var(--danger-text)", borderRadius: "8px", fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        {/* Info Box */}
        <div style={{ padding: "12px", background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Anda akan membuat jadwal <strong>{meetingType}</strong>. {meetingType === "Rapat Departemen" && currentUser.department?.name ? `(Departemen ${currentUser.department.name})` : ""}
        </div>

        {/* Event Name */}
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
            Nama / Topik Rapat *
          </label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Contoh: Evaluasi Proker Bulan Juni"
            style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border-color)", borderRadius: "8px", fontSize: "0.9rem", outline: "none" }}
            required
          />
        </div>

        {/* Date */}
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
            Tanggal Pelaksanaan *
          </label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border-color)", borderRadius: "8px", fontSize: "0.9rem", outline: "none" }}
            required
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
            {loading ? "Menyimpan..." : "Buat Jadwal"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
