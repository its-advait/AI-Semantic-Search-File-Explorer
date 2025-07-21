import { createClient } from 'jsr:@supabase/supabase-js@2';

// Handler function for Deno Deploy
Deno.serve(async (req) => {
  // Create a Supabase client with the service role key
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { user } = await req.json();

    let pathPattern = '';
    let userIdentifier = '';

    if (user === 'samcr') {
      pathPattern = 'C:%';
      userIdentifier = 'samcr';
    } else if (user === 'noahlee') {
      // Use a pattern that matches macOS user paths
      pathPattern = '/Users/%'; 
      userIdentifier = 'noahlee';
    } else {
      return new Response(JSON.stringify({ error: 'Invalid user specified. Use "samcr" or "noahlee".' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update documents where the user_identifier is not yet set
    const { data, error } = await supabase
      .from('documents')
      .update({ user_identifier: userIdentifier })
      .like('filepath', pathPattern)
      .is('user_identifier', null);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ message: `Successfully tagged documents for ${userIdentifier}.`, data }), {
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