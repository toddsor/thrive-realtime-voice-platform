import { createDemoStore, DemoStoreConfig, DemoStoreDeps } from "./demoStore";
import { redact } from "@thrive/realtime-security";

// Store configuration
const config: DemoStoreConfig = {
  databaseUrl: process.env.DATABASE_URL || "",
  logLevel: process.env.NODE_ENV === "development" ? "warn" : "error",
};

// Store dependencies
const deps: DemoStoreDeps = {
  redact: redact,
};

// Create the demo store instance
export const demoStore = createDemoStore(config, deps);

// Export types for use in other files
export type { DemoStore, DemoSession, DemoFeedback } from "./demoStore";
