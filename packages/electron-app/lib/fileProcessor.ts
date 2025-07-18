// packages/electron-app/lib/fileProcessor.ts

import { generateEmbedding } from './minilmEmbeddings';
import { supabase } from './supabaseClient';

declare global {
  interface Window {
    electron: {
      readDirectory: (dirPath: string) => Promise<{ name: string; isDirectory: boolean; path: string; dateCreated: string | null; dateModified: string | null }[]>;
      parseAndExtractText: (filePath: string) => Promise<{ text?: string; error?: string }>;
    };
  }
}

interface ProcessProgress {
  totalFiles: number;
  processedFiles: number;
  currentFileName: string;
}

export async function processDirectory(directoryPath: string, onProgress?: (progress: ProcessProgress) => void) {
  console.log(`Starting to process directory: ${directoryPath}`);
  let totalFiles = 0;
  let processedFiles = 0;
  const filesToProcess: { name: string; path: string; dateCreated: string | null; dateModified: string | null }[] = [];

  // First, collect all files to process to get a total count
  const collectFiles = async (dir: string) => {
    const items = await window.electron.readDirectory(dir);
    for (const item of items) {
      if (item.isDirectory) {
        await collectFiles(item.path);
      } else {
        // Only consider files that parseAndExtractText might handle
        const fileExtension = item.name.split('.').pop()?.toLowerCase();
        if (['txt', 'md', 'js', 'ts', 'json', 'py', 'pdf', 'docx', 'html', 'css'].includes(fileExtension || '')) {
          filesToProcess.push({
            name: item.name,
            path: item.path,
            dateCreated: item.dateCreated,
            dateModified: item.dateModified,
          });
        }
      }
    }
  };

  await collectFiles(directoryPath);
  totalFiles = filesToProcess.length;

  for (const fileItem of filesToProcess) {
    processedFiles++;
    onProgress?.({
      totalFiles,
      processedFiles,
      currentFileName: fileItem.name,
    });

    console.log(`Attempting to process file: ${fileItem.path}`);
    
    try {
      const parseResult = await window.electron.parseAndExtractText(fileItem.path);

      if (parseResult.error) {
        console.warn(`Skipping ${fileItem.path}: ${parseResult.error}`);
        continue; // Skip this file if there's an error or it's unsupported/too large
      }

      const content = parseResult.text;

      if (content) {
        // Call generateEmbedding with filename, filepath, dateCreated, and dateModified
        // The generateEmbedding function will then call the jina-embed Edge Function
        await generateEmbedding(content, fileItem.name, fileItem.path, fileItem.dateCreated, fileItem.dateModified);

        // Note: The actual insertion into Supabase is now handled by the jina-embed Edge Function
        // This part of the code in fileProcessor.ts is simplified as it no longer directly inserts.
        // The jina-embed Edge Function will return a success/failure message.
        console.log(`Successfully sent ${fileItem.path} for embedding and storage.`);
      } else {
        console.warn(`No content extracted from ${fileItem.path}. Skipping.`);
      }

    } catch (fileError) {
      console.error(`Error processing file ${fileItem.path}:`, fileError);
    }
  }
}
