const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('tasks').insert([
    {
      title: 'Test',
      description: 'Test',
      assignee_id: 'd9b7b9f3-8b7a-4b7c-8b7a-4b7c8b7a4b7c', // we will use a real ID later
      status: 'pending',
      task_type: 'terencana'
    }
  ]);
  console.log('Error:', error);
}
test();
