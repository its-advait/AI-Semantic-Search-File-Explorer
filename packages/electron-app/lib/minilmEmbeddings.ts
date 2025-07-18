// packages/electron-app/lib/minilmEmbeddings.ts

import { supabase } from './supabaseClient'; // Import the Supabase client

// Removed Xenova imports and related logic

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('https://gmljypddryfgnlhpufht.supabase.co/functions/v1/jina-embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Assuming the Edge Function is public or handles auth internally
        // If it requires a JWT, you'd add: 'Authorization': `Bearer ${await supabase.auth.getSession()?.access_token}`
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error calling Supabase Edge Function:', errorData);
      throw new Error(`Failed to get embedding: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    // Assuming the Edge Function returns the embedding directly in the 'embedding' field
    // Adjust this based on the actual response structure of your Edge Function
    if (data && data.data && data.data[0] && data.data[0].embedding) {
      return data.data[0].embedding;
    } else {
      throw new Error('Invalid response from Supabase Edge Function: embedding not found');
    }
  } catch (error) {
    console.error("Error generating embedding with Jina AI via Supabase Edge Function:", error);
    throw error;
  }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (const text of texts) {
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
