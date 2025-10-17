import { Transport, TransportKind } from "@thrivereflections/realtime-contracts";
import { getSessionToken } from "./sessionProvider";

export interface TransportFactory {
  (kind: TransportKind, baseUrl?: string): Transport;
}

export function createTransport(kind: TransportKind, baseUrl?: string): Transport {
  const sessionProvider = () => getSessionToken(baseUrl);

  switch (kind) {
    case "webrtc":
      try {
        // Dynamic import to avoid circular dependencies
        const { createWebRTCTransport } = require("@thrivereflections/realtime-transport-webrtc");
        return createWebRTCTransport({}, { getSessionToken: sessionProvider });
      } catch (error) {
        throw new Error("WebRTC transport not available - install @thrivereflections/realtime-transport-webrtc");
      }
    case "websocket":
      try {
        // Dynamic import to avoid circular dependencies
        const { createWebSocketTransport } = require("@thrivereflections/realtime-transport-websocket");
        return createWebSocketTransport({}, { getSessionToken: sessionProvider });
      } catch (error) {
        throw new Error("WebSocket transport not available - install @thrivereflections/realtime-transport-websocket");
      }
    default:
      throw new Error(`Unknown transport kind: ${kind}`);
  }
}
