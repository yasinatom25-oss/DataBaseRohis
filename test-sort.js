import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function test() {
  const { data: usersData } = await supabase
    .from("users")
    .select("name, role:roles(name), department:departments(name)")
    
  const roleRank = {
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

  console.log(sortedUsers.map(u => `${u.name} - ${u.department?.name || 'Z'} - ${u.role?.name || 'anggota'}`))
}
test()
