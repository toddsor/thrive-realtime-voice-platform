// Demo-specific TypeScript types
// These types correspond to the demo Prisma schema

export interface DemoSessionData {
  id: string;
  userId: string;
  sessionName: string;
  demoType: 'voice' | 'chat' | 'video';
  metadata?: Record<string, any>;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  baseSessionId?: string;
}

export interface CreateDemoSessionInput {
  userId: string;
  sessionName: string;
  demoType: 'voice' | 'chat' | 'video';
  metadata?: Record<string, any>;
}

export interface UpdateDemoSessionInput {
  sessionName?: string;
  metadata?: Record<string, any>;
  status?: 'active' | 'completed' | 'cancelled';
}

export interface DemoFeedbackData {
  id: string;
  sessionId: string;
  userId: string;
  rating: number; // 1-5
  feedback?: string;
  category: string;
  createdAt: Date;
}

export interface CreateDemoFeedbackInput {
  sessionId: string;
  userId: string;
  rating: number; // 1-5
  feedback?: string;
  category: string;
}

export interface DemoAnalytics {
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  averageRating: number;
}

// Demo-specific API response types
export interface DemoSessionResponse {
  session: DemoSessionData;
}

export interface DemoSessionsResponse {
  sessions: DemoSessionData[];
}

export interface DemoFeedbackResponse {
  feedback: DemoFeedbackData;
}

export interface DemoAnalyticsResponse {
  analytics: DemoAnalytics;
}

// Demo-specific error types
export class DemoSessionError extends Error {
  constructor(message: string, public context?: Record<string, any>) {
    super(message);
    this.name = 'DemoSessionError';
  }
}

export class DemoFeedbackError extends Error {
  constructor(message: string, public context?: Record<string, any>) {
    super(message);
    this.name = 'DemoFeedbackError';
  }
}
