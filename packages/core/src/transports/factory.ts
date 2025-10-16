import { Transport, TransportKind } from "@thrive/realtime-contracts";
import { getSessionToken } from "./sessionProvider";

export interface TransportFactory {
  (kind: TransportKind): Transport;
}

export function createTransport(kind: TransportKind): Transport {
  switch (kind) {
    case "webrtc":
      try {
        // Dynamic import to avoid circular dependencies
        const { createWebRTCTransport } = require("@thrive/realtime-transport-webrtc");
        return createWebRTCTransport({}, { getSessionToken });
      } catch (error) {
        throw new Error("WebRTC transport not available - install @thrive/realtime-transport-webrtc");
      }
    case "websocket":
      try {
        // Dynamic import to avoid circular dependencies
        const { createWebSocketTransport } = require("@thrive/realtime-transport-websocket");
        return createWebSocketTransport({}, { getSessionToken });
      } catch (error) {
        throw new Error("WebSocket transport not available - install @thrive/realtime-transport-websocket");
      }
    default:
      throw new Error(`Unknown transport kind: ${kind}`);
  }
}
