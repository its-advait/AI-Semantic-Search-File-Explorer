import { createClient } from 'jsr:@supabase/supabase-js@2';
import OpenAI from 'jsr:@openai/openai';

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: Deno.env.get('OPENROUTER_API_KEY'),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  try {
    const { user_identifier, topic } = await req.json();

    // 1. Get the embedding for the user's topic
    const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('jina-embed', {
      body: { text: topic }
    });
    if (embeddingError) throw new Error(`Embedding error: ${embeddingError.message}`);
    const queryEmbedding = embeddingData.embedding;

    // 2. Find the top 10 most relevant documents for that topic
    const { data: relevantDocs, error: docsError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      p_user_identifier: user_identifier,
      match_threshold: 0.1, // Start broad
      match_count: 10,
    });
    if (docsError) throw new Error(`Document matching error: ${docsError.message}`);

    // 3. Ask the LLM to give the folder a name and description
    const fileList = relevantDocs.map(doc => `- ${doc.filepath}`).join('\n');
    const namingPrompt = `You are an expert file organizer. The user wants to create a Smart Folder about \"${topic}\". Based on the following relevant files, propose a concise, descriptive name and a one-sentence description for the folder. Respond ONLY with a JSON object with the keys \"name\" and \"description\".\n\n${fileList}`;

    const namingResponse = await openrouter.chat.completions.create({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: namingPrompt }],
      response_format: { type: 'json_object' },
    });
    const { name, description } = JSON.parse(namingResponse.choices[0].message.content);

    // 4. Create the folder and link the files
    const { data: newFolder, error: transactionError } = await supabase.rpc('create_smart_folder_and_link_files', {
      p_folder_name: name,
      p_folder_description: description,
      p_user_identifier: user_identifier,
      p_file_ids: relevantDocs.map(doc => doc.id),
    });
    if (transactionError) throw new Error(`Transaction error: ${transactionError.message}`);

    return new Response(JSON.stringify(newFolder), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});