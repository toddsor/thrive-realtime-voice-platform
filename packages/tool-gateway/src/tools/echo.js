export const echoTool = async (input) => {
    // Simple echo tool that returns the input
    return {
        message: "Echo response",
        input: input,
        timestamp: new Date().toISOString(),
    };
};
