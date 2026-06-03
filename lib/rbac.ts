import type { RoleName } from "./types";

/**
 * BPH (Badan Pengurus Harian) has global access.
 */
export function isBPH(role: RoleName | string): boolean {
  return [
    "ketua_umum",
    "wakil_ketum",
    "sekretaris_umum",
    "wakil_sekretaris",
    "bendahara_umum",
    "wakil_bendahara",
    "bph", // fallback
  ].includes(role);
}

/**
 * Kadiv (Ketua/Sekretaris Departemen) has division-level access.
 */
export function isKadiv(role: RoleName | string): boolean {
  return ["ketua_departemen", "sekretaris_departemen", "kadiv"].includes(role);
}

/**
 * Pembina has global view access.
 */
export function isPembina(role: RoleName | string): boolean {
  return role === "pembina";
}

/**
 * Anggota are regular members, PJ, or anyone else.
 */
export function isAnggota(role: RoleName | string): boolean {
  return role === "anggota" || role === "pj_program";
}

/**
 * Format raw role name into readable label
 */
export function formatRoleName(roleName: string): string {
  if (!roleName) return "Role Tidak Diketahui";
  const mapping: Record<string, string> = {
    pembina: "Pembina",
    ketua_umum: "Ketua Umum",
    wakil_ketum: "Wakil Ketua Umum",
    sekretaris_umum: "Sekretaris Umum",
    wakil_sekretaris: "Wakil Sekretaris",
    bendahara_umum: "Bendahara Umum",
    wakil_bendahara: "Wakil Bendahara",
    ketua_departemen: "Ketua Departemen",
    sekretaris_departemen: "Sekretaris Departemen",
    pj_program: "PJ Program",
    anggota: "Anggota",
    bph: "Badan Pengurus Harian (BPH)",
    kadiv: "Ketua Divisi",
  };
  return mapping[roleName] || roleName.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Can the user see global data? (BPH and Pembina)
 */
export function canViewGlobalData(role: RoleName | string): boolean {
  return isBPH(role) || isPembina(role) || role === "bph";
}

/**
 * Can the user create tasks or meetings? (BPH and Kadiv)
 */
export function canCreateRecords(role: RoleName | string): boolean {
  return isBPH(role) || isKadiv(role);
}
