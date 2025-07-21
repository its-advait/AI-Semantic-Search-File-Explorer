# AI-Powered File Organization System
## Implementation Options & Recommendations

## 1. Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Electron App  │    │   Supabase      │    │   AI Provider   │
│   - UI          │◄──►│   - Auth        │◄──►│   - OpenRouter  │
│   - State       │    │   - Database    │    │   - Vertex AI   │
│   - Services    │    │   - Storage     │    │   - OpenAI      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 2. AI Provider Options

### Option A: OpenRouter
**Pros:**
- Single API for multiple models (GPT-4, Claude, etc.)
- Pay-as-you-go pricing
- No vendor lock-in
- Easy to switch models

**Cons:**
- Additional latency (extra hop)
- Limited control over models
- Potential rate limiting

**Implementation:**
```typescript
// src/services/openrouter.ts
class OpenRouterService {
  async generateText(prompt: string, model = 'anthropic/claude-3-haiku') {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    return response.json();
  }
}
```

### Option B: Google Vertex AI
**Pros:**
- Direct access to Google's latest models
- Better performance (lower latency)
- Enterprise-grade security
- Integration with Google Cloud

**Cons:**
- Steeper learning curve
- More complex setup
- Vendor lock-in

**Implementation:**
```typescript
// src/services/vertexAI.ts
import { v1 } from '@google-ai/generativelanguage';

class VertexAIService {
  private client: v1.GenerativeServiceClient;
  
  constructor() {
    this.client = new v1.GenerativeServiceClient({
      apiEndpoint: 'us-central1-aiplatform.googleapis.com',
      projectId: process.env.GOOGLE_CLOUD_PROJECT
    });
  }

  async generateText(prompt: string) {
    const [result] = await this.client.generateContent({
      model: 'projects/your-project/locations/us-central1/models/gemini-1.5-pro',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    });
    return result.candidates[0].content.parts[0].text;
  }
}
```

## 3. Embedding Options

### Jina AI Embeddings (2048d)
**Pros:**
- Larger context window
- Better semantic understanding
- Optimized for search

**Cons:**
- Larger storage requirements
- Slightly slower similarity search

### OpenAI Embeddings (1536d)
**Pros:**
- Well-tested
- Good balance of size/performance
- Widely supported

**Cons:**
- Paid API
- Rate limited

### Implementation (Supabase):
```sql
-- For Jina AI (2048d)
ALTER TABLE files 
  ALTER COLUMN embedding TYPE vector(2048);

-- Index for faster search
CREATE INDEX ON files 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);
```

## 4. Supabase Implementation

### Required Tables
```sql
-- Files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  path TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT,
  embedding VECTOR(2048), -- Jina AI uses 2048d
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Smart folders
CREATE TABLE smart_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  query_embedding VECTOR(2048),
  user_id UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Folder items (many-to-many)
CREATE TABLE smart_folder_items (
  folder_id UUID REFERENCES smart_folders ON DELETE CASCADE,
  file_id UUID REFERENCES files ON DELETE CASCADE,
  PRIMARY KEY (folder_id, file_id)
);
```

## 5. Implementation Roadmap

### Phase 1: Core Infrastructure
1. Set up Supabase with pgvector
2. Implement file upload and embedding generation
3. Create basic search functionality

### Phase 2: Smart Folders
1. Implement folder generation with AI
2. Create folder management UI
3. Add real-time updates

### Phase 3: Advanced Features
1. Add folder sharing
2. Implement collaborative editing
3. Add version history

## 6. Required Environment Variables
```bash
# .env
# Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-key

# AI Provider (choose one)
# OpenRouter
VITE_OPENROUTER_API_KEY=your-key

# OR Vertex AI
VITE_GOOGLE_CLOUD_PROJECT=your-project
VITE_GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json

# Embeddings
VITE_EMBEDDING_MODEL=jina-embeddings-v2-base-en
VITE_EMBEDDING_DIMENSIONS=2048
```

## 7. Performance Optimization

1. **Database Indexing**:
   ```sql
   CREATE INDEX ON files USING ivfflat (embedding vector_cosine_ops);
   ```

2. **Batch Processing**:
   ```typescript
   async function processFilesInBatch(files: File[], batchSize = 10) {
     for (let i = 0; i < files.length; i += batchSize) {
       const batch = files.slice(i, i + batchSize);
       await Promise.all(batch.map(processFile));
     }
   }
   ```

3. **Caching**:
   ```typescript
   const embeddingCache = new Map<string, number[]>();
   
   async function getCachedEmbedding(text: string): Promise<number[]> {
     const cacheKey = md5(text);
     if (embeddingCache.has(cacheKey)) {
       return embeddingCache.get(cacheKey)!;
     }
     const embedding = await generateEmbedding(text);
     embeddingCache.set(cacheKey, embedding);
     return embedding;
   }
   ```

## 8. Recommended Stack

| Component       | Recommendation         | Alternative       |
|-----------------|------------------------|-------------------|
| Frontend        | React + TypeScript     | Vue.js            |
| State Management| Jotai                  | Zustand/Redux     |
| AI Provider     | OpenRouter             | Vertex AI         |
| Embeddings      | Jina AI (2048d)        | OpenAI (1536d)    |
| Database        | Supabase + pgvector    | Pinecone          |
| Styling         | Tailwind CSS           | Chakra UI         |

## 9. Development Workflow

1. **Local Setup**:
   ```bash
   # Install dependencies
   pnpm install
   
   # Start dev server
   pnpm dev
   ```

2. **Testing**:
   ```bash
   # Run unit tests
   pnpm test
   
   # Run E2E tests
   pnpm test:e2e
   ```

3. **Deployment**:
   ```bash
   # Build for production
   pnpm build
   
   # Deploy to Vercel/Netlify
   pnpm deploy
   ```

## 10. Monitoring & Maintenance

1. **Logging**:
   ```typescript
   // src/utils/logger.ts
   export const logger = {
     info: (message: string, meta?: any) => 
       console.log(JSON.stringify({ level: 'info', message, ...meta })),
     error: (message: string, error?: Error) => 
       console.error(JSON.stringify({ level: 'error', message, error }))
   };
   ```

2. **Error Tracking**:
   ```typescript
   // src/utils/errorHandler.ts
   export function trackError(error: Error, context: Record<string, any> = {}) {
     logger.error(error.message, { ...context, stack: error.stack });
     // Send to error tracking service (Sentry, etc.)
   }
   ```

## 11. Next Steps

1. **Immediate Next Steps**:
   - Set up Supabase project with pgvector
   - Choose and configure AI provider (OpenRouter or Vertex AI)
   - Implement file upload and embedding generation
   - Create basic search functionality

2. **Future Enhancements**:
   - Implement smart folder generation
   - Add real-time collaboration features
   - Set up monitoring and alerting
   - Optimize performance for large file collections

## 12. Troubleshooting

### Common Issues

1. **Embedding Generation Fails**
   - Check API key permissions
   - Verify network connectivity
   - Check rate limits

2. **Slow Search Performance**
   - Verify database indexes
   - Check embedding dimensions match
   - Consider batch processing for large datasets

3. **Authentication Issues**
   - Verify Supabase credentials
   - Check CORS settings
   - Validate JWT tokens

## 13. Resources

- [Supabase Documentation](https://supabase.com/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenRouter API Reference](https://openrouter.ai/docs)
- [Google Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Jina AI Embeddings](https://jina.ai/embeddings/)
