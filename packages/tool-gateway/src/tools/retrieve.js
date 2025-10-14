export const retrieveTool = async (input) => {
    // Simple retrieve tool that returns mock data
    // In a real implementation, this would perform vector search
    return {
        results: [
            {
                content: "This is a sample document about voice applications.",
                score: 0.95,
                source: "sample-doc-1",
            },
            {
                content: "Another document about real-time communication.",
                score: 0.87,
                source: "sample-doc-2",
            },
        ],
        query: input,
        timestamp: new Date().toISOString(),
    };
};
