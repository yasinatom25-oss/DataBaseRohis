"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types";
import { ArrowLeft, Save, Star } from "lucide-react";
import { verifyUserSession } from "@/lib/auth";

const CRITERIA = [
  { key: "perkataan", label: "Perkataan" },
  { key: "mutabaah", label: "Mutab" },
  { key: "dua_arah", label: "2 Arah" },
  { key: "antar", label: "Antar" },
  { key: "kerjasama", label: "Kerjasama" },
  { key: "kontribusi", label: "Kontribusi" },
  { key: "amanah", label: "Amanah" },
  { key: "akademik", label: "Akademik" },
  { key: "penyampaian", label: "Penyampaian" },
  { key: "diksi", label: "Diksi" },
  { key: "kepekaan", label: "Kepekaan" },
  { key: "inovasi", label: "Inovasi" },
  { key: "rapat", label: "Rapat" },
  { key: "kritis", label: "Kritis" }
];

export default function PenilaianBulananPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [departments, setDepartments] = useState<any[]>([]);

  const [canEdit, setCanEdit] = useState(false);
  const [canViewAll, setCanViewAll] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("rohiser_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      verifyUserSession(
        parsed,
        () => router.push("/login"),
        (updatedUser) => {
          setCurrentUser(updatedUser);
          checkAccessAndFetch(updatedUser);
        }
      );
    } else {
      router.push("/login");
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchAssessments();
    }
  }, [selectedMonth]);

  const checkAccessAndFetch = async (user: User) => {
    const safeRole = typeof user.role === "string" ? user.role : (user.role?.name || "");
    const safeRoleLower = safeRole.toLowerCase();
    
    const isBPH = safeRoleLower.includes("sekretaris") || safeRoleLower.includes("bendahara") || safeRoleLower.includes("wakil");
    const isKetum = safeRoleLower.includes("ketua umum") || safeRoleLower.includes("ketua_umum") || safeRoleLower.includes("pembina");
    const isKetuaDept = safeRoleLower.includes("ketua departemen") || safeRoleLower.includes("ketua_departemen");

    if (!isBPH && !isKetum && !isKetuaDept) {
      router.push("/dashboard");
      return;
    }

    setCanViewAll(isKetum || isBPH);
    setCanEdit(isKetum || isKetuaDept);

    try {
      let query = supabase.from("users").select("*, role:roles(*), department:departments(*)");
      
      const userDeptObj = typeof user.department === "string" ? null : (Array.isArray(user.department) ? user.department[0] : user.department);
      
      if (isKetuaDept && !isKetum) {
        if (userDeptObj?.id) {
          query = query.eq("department_id", userDeptObj.id);
        } else {
          // Fallback if no specific department id
          const rawDept = (user as any).department_id;
          if (rawDept) query = query.eq("department_id", rawDept);
        }
      }

      const { data: usersData, error } = await query;
      
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

        const sortedUsers = [...usersData].sort((a, b) => {
          const deptA = (Array.isArray(a.department) ? a.department[0]?.name : a.department?.name) || "Z";
          const deptB = (Array.isArray(b.department) ? b.department[0]?.name : b.department?.name) || "Z";
          if (deptA !== deptB) return deptA.localeCompare(deptB);

          const roleA = ((Array.isArray(a.role) ? a.role[0]?.name : a.role?.name) || "anggota").toLowerCase();
          const roleB = ((Array.isArray(b.role) ? b.role[0]?.name : b.role?.name) || "anggota").toLowerCase();

          const rankA = roleRank[roleA] || 99;
          const rankB = roleRank[roleB] || 99;

          if (rankA !== rankB) return rankA - rankB;
          return a.name.localeCompare(b.name);
        });
        setMembers(sortedUsers);
      }

      const { data: deptData } = await supabase.from("departments").select("*").order("name");
      if (deptData) {
        setDepartments(deptData);
      }

      await fetchAssessments();

    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("monthly_assessments")
        .select("*")
        .eq("month_year", selectedMonth);
      
      if (data) {
        const acc: Record<string, any> = {};
        data.forEach(item => {
          acc[item.user_id] = item;
        });
        setAssessments(acc);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleScoreChange = (userId: string, criteriaKey: string, value: string) => {
    const member = members.find(m => m.id === userId);
    if (!member || !canRateMember(member)) return;
    const numValue = parseInt(value, 10) || 0;
    
    setAssessments(prev => {
      const existing = prev[userId] || { user_id: userId, month_year: selectedMonth };
      return {
        ...prev,
        [userId]: {
          ...existing,
          [criteriaKey]: numValue
        }
      };
    });
  };

  const handleSaveAll = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const recordsToUpsert = Object.values(assessments).map(record => ({
        ...record,
        month_year: selectedMonth,
        assessor_id: currentUser?.id
      }));

      if (recordsToUpsert.length === 0) {
        alert("Tidak ada data untuk disimpan.");
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("monthly_assessments")
        .upsert(recordsToUpsert, { onConflict: "user_id,month_year" });

      if (error) throw error;
      alert("Penilaian berhasil disimpan!");
      fetchAssessments();
    } catch (err: any) {
      console.error(err);
      alert("Gagal menyimpan penilaian: " + (err.message || "Unknown error"));
    }
    setSaving(false);
  };

  const calculateTotal = (record: any) => {
    if (!record) return { total: 0, scale100: 0, grade: "D" };
    let sum = 0;
    CRITERIA.forEach(c => {
      sum += (record[c.key] || 0);
    });
    
    // max score is 14 * 4 = 56
    const maxScore = CRITERIA.length * 4;
    const scale100 = maxScore > 0 ? Math.round((sum / maxScore) * 100) : 0;
    
    let grade = "D";
    if (scale100 >= 93) grade = "A";
    else if (scale100 >= 86) grade = "B";
    else if (scale100 >= 77) grade = "C";

    return { total: sum, scale100, grade };
  };

  const filteredMembers = selectedDept === "all" 
    ? members 
    : members.filter(m => {
        const deptName = (Array.isArray(m.department) ? m.department[0]?.name : m.department?.name) || "BPH";
        return deptName === selectedDept;
      });

  const canRateMember = (member: any) => {
    if (!currentUser || !canEdit) return false;
    
    const evaluatorRole = (typeof currentUser.role === "string" ? currentUser.role : (currentUser.role?.name || "")).toLowerCase();
    const memberRole = ((Array.isArray(member.role) ? member.role[0]?.name : member.role?.name) || "anggota").toLowerCase();

    const isEvalPembina = evaluatorRole.includes("pembina");
    const isEvalKetum = evaluatorRole.includes("ketua umum") || evaluatorRole.includes("ketua_umum");
    const isEvalKetuaDept = evaluatorRole.includes("ketua departemen") || evaluatorRole.includes("ketua_departemen");

    const isMemberPembina = memberRole.includes("pembina");
    const isMemberKetum = memberRole.includes("ketua umum") || memberRole.includes("ketua_umum");
    const isMemberKetuaDept = memberRole.includes("ketua departemen") || memberRole.includes("ketua_departemen");

    if (isMemberPembina) return false;
    if (isMemberKetum) return isEvalPembina;
    if (isMemberKetuaDept) return isEvalKetum || isEvalPembina;
    
    if (isEvalKetuaDept || isEvalKetum || isEvalPembina) return true;

    return false;
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <main className="main-content min-h-screen bg-[var(--bg-main)]">
        <div style={{ maxWidth: "100%", margin: "0 auto", padding: "0 10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
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
                  Penilaian Bulanan
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", margin: 0 }}>
                  Evaluasi kinerja anggota. (Bulan: {selectedMonth})
                </p>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <select
                  value={selectedMonth.split("-")[1]}
                  onChange={(e) => {
                    const newM = e.target.value;
                    const newY = selectedMonth.split("-")[0];
                    setSelectedMonth(`${newY}-${newM}`);
                  }}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                    outline: "none"
                  }}
                >
                  <option value="01">Januari</option>
                  <option value="02">Februari</option>
                  <option value="03">Maret</option>
                  <option value="04">April</option>
                  <option value="05">Mei</option>
                  <option value="06">Juni</option>
                  <option value="07">Juli</option>
                  <option value="08">Agustus</option>
                  <option value="09">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>
                <select
                  value={selectedMonth.split("-")[0]}
                  onChange={(e) => {
                    const newY = e.target.value;
                    const newM = selectedMonth.split("-")[1];
                    setSelectedMonth(`${newY}-${newM}`);
                  }}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                    outline: "none"
                  }}
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              {canViewAll && (
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                    outline: "none"
                  }}
                >
                  <option value="all">Semua Departemen</option>
                  <option value="BPH">BPH</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              )}

              {canEdit && (
                <button
                  onClick={handleSaveAll}
                  disabled={saving}
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
                    cursor: saving ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 6px rgba(0,140,186,0.2)",
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  <Save size={18} /> {saving ? "Menyimpan..." : "Simpan Penilaian"}
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Memuat data penilaian...</div>
          ) : (
            <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-color)", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1200px" }}>
                <thead>
                  <tr style={{ background: "var(--bg-main)", borderBottom: "1px solid var(--border-color)" }}>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)", position: "sticky", left: 0, background: "var(--bg-main)", zIndex: 10 }}>NAMA</th>
                    {CRITERIA.map(c => (
                      <th key={c.key} style={{ padding: "14px 10px", textAlign: "center", fontSize: "0.80rem", color: "var(--text-muted)", width: "60px" }}>
                        <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", height: "100px", margin: "0 auto" }}>
                          {c.label}
                        </div>
                      </th>
                    ))}
                    <th style={{ padding: "14px 20px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "bold" }}>NILAI</th>
                    <th style={{ padding: "14px 20px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "bold" }}>MUTU</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => {
                    const record = assessments[m.id];
                    const { scale100, grade } = calculateTotal(record);
                    
                    let gradeColor = "var(--text-main)";
                    if (grade === "A") gradeColor = "#10b981"; // green
                    else if (grade === "B") gradeColor = "#3b82f6"; // blue
                    else if (grade === "C") gradeColor = "#f59e0b"; // yellow
                    else if (grade === "D") gradeColor = "#ef4444"; // red

                    return (
                      <tr key={m.id} style={{ borderBottom: "1px solid var(--hover-bg)" }}>
                        <td style={{ padding: "14px 20px", fontSize: "0.95rem", fontWeight: 500, color: "var(--text-main)", position: "sticky", left: 0, background: "var(--bg-card)", zIndex: 10 }}>
                          {m.name}
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "normal" }}>
                            {(Array.isArray(m.department) ? m.department[0]?.name : m.department?.name) || "BPH"}
                          </div>
                        </td>
                        
                        {CRITERIA.map(c => (
                          <td key={c.key} style={{ padding: "14px 10px", textAlign: "center" }}>
                            <select
                              value={record?.[c.key] || ""}
                              onChange={(e) => handleScoreChange(m.id, c.key, e.target.value)}
                              disabled={!canRateMember(m)}
                              style={{
                                padding: "4px",
                                borderRadius: "4px",
                                border: "1px solid var(--border-color)",
                                background: "var(--bg-main)",
                                color: "var(--text-main)",
                                outline: "none",
                                width: "45px",
                                textAlign: "center",
                                cursor: canRateMember(m) ? "pointer" : "not-allowed"
                              }}
                            >
                              <option value="">-</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                            </select>
                          </td>
                        ))}

                        <td style={{ padding: "14px 20px", textAlign: "center", fontWeight: 600, color: "var(--text-main)", fontSize: "1.05rem" }}>
                          {scale100}
                        </td>
                        <td style={{ padding: "14px 20px", textAlign: "center", fontWeight: 800, color: gradeColor, fontSize: "1.1rem" }}>
                          {grade}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredMembers.length === 0 && (
                <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>Tidak ada anggota yang dapat ditampilkan.</div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
