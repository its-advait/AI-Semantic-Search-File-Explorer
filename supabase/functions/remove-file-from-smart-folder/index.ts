import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { folder_id, file_id } = await req.json();
    if (!folder_id || !file_id) {
      throw new Error('Missing folder_id or file_id');
    }

    const { error } = await supabase.rpc('remove_file_from_smart_folder', {
      p_folder_id: folder_id,
      p_file_id: file_id,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ message: 'File removed successfully' }), {
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
