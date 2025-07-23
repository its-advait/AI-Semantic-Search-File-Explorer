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
  console.log("--- New 'organize-files' request ---");
  try {
    const { user_identifier } = await req.json();
    console.log(`User Identifier: ${user_identifier}`);

    // 1. Find a random, unorganized file
    console.log("Step 1: Finding a random unorganized file...");
    const { data: randomFileData, error: randomFileError } = await supabase.rpc('get_unorganized_file', {
      p_user_identifier: user_identifier,
    });

    if (randomFileError) {
      console.error("Error in get_unorganized_file RPC:", randomFileError);
      throw new Error(`Error finding random file: ${randomFileError.message}`);
    }
    
    const randomFile = randomFileData[0];
    if (!randomFile) {
      console.log("No unorganized files found for this user. Exiting.");
      return new Response(JSON.stringify({ message: 'No unorganized files found for this user.' }), { status: 200 });
    }
    console.log(`Found random file: ${randomFile.filepath}`);

    // 2. Find similar documents
    console.log("Step 2: Finding similar documents...");
    const { data: similarDocs, error: similarDocsError } = await supabase.rpc('match_documents', {
      query_embedding: randomFile.embedding,
      p_user_identifier: user_identifier,
      match_threshold: 0.1,
      match_count: 25,
    });

    if (similarDocsError) {
      console.error("Error in match_documents RPC:", similarDocsError);
      throw new Error(`Error matching documents: ${similarDocsError.message}`);
    }
    console.log(`Found ${similarDocs.length} similar documents.`);

    // 3. Prepare prompt for LLM Re-ranking
    const fileList = similarDocs.map(doc => `- ${doc.filepath}`).join('\n');
    const rerankPrompt = `You are an expert file organization assistant. Your goal is to identify a coherent group of files from the list below that are related to the original file: ${randomFile.filepath}. Select the 5 to 7 files that are MOST relevant and form a coherent group. Respond ONLY with a JSON object containing a single key "paths" which is an array of the full file paths. Here is the list of files:\n\n${fileList}`;
    console.log("Step 3: Prepared re-rank prompt.");

    // 4. Call OpenRouter for re-ranking
    console.log("Step 4: Calling OpenRouter for re-ranking...");
    const rerankResponse = await openrouter.chat.completions.create({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: rerankPrompt }],
      response_format: { type: 'json_object' },
    });

    const llmRerankContent = rerankResponse.choices[0].message.content;
    console.log("LLM Re-rank Response Content:", llmRerankContent);

    let rerankedFilePaths;
    try {
      rerankedFilePaths = JSON.parse(llmRerankContent).paths;
      if (!Array.isArray(rerankedFilePaths)) {
          throw new Error("LLM response for reranking did not contain a 'paths' array.");
      }
    } catch (e) {
      console.error("Failed to parse LLM re-rank response:", e.message);
      throw new Error("Failed to parse LLM re-rank response.");
    }
    console.log(`Re-ranked and got ${rerankedFilePaths.length} file paths.`);

    if (rerankedFilePaths.length === 0) {
        console.log("LLM returned no files for the smart folder. Exiting.");
        return new Response(JSON.stringify({ message: "Could not determine a coherent group of files."}), { status: 200 });
    }

    // 5. Prepare prompt for naming the Smart Folder
    const namingPrompt = `You are an expert file organization assistant. Based on the following file paths, propose a concise, descriptive name and a one-sentence description for a folder that would contain them. Respond ONLY with a JSON object with the keys "name" and "description".\n\n${rerankedFilePaths.join('\n')}`;
    console.log("Step 5: Prepared naming prompt.");

    // 6. Call OpenRouter for naming
    console.log("Step 6: Calling OpenRouter for naming...");
    const namingResponse = await openrouter.chat.completions.create({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: namingPrompt }],
      response_format: { type: 'json_object' },
    });

    const llmNamingContent = namingResponse.choices[0].message.content;
    console.log("LLM Naming Response Content:", llmNamingContent);
    
    const { name, description } = JSON.parse(llmNamingContent);
    console.log(`Generated folder name: "${name}", Description: "${description}"`);

    // 7. Create the Smart Folder and link files
    const fileIdsToLink = similarDocs.filter(doc => rerankedFilePaths.includes(doc.filepath)).map(doc => doc.id);
    console.log(`Step 7: Creating smart folder and linking ${fileIdsToLink.length} files.`);
    
    const { data: newFolder, error: transactionError } = await supabase.rpc('create_smart_folder_and_link_files', {
        p_folder_name: name,
        p_folder_description: description,
        p_user_identifier: user_identifier,
        p_file_ids: fileIdsToLink
    });

    if (transactionError) {
      console.error("Error in create_smart_folder_and_link_files RPC:", transactionError);
      throw new Error(`Error in transaction: ${transactionError.message}`);
    }

    console.log("Successfully created smart folder:", newFolder);
    return new Response(JSON.stringify(newFolder), { status: 200 });

  } catch (error) {
    console.error("--- Uncaught Exception in 'organize-files' ---");
    console.error(error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});