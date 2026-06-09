require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function cleanup() {
  console.log("Fetching all tasks...");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/tasks?select=*`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`
    }
  });
  const tasks = await res.json();

  const taskMap = {};
  const toDelete = [];

  tasks.forEach(t => {
    if (t.is_template) return;
    if (t.status !== 'pending') return;
    if (t.task_type !== 'rutin') return;

    // Identify duplicates by parent_template_id and assignee_id
    const key = `${t.parent_template_id}-${t.assignee_id}`;
    if (!taskMap[key]) {
      taskMap[key] = t; // Keep the first
    } else {
      toDelete.push(t.id);
    }
  });

  console.log(`Found ${toDelete.length} duplicated pending tasks.`);

  if (toDelete.length > 0) {
    for (const id of toDelete) {
        await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        });
    }
    console.log("Successfully deleted duplicates.");
  }
}

cleanup();
