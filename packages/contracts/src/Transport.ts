import { TransportKind } from "./RuntimeConfig";
import type { ClientIdentity } from "./Identity";

export interface Transport {
  kind: TransportKind;
  connect(opts: { token: string; onEvent: (event: unknown) => void; identity?: ClientIdentity }): Promise<void>;
  send(event: unknown): void;
  close(): Promise<void>;
}

export interface TransportFactory {
  (kind: TransportKind): Transport;
}
