// packages/electron-app/lib/fileProcessor.ts

import { generateEmbedding } from './minilmEmbeddings';
import { supabase } from './supabaseClient';

declare global {
  interface Window {
    electron: {
      readDirectory: (dirPath: string) => Promise<{ name: string; isDirectory: boolean; path: string }[]>;
      readFileContent: (filePath: string) => Promise<string>;
    };
  }
}

export async function processDirectory(directoryPath: string) {
  console.log(`Starting to process directory: ${directoryPath}`);
  try {
    const filesAndFolders = await window.electron.readDirectory(directoryPath);

    for (const item of filesAndFolders) {
      if (item.isDirectory) {
        // Recursively process subdirectories
        await processDirectory(item.path);
      } else {
        // Process files
        console.log(`Processing file: ${item.path}`);
        // For now, only process text-like files
        if (item.name.endsWith('.txt') || item.name.endsWith('.md') || item.name.endsWith('.js') || item.name.endsWith('.ts') || item.name.endsWith('.json') || item.name.endsWith('.py')) {
          try {
            const content = await window.electron.readFileContent(item.path);
            const embedding = await generateEmbedding(content);

            // Store in Supabase
            const { data, error } = await supabase
              .from('documents')
              .insert([
                {
                  content: content,
                  embedding: embedding,
                  filename: item.name,
                  filepath: item.path,
                  // Add other metadata as needed, e.g., file type, size, modified date
                },
              ]);

            if (error) {
              console.error(`Error inserting ${item.path} into Supabase:`, error);
            } else {
              console.log(`Successfully processed and stored: ${item.path}`);
            }
          } catch (fileError) {
            console.error(`Error processing file ${item.path}:`, fileError);
          }
        }
      }
    }
  } catch (dirError) {
    console.error(`Error reading directory ${directoryPath}:`, dirError);
  }
}
