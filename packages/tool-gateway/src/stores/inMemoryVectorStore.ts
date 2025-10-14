import { Document, DocumentChunk, VectorStore, EmbeddingProvider } from './documentStore';

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'text-embedding-3-small') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          model: this.model,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: texts,
          model: this.model,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.map((item: { embedding: number[] }) => item.embedding);
    } catch (error) {
      console.error('Failed to generate embeddings:', error);
      throw error;
    }
  }
}

export class InMemoryVectorStore implements VectorStore {
  private documents = new Map<string, Document>();
  private embeddings = new Map<string, number[]>();
  private embeddingProvider: EmbeddingProvider;
  private readonly maxChunkSize = 512; // tokens (roughly 2000 characters)

  constructor(embeddingProvider: EmbeddingProvider) {
    this.embeddingProvider = embeddingProvider;
  }

  async addDocument(doc: Document): Promise<void> {
    try {
      // Generate embedding for the document
      const embedding = await this.embeddingProvider.generateEmbedding(doc.text);
      
      // Store document with embedding
      const documentWithEmbedding: Document = {
        ...doc,
        embedding,
        createdAt: doc.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      this.documents.set(doc.id, documentWithEmbedding);
      this.embeddings.set(doc.id, embedding);
    } catch (error) {
      console.error(`Failed to add document ${doc.id}:`, error);
      throw error;
    }
  }

  async addDocuments(docs: Document[]): Promise<void> {
    try {
      // Generate embeddings for all documents in batch
      const texts = docs.map(doc => doc.text);
      const embeddings = await this.embeddingProvider.generateEmbeddings(texts);

      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        const embedding = embeddings[i];
        
        const documentWithEmbedding: Document = {
          ...doc,
          embedding,
          createdAt: doc.createdAt || Date.now(),
          updatedAt: Date.now()
        };

        this.documents.set(doc.id, documentWithEmbedding);
        this.embeddings.set(doc.id, embedding);
      }
    } catch (error) {
      console.error('Failed to add documents:', error);
      throw error;
    }
  }

  async search(query: string, topK: number = 5): Promise<DocumentChunk[]> {
    const startTime = Date.now();
    
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddingProvider.generateEmbedding(query);
      
      // Calculate cosine similarity with all documents
      const similarities: Array<{ doc: Document; score: number }> = [];
      
      for (const [docId, docEmbedding] of this.embeddings.entries()) {
        const doc = this.documents.get(docId);
        if (!doc) continue;

        const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
        similarities.push({ doc, score: similarity });
      }

      // Sort by similarity score (descending) and take top K
      similarities.sort((a, b) => b.score - a.score);
      const topResults = similarities.slice(0, topK);

      // Convert to DocumentChunk format
      const chunks: DocumentChunk[] = topResults.map(({ doc, score }) => ({
        text: doc.text,
        source: doc.source,
        score,
        metadata: doc.metadata
      }));

      const searchTime = Date.now() - startTime;
      console.log(`Vector search completed in ${searchTime}ms, found ${chunks.length} results`);

      return chunks;
    } catch (error) {
      console.error('Vector search failed:', error);
      throw error;
    }
  }

  async getDocument(id: string): Promise<Document | null> {
    return this.documents.get(id) || null;
  }

  async deleteDocument(id: string): Promise<void> {
    this.documents.delete(id);
    this.embeddings.delete(id);
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async getDocumentCount(): Promise<number> {
    return this.documents.size;
  }

  async clearAll(): Promise<void> {
    this.documents.clear();
    this.embeddings.clear();
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  // Utility method to chunk large documents
  chunkDocument(text: string, maxChunkSize: number = this.maxChunkSize): string[] {
    const words = text.split(' ');
    const chunks: string[] = [];
    let currentChunk = '';

    for (const word of words) {
      if (currentChunk.length + word.length + 1 > maxChunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = word;
        }
      } else {
        currentChunk += (currentChunk ? ' ' : '') + word;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}

// Factory function to create vector store
export function createVectorStore(apiKey: string): VectorStore {
  const embeddingProvider = new OpenAIEmbeddingProvider(apiKey);
  return new InMemoryVectorStore(embeddingProvider);
}
