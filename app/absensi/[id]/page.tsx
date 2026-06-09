"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types";
import RichTextEditor from "@/components/RichTextEditor";
import { ArrowLeft, MapPin, User as UserIcon, Calendar, CheckCircle, Wifi } from "lucide-react";

interface MeetingDetail {
  id: string;
  event_type: string;
  event_name: string;
  event_date: string;
  creator_id: string;
  created_at: string;
  location_type?: string;
  location_detail?: string;
  notetaker_id?: string;
  notes_content?: string;
  notetaker?: { name: string } | null;
}

export default function MeetingDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [notetakerName, setNotetakerName] = useState("Belum ditentukan");

  useEffect(() => {
    const stored = localStorage.getItem("rohiser_user");
    if (stored) {
      const parsedUser = JSON.parse(stored);
      setUser(parsedUser);
      setCurrentUserId(parsedUser.id);
    } else {
      router.push("/login");
      return;
    }
    fetchMeetingDetails();
  }, [id]);

  const fetchMeetingDetails = async () => {
    try {
      // Try with join first
      const { data, error } = await supabase
        .from("attendances")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setMeeting(data as MeetingDetail);
      setNotes(data.notes_content || "");

      // Fetch notetaker name separately to avoid FK join issues
      if (data.notetaker_id) {
        const { data: notetakerData } = await supabase
          .from("users")
          .select("name")
          .eq("id", data.notetaker_id)
          .single();
        if (notetakerData?.name) setNotetakerName(notetakerData.name);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async () => {
    if (!meeting) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("attendances")
        .update({ notes_content: notes })
        .eq("id", meeting.id);

      if (error) throw error;
      alert("✅ Notulensi berhasil disimpan!");
    } catch (err: any) {
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-main)", color: "var(--text-main)" }}>
        Memuat Detail Rapat...
      </div>
    );
  }

  if (!meeting || !user) {
    return <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Rapat tidak ditemukan.</div>;
  }

  const isNotetaker = !!(currentUserId && meeting.notetaker_id && meeting.notetaker_id === currentUserId);

  return (
    <div className="min-h-screen bg-bg-canvas">
      <main className="main-content fade-in min-h-screen bg-bg-canvas">

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", marginBottom: "24px", fontWeight: 600, fontSize: "0.9rem" }}
        >
          <ArrowLeft size={18} /> Kembali ke Daftar Rapat
        </button>

        {/* Header Card */}
        <div style={{ background: "linear-gradient(135deg, #008CBA 0%, #005f7a 100%)", borderRadius: "16px", padding: "30px", color: "white", marginBottom: "24px", boxShadow: "0 8px 24px rgba(0,140,186,0.25)" }}>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", padding: "4px 14px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: 700, marginBottom: "14px", letterSpacing: "0.04em" }}>
            {meeting.event_type}
          </div>
          <h1 style={{ fontSize: "1.9rem", fontWeight: 800, margin: "0 0 20px 0", lineHeight: 1.25 }}>
            {meeting.event_name}
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", fontSize: "0.9rem", opacity: 0.9 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={16} />
              {new Date(meeting.event_date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
            {meeting.location_type && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {meeting.location_type === "Online" ? <Wifi size={16} /> : <MapPin size={16} />}
                <strong>{meeting.location_type}</strong>
                {meeting.location_detail && ` — ${meeting.location_detail}`}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <UserIcon size={16} />
              Notulen: <strong>{notetakerName}</strong>
            </div>
          </div>
        </div>

        {/* Notulensi Section */}
        <div className="solid-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
                📝 Notulensi Rapat
              </h2>
              {isNotetaker && (
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Anda ditunjuk sebagai notulen. Gunakan toolbar di bawah untuk memformat teks.
                </p>
              )}
            </div>
            {isNotetaker && (
              <button
                onClick={saveNotes}
                disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 22px", borderRadius: "10px", border: "none", background: "#10b981", color: "white", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, boxShadow: "0 4px 14px rgba(16,185,129,0.3)", transition: "all 0.2s" }}
              >
                <CheckCircle size={18} />
                {saving ? "Menyimpan..." : "Simpan Notulensi"}
              </button>
            )}
          </div>

          {isNotetaker ? (
            <RichTextEditor value={notes} onChange={setNotes} />
          ) : (
            <div style={{ background: "var(--bg-main)", padding: "24px", borderRadius: "10px", border: "1px solid var(--border-color)", minHeight: "220px" }}>
              {notes ? (
                <>
                  <style>{`
                    .notulensi-content h1 { font-size: 1.5rem; font-weight: 700; margin: 12px 0 6px; color: var(--text-main); }
                    .notulensi-content h2 { font-size: 1.2rem; font-weight: 700; margin: 10px 0 5px; color: var(--text-main); }
                    .notulensi-content h3 { font-size: 1.05rem; font-weight: 600; margin: 8px 0 4px; color: var(--text-main); }
                    .notulensi-content p { color: var(--text-main); line-height: 1.75; margin: 6px 0; }
                    .notulensi-content ul { color: var(--text-main); padding-left: 20px; list-style-type: disc; }
                    .notulensi-content ol { color: var(--text-main); padding-left: 20px; list-style-type: decimal; }
                    .notulensi-content li { margin: 4px 0; }
                    .notulensi-content strong { font-weight: 700; }
                    .notulensi-content em { font-style: italic; }
                    .notulensi-content a { color: #008CBA; text-decoration: underline; }
                    .notulensi-content hr { border: none; border-top: 1px solid var(--border-color); margin: 12px 0; }
                  `}</style>
                  <div className="notulensi-content" dangerouslySetInnerHTML={{ __html: notes }} />
                </>
              ) : (
                <p style={{ color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", marginTop: "60px" }}>
                  Notulensi belum ditulis oleh notulen.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
