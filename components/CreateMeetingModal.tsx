"use client";

import React, { useState, useEffect } from "react";
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

const ONLINE_PLATFORMS = ["Zoom", "Google Meet", "Microsoft Teams", "Discord", "WhatsApp", "Lainnya"];
const OFFLINE_PLACES = ["Masjid Sekolah", "Ruang Kelas", "Aula Sekolah", "Kantin", "Lainnya"];

export default function CreateMeetingModal({
  isOpen,
  onClose,
  currentUser,
  meetingType,
  onMeetingCreated,
}: CreateMeetingModalProps) {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [locationType, setLocationType] = useState<"Offline" | "Online">("Offline");
  const [locationPreset, setLocationPreset] = useState("");
  const [locationCustom, setLocationCustom] = useState("");
  const [notetakerId, setNotetakerId] = useState("");
  const [targetAudienceType, setTargetAudienceType] = useState("Semua Pengurus");
  const [targetDepartment, setTargetDepartment] = useState("");
  const [availableUsers, setAvailableUsers] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    // Reset form
    setEventName("");
    setEventDate("");
    setEventTime("");
    setLocationType("Offline");
    setLocationPreset("");
    setLocationCustom("");
    setNotetakerId("");
    setTargetAudienceType("Semua Pengurus");
    setTargetDepartment("");
    setError("");

    // Fetch users for notetaker dropdown
    const fetchUsers = async () => {
      let query = supabase.from("users").select("id, name");
      if (meetingType === "Rapat Departemen" && currentUser.department?.id) {
        query = query.eq("department_id", currentUser.department.id);
      }
      const { data } = await query.order("name");
      if (data) setAvailableUsers(data);
    };

    const fetchDepartments = async () => {
      const { data } = await supabase.from("departments").select("id, name").order("name");
      if (data) setDepartments(data);
    };

    fetchUsers();
    fetchDepartments();
  }, [isOpen, meetingType, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!eventName || !eventDate) {
      setError("Nama rapat dan tanggal wajib diisi.");
      return;
    }

    // Build location detail: use custom if "Lainnya", otherwise preset
    const locationDetail = locationPreset === "Lainnya" ? locationCustom : locationPreset;

    // Target audience resolution
    let finalTargetAudience = "Semua Pengurus";
    if (meetingType === "Rapat Umum") {
      if (targetAudienceType === "Per Divisi" && targetDepartment) {
        finalTargetAudience = `Divisi: ${targetDepartment}`;
      } else {
        finalTargetAudience = targetAudienceType;
      }
    } else {
      // For Rapat Departemen, it is implicitly for that department
      finalTargetAudience = `Divisi: ${currentUser.department?.name}`;
    }

    setLoading(true);
    try {
      const { error: insertError } = await supabase.from("attendances").insert([
        {
          event_type: meetingType,
          event_name: eventName,
          event_date: eventDate,
          event_time: eventTime || null,
          creator_id: currentUser.id,
          location_type: locationType,
          location_detail: locationDetail || null,
          notetaker_id: notetakerId || null,
          target_audience: finalTargetAudience,
        },
      ]);

      if (insertError) throw insertError;

      onMeetingCreated();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat membuat rapat.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    fontSize: "0.9rem",
    outline: "none",
    background: "var(--bg-card)",
    color: "var(--text-main)",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--text-main)",
    marginBottom: "6px",
  };

  const presetOptions = locationType === "Online" ? ONLINE_PLATFORMS : OFFLINE_PLACES;

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
          Anda akan membuat jadwal <strong>{meetingType}</strong>.{" "}
          {meetingType === "Rapat Departemen" && currentUser.department?.name
            ? `(Departemen ${currentUser.department.name})`
            : ""}
        </div>

        {/* Target Audience (Only for Rapat Umum) */}
        {meetingType === "Rapat Umum" && (
          <div style={{ background: "var(--primary-50)", padding: "14px", borderRadius: "8px", border: "1px solid #bae6fd", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Peserta Rapat (Target Audiens)</label>
              <select
                value={targetAudienceType}
                onChange={(e) => {
                  setTargetAudienceType(e.target.value);
                  setTargetDepartment("");
                }}
                className="form-select w-full !border-[#7dd3fc]"
              >
                <option value="Semua Pengurus">Semua Pengurus</option>
                <option value="BPH + Kadiv">BPH + Kadiv</option>
                <option value="Per Divisi">Per Divisi (Departemen Tertentu)</option>
              </select>
            </div>
            {targetAudienceType === "Per Divisi" && (
              <div>
                <label style={labelStyle}>Pilih Departemen</label>
                <select
                  value={targetDepartment}
                  onChange={(e) => setTargetDepartment(e.target.value)}
                  className="form-select w-full !border-[#7dd3fc]"
                  required
                >
                  <option value="">-- Pilih --</option>
                  <option value="BPH">BPH</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Event Name */}
        <div>
          <label style={labelStyle}>Nama / Topik Rapat *</label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Contoh: Evaluasi Proker Bulan Juni"
            style={inputStyle}
            required
          />
        </div>

        {/* Date + Time */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={labelStyle}>Tanggal Pelaksanaan *</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Jam Mulai</label>
            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Location Type */}
        <div>
          <label style={labelStyle}>Tipe Pertemuan</label>
          <select
            value={locationType}
            onChange={(e) => {
              setLocationType(e.target.value as "Offline" | "Online");
              setLocationPreset("");
              setLocationCustom("");
            }}
            className="form-select w-full"
          >
            <option value="Offline">🏫 Tatap Muka (Offline)</option>
            <option value="Online">💻 Daring (Online)</option>
          </select>
        </div>

        {/* Location Detail — Preset Dropdown */}
        <div>
          <label style={labelStyle}>
            {locationType === "Online" ? "Platform yang Digunakan" : "Tempat Pelaksanaan"}
          </label>
          <select
            value={locationPreset}
            onChange={(e) => setLocationPreset(e.target.value)}
            className="form-select w-full"
          >
            <option value="">-- Pilih --</option>
            {presetOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Custom Input if "Lainnya" */}
        {locationPreset === "Lainnya" && (
          <div>
            <label style={labelStyle}>
              {locationType === "Online" ? "Nama Platform / Link" : "Nama Tempat"}
            </label>
            <input
              type="text"
              value={locationCustom}
              onChange={(e) => setLocationCustom(e.target.value)}
              placeholder={locationType === "Online" ? "Contoh: Telegram Group / Discord Server" : "Contoh: Rumah Ketua"}
              style={inputStyle}
            />
          </div>
        )}

        {/* Notetaker */}
        <div>
          <label style={labelStyle}>Notulen (Pencatat Rapat)</label>
          <select
            value={notetakerId}
            onChange={(e) => setNotetakerId(e.target.value)}
            className="form-select w-full"
          >
            <option value="">-- Belum Ditentukan --</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "6px" }}>
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
