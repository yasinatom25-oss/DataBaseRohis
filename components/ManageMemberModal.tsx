import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatRoleName } from "@/lib/rbac";
import { X, ArrowLeft } from "lucide-react";

export default function ManageMemberModal({ member, roles, departments, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [name, setName] = useState(member?.name || "");
  const [email, setEmail] = useState(member?.email || "");
  const [gender, setGender] = useState(member?.gender || "ikhwan");
  const [roleId, setRoleId] = useState(member?.role_id || "");
  const [departmentId, setDepartmentId] = useState(member?.department_id || "");

  useEffect(() => {
    if (!roleId && roles.length > 0) {
      setRoleId(roles.find((r: any) => r.name === "anggota")?.id || roles[0].id);
    }
    if (!departmentId && departments.length > 0) {
      setDepartmentId(departments.find((d: any) => d.name === "BPH")?.id || departments[0].id);
    }
  }, [roles, departments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const selectedRole = roles.find((r: any) => r.id === roleId);
      const roleName = selectedRole?.name;

      // VALIDATION LIMIT LOGIC
      let limitQuery = supabase.from("users").select("id").eq("role_id", roleId);
      let limitExceeded = false;
      let limitMessage = "";

      if (["ketua_umum", "sekretaris_umum", "bendahara_umum", "pembina"].includes(roleName)) {
        if (member) limitQuery = limitQuery.neq("id", member.id);
        const { data } = await limitQuery;
        if (data && data.length >= 1) {
          limitExceeded = true;
          limitMessage = `Posisi ${formatRoleName(selectedRole.name)} hanya bisa diisi oleh 1 orang.`;
        }
      } else if (["ketua_departemen", "sekretaris_departemen"].includes(roleName)) {
        limitQuery = limitQuery.eq("department_id", departmentId);
        if (member) limitQuery = limitQuery.neq("id", member.id);
        const { data } = await limitQuery;
        if (data && data.length >= 1) {
          limitExceeded = true;
          limitMessage = `Posisi ${formatRoleName(selectedRole.name)} di divisi ini sudah terisi.`;
        }
      }

      if (limitExceeded) {
        setError(limitMessage);
        setLoading(false);
        return;
      }

      const payload = {
        name,
        email,
        gender,
        role_id: roleId,
        department_id: departmentId
      };

      if (member) {
        // Edit Mode
        const { error: updateErr } = await supabase.from("users").update(payload).eq("id", member.id);
        if (updateErr) throw updateErr;
      } else {
        // Create Mode
        const { error: insertErr } = await supabase.from("users").insert([payload]);
        if (insertErr) throw insertErr;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal menyimpan data.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      padding: "20px"
    }}>
      <div className="animate-fade-in-up" style={{
        background: "var(--bg-card)", borderRadius: "16px", width: "100%", maxWidth: "500px",
        overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px" }} title="Kembali">
              <ArrowLeft size={22} />
            </button>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
              {member ? "Edit Anggota" : "Tambah Anggota Baru"}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          {error && (
            <div style={{ background: "var(--danger-bg)", color: "var(--danger-text)", padding: "12px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "20px", border: "1px solid var(--danger-border)" }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "8px" }}>Nama Lengkap</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border-color)", borderRadius: "8px", fontSize: "0.9rem", outline: "none" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "8px" }}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border-color)", borderRadius: "8px", fontSize: "0.9rem", outline: "none" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "8px" }}>Gender</label>
            <select value={gender} onChange={e => setGender(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border-color)", borderRadius: "8px", fontSize: "0.9rem", outline: "none", background: "var(--bg-card)" }}>
              <option value="ikhwan">Ikhwan</option>
              <option value="akhwat">Akhwat</option>
            </select>
          </div>

          <div style={{ marginBottom: "16px", display: "flex", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "8px" }}>Jabatan</label>
              <select value={roleId} onChange={e => setRoleId(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border-color)", borderRadius: "8px", fontSize: "0.9rem", outline: "none", background: "var(--bg-card)" }}>
                {roles.map((r: any) => (
                  <option key={r.id} value={r.id}>{formatRoleName(r.name)}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "8px" }}>Divisi</label>
              <select value={departmentId} onChange={e => setDepartmentId(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border-color)", borderRadius: "8px", fontSize: "0.9rem", outline: "none", background: "var(--bg-card)" }}>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px" }}>
            <button type="button" onClick={onClose}
              style={{ padding: "10px 16px", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)", borderRadius: "8px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}>
              Kembali
            </button>
            <button type="submit" disabled={loading}
              style={{ padding: "10px 16px", border: "none", background: "#008CBA", color: "#ffffff", borderRadius: "8px", fontSize: "0.9rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Menyimpan..." : "Simpan Anggota"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
