import { supabase } from "./supabase";

/**
 * Pengecekan otomatis (Lazy Spawner) untuk mencetak tugas rutin
 * yang jadwalnya sudah tiba.
 */
export async function spawnRecurringTasks() {
  try {
    // 1. Ambil semua template tugas rutin
    const { data: templates, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("task_type", "rutin")
      .eq("is_template", true);

    if (error) throw error;
    if (!templates || templates.length === 0) return;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    const currentDayOfWeek = today.getDay(); // 0 = Ahad, 1 = Senin, ...

    for (const template of templates) {
      const lastSpawnDate = template.last_spawned_at ? new Date(template.last_spawned_at) : null;
      let needsSpawning = false;

      if (template.recurrence_interval === "monthly") {
        // Cek apakah hari ini sudah melewati atau pas tanggal rilis (recurrence_day)
        if (currentDay >= template.recurrence_day) {
          // Cek apakah bulan ini sudah pernah dicetak?
          if (!lastSpawnDate || lastSpawnDate.getMonth() !== currentMonth || lastSpawnDate.getFullYear() !== currentYear) {
            needsSpawning = true;
          }
        }
      } else if (template.recurrence_interval === "weekly") {
        // Cek apakah hari ini sudah melewati atau pas hari rilis (recurrence_day)
        if (currentDayOfWeek >= template.recurrence_day) {
          // Cari tahu tanggal rilis pekan ini (Sunday-based)
          const diffToRelease = currentDayOfWeek - template.recurrence_day;
          const releaseDateThisWeek = new Date(today);
          releaseDateThisWeek.setDate(today.getDate() - diffToRelease);
          
          // Bandingkan
          if (!lastSpawnDate || lastSpawnDate < releaseDateThisWeek) {
            needsSpawning = true;
          }
        }
      }

      if (needsSpawning) {
        // Hitung deadline
        const deadlineDate = new Date();
        deadlineDate.setDate(deadlineDate.getDate() + (template.deadline_duration_days || 7));
        const deadlineStr = deadlineDate.toISOString().split("T")[0];

        // Cetak tugas baru!
        const { error: insertError } = await supabase.from("tasks").insert([{
          title: template.title,
          description: template.description,
          assignee_id: template.assignee_id,
          assigner_id: template.assigner_id,
          committee_id: template.committee_id,
          status: "pending",
          task_type: "rutin",
          is_template: false,
          deadline: deadlineStr,
          parent_template_id: template.id
        }]);

        if (!insertError) {
          // Update last_spawned_at di template
          await supabase
            .from("tasks")
            .update({ last_spawned_at: today.toISOString().split("T")[0] })
            .eq("id", template.id);
        }
      }
    }
  } catch (err) {
    console.error("Gagal menjalankan spawner rutin:", err);
  }
}
