import { createClient } from 'jsr:@supabase/supabase-js@2';
import OpenAI from 'jsr:@openai/openai';

// Initialize OpenAI client with OpenRouter configuration
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: Deno.env.get('OPENROUTER_API_KEY'),
});

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  try {
    const { user_identifier } = await req.json();

    // 1. Find a random, unorganized file for the specified user
    const { data: randomFileData, error: randomFileError } = await supabase.rpc('get_unorganized_file', {
      p_user_identifier: user_identifier,
    });

    if (randomFileError) throw new Error(`Error finding random file: ${randomFileError.message}`);
    const randomFile = randomFileData[0]; // RPC returns an array
    if (!randomFile) return new Response(JSON.stringify({ message: 'No unorganized files found for this user.' }), { status: 200 });

    // 2. Find top 25 similar documents (initial broad search)
    const { data: similarDocs, error: similarDocsError } = await supabase.rpc('match_documents', {
      query_embedding: randomFile.embedding,
      p_user_identifier: user_identifier,
      match_threshold: 0.1, // Low threshold for a broad search
      match_count: 25,
    });

    if (similarDocsError) throw new Error(`Error matching documents: ${similarDocsError.message}`);

    // 3. Prepare prompt for LLM Re-ranking
    const fileList = similarDocs.map(doc => `- ${doc.filepath}`).join('\n');
    const rerankPrompt = `You are an expert file organization assistant. Your goal is to identify a coherent group of files from the list below that are related to the original file: ${randomFile.filepath}. Select the 5 to 7 files that are MOST relevant and form a coherent group. Respond ONLY with a JSON array of the full file paths. Here is the list of files:\n\n${fileList}`;

    // 4. Call OpenRouter for re-ranking
    const rerankResponse = await openrouter.chat.completions.create({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: rerankPrompt }],
      response_format: { type: 'json_object' },
    });

    const rerankedFilePaths = JSON.parse(rerankResponse.choices[0].message.content);

    // 5. Prepare prompt for naming the Smart Folder
    const namingPrompt = `You are an expert file organization assistant. Based on the following file paths, propose a concise, descriptive name and a one-sentence description for a folder that would contain them. Respond ONLY with a JSON object with the keys "name" and "description".\n\n${rerankedFilePaths.join('\n')}`;

    // 6. Call OpenRouter for naming
    const namingResponse = await openrouter.chat.completions.create({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: namingPrompt }],
      response_format: { type: 'json_object' },
    });

    const { name, description } = JSON.parse(namingResponse.choices[0].message.content);

    // 7. Create the Smart Folder and link files (transaction)
    const { data: newFolder, error: transactionError } = await supabase.rpc('create_smart_folder_and_link_files', {
        p_folder_name: name,
        p_folder_description: description,
        p_user_identifier: user_identifier,
        p_file_ids: similarDocs.filter(doc => rerankedFilePaths.includes(doc.filepath)).map(doc => doc.id)
    });

    if (transactionError) throw new Error(`Error in transaction: ${transactionError.message}`);

    return new Response(JSON.stringify(newFolder), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
