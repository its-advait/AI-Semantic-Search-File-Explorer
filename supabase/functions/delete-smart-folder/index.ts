import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { folder_id } = await req.json();
    if (!folder_id) {
      throw new Error('Missing folder_id');
    }

    const { error } = await supabase.rpc('delete_smart_folder', { p_folder_id: folder_id });

    if (error) throw error;

    return new Response(JSON.stringify({ message: 'Folder deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
