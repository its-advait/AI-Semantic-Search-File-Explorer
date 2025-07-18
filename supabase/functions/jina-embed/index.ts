// Get your Jina AI API key for free: https://jina.ai/?sui=apikey
import { createClient } from 'npm:@supabase/supabase-js@2';
Deno.serve(async (req)=>{
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method Not Allowed'
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 405
    });
  }
  try {
    const { text } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({
        error: 'Missing "text" in request body'
      }), {
        headers: {
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    const JINA_API_KEY = Deno.env.get('JINA_API_KEY');
    if (!JINA_API_KEY) {
      return new Response(JSON.stringify({
        error: 'JINA_API_KEY not set in environment variables'
      }), {
        headers: {
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    // Call Jina AI embedding API
    const jinaResponse = await fetch('https://api.jina.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JINA_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: 'jina-embeddings-v4',
        input: [
          text
        ]
      })
    });
    if (!jinaResponse.ok) {
      const errorData = await jinaResponse.json();
      console.error('Jina AI API error:', errorData);
      return new Response(JSON.stringify({
        error: 'Failed to get embedding from Jina AI',
        details: errorData
      }), {
        headers: {
          'Content-Type': 'application/json'
        },
        status: jinaResponse.status
      });
    }
    const jinaData = await jinaResponse.json();
    const embedding = jinaData.data[0].embedding;
    if (!embedding) {
      return new Response(JSON.stringify({
        error: 'Embedding not found in Jina AI response'
      }), {
        headers: {
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    // Initialize Supabase client
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    // Insert into Supabase database
    const { data, error } = await supabase.from('documents').insert([
      {
        content: text,
        embedding: embedding
      }
    ]);
    if (error) {
      console.error('Supabase insert error:', error);
      return new Response(JSON.stringify({
        error: 'Failed to insert embedding into Supabase',
        details: error.message
      }), {
        headers: {
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    return new Response(JSON.stringify({
      message: 'Embedding generated and stored successfully',
      data
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error.message
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
