"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types";
import { Plus, Edit, Trash2, ShieldAlert, ArrowLeft } from "lucide-react";
import ManageMemberModal from "@/components/ManageMemberModal";
import { formatRoleName } from "@/lib/rbac";

export default function AnggotaPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("rohiser_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setCurrentUser(parsed);
      if (parsed.role.name !== "ketua_umum" && parsed.role.name !== "pembina") {
        router.push("/dashboard"); // Kick out unauthorized users
        return;
      }
      fetchData();
    } else {
      router.push("/login");
    }
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: usersData, error: uError } = await supabase
        .from("users")
        .select("*, role:roles(*), department:departments(*)");
        
      if (usersData) {
        const roleRank: Record<string, number> = {
          pembina: 1,
          ketua_umum: 2,
          wakil_ketum: 3,
          sekretaris_umum: 4,
          wakil_sekretaris: 5,
          bendahara_umum: 6,
          wakil_bendahara: 7,
          ketua_departemen: 8,
          sekretaris_departemen: 9,
          pj_program: 10,
          anggota: 11
        };

        const sortedUsers = usersData.sort((a, b) => {
          const deptA = (Array.isArray(a.department) ? a.department[0]?.name : a.department?.name) || "Z";
          const deptB = (Array.isArray(b.department) ? b.department[0]?.name : b.department?.name) || "Z";
          
          const isBphA = deptA.includes("BPH") ? 0 : 1;
          const isBphB = deptB.includes("BPH") ? 0 : 1;
          
          if (isBphA !== isBphB) return isBphA - isBphB;
          if (deptA !== deptB) return deptA.localeCompare(deptB);

          const roleA = (Array.isArray(a.role) ? a.role[0]?.name : a.role?.name) || "anggota";
          const roleB = (Array.isArray(b.role) ? b.role[0]?.name : b.role?.name) || "anggota";

          const rankA = roleRank[roleA] || 99;
          const rankB = roleRank[roleB] || 99;

          return rankA - rankB;
        });

        setMembers(sortedUsers);
      }

      const { data: rolesData } = await supabase.from("roles").select("*").order("name");
      if (rolesData) setRoles(rolesData);

      const { data: deptData } = await supabase.from("departments").select("*").order("name");
      if (deptData) {
        const validDepts = deptData.filter((d: any) => 
          !["Tarbiyah", "Syiar", "Tarbiyah Islamiah"].includes(d.name)
        );
        setDepartments(validDepts);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${name} dari sistem? Semua data terkait (mutabaah, amanah, absensi) juga akan terhapus.`)) return;
    try {
      // Cascading deletes (karena foreign key tidak memiliki ON DELETE CASCADE)
      await supabase.from("mutabaah_logs").delete().eq("user_id", id);
      await supabase.from("attendance_records").delete().eq("user_id", id);
      await supabase.from("tasks").delete().eq("assignee_id", id);
      await supabase.from("tasks").delete().eq("assigner_id", id);
      await supabase.from("attendances").delete().eq("creator_id", id);
      
      // Hapus pengguna
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) throw error;
      
      alert(`${name} berhasil dihapus dari sistem.`);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Gagal menghapus pengguna: " + (err.message || "Unknown error"));
    }
  };

  if (!currentUser) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      <main className="main-content" style={{ flex: 1, marginLeft: "256px", padding: "24px 28px", minHeight: "100vh", background: "var(--bg-main)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              color: "var(--text-main)",
              padding: "10px",
              borderRadius: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "4px"
            }}
            title="Kembali ke Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--text-main)", margin: 0, marginBottom: "6px" }}>
              Manajemen Anggota
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", margin: 0 }}>
              Kelola susunan pengurus dan mutasi divisi.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedMember(null);
            setIsModalOpen(true);
          }}
          style={{
            background: "#008CBA",
            color: "#ffffff",
            border: "none",
            padding: "10px 18px",
            borderRadius: "8px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,140,186,0.2)",
          }}
        >
          <Plus size={18} /> Tambah Anggota
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Memuat data anggota...</div>
      ) : (
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-color)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-main)", borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)" }}>NAMA</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)" }}>EMAIL</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)" }}>JABATAN</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)" }}>DIVISI</th>
                <th style={{ padding: "14px 20px", textAlign: "right", fontSize: "0.85rem", color: "var(--text-muted)" }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const roleObj = Array.isArray(m.role) ? m.role[0] : m.role;
                const deptObj = Array.isArray(m.department) ? m.department[0] : m.department;
                
                return (
                  <tr key={m.id} style={{ borderBottom: "1px solid var(--hover-bg)" }}>
                    <td style={{ padding: "14px 20px", fontSize: "0.95rem", fontWeight: 500, color: "var(--text-main)" }}>{m.name}</td>
                    <td style={{ padding: "14px 20px", fontSize: "0.9rem", color: "var(--text-muted)" }}>{m.email}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span className="badge badge-primary">
                        {roleObj?.name ? formatRoleName(roleObj.name) : "Anggota"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: "0.9rem", color: "var(--text-main)" }}>
                      {deptObj?.name || "BPH"}
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <button
                        onClick={() => {
                          setSelectedMember(m);
                          setIsModalOpen(true);
                        }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#008CBA", marginRight: "12px" }}
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id, m.name)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
                        title="Hapus"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {members.length === 0 && (
            <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>Belum ada anggota.</div>
          )}
        </div>
      )}

      {isModalOpen && (
        <ManageMemberModal
          member={selectedMember}
          roles={roles}
          departments={departments}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchData}
        />
      )}
        </div>
      </main>
    </div>
  );
}
