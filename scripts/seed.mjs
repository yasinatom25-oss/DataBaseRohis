import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load from .env.local
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
import ws from "ws";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

async function seed() {
  console.log("Seeding Supabase database...");

  try {
    // 1. Roles
    const rolesData = [
      { name: "pembina" },
      { name: "bph" },
      { name: "kadiv" },
      { name: "sc_oc" },
      { name: "pj_mutabaah" },
      { name: "anggota" },
    ];
    
    let { data: roles, error: rolesErr } = await supabase.from("roles").select("*");
    if (rolesErr) throw rolesErr;

    if (roles.length === 0) {
      console.log("Inserting roles...");
      const res = await supabase.from("roles").insert(rolesData).select();
      if (res.error) throw res.error;
      roles = res.data;
    }

    // 2. Departments
    const deptsData = [{ name: "BPH" }, { name: "Tarbiyah" }, { name: "Syiar" }];
    let { data: departments, error: deptErr } = await supabase.from("departments").select("*");
    if (deptErr) throw deptErr;

    if (departments.length === 0) {
      console.log("Inserting departments...");
      const res = await supabase.from("departments").insert(deptsData).select();
      if (res.error) throw res.error;
      departments = res.data;
    }

    // 3. Users
    let { data: users, error: usersErr } = await supabase.from("users").select("*");
    if (usersErr) throw usersErr;

    if (users.length === 0) {
      console.log("Inserting users...");
      
      const getRole = (n) => roles.find((r) => r.name === n)?.id;
      const getDept = (n) => departments.find((d) => d.name === n)?.id;

      const usersData = [
        { email: "satya@rohis.id", name: "Satya Ghazi", gender: "ikhwan", role_id: getRole("bph"), department_id: getDept("BPH") },
        { email: "yasin@rohis.id", name: "Yasin Ghifari", gender: "ikhwan", role_id: getRole("kadiv"), department_id: getDept("Tarbiyah") },
        { email: "fulan@rohis.id", name: "Fulan Ahmad", gender: "ikhwan", role_id: getRole("anggota"), department_id: getDept("Tarbiyah") },
        { email: "aisyah@rohis.id", name: "Aisyah", gender: "akhwat", role_id: getRole("anggota"), department_id: getDept("Syiar") },
        { email: "nazhifa@rohis.id", name: "Nazhifa Jasmine", gender: "akhwat", role_id: getRole("pj_mutabaah"), department_id: getDept("BPH") },
      ];

      const res = await supabase.from("users").insert(usersData).select();
      if (res.error) throw res.error;
      users = res.data;
    }

    // 4. Tasks
    let { data: tasks, error: taskErr } = await supabase.from("tasks").select("*");
    if (taskErr) throw taskErr;

    if (tasks.length === 0) {
      console.log("Inserting tasks...");
      const getUserId = (email) => users.find(u => u.email === email)?.id;

      const tasksData = [
        {
          title: "Pembuatan TOR LDKS 2025",
          description: "Menyusun Terms of Reference untuk kegiatan LDKS tahun 2025",
          assignee_id: getUserId("satya@rohis.id"),
          assigner_id: getUserId("yasin@rohis.id"),
          status: "pending",
          deadline: "2025-06-15",
        },
        {
          title: "Laporan Bulanan Departemen Tarbiyah",
          description: "Menyusun laporan kegiatan bulanan departemen",
          assignee_id: getUserId("yasin@rohis.id"),
          assigner_id: getUserId("satya@rohis.id"),
          status: "waiting_approval",
          deadline: "2025-06-10",
        },
        {
          title: "Koordinasi Mentor Halaqah",
          description: "Menghubungi mentor untuk program halaqah",
          assignee_id: getUserId("fulan@rohis.id"),
          assigner_id: getUserId("yasin@rohis.id"),
          status: "pending",
          deadline: "2025-06-08",
        },
      ];

      const res = await supabase.from("tasks").insert(tasksData);
      if (res.error) throw res.error;
    }

    // 5. Meetings (Attendances)
    let { data: attendances, error: attErr } = await supabase.from("attendances").select("*");
    if (attErr) throw attErr;

    if (attendances.length === 0) {
      console.log("Inserting meetings...");
      const getUserId = (email) => users.find(u => u.email === email)?.id;

      const attData = [
        {
          event_type: "Rapat Umum",
          event_name: "Rapat Pleno Tengah Tahun",
          event_date: "2025-05-20",
          creator_id: getUserId("satya@rohis.id"),
        },
        {
          event_type: "Rapat Departemen",
          event_name: "Evaluasi Mentor",
          event_date: "2025-05-28",
          creator_id: getUserId("yasin@rohis.id"),
        }
      ];

      const res = await supabase.from("attendances").insert(attData);
      if (res.error) throw res.error;
    }

    console.log("Seeding complete!");
  } catch (err) {
    console.error("Error during seeding:", err);
  }
}

seed();
