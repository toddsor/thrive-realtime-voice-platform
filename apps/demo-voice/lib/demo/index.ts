/**
 * Demo-Specific Utilities
 *
 * This directory contains utilities specific to the demo application.
 * These are not reusable patterns but demo-specific implementations.
 */

// Demo-specific store operations
export { demoStore } from "../store";

// Demo-specific hooks
export { useRealtimeVoice } from "../hooks/useRealtimeVoice";

// Demo-specific components (re-exported for convenience)
export { default as VoicePage } from "../../app/demo/page";

// Demo-specific types
export type { ConnectionStatus, LatencyMark, Transcript, RetrievalMetrics } from "../hooks/useRealtimeVoice";
