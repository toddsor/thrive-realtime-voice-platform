export type EventType = "partial_transcript" | "final_transcript" | "latency_mark";

export interface Event {
  type: EventType;
  payload: unknown;
}

export interface PartialTranscriptEvent extends Event {
  type: "partial_transcript";
  payload: {
    text: string;
    timestamp: number;
  };
}

export interface FinalTranscriptEvent extends Event {
  type: "final_transcript";
  payload: {
    text: string;
    timestamp: number;
  };
}

export interface LatencyMarkEvent extends Event {
  type: "latency_mark";
  payload: {
    mark: string;
    timestamp: number;
    duration?: number;
  };
}
