import { Transport, TransportKind } from "@thrive/realtime-contracts";

export interface TransportFactory {
  (kind: TransportKind): Transport;
}

export function createTransport(kind: TransportKind): Transport {
  switch (kind) {
    case "webrtc":
      // This will be implemented by the transport-webrtc package
      throw new Error("WebRTC transport not available - install @thrive/realtime-transport-webrtc");
    case "websocket":
      // This will be implemented by the transport-websocket package
      throw new Error("WebSocket transport not available - install @thrive/realtime-transport-websocket");
    default:
      throw new Error(`Unknown transport kind: ${kind}`);
  }
}
