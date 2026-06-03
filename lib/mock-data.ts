// ============================
// Rohiser – Mock Data for Demo
// ============================
import type {
  User,
  MutabaahSummary,
  Task,
  AttendanceSummary,
} from "./types";

// ============================
// USERS
// ============================

export const mockUserSatya: User = {
  id: "u-001",
  email: "satya@rohis.id",
  name: "Satya Ghazi",
  gender: "ikhwan",
  role: { id: "r-002", name: "ketua_umum", label: "BPH – Ketua Umum" },
  department: { id: "d-001", name: "BPH" },
  createdAt: "2024-07-01T00:00:00Z",
};
export const mockUserPembina: User = {
  id: "u-000",
  email: "pembina@rohis.id",
  name: "Fathimah Hasim",
  gender: "akhwat",
  role: { id: "r-001", name: "pembina", label: "Pembina" },
  department: { id: "d-001", name: "BPH" },
  createdAt: "2024-07-01T00:00:00Z",
};

// Users list (for login demo)
export const mockUsers: { email: string; password: string; user: User }[] = [
  { email: "pembina@rohis.id", password: "demo123", user: mockUserPembina },
  { email: "satya@rohis.id", password: "demo123", user: mockUserSatya },
];

// Provide default export for current user fallback
export const mockUser = mockUserSatya;

// ============================
// MUTABAAH
// ============================
export const mockMutabaahSummary: MutabaahSummary[] = [
  { paramName: "Shalat Tepat Waktu", current: 0, target: 100, percentage: 0 },
  { paramName: "Shalat Tahajjud", current: 0, target: 8, percentage: 0 },
  { paramName: "Shalat Dhuha", current: 0, target: 20, percentage: 0 },
  { paramName: "Shalat Rawatib", current: 0, target: 120, percentage: 0 },
  { paramName: "Shaum Sunnah", current: 0, target: 4, percentage: 0 },
  { paramName: "Tilawah & Murojaah", current: 0, target: 280, percentage: 0 },
  { paramName: "Tambah Hafalan", current: 0, target: 20, percentage: 0 },
  { paramName: "Al-Ma'tsurat Pagi", current: 0, target: 8, percentage: 0 },
  { paramName: "Al-Ma'tsurat Sore", current: 0, target: 12, percentage: 0 },
  { paramName: "Birrul Walidain", current: 0, target: 28, percentage: 0 },
  { paramName: "Infaq", current: 0, target: 4, percentage: 0 },
  { paramName: "Wawasan Islami", current: 0, target: 4, percentage: 0 },
];

export const mockMutabaahAverage = 0;

export const mockMutabaahHistory = [];

// ============================
// TASKS
// ============================
export const mockTasks: Task[] = [];

// ============================
// ATTENDANCE
// ============================
export const mockAttendanceSummary: AttendanceSummary = {
  hadir: 0,
  izin: 0,
  sakit: 0,
  alpa: 0,
  total: 0,
  percentage: 0,
};

export const mockMeetings = [];
