import { AgentConfig } from './AgentConfig';

export type Consent = 'DECLINED' | 'ACCEPTED';

export interface UserRef {
  appUserId: string;
  authUserId: string;
}

export interface Timings {
  providerSessionId: string;
  connectRequested: number;
  sessionIssued: number;
  webrtcConnected?: number;
  firstAudio?: number;
}

export interface TranscriptSegment {
  role: 'user' | 'assistant';
  text: string;
  startedAt: number;
  endedAt: number;
}

export interface ToolEvent {
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
}

export interface PersistenceStore {
  saveSessionMeta(
    sessionId: string,
    user: UserRef | null,
    config: AgentConfig,
    timings: Timings,
    consent: Consent
  ): Promise<void>;
  
  appendTranscript(sessionId: string, segment: TranscriptSegment): Promise<void>;
  
  appendToolEvent(sessionId: string, event: ToolEvent): Promise<void>;
  
  persistSummary(sessionId: string, summary: string): Promise<void>;
}
