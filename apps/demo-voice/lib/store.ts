import { createDemoStore, DemoStoreConfig, DemoStoreDeps } from "./demoStore";
import { redact } from "@thrivereflections/realtime-security";
import { loadDatabaseConfig } from "@thrivereflections/realtime-config";

// Store configuration
const databaseConfig = loadDatabaseConfig();
const config: DemoStoreConfig = {
  databaseUrl: databaseConfig?.url || "",
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
