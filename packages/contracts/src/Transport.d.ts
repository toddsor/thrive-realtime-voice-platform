import { TransportKind } from "./RuntimeConfig";
export interface Transport {
    kind: TransportKind;
    connect(opts: {
        token: string;
        onEvent: (event: unknown) => void;
    }): Promise<void>;
    send(event: unknown): void;
    close(): Promise<void>;
}
export interface TransportFactory {
    (kind: TransportKind): Transport;
}
//# sourceMappingURL=Transport.d.ts.map
