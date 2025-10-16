import { ToolCallResponse } from "@thrivereflections/realtime-contracts";
import { VectorStore } from "../stores/documentStore";

export interface RetrieveToolArgs {
  query: string;
  topK?: number;
}

export interface RetrieveToolResult {
  chunks: Array<{
    text: string;
    source: string;
    score: number;
    metadata?: Record<string, unknown>;
  }>;
  usage: {
    query: string;
    totalDocs: number;
    chunksReturned: number;
    searchTimeMs: number;
  };
}

export async function handleRetrieve(args: RetrieveToolArgs, vectorStore: VectorStore): Promise<ToolCallResponse> {
  const startTime = Date.now();

  try {
    // Validate arguments
    if (!args.query || typeof args.query !== "string") {
      return {
        id: "retrieve-error",
        ok: false,
        error: "Query parameter is required and must be a string",
      };
    }

    const topK = Math.min(args.topK || 5, 20); // Cap at 20 results
    const query = args.query.trim();

    if (query.length === 0) {
      return {
        id: "retrieve-error",
        ok: false,
        error: "Query cannot be empty",
      };
    }

    // Perform search
    const chunks = await vectorStore.search(query, topK);
    const searchTime = Date.now() - startTime;
    const totalDocs = await vectorStore.getDocumentCount();

    // Format result
    const result: RetrieveToolResult = {
      chunks,
      usage: {
        query,
        totalDocs,
        chunksReturned: chunks.length,
        searchTimeMs: searchTime,
      },
    };

    return {
      id: "retrieve-success",
      ok: true,
      result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Retrieve tool error:", error);

    return {
      id: "retrieve-error",
      ok: false,
      error: `Search failed: ${errorMessage}`,
    };
  }
}

// Helper function to format search results for display
export function formatSearchResults(result: RetrieveToolResult): string {
  if (result.chunks.length === 0) {
    return "No relevant documents found in the knowledge base.";
  }

  let formatted = `Found ${result.chunks.length} relevant document(s):\n\n`;

  result.chunks.forEach((chunk, index) => {
    formatted += `${index + 1}. **${chunk.source}** (relevance: ${(chunk.score * 100).toFixed(1)}%)\n`;
    formatted += `   ${chunk.text}\n\n`;
  });

  formatted += `\n*Search completed in ${result.usage.searchTimeMs}ms*`;

  return formatted;
}
