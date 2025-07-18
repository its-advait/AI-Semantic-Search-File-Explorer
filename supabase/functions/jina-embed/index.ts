// Get your Jina AI API key for free: https://jina.ai/?sui=apikey
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  try {
    const body = await req.json();
    const { text, filename, filepath, dateCreated, dateModified, embedding, storeOnly } = body;

    const JINA_API_KEY = Deno.env.get('JINA_API_KEY');
    if (!JINA_API_KEY) {
      return new Response(JSON.stringify({ error: 'JINA_API_KEY not set in environment variables' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    if (storeOnly) {
      // This is a request to store the final averaged embedding and metadata
      if (!embedding || !filename || !filepath) {
        return new Response(JSON.stringify({ error: 'Missing "embedding", "filename", or "filepath" for storage' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      const { data, error } = await supabase
        .from('documents')
        .insert([{
          embedding: embedding,
          filename: filename,
          filepath: filepath,
          date_created: dateCreated, // Use date_created
          date_modified: dateModified // Use date_modified
        }]);

      if (error) {
        console.error('Supabase insert error:', error);
        return new Response(JSON.stringify({ error: 'Failed to insert embedding into Supabase', details: error.message }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      return new Response(JSON.stringify({ message: 'Averaged embedding and metadata stored successfully', data }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });

    } else {
      // This is a request to generate an embedding for a text chunk
      if (!text) {
        return new Response(JSON.stringify({ error: 'Missing "text" for embedding generation' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Call Jina AI embedding API
      const jinaResponse = await fetch('https://api.jina.ai/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JINA_API_KEY}`,
          'Accept': 'application/json', // Ensure JSON response
        },
        body: JSON.stringify({
          model: 'jina-embeddings-v4', // Or your preferred Jina AI model
          input: [text],
        }),
      });

      if (!jinaResponse.ok) {
        const errorData = await jinaResponse.json();
        console.error('Jina AI API error:', errorData);
        return new Response(JSON.stringify({ error: 'Failed to get embedding from Jina AI', details: errorData }), {
          headers: { 'Content-Type': 'application/json' },
          status: jinaResponse.status,
        });
      }

      const jinaData = await jinaResponse.json();
      const generatedEmbedding = jinaData.data[0].embedding;

      if (!generatedEmbedding) {
        return new Response(JSON.stringify({ error: 'Embedding not found in Jina AI response' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      // Return only the embedding for the chunk
      return new Response(JSON.stringify({ embedding: generatedEmbedding }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});