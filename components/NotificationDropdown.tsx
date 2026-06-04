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
          icon: <ClipboardList size={18} className="text-amber-600 dark:text-amber-400" />,
          bgClass: "bg-amber-100 dark:bg-amber-900/30"
        });
      }

      // 2. Cek apakah Mutabaah minggu ini sudah diisi (Ahad - Sabtu minggu berjalan)
      const today = new Date();
      // Cari hari minggu terdekat ke belakang
      const sunday = new Date(today);
      sunday.setDate(today.getDate() - today.getDay());
      sunday.setHours(0, 0, 0, 0);
      
      const sundayStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, "0")}-${String(sunday.getDate()).padStart(2, "0")}`;

      const { data: logsData, error: logError } = await supabase
        .from("mutabaah_logs")
        .select("id")
        .eq("user_id", currentUser.id)
        .gte("log_date", sundayStr);

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
            icon: <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />,
            bgClass: "bg-blue-100 dark:bg-blue-900/30"
          });
        }
      }

      // 3. Cek rapat yang akan dimulai dalam 1 jam ke depan
      const now = new Date();
      // Generate range: now → now + 75 menit (pakai 75 menit agar tidak terlalu ketat)
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      const { data: upcomingMeetings } = await supabase
        .from("attendances")
        .select("id, event_name, event_date, event_time, event_type, notetaker_id")
        .eq("event_date", todayStr)
        .eq("status", "Scheduled")
        .not("event_time", "is", null);

      if (upcomingMeetings) {
        for (const m of upcomingMeetings) {
          // Hitung selisih waktu
          const [hour, minute] = (m.event_time as string).split(":").map(Number);
          const meetingTime = new Date(now);
          meetingTime.setHours(hour, minute, 0, 0);
          const diffMs = meetingTime.getTime() - now.getTime();
          const diffMin = diffMs / 60000;

          // Hanya tampilkan jika 0–75 menit lagi
          if (diffMin < 0 || diffMin > 75) continue;

          const minsLeft = Math.round(diffMin);
          const timeLabel = minsLeft <= 5 ? "Sebentar lagi!" : `${minsLeft} menit lagi`;

          notifs.push({
            id: `meeting-${m.id}`,
            type: "rapat",
            title: `🔔 Rapat Segera Dimulai`,
            message: `"${m.event_name}" akan dimulai pukul ${m.event_time} — ${timeLabel}`,
            link: `/absensi/${m.id}`,
            time: `Hari ini ${m.event_time}`,
            icon: <span className="text-lg leading-none">📅</span>,
            bgClass: "bg-yellow-100 dark:bg-yellow-900/30",
          });
        }
      }

      setNotifications(notifs);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-all duration-200"
      >
        <Bell size={18} className="text-[var(--text-muted)]" />
        {notifications.length > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--bg-card)]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-[90vw] sm:w-96 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-xl z-50 p-4 flex flex-col">

          
          {/* List of Notifications */}
          <div className="max-h-[350px] overflow-y-auto py-3 flex flex-col gap-4 shrink-0">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                Tidak ada notifikasi baru.
              </div>
            ) : (
              notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={notif.link}
                  onClick={() => setIsOpen(false)}
                  className="flex gap-4 p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-blue-300 hover:shadow-sm transition-all duration-200 group"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.bgClass}`}>
                    {notif.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-[var(--text-main)] mb-1 group-hover:text-blue-600 transition-colors">
                      {notif.title}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed m-0">
                      {notif.message}
                    </p>
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] mt-2 block uppercase tracking-wider opacity-70">
                      {notif.time}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Bottom Element */}
          <div className="mt-2 shrink-0">
             <Link 
               href="#" 
               onClick={(e) => { e.preventDefault(); setIsOpen(false); }}
               className="block text-center py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors w-full"
             >
               Tandai Semua Sudah Dibaca
             </Link>
          </div>
        </div>
      )}
    </div>
  );
}
