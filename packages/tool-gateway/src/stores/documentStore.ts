export interface Document {
  id: string;
  text: string;
  source: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
  createdAt?: number;
  updatedAt?: number;
}

export interface DocumentChunk {
  text: string;
  source: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface SearchResult {
  chunks: DocumentChunk[];
  usage: {
    query: string;
    totalDocs: number;
    chunksReturned: number;
    searchTimeMs: number;
  };
}

export interface DocumentStore {
  addDocument(doc: Document): Promise<void>;
  addDocuments(docs: Document[]): Promise<void>;
  search(query: string, topK?: number): Promise<SearchResult>;
  getDocument(id: string): Promise<Document | null>;
  deleteDocument(id: string): Promise<void>;
  getAllDocuments(): Promise<Document[]>;
  getDocumentCount(): Promise<number>;
  clearAll(): Promise<void>;
}

export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

export interface VectorStore {
  addDocument(doc: Document): Promise<void>;
  addDocuments(docs: Document[]): Promise<void>;
  search(query: string, topK?: number): Promise<DocumentChunk[]>;
  getDocument(id: string): Promise<Document | null>;
  deleteDocument(id: string): Promise<void>;
  getAllDocuments(): Promise<Document[]>;
  getDocumentCount(): Promise<number>;
  clearAll(): Promise<void>;
}
