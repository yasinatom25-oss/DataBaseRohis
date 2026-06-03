import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const { data: templates, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_template', true);
    
  if (fetchError) {
    console.error(fetchError);
    return;
  }
  
  console.log('Found', templates?.length, 'templates');
  for (const t of templates || []) {
    // Check if it already has children
    const { data: children } = await supabase.from('tasks').select('id').eq('parent_template_id', t.id);
    if (!children || children.length === 0) {
      console.log('Spawning for template', t.title);
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + (t.deadline_duration_days || 7));
      await supabase.from('tasks').insert([{
        title: t.title,
        description: t.description,
        assignee_id: t.assignee_id,
        assigner_id: t.assigner_id,
        status: 'pending',
        task_type: 'rutin',
        is_template: false,
        deadline: deadlineDate.toISOString().split("T")[0],
        parent_template_id: t.id
      }]);
    }
  }
}
fix();
