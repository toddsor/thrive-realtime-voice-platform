export class OpenAIEmbeddingProvider {
    constructor(apiKey, model = 'text-embedding-3-small') {
        this.apiKey = apiKey;
        this.model = model;
    }
    async generateEmbedding(text) {
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
        }
        catch (error) {
            console.error('Failed to generate embedding:', error);
            throw error;
        }
    }
    async generateEmbeddings(texts) {
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
            return data.data.map((item) => item.embedding);
        }
        catch (error) {
            console.error('Failed to generate embeddings:', error);
            throw error;
        }
    }
}
export class InMemoryVectorStore {
    constructor(embeddingProvider) {
        this.documents = new Map();
        this.embeddings = new Map();
        this.maxChunkSize = 512; // tokens (roughly 2000 characters)
        this.embeddingProvider = embeddingProvider;
    }
    async addDocument(doc) {
        try {
            // Generate embedding for the document
            const embedding = await this.embeddingProvider.generateEmbedding(doc.text);
            // Store document with embedding
            const documentWithEmbedding = {
                ...doc,
                embedding,
                createdAt: doc.createdAt || Date.now(),
                updatedAt: Date.now()
            };
            this.documents.set(doc.id, documentWithEmbedding);
            this.embeddings.set(doc.id, embedding);
        }
        catch (error) {
            console.error(`Failed to add document ${doc.id}:`, error);
            throw error;
        }
    }
    async addDocuments(docs) {
        try {
            // Generate embeddings for all documents in batch
            const texts = docs.map(doc => doc.text);
            const embeddings = await this.embeddingProvider.generateEmbeddings(texts);
            for (let i = 0; i < docs.length; i++) {
                const doc = docs[i];
                const embedding = embeddings[i];
                const documentWithEmbedding = {
                    ...doc,
                    embedding,
                    createdAt: doc.createdAt || Date.now(),
                    updatedAt: Date.now()
                };
                this.documents.set(doc.id, documentWithEmbedding);
                this.embeddings.set(doc.id, embedding);
            }
        }
        catch (error) {
            console.error('Failed to add documents:', error);
            throw error;
        }
    }
    async search(query, topK = 5) {
        const startTime = Date.now();
        try {
            // Generate embedding for the query
            const queryEmbedding = await this.embeddingProvider.generateEmbedding(query);
            // Calculate cosine similarity with all documents
            const similarities = [];
            for (const [docId, docEmbedding] of this.embeddings.entries()) {
                const doc = this.documents.get(docId);
                if (!doc)
                    continue;
                const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
                similarities.push({ doc, score: similarity });
            }
            // Sort by similarity score (descending) and take top K
            similarities.sort((a, b) => b.score - a.score);
            const topResults = similarities.slice(0, topK);
            // Convert to DocumentChunk format
            const chunks = topResults.map(({ doc, score }) => ({
                text: doc.text,
                source: doc.source,
                score,
                metadata: doc.metadata
            }));
            const searchTime = Date.now() - startTime;
            console.log(`Vector search completed in ${searchTime}ms, found ${chunks.length} results`);
            return chunks;
        }
        catch (error) {
            console.error('Vector search failed:', error);
            throw error;
        }
    }
    async getDocument(id) {
        return this.documents.get(id) || null;
    }
    async deleteDocument(id) {
        this.documents.delete(id);
        this.embeddings.delete(id);
    }
    async getAllDocuments() {
        return Array.from(this.documents.values());
    }
    async getDocumentCount() {
        return this.documents.size;
    }
    async clearAll() {
        this.documents.clear();
        this.embeddings.clear();
    }
    cosineSimilarity(a, b) {
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
    chunkDocument(text, maxChunkSize = this.maxChunkSize) {
        const words = text.split(' ');
        const chunks = [];
        let currentChunk = '';
        for (const word of words) {
            if (currentChunk.length + word.length + 1 > maxChunkSize) {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                    currentChunk = word;
                }
            }
            else {
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
export function createVectorStore(apiKey) {
    const embeddingProvider = new OpenAIEmbeddingProvider(apiKey);
    return new InMemoryVectorStore(embeddingProvider);
}
