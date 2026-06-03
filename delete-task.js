require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log("Searching for tasks containing 'test amanah rutin'...");
  const { data: tasks, error: searchError } = await supabase
    .from('tasks')
    .select('id, title, is_template')
    .ilike('title', '%test amanah rutin%');

  if (searchError) {
    console.error("Search error:", searchError);
    return;
  }

  if (!tasks || tasks.length === 0) {
    console.log("No tasks found matching 'test amanah rutin'.");
    return;
  }

  console.log("Found tasks to delete:", tasks);
  
  // Also delete child tasks spawned from this template
  for (const task of tasks) {
    if (task.is_template) {
       console.log("Deleting child tasks for template:", task.id);
       const { error: childErr } = await supabase.from('tasks').delete().eq('parent_template_id', task.id);
       if (childErr) console.error("Error deleting children:", childErr);
    }
    console.log("Deleting task:", task.id);
    const { error: delErr } = await supabase.from('tasks').delete().eq('id', task.id);
    if (delErr) {
      console.error("Error deleting task:", task.id, delErr);
    } else {
      console.log("Deleted task successfully:", task.title);
    }
  }
}
main();
