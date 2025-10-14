import { Tool } from "../gateway";

export const echoTool: Tool = async (input: unknown) => {
  // Simple echo tool that returns the input
  return {
    message: "Echo response",
    input: input,
    timestamp: new Date().toISOString(),
  };
};
