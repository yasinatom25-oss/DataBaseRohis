// ============================
// Rohiser – Type Definitions
// ============================

export type Gender = "ikhwan" | "akhwat";

export type RoleName =
  | "pembina"
  | "ketua_umum"
  | "wakil_ketum"
  | "sekretaris_umum"
  | "wakil_sekretaris"
  | "bendahara_umum"
  | "wakil_bendahara"
  | "ketua_departemen"
  | "sekretaris_departemen"
  | "pj_program"
  | "anggota";

export interface Role {
  id: string;
  name: RoleName;
  label: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  gender: Gender;
  role: Role;
  department: Department | null;
  avatarUrl?: string;
  createdAt: string;
}

// Mutabaah
export interface MutabaahTarget {
  id: string;
  gender: Gender;
  paramName: string;
  targetValue: number;
}

export interface MutabaahLog {
  id: string;
  userId: string;
  logDate: string;
  values: number[]; // 12 params
  hafalanText: string;
  createdAt: string;
}

export interface MutabaahSummary {
  paramName: string;
  current: number;
  target: number;
  percentage: number;
}

// Amanah / Tasks
export type TaskStatus = "pending" | "in_progress" | "waiting_approval" | "completed";

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  assignerId: string;
  assignerName: string;
  committeeId?: string;
  status: TaskStatus;
  deadline: string;
  taskType?: "terencana" | "rutin";
  isTemplate?: boolean;
  recurrenceInterval?: "daily" | "weekly" | "monthly";
  recurrenceDay?: number;
  deadlineDurationDays?: number;
  lastSpawnedAt?: string;
  parentTemplateId?: string;
  createdAt: string;
}

// Attendance
export type AttendanceStatus = "Hadir" | "Izin" | "Sakit" | "Alpa";

export interface Attendance {
  id: string;
  eventType: string;
  eventName: string;
  eventDate: string;
  creatorId: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  attendanceId: string;
  userId: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface AttendanceSummary {
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  total: number;
  percentage: number;
}
