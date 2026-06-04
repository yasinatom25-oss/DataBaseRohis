"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, ClipboardList, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User } from "@/lib/types";
import { isBPH, isKadiv } from "@/lib/rbac";

export default function NotificationDropdown({ currentUser }: { currentUser: User | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      // Refresh setiap 5 menit agar pengingat rapat selalu akurat
      const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchNotifications() {
    if (!currentUser) return;
    const notifs = [];

    try {
      // 1. Cek Amanah yang belum dikerjakan
      const { data: pendingTasks, error: taskError } = await supabase
        .from("tasks")
        .select("id, title")
        .eq("assignee_id", currentUser.id)
        .in("status", ["pending"]);

      if (pendingTasks && pendingTasks.length > 0) {
        notifs.push({
          id: "tasks-pending",
          type: "amanah",
          title: "Amanah Tertunda",
          message: `Anda memiliki ${pendingTasks.length} amanah yang belum dikerjakan.`,
          link: "/amanah",
          time: "Baru saja",
          icon: <ClipboardList size={18} color="#d97706" />,
          iconBg: "#fef3c7"
        });
      }

      // 2. Cek apakah Mutabaah minggu ini sudah diisi (Ahad - Sabtu minggu berjalan)
      const today = new Date();
      // Cari hari minggu terdekat ke belakang
      const sunday = new Date(today);
      sunday.setDate(today.getDate() - today.getDay());
      sunday.setHours(0, 0, 0, 0);

      const { data: logsData, error: logError } = await supabase
        .from("mutabaah_logs")
        .select("id")
        .eq("user_id", currentUser.id)
        .gte("log_date", sunday.toISOString().split("T")[0]);

      if (!logsData || logsData.length === 0) {
        // Hanya ingatkan jika hari ini adalah Sabtu, Ahad, atau Senin
        const day = today.getDay();
        if (day === 0 || day === 1 || day === 6) {
          notifs.push({
            id: "mutabaah-pending",
            type: "mutabaah",
            title: "Waktunya Mutabaah",
            message: "Anda belum mengisi Mutabaah ibadah untuk pekan ini. Yuk isi sekarang!",
            link: "/mutabaah",
            time: "Baru saja",
            icon: <BookOpen size={18} color="#008CBA" />,
            iconBg: "var(--primary-50)"
          });
        }
      }

      // 3. Cek rapat yang akan dimulai dalam 1 jam ke depan
      const now = new Date();
      // Generate range: now → now + 75 menit (pakai 75 menit agar tidak terlalu ketat)
      const todayStr = now.toISOString().split("T")[0];

      const { data: upcomingMeetings } = await supabase
        .from("attendances")
        .select("id, event_name, event_date, event_time, event_type, notetaker_id, target_audience")
        .eq("event_date", todayStr)
        .eq("status", "Scheduled")
        .not("event_time", "is", null);

      if (upcomingMeetings) {
        const userIsBPH = isBPH(currentUser.role.name);
        const userIsKadiv = isKadiv(currentUser.role.name);

        for (const m of upcomingMeetings) {
          // Hitung selisih waktu
          const [hour, minute] = (m.event_time as string).split(":").map(Number);
          const meetingTime = new Date(now);
          meetingTime.setHours(hour, minute, 0, 0);
          const diffMs = meetingTime.getTime() - now.getTime();
          const diffMin = diffMs / 60000;

          // Hanya tampilkan jika 0–75 menit lagi
          if (diffMin < 0 || diffMin > 75) continue;

          // Target Audience filtering
          if (m.event_type === "Rapat Umum") {
            const aud = m.target_audience || "Semua Pengurus";
            if (aud !== "Semua Pengurus") {
              if (aud === "BPH + Kadiv" && !userIsBPH && !userIsKadiv) continue;
              if (aud.startsWith("Divisi: ")) {
                const targetDept = aud.replace("Divisi: ", "");
                if (targetDept === "BPH" && !userIsBPH) continue;
                if (targetDept !== "BPH" && currentUser.department?.name !== targetDept) continue;
              }
            }
          } else if (m.event_type === "Rapat Departemen") {
            // Rapat Departemen hanya untuk anggota departemen yang sama
            const deptName = currentUser.department?.name;
            if (!deptName) continue; // BPH tidak punya departemen, skip
          }

          const minsLeft = Math.round(diffMin);
          const timeLabel = minsLeft <= 5 ? "Sebentar lagi!" : `${minsLeft} menit lagi`;

          notifs.push({
            id: `meeting-${m.id}`,
            type: "rapat",
            title: `🔔 Rapat Segera Dimulai`,
            message: `"${m.event_name}" akan dimulai pukul ${m.event_time} — ${timeLabel}`,
            link: `/absensi/${m.id}`,
            time: `Hari ini ${m.event_time}`,
            icon: <span style={{ fontSize: "1.2rem" }}>📅</span>,
            iconBg: "#fef9c3",
          });
        }
      }

      setNotifications(notifs);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  }

  return (
    <div className="notification-container" style={{ position: "relative" }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "10px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          position: "relative",
          transition: "all 0.2s"
        }}
      >
        <Bell size={17} style={{ color: "var(--text-muted)" }} />
        {notifications.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: "6px",
              right: "8px",
              width: "8px",
              height: "8px",
              background: "var(--danger-text)",
              borderRadius: "50%",
              border: "2px solid var(--bg-card)"
            }}
          />
        )}
      </button>

      {isOpen && (
        <div
          className="animate-fade-in-up"
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "10px",
            width: "320px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            zIndex: 9999,
            overflow: "hidden"
          }}
        >
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>Notifikasi</h3>
            <span style={{ fontSize: "0.75rem", background: "var(--primary-50)", color: "#008CBA", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>
              {notifications.length} Baru
            </span>
          </div>
          
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "30px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Tidak ada notifikasi baru.
              </div>
            ) : (
              notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={notif.link}
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "16px",
                    borderBottom: "1px solid var(--border-color)",
                    textDecoration: "none",
                    transition: "background 0.2s"
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-main)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "var(--bg-card)")}
                >
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: notif.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {notif.icon}
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-main)" }}>{notif.title}</h4>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{notif.message}</p>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "6px", display: "block" }}>{notif.time}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
