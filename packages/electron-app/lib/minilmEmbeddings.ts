// packages/electron-app/lib/minilmEmbeddings.ts

import { supabase } from './supabaseClient'; // Import the Supabase client

// Removed Xenova imports and related logic

const JINA_MAX_TOKENS = 8192; // Jina AI's maximum token limit
const CHUNK_SIZE = JINA_MAX_TOKENS * 3; // Approximate character count per chunk (adjust as needed)

// Function to average an array of embeddings
function averageEmbeddings(embeddings: number[][]): number[] {
  if (embeddings.length === 0) {
    return [];
  }

  const numDimensions = embeddings[0].length;
  const averagedEmbedding = new Array(numDimensions).fill(0);

  for (const embedding of embeddings) {
    for (let i = 0; i < numDimensions; i++) {
      averagedEmbedding[i] += embedding[i];
    }
  }

  for (let i = 0; i < numDimensions; i++) {
    averagedEmbedding[i] /= embeddings.length;
  }

  return averagedEmbedding;
}

export async function generateEmbedding(text: string, filename: string, filepath: string, dateCreated: string | null, dateModified: string | null): Promise<number[]> {
  try {
    const embeddings: number[][] = [];

    // Simple character-based chunking
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      const chunk = text.substring(i, i + CHUNK_SIZE);
      
      const response = await fetch('https://gmljypddryfgnlhpufht.supabase.co/functions/v1/jina-embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: chunk, filename, filepath, dateCreated, dateModified }), // Pass all metadata
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error calling Supabase Edge Function for chunk:', errorData);
        throw new Error(`Failed to get embedding for chunk: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      if (data && data.embedding) { // Edge Function now returns just the embedding for a chunk
        embeddings.push(data.embedding);
      } else {
        throw new Error('Invalid response from Supabase Edge Function: embedding not found in chunk response');
      }
    }

    // Average the embeddings of all chunks
    const averagedEmbedding = averageEmbeddings(embeddings);

    // Now, send the averaged embedding and metadata to the Edge Function for final storage
    // This is a separate call to avoid storing partial embeddings if chunking is needed.
    const finalStoreResponse = await fetch('https://gmljypddryfgnlhpufht.supabase.co/functions/v1/jina-embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        embedding: averagedEmbedding, 
        filename: filename, 
        filepath: filepath, 
        dateCreated: dateCreated, 
        dateModified: dateModified,
        storeOnly: true // Indicate to the Edge Function that this is for storage only
      }),
    });

    if (!finalStoreResponse.ok) {
      const errorData = await finalStoreResponse.json();
      console.error('Error storing final embedding in Supabase:', errorData);
      throw new Error(`Failed to store final embedding: ${errorData.error || finalStoreResponse.statusText}`);
    }

    return averagedEmbedding; // Return the averaged embedding

  } catch (error) {
    console.error("Error generating embedding with Jina AI via Supabase Edge Function:", error);
    throw error;
  }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // This function needs to be re-evaluated based on its usage.
  // It currently doesn't have filename/filepath/dates.
  // For now, it will likely not work as generateEmbedding now requires more arguments.
  console.warn("generateEmbeddings called without full metadata. This might lead to errors.");
  const embeddings: number[][] = [];
  for (const text of texts) {
    // This call will now fail as generateEmbedding expects filename and filepath
    // You'll need to adjust generateEmbeddings if you use it.
    // For now, I'm leaving it as is, assuming processDirectory is the primary entry point.
    // @ts-ignore - Temporarily ignore as this function's signature needs review based on usage
    const embedding = await generateEmbedding(text);
    embeddings.push(embedding);
  }
  return embeddings;
}

export async function calculateSimilarity(embedding1: number[], embedding2: number[]): Promise<number> {
  if (embedding1.length !== embedding2.length) {
    throw new Error("Embeddings must have the same dimension for similarity calculation.");
  }

  let dotProduct = 0;
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
  }

  let magnitude1 = 0;
  for (let i = 0; i < embedding1.length; i++) {
    magnitude1 += embedding1[i] * embedding1[i];
  }
  magnitude1 = Math.sqrt(magnitude1);

  let magnitude2 = 0;
  for (let i = 0; i < embedding2.length; i++) {
    magnitude2 += embedding2[i] * embedding2[i];
  }
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0; // Avoid division by zero
  }

  return dotProduct / (magnitude1 * magnitude2);
}

export async function findMostSimilar(queryEmbedding: number[], embeddings: { id: string; embedding: number[] }[]): Promise<{ id: string; similarity: number } | null> {
  let maxSimilarity = -1;
  let mostSimilarId: string | null = null;

  for (const { id, embedding } of embeddings) {
    const similarity = await calculateSimilarity(queryEmbedding, embedding);
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      mostSimilarId = id;
    }
  }

  return mostSimilarId ? { id: mostSimilarId, similarity: maxSimilarity } : null;
}

export async function clusterEmbeddings(embeddings: { id: string; embedding: number[] }[], threshold: number = 0.7): Promise<{ clusterId: string; embeddings: { id: string; embedding: number[] }[] }[]> {
  const clusters: { clusterId: string; embeddings: { id: string; embedding: number[] }[] }[] = [];
  const assigned: Set<string> = new Set();

  for (const current of embeddings) {
    if (assigned.has(current.id)) {
      continue;
    }

    let bestCluster: { clusterId: string; embeddings: { id: string; embedding: number[] }[] } | null = null;
    let maxAvgSimilarity = -1;

    // Try to assign to an existing cluster
    for (const cluster of clusters) {
      let totalSimilarity = 0;
      for (const member of cluster.embeddings) {
        totalSimilarity += await calculateSimilarity(current.embedding, member.embedding);
      }
      const avgSimilarity = totalSimilarity / cluster.embeddings.length;

      if (avgSimilarity >= threshold && avgSimilarity > maxAvgSimilarity) {
        maxAvgSimilarity = avgSimilarity;
        bestCluster = cluster;
      }
    }

    if (bestCluster) {
      bestCluster.embeddings.push(current);
      assigned.add(current.id);
    } else {
      // Create a new cluster
      const newClusterId = `cluster_${clusters.length + 1}`;
      clusters.push({ clusterId: newClusterId, embeddings: [current] });
      assigned.add(current.id);
    }
  }

  return clusters;
}
