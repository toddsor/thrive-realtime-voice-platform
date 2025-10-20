/**
 * Event Router for OpenAI Realtime WebRTC Events
 *
 * Maps OpenAI Realtime event types from DataChannel to application state
 * and provides typed event handlers for the voice interface.
 */

export interface RealtimeEvent {
  type: string;
  [key: string]: unknown;
}

export interface Transcript {
  id: string;
  role: "user" | "assistant";
  text: string;
  type: "partial" | "final";
  timestamp: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  timestamp: number;
}

export interface UsageInfo {
  total_tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
  cached_tokens?: number;
  input_token_details?: {
    text_tokens?: number;
    audio_tokens?: number;
    image_tokens?: number;
    cached_tokens?: number;
    cached_tokens_details?: {
      text_tokens?: number;
      audio_tokens?: number;
      image_tokens?: number;
    };
  };
  output_token_details?: {
    text_tokens?: number;
    audio_tokens?: number;
  };
}

export interface EventRouterCallbacks {
  onSessionCreated?: (sessionId: string, session: unknown) => void;
  onTranscript?: (transcript: Transcript) => void;
  onPartialTranscript?: (text: string) => void;
  onAudioResponse?: (audioData: Int16Array) => void;
  onToolCall?: (toolCall: ToolCall) => void;
  onToolCallDelta?: (callId: string, delta: string) => void;
  onToolCallDone?: (callId: string, args: Record<string, unknown>) => void;
  onSpeechStarted?: () => void;
  onSpeechStopped?: () => void;
  onResponseCompleted?: () => void;
  onUsageUpdate?: (usage: UsageInfo) => void;
  onError?: (error: unknown) => void;
  onLatencyMark?: (mark: string, timestamp: number) => void;
}

// Specific event types for better type safety
interface ResponseEvent extends RealtimeEvent {
  response?: {
    usage?: UsageInfo;
  };
  usage?: UsageInfo;
}

interface TranscriptEvent extends RealtimeEvent {
  transcript?: string;
  text?: string;
  delta?: string;
  content?: string;
  message?: string;
}

export class RealtimeEventRouter {
  private callbacks: EventRouterCallbacks;
  private currentUserTranscript: string = "";
  private currentAITranscript: string = "";
  private currentToolCall: { callId: string; arguments: string } | null = null;
  private processedToolCalls: Set<string> = new Set();

  constructor(callbacks: EventRouterCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Route an incoming event to the appropriate handler
   */
  routeEvent(event: RealtimeEvent): void {
    // Log all events with their data (excluding audio and potential PII fields)
    const logData = { ...event };
    if (logData.audio) {
      logData.audio = "[AUDIO_DATA_REMOVED_FOR_LOGGING]";
    }
    if ((logData as any).transcript) {
      (logData as any).transcript = "[REDACTED]";
    }
    if ((logData as any).text) {
      (logData as any).text = "[REDACTED]";
    }
    console.log("🔄 Routing event:", event.type, logData);

    // Debug: Log all event types to see what we're missing
    if (event.type.includes("input") || event.type.includes("transcription")) {
      console.log("🎤 INPUT/TRANSCRIPTION EVENT:", event.type, event);
    }

    // Log usage-related events specifically
    if (event.type.includes("usage") || event.type.includes("response") || event.type.includes("completion")) {
      console.log("📊 USAGE/RESPONSE EVENT:", event.type, logData);
    }

    switch (event.type) {
      case "session.created":
        this.handleSessionCreated(event);
        break;

      case "response.text.delta":
        this.handleTextDelta(event);
        break;

      case "response.audio.delta":
        this.handleAudioDelta(event);
        break;

      case "response.audio_transcript.delta":
        this.handleAudioTranscriptDelta(event);
        break;

      case "response.audio_transcript.done":
        this.handleAudioTranscriptDone(event);
        break;

      case "response.completed":
        this.handleResponseCompleted(event);
        break;

      case "input_audio_buffer.speech_started":
        this.handleSpeechStarted(event);
        break;

      case "input_audio_buffer.speech_stopped":
        this.handleSpeechStopped(event);
        break;

      case "input_audio_transcription.delta":
        this.handleInputTranscriptionDelta(event);
        break;

      case "input_audio_transcription.completed":
        this.handleInputTranscriptionCompleted(event);
        break;

      case "input_audio_buffer.committed":
        this.handleInputAudioBufferCommitted(event);
        break;

      case "conversation.item.created":
        this.handleConversationItemCreated(event);
        break;

      case "response.function_call_arguments.delta":
        this.handleToolCallDelta(event);
        break;

      case "response.function_call_arguments.done":
        this.handleToolCallDone(event);
        break;

      case "response.error":
        this.handleError(event);
        break;

      case "conversation.item.input_audio_transcription.completed":
        this.handleTranscriptionCompleted(event);
        break;

      case "conversation.item.completed":
        this.handleConversationItemCompleted(event);
        break;

      case "response.done":
        this.handleResponseDone(event);
        break;

      default:
        console.log("🔍 Unhandled event type:", event.type, event);

        // Check if this might contain usage information
        if (event.type.includes("usage") || event.type.includes("token") || event.type.includes("cost")) {
          console.log("💰 Potential usage event:", event.type, event);
        }

        // Check if this might be a response event with usage data
        if (event.type.includes("response") && (event as ResponseEvent).usage) {
          console.log("📊 Response event with usage data:", event.type, (event as ResponseEvent).usage);
        }

        // Check if this might be a user transcript event we haven't handled
        if (event.type.includes("input") || event.type.includes("user") || event.type.includes("transcript")) {
          console.log("🎤 POTENTIAL USER TRANSCRIPT EVENT:", event.type, event);

          // Try to extract transcript from various possible fields
          const transcriptEvent = event as TranscriptEvent;
          const possibleTranscript =
            transcriptEvent.transcript ||
            transcriptEvent.text ||
            transcriptEvent.delta ||
            transcriptEvent.content ||
            transcriptEvent.message;

          if (possibleTranscript && typeof possibleTranscript === "string") {
            console.log("📝 Found potential transcript text:", possibleTranscript);

            const transcript: Transcript = {
              id: crypto.randomUUID(),
              role: "user",
              text: possibleTranscript,
              type: "final",
              timestamp: Date.now(),
            };

            this.callbacks.onTranscript?.(transcript);
          }
        }
        break;
    }
  }

  private handleSessionCreated(event: RealtimeEvent): void {
    console.log("🎉 Session created event received:", event);

    const session = event.session as { id?: string } | undefined;
    const sessionId = session?.id;
    console.log("🎉 Extracted session ID:", sessionId);
    console.log("🎉 Has onSessionCreated callback:", !!this.callbacks.onSessionCreated);

    if (sessionId) {
      console.log("🎉 Calling onSessionCreated callback with:", sessionId);
      this.callbacks.onSessionCreated?.(sessionId, event.session);
      this.callbacks.onLatencyMark?.("sessionCreated", Date.now());
      console.log("🎉 Session created callback completed");
    } else {
      console.log("❌ No session ID found in event");
    }
  }

  private handleTextDelta(event: RealtimeEvent): void {
    const delta = event.delta as string | undefined;
    if (delta) {
      this.currentAITranscript += delta;
      console.log("📝 Text delta:", delta);
      console.log("📝 Current AI transcript:", this.currentAITranscript);

      this.callbacks.onPartialTranscript?.(this.currentAITranscript);
    }
  }

  private handleAudioDelta(event: RealtimeEvent): void {
    const delta = event.delta as string | undefined;
    if (delta) {
      console.log("🎵 Audio delta received");

      // Convert base64 audio data to Int16Array if needed
      try {
        const audioData = this.base64ToInt16Array(delta);
        this.callbacks.onAudioResponse?.(audioData);
        this.callbacks.onLatencyMark?.("firstAudio", Date.now());
      } catch (error) {
        console.error("❌ Failed to process audio delta:", error);
      }
    }
  }

  private handleResponseCompleted(event: RealtimeEvent): void {
    console.log("✅ Response completed - Full event data:", JSON.stringify(event, null, 2));

    // Check if the event contains usage information (either directly or in response)
    const responseEvent = event as ResponseEvent;
    const usage = responseEvent.usage || responseEvent.response?.usage;
    if (usage) {
      console.log("📊 Usage information received:", usage);
      this.callbacks.onUsageUpdate?.(usage as UsageInfo);
    } else {
      console.log("⚠️ No usage information found in response.completed event");
    }

    // Log all properties of the event to see what's available
    console.log("🔍 Event properties:", Object.keys(event));
    if (event.response) {
      console.log("📋 Response object:", event.response);
    }

    // Create final transcript if we have accumulated text
    if (this.currentAITranscript.trim()) {
      const transcript: Transcript = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: this.currentAITranscript.trim(),
        type: "final",
        timestamp: Date.now(),
      };

      this.callbacks.onTranscript?.(transcript);
      this.currentAITranscript = ""; // Reset for next response
    }

    this.callbacks.onResponseCompleted?.();
  }

  private handleResponseDone(event: RealtimeEvent): void {
    console.log("✅ Response done - Full event data:", JSON.stringify(event, null, 2));

    // Check if the event contains usage information (either directly or in response)
    const responseEvent = event as ResponseEvent;
    const usage = responseEvent.usage || responseEvent.response?.usage;
    if (usage) {
      console.log("📊 Usage information received in response.done:", usage);
      this.callbacks.onUsageUpdate?.(usage as UsageInfo);
    } else {
      console.log("⚠️ No usage information found in response.done event");
    }

    // Log all properties of the event to see what's available
    console.log("🔍 Event properties:", Object.keys(event));
    if (event.response) {
      console.log("📋 Response object:", event.response);
    }
  }

  private handleSpeechStarted(_event: RealtimeEvent): void {
    console.log("🎤 Speech started");
    this.callbacks.onSpeechStarted?.();
    this.callbacks.onLatencyMark?.("speechStarted", Date.now());
  }

  private handleSpeechStopped(_event: RealtimeEvent): void {
    console.log("🔇 Speech stopped");
    this.callbacks.onSpeechStopped?.();
    this.callbacks.onLatencyMark?.("speechStopped", Date.now());
  }

  private handleToolCallDelta(event: RealtimeEvent): void {
    const callId = event.call_id as string | undefined;
    const delta = event.delta as string | undefined;

    if (callId && delta) {
      console.log("🔧 Tool call delta:", callId, delta);

      if (!this.currentToolCall || this.currentToolCall.callId !== callId) {
        this.currentToolCall = { callId, arguments: "" };
      }

      this.currentToolCall.arguments += delta;
      this.callbacks.onToolCallDelta?.(callId, delta);
    }
  }

  private handleToolCallDone(event: RealtimeEvent): void {
    const callId = event.call_id as string | undefined;
    const argsStr = this.currentToolCall?.callId === callId ? this.currentToolCall?.arguments : "";

    if (callId && argsStr) {
      // Check if we've already processed this tool call
      if (this.processedToolCalls.has(callId)) {
        console.log("⚠️ Duplicate tool call detected, skipping:", callId);
        return;
      }

      console.log("🔧 Tool call done:", callId, argsStr);

      try {
        const parsedArgs = JSON.parse(argsStr);
        const toolCall: ToolCall = {
          id: callId,
          name: (event.name as string) || "unknown",
          arguments: parsedArgs,
          timestamp: Date.now(),
        };

        // Mark this tool call as processed
        this.processedToolCalls.add(callId);

        this.callbacks.onToolCall?.(toolCall);
        this.callbacks.onToolCallDone?.(callId, parsedArgs);
        this.callbacks.onLatencyMark?.("toolCallDone", Date.now());
      } catch (error) {
        console.error("❌ Failed to parse tool call arguments:", error);
        this.callbacks.onError?.(error);
      }

      // Reset current tool call
      this.currentToolCall = null;
    }
  }

  private handleError(event: RealtimeEvent): void {
    console.error("❌ Response error:", event);
    this.callbacks.onError?.(event);
  }

  private handleConversationItemCreated(event: RealtimeEvent): void {
    console.log("💬 Conversation item created:", event);

    const item = event.item as
      | {
          type?: string;
          id?: string;
          name?: string;
          arguments?: Record<string, unknown>;
          role?: string;
          transcript?: string;
          formatted?: { text?: string };
        }
      | undefined;

    if (item?.type === "function_call") {
      const callId = item.id || crypto.randomUUID();

      // Check if we've already processed this tool call
      if (this.processedToolCalls.has(callId)) {
        console.log("⚠️ Duplicate function call detected, skipping:", callId);
        return;
      }

      const toolCall: ToolCall = {
        id: callId,
        name: item.name || "unknown",
        arguments: item.arguments || {},
        timestamp: Date.now(),
      };

      // Mark this tool call as processed
      this.processedToolCalls.add(callId);

      this.callbacks.onToolCall?.(toolCall);
    } else if (item?.type === "message" && item?.role === "user") {
      // Handle user message/transcript
      console.log("👤 User message created:", item);

      const transcriptText = item.transcript || item.formatted?.text;
      if (transcriptText) {
        const transcript: Transcript = {
          id: item.id || crypto.randomUUID(),
          role: "user",
          text: transcriptText,
          type: "final",
          timestamp: Date.now(),
        };

        this.callbacks.onTranscript?.(transcript);
      }
    }
  }

  private handleTranscriptionCompleted(event: RealtimeEvent): void {
    console.log("📝 Transcription completed:", event);

    const item = event.item as { transcript?: string; id?: string; timestamp?: number } | undefined;
    if (item?.transcript) {
      const transcript: Transcript = {
        id: item.id || crypto.randomUUID(),
        role: "user",
        text: item.transcript,
        type: "final",
        timestamp: item.timestamp || Date.now(),
      };

      this.callbacks.onTranscript?.(transcript);
      this.callbacks.onLatencyMark?.("transcriptionCompleted", Date.now());
    }
  }

  private handleConversationItemCompleted(event: RealtimeEvent): void {
    console.log("✅ Conversation item completed:", event);

    const item = event.item as { type?: string; role?: string; formatted?: { text?: string } } | undefined;
    if (item?.type === "message" && item?.role === "assistant") {
      if (item.formatted?.text) {
        const transcript: Transcript = {
          id: crypto.randomUUID(),
          role: "assistant",
          text: item.formatted.text,
          type: "final",
          timestamp: Date.now(),
        };

        this.callbacks.onTranscript?.(transcript);
      }
    }
  }

  /**
   * Handle input audio transcription delta events (user speech)
   */
  private handleInputTranscriptionDelta(event: RealtimeEvent): void {
    const delta = event.delta as string | undefined;
    if (delta) {
      this.currentUserTranscript += delta;
      console.log("🎤 Input transcript delta:", delta);
      console.log("🎤 Current input transcript:", this.currentUserTranscript);

      this.callbacks.onPartialTranscript?.(this.currentUserTranscript);
    }
  }

  /**
   * Handle input audio transcription completed events (user speech)
   */
  private handleInputTranscriptionCompleted(event: RealtimeEvent): void {
    console.log("✅ Input transcription completed");

    if (this.currentUserTranscript.trim()) {
      const transcript: Transcript = {
        id: crypto.randomUUID(),
        role: "user",
        text: this.currentUserTranscript.trim(),
        type: "final",
        timestamp: Date.now(),
      };

      this.callbacks.onTranscript?.(transcript);
      this.currentUserTranscript = ""; // Reset for next response
    }
  }

  /**
   * Handle input audio buffer committed events (user speech)
   */
  private handleInputAudioBufferCommitted(event: RealtimeEvent): void {
    console.log("📝 Input audio buffer committed:", event);

    // This event indicates the user's speech has been processed
    // We might need to wait for a transcription event or create one from the buffer
    const itemId = event.item_id as string | undefined;
    if (itemId) {
      console.log("🎤 Audio buffer committed for item:", itemId);
      // The transcription might come in a separate event
    }
  }

  /**
   * Handle audio transcript delta events
   */
  private handleAudioTranscriptDelta(event: RealtimeEvent): void {
    const delta = event.delta as string | undefined;
    if (delta) {
      this.currentAITranscript += delta;
      console.log("📝 Audio transcript delta:", delta);
      console.log("📝 Current AI transcript:", this.currentAITranscript);

      this.callbacks.onPartialTranscript?.(this.currentAITranscript);
    }
  }

  /**
   * Handle audio transcript done events
   */
  private handleAudioTranscriptDone(event: RealtimeEvent): void {
    console.log("✅ Audio transcript completed");

    if (this.currentAITranscript.trim()) {
      const transcript: Transcript = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: this.currentAITranscript.trim(),
        type: "final",
        timestamp: Date.now(),
      };

      this.callbacks.onTranscript?.(transcript);
      this.currentAITranscript = ""; // Reset for next response
    }
  }

  /**
   * Convert base64 encoded audio data to Int16Array
   */
  private base64ToInt16Array(base64: string): Int16Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Int16Array(bytes.buffer);
  }

  /**
   * Reset the router state
   */
  reset(): void {
    this.currentUserTranscript = "";
    this.currentAITranscript = "";
    this.currentToolCall = null;
    this.processedToolCalls.clear();
  }
}
