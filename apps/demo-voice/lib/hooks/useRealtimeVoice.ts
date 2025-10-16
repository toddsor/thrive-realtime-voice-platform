import { useState, useCallback, useRef, useEffect } from "react";
import { AgentConfig } from "@thrivereflections/realtime-contracts";
import { ConsoleLogger } from "@thrivereflections/realtime-observability";
import { memoryStore } from "@/lib/stores/memory";
import {
  createTransport,
  RealtimeEventRouter,
  Transcript as EventTranscript,
  UsageInfo,
  RealtimeEvent,
} from "@thrivereflections/realtime-core";
import { Transport, TransportKind } from "@thrivereflections/realtime-contracts";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface LatencyMark {
  mark: string;
  timestamp: number;
  duration?: number;
}

export interface RetrievalMetrics {
  totalRetrievals: number;
  averageRetrievalTime: number;
  lastRetrievalQuery?: string;
  lastRetrievalResults?: number;
}

export interface Transcript {
  id: string;
  role: "user" | "assistant";
  text: string;
  type: "partial" | "final";
  timestamp: number;
  usageData?: {
    tokensInput?: number;
    tokensOutput?: number;
    estimatedCost?: number;
  };
}

export interface UsageData {
  sessionId: string;
  startTime: number;
  durationMs: number;
  audioMinutes: number;
  tokensInput: number;
  tokensOutput: number;
  tokensCached: number;
  // Detailed token breakdown
  textTokensInput: number;
  audioTokensInput: number;
  textTokensOutput: number;
  audioTokensOutput: number;
  textTokensCached: number;
  audioTokensCached: number;
  toolCalls: number;
  retrievals: number;
  estimatedCost: number;
}

export interface UseRealtimeVoiceReturn {
  connectionStatus: ConnectionStatus;
  isRecording: boolean;
  error: string | null;
  latencyMarks: LatencyMark[];
  transcripts: Transcript[];
  retrievalMetrics: RetrievalMetrics;
  sessionId: string | null;
  usageData: UsageData | null;
  connect: (
    config: AgentConfig,
    user?: { sub: string; email?: string; name?: string; provider?: string }
  ) => Promise<void>;
  disconnect: () => void;
  getTimingStats: () => { ttfa?: number; totalResponseTime?: number };
}

export function useRealtimeVoice(): UseRealtimeVoiceReturn {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latencyMarks, setLatencyMarks] = useState<LatencyMark[]>([]);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [currentModel, setCurrentModel] = useState<string>("gpt-realtime-mini"); // Track current model
  const [retrievalMetrics, setRetrievalMetrics] = useState<RetrievalMetrics>({
    totalRetrievals: 0,
    averageRetrievalTime: 0,
  });

  // Audio duration tracking
  const audioDurationRef = useRef<number>(0);
  const audioStartTimeRef = useRef<number | null>(null);

  // Fetch current model on mount
  useEffect(() => {
    fetch("/api/config/model")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }
        setCurrentModel(data.model);
      })
      .catch((err) => {
        console.error("Failed to fetch model:", err);
        // Set a fallback for display purposes, but the error will be visible in console
        setCurrentModel("unknown");
      });
  }, []);

  // Cost calculation rates (OpenAI Realtime API pricing)
  const costRates = {
    // gpt-realtime pricing
    gptRealtime: {
      textInputTokenPer1k: 0.004, // $4.00 per 1M tokens = $0.004 per 1k tokens
      textOutputTokenPer1k: 0.016, // $16.00 per 1M tokens = $0.016 per 1k tokens
      textCachedTokenPer1k: 0.0004, // $0.40 per 1M tokens = $0.0004 per 1k tokens
      audioInputTokenPer1k: 0.032, // $32.00 per 1M tokens = $0.032 per 1k tokens
      audioOutputTokenPer1k: 0.064, // $64.00 per 1M tokens = $0.064 per 1k tokens
      audioCachedTokenPer1k: 0.0004, // $0.40 per 1M tokens = $0.0004 per 1k tokens
    },
    // gpt-realtime-mini pricing
    gptRealtimeMini: {
      textInputTokenPer1k: 0.0006, // $0.60 per 1M tokens = $0.0006 per 1k tokens
      textOutputTokenPer1k: 0.0024, // $2.40 per 1M tokens = $0.0024 per 1k tokens
      textCachedTokenPer1k: 0.00006, // $0.06 per 1M tokens = $0.00006 per 1k tokens
      audioInputTokenPer1k: 0.01, // $10.00 per 1M tokens = $0.01 per 1k tokens
      audioOutputTokenPer1k: 0.02, // $20.00 per 1M tokens = $0.02 per 1k tokens
      audioCachedTokenPer1k: 0.0003, // $0.30 per 1M tokens = $0.0003 per 1k tokens
    },
    toolCallOverhead: 0.001, // $0.001 per tool call
    retrievalOverhead: 0.002, // $0.002 per retrieval
  };

  const calculateCost = useCallback(
    (data: Omit<UsageData, "estimatedCost">, model: string = "gpt-realtime-mini"): number => {
      // Get pricing for the current model
      const pricing = model === "gpt-realtime" ? costRates.gptRealtime : costRates.gptRealtimeMini;

      // Calculate text input tokens (total text input - text cached)
      const textInputTokens = Math.max(0, data.textTokensInput - data.textTokensCached);
      const textInputCost = (textInputTokens / 1000) * pricing.textInputTokenPer1k;

      // Calculate text cached tokens as a separate cost (not discount)
      const textCachedTokenCost = (data.textTokensCached / 1000) * pricing.textCachedTokenPer1k;

      // Calculate text output tokens
      const textOutputTokenCost = (data.textTokensOutput / 1000) * pricing.textOutputTokenPer1k;

      // Calculate audio input tokens (total audio input - audio cached)
      const audioInputTokens = Math.max(0, data.audioTokensInput - data.audioTokensCached);
      const audioInputCost = (audioInputTokens / 1000) * pricing.audioInputTokenPer1k;

      // Calculate audio cached tokens as a separate cost (not discount)
      const audioCachedTokenCost = (data.audioTokensCached / 1000) * pricing.audioCachedTokenPer1k;

      // Calculate audio output tokens
      const audioOutputTokenCost = (data.audioTokensOutput / 1000) * pricing.audioOutputTokenPer1k;

      const toolCallCost = data.toolCalls * costRates.toolCallOverhead;
      const retrievalCost = data.retrievals * costRates.retrievalOverhead;

      return (
        textInputCost +
        textCachedTokenCost +
        textOutputTokenCost +
        audioInputCost +
        audioCachedTokenCost +
        audioOutputTokenCost +
        toolCallCost +
        retrievalCost
      );
    },
    []
  );

  const updateUsageData = useCallback(
    (updates: Partial<UsageData>) => {
      setUsageData((prev) => {
        if (!prev) return null;

        // For numeric fields, accumulate the values instead of replacing them
        const updated = { ...prev };

        if (updates.tokensInput !== undefined) {
          updated.tokensInput = prev.tokensInput + updates.tokensInput;
        }
        if (updates.tokensOutput !== undefined) {
          updated.tokensOutput = prev.tokensOutput + updates.tokensOutput;
        }
        if (updates.tokensCached !== undefined) {
          updated.tokensCached = prev.tokensCached + updates.tokensCached;
        }
        if (updates.textTokensInput !== undefined) {
          updated.textTokensInput = prev.textTokensInput + updates.textTokensInput;
        }
        if (updates.audioTokensInput !== undefined) {
          updated.audioTokensInput = prev.audioTokensInput + updates.audioTokensInput;
        }
        if (updates.textTokensOutput !== undefined) {
          updated.textTokensOutput = prev.textTokensOutput + updates.textTokensOutput;
        }
        if (updates.audioTokensOutput !== undefined) {
          updated.audioTokensOutput = prev.audioTokensOutput + updates.audioTokensOutput;
        }
        if (updates.textTokensCached !== undefined) {
          updated.textTokensCached = prev.textTokensCached + updates.textTokensCached;
        }
        if (updates.audioTokensCached !== undefined) {
          updated.audioTokensCached = prev.audioTokensCached + updates.audioTokensCached;
        }
        if (updates.toolCalls !== undefined) {
          updated.toolCalls = prev.toolCalls + updates.toolCalls;
        }
        if (updates.retrievals !== undefined) {
          updated.retrievals = prev.retrievals + updates.retrievals;
        }

        // For other fields, use the new value directly
        if (updates.durationMs !== undefined) {
          updated.durationMs = updates.durationMs;
        }
        if (updates.audioMinutes !== undefined) {
          updated.audioMinutes = updates.audioMinutes;
        }

        // Recalculate the total cost
        updated.estimatedCost = calculateCost(updated, currentModel);
        return updated;
      });
    },
    [calculateCost, currentModel]
  );

  const transportRef = useRef<Transport | null>(null);
  const eventRouterRef = useRef<RealtimeEventRouter | null>(null);
  const loggerRef = useRef<ConsoleLogger | null>(null);
  const clientSessionIdRef = useRef<string | null>(null);
  const openaiSessionIdRef = useRef<string | null>(null);
  const connectionStatusRef = useRef<ConnectionStatus>("disconnected");

  const addLatencyMark = useCallback((mark: string, timestamp: number, duration?: number) => {
    const newMark: LatencyMark = { mark, timestamp, duration };
    setLatencyMarks((prev) => [...prev, newMark]);
    loggerRef.current?.logLatencyMark(mark, timestamp, duration);
  }, []);

  const saveTranscriptToStore = useCallback(async (transcript: Transcript, config: AgentConfig) => {
    if (config.featureFlags.memory && config.featureFlags.memory !== "off" && openaiSessionIdRef.current) {
      try {
        await memoryStore.appendTranscript(openaiSessionIdRef.current, transcript);
        loggerRef.current?.debug("Transcript saved to store", {
          sessionId: openaiSessionIdRef.current,
          transcriptId: transcript.id,
          type: transcript.type,
        });
      } catch (error) {
        loggerRef.current?.warn("Failed to save transcript to store", {
          error: error instanceof Error ? error.message : "Unknown error",
          sessionId: openaiSessionIdRef.current,
        });
      }
    }
  }, []);

  const saveToolEventToStore = useCallback(
    async (
      toolEvent: {
        id: string;
        name: string;
        args: Record<string, unknown>;
        result?: unknown;
        error?: string;
        timestamp: number;
        duration?: number;
      },
      config: AgentConfig
    ) => {
      if (config.featureFlags.memory && config.featureFlags.memory !== "off" && openaiSessionIdRef.current) {
        try {
          await memoryStore.appendToolEvent(openaiSessionIdRef.current, toolEvent);
          loggerRef.current?.debug("Tool event saved to store", {
            sessionId: openaiSessionIdRef.current,
            toolId: toolEvent.id,
            toolName: toolEvent.name,
          });
        } catch (error) {
          loggerRef.current?.warn("Failed to save tool event to store", {
            error: error instanceof Error ? error.message : "Unknown error",
            sessionId: openaiSessionIdRef.current,
          });
        }
      }
    },
    []
  );

  const playAudioResponse = useCallback(
    async (audioData: Int16Array) => {
      try {
        // Create audio context for playback
        const audioContext = new AudioContext({ sampleRate: 24000 });

        // Convert Int16Array to Float32Array for Web Audio API
        const float32Array = new Float32Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          float32Array[i] = audioData[i] / 32768.0;
        }

        // Create audio buffer
        const audioBuffer = audioContext.createBuffer(1, float32Array.length, 24000);
        audioBuffer.copyToChannel(float32Array, 0);

        // Play audio
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();

        addLatencyMark("firstAudio", Date.now());
        loggerRef.current?.info("Playing audio response");
      } catch (err) {
        loggerRef.current?.error("Failed to play audio", { error: err });
      }
    },
    [addLatencyMark]
  );

  const connect = useCallback(
    async (config: AgentConfig, user?: { sub: string; email?: string; name?: string; provider?: string }) => {
      try {
        console.log("🚀 Starting pure WebRTC connection...");
        setConnectionStatus("connecting");
        connectionStatusRef.current = "connecting";
        setError(null);

        // Clear previous transcripts for a fresh start
        setTranscripts([]);

        // Generate client session ID and correlation ID
        const clientSessionId = crypto.randomUUID();
        const correlationId = crypto.randomUUID();

        clientSessionIdRef.current = clientSessionId;
        loggerRef.current = new ConsoleLogger(correlationId);

        loggerRef.current.info("Starting voice connection", {
          clientSessionId,
          correlationId,
        });
        addLatencyMark("connectRequested", Date.now());

        // Set up event router
        const eventRouter = new RealtimeEventRouter({
          onSessionCreated: async (sessionId, _session) => {
            console.log("🎉 Session created:", sessionId);
            console.log("🎉 Session object:", _session);
            openaiSessionIdRef.current = sessionId;
            setSessionId(sessionId);
            loggerRef.current?.setSessionIds(clientSessionId, sessionId);
            addLatencyMark("sessionCreated", Date.now());

            // Save session metadata to memory store
            try {
              const consent = localStorage.getItem("voice-consent") === "ACCEPTED" ? "ACCEPTED" : "DECLINED";
              const timings = {
                providerSessionId: sessionId,
                connectRequested: Date.now() - 1000, // Approximate
                sessionIssued: Date.now(),
              };

              await memoryStore.saveSessionMeta(
                sessionId,
                user ? { sub: user.sub, tenant: "default" } : { sub: "anonymous", tenant: "default" },
                config,
                timings,
                consent
              );
              console.log("💾 Session metadata saved to memory store");
            } catch (error) {
              console.error("Failed to save session metadata:", error);
            }

            // Initialize usage data
            const now = Date.now();
            const initialUsageData: UsageData = {
              sessionId,
              startTime: now,
              durationMs: 0,
              audioMinutes: 0,
              tokensInput: 0,
              tokensOutput: 0,
              tokensCached: 0,
              textTokensInput: 0,
              audioTokensInput: 0,
              textTokensOutput: 0,
              audioTokensOutput: 0,
              textTokensCached: 0,
              audioTokensCached: 0,
              toolCalls: 0,
              retrievals: 0,
              estimatedCost: 0,
            };
            setUsageData(initialUsageData);
            audioStartTimeRef.current = now;
            audioDurationRef.current = 0;
            console.log("📊 Usage tracking started for session:", sessionId);
          },

          onTranscript: async (transcript: EventTranscript) => {
            console.log("📝 Transcript received:", transcript);
            // For display purposes, we'll show estimated tokens in transcripts
            // but the real usage data comes from OpenAI API via onUsageUpdate
            const estimatedTokens = Math.ceil(transcript.text.length / 4);
            const messageCost =
              transcript.type === "final"
                ? transcript.role === "user"
                  ? (estimatedTokens / 1000) * 0.0005
                  : (estimatedTokens / 1000) * 0.0015
                : 0;

            const newTranscript: Transcript = {
              id: transcript.id,
              role: transcript.role,
              text: transcript.text,
              type: transcript.type,
              timestamp: transcript.timestamp,
              usageData:
                transcript.type === "final"
                  ? {
                      tokensInput: transcript.role === "user" ? estimatedTokens : undefined,
                      tokensOutput: transcript.role === "assistant" ? estimatedTokens : undefined,
                      // tokensCached will be shown from the cumulative usage data
                      estimatedCost: messageCost,
                    }
                  : undefined,
            };

            setTranscripts((prev) => {
              const updated = [...prev, newTranscript];
              return updated.slice(-100);
            });

            saveTranscriptToStore(newTranscript, config);

            // Note: Token usage is now handled by onUsageUpdate callback from OpenAI API
            // We no longer estimate tokens here since we get real data from the API
          },

          onPartialTranscript: (text: string) => {
            console.log("📝 Partial transcript:", text);
            // Could add partial transcript handling here if needed
          },

          onAudioResponse: (audioData: Int16Array) => {
            console.log("🎵 Audio response received");
            playAudioResponse(audioData);
          },

          onToolCall: async (toolCall) => {
            console.log("🔧 Tool call received:", toolCall);
            try {
              addLatencyMark("toolCallStart", Date.now());
              loggerRef.current?.setToolCallId(toolCall.id);

              loggerRef.current?.info("Function call received", {
                toolName: toolCall.name,
                toolId: toolCall.id,
                clientSessionId: clientSessionIdRef.current,
                openaiSessionId: openaiSessionIdRef.current,
              });

              // Call the tool gateway
              const toolCallResponse = await fetch("/api/tools/gateway", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-correlation-id": correlationId,
                  "x-client-session-id": clientSessionIdRef.current || "",
                },
                body: JSON.stringify({
                  id: toolCall.id,
                  name: toolCall.name,
                  args: toolCall.arguments,
                  user: { sub: "anonymous" },
                }),
              });

              if (!toolCallResponse.ok) {
                throw new Error(`Tool gateway error: ${toolCallResponse.status}`);
              }

              const toolResult = await toolCallResponse.json();
              addLatencyMark("toolCallEnd", Date.now());

              // Track tool call usage
              updateUsageData({
                toolCalls: (usageData?.toolCalls || 0) + 1,
              });
              console.log(`📊 Tracked tool call: ${toolCall.name}`);

              // Track retrieval metrics
              if (toolCall.name === "retrieve_docs" && toolResult.ok) {
                const retrievalStartTime = Date.now() - 1000;
                const retrievalDuration = Date.now() - retrievalStartTime;

                // Track retrieval usage
                updateUsageData({
                  retrievals: (usageData?.retrievals || 0) + 1,
                });
                console.log(`📊 Tracked retrieval: ${toolResult.result?.chunks?.length || 0} results`);

                setRetrievalMetrics((prev) => {
                  const newTotal = prev.totalRetrievals + 1;
                  const newAverage = (prev.averageRetrievalTime * prev.totalRetrievals + retrievalDuration) / newTotal;

                  return {
                    totalRetrievals: newTotal,
                    averageRetrievalTime: newAverage,
                    lastRetrievalQuery: toolCall.arguments?.query as string,
                    lastRetrievalResults: toolResult.result?.chunks?.length || 0,
                  };
                });
              }

              // Save tool event to store
              const toolEvent = {
                id: toolCall.id,
                name: toolCall.name,
                args: toolCall.arguments,
                result: toolResult.ok ? toolResult.result : undefined,
                error: toolResult.ok ? undefined : toolResult.error,
                timestamp: Date.now(),
                duration: Date.now() - (Date.now() - 1000),
              };
              saveToolEventToStore(toolEvent, config);

              loggerRef.current?.info("Tool call completed", {
                toolName: toolCall.name,
                toolId: toolCall.id,
                success: toolResult.ok,
              });

              // Send tool response back to OpenAI via transport
              if (transportRef.current) {
                transportRef.current.send({
                  type: "conversation.item.create",
                  item: {
                    type: "function_call_output",
                    call_id: toolCall.id,
                    output: toolResult,
                  },
                });
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : "Unknown error";
              loggerRef.current?.error("Function call failed", {
                toolName: toolCall.name,
                toolId: toolCall.id,
                error: errorMessage,
              });

              // Send error response back to OpenAI
              if (transportRef.current) {
                transportRef.current.send({
                  type: "conversation.item.create",
                  item: {
                    type: "function_call_output",
                    call_id: toolCall.id,
                    output: { error: errorMessage },
                  },
                });
              }
            }
          },

          onSpeechStarted: () => {
            console.log("🎤 Speech started");
            setIsRecording(true);
            addLatencyMark("speechStarted", Date.now());
          },

          onSpeechStopped: () => {
            console.log("🔇 Speech stopped");
            setIsRecording(false);
            addLatencyMark("speechStopped", Date.now());
          },

          onResponseCompleted: () => {
            console.log("✅ Response completed");
            addLatencyMark("responseCompleted", Date.now());
          },

          onUsageUpdate: (usage: UsageInfo) => {
            console.log("📊 Usage update received from OpenAI:", usage);

            // Update usage data with real information from OpenAI
            // OpenAI Realtime API returns usage per response, so we need to accumulate
            if (usage.input_tokens || usage.output_tokens || usage.cached_tokens) {
              setUsageData((prev) => {
                if (!prev) return null;

                // Accumulate usage data from each response
                const updated = { ...prev };

                // Accumulate total tokens
                updated.tokensInput += usage.input_tokens || 0;
                updated.tokensOutput += usage.output_tokens || 0;
                updated.tokensCached += usage.cached_tokens || 0;

                // Extract and accumulate detailed token breakdown
                if (usage.input_token_details) {
                  updated.textTokensInput += usage.input_token_details.text_tokens || 0;
                  updated.audioTokensInput += usage.input_token_details.audio_tokens || 0;

                  if (usage.input_token_details.cached_tokens_details) {
                    updated.textTokensCached += usage.input_token_details.cached_tokens_details.text_tokens || 0;
                    updated.audioTokensCached += usage.input_token_details.cached_tokens_details.audio_tokens || 0;
                  }
                }

                if (usage.output_token_details) {
                  updated.textTokensOutput += usage.output_token_details.text_tokens || 0;
                  updated.audioTokensOutput += usage.output_token_details.audio_tokens || 0;
                }

                // Recalculate the total cost
                updated.estimatedCost = calculateCost(updated, currentModel);

                console.log("📊 Updated usage data with detailed breakdown (cumulative):", {
                  tokensInput: updated.tokensInput,
                  tokensOutput: updated.tokensOutput,
                  tokensCached: updated.tokensCached,
                  textTokensInput: updated.textTokensInput,
                  audioTokensInput: updated.audioTokensInput,
                  textTokensOutput: updated.textTokensOutput,
                  audioTokensOutput: updated.audioTokensOutput,
                  textTokensCached: updated.textTokensCached,
                  audioTokensCached: updated.audioTokensCached,
                  estimatedCost: updated.estimatedCost,
                });

                return updated;
              });
            }
          },

          onError: (error) => {
            console.error("❌ Event error:", error);
            loggerRef.current?.error("Event error", { error });

            // If it's a DataChannel error, try to reconnect
            if (
              error &&
              typeof error === "object" &&
              "type" in error &&
              (error as { type?: string }).type?.includes("datachannel")
            ) {
              console.log("🔄 DataChannel error detected, attempting reconnection...");
              // The WebRTC module will handle reconnection automatically
            }
          },

          onLatencyMark: (mark, timestamp) => {
            addLatencyMark(mark, timestamp);
          },
        });

        eventRouterRef.current = eventRouter;

        // Start transport connection with fallback logic
        console.log("🔗 Starting transport connection...");
        let transportKind: TransportKind = "webrtc"; // Default to WebRTC
        let transport: Transport;

        try {
          transport = createTransport(transportKind);
          await transport.connect({
            token: "dummy-token", // The transport will fetch its own token
            onEvent: (event) => eventRouter.routeEvent(event as RealtimeEvent),
          });
          console.log("✅ WebRTC connection established");
        } catch (err) {
          // If WebRTC fails, try WebSocket fallback
          console.log("⚠️ WebRTC failed, attempting WebSocket fallback:", err);
          loggerRef.current?.warn("WebRTC failed, attempting WebSocket fallback", { error: err });

          transportKind = "websocket";
          transport = createTransport(transportKind);
          await transport.connect({
            token: "dummy-token",
            onEvent: (event) => eventRouter.routeEvent(event as RealtimeEvent),
          });
          console.log("✅ WebSocket fallback connection established");
        }

        transportRef.current = transport;

        setConnectionStatus("connected");
        connectionStatusRef.current = "connected";
        addLatencyMark(transportKind === "webrtc" ? "webrtcConnected" : "websocketConnected", Date.now());
        loggerRef.current?.info(`${transportKind.toUpperCase()} connection established`);

        console.log(`✅ ${transportKind.toUpperCase()} connection setup complete`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        const errorStack = err instanceof Error ? err.stack : undefined;
        console.error("❌ Connection failed with error:", err);
        console.error("Error message:", errorMessage);
        console.error("Error stack:", errorStack);

        setError(errorMessage);
        setConnectionStatus("error");
        connectionStatusRef.current = "error";
        loggerRef.current?.error("Connection failed", {
          error: errorMessage,
          stack: errorStack,
          fullError: err,
        });
      }
    },
    [addLatencyMark, playAudioResponse, saveTranscriptToStore, saveToolEventToStore]
  );

  const disconnect = useCallback(async () => {
    try {
      console.log("🧹 Starting disconnect process...");

      // Track final audio duration and end session
      if (audioStartTimeRef.current) {
        const finalDuration = Date.now() - audioStartTimeRef.current;
        updateUsageData({
          durationMs: finalDuration,
          audioMinutes: finalDuration / (1000 * 60),
        });
        console.log("📊 Final audio duration tracked:", finalDuration, "ms");
      }

      // Clean up transport connection
      if (transportRef.current) {
        console.log("🔌 Closing transport connection...");
        await transportRef.current.close();
        transportRef.current = null;
      }

      // Reset event router
      if (eventRouterRef.current) {
        console.log("🔄 Resetting event router...");
        eventRouterRef.current.reset();
        eventRouterRef.current = null;
      }

      setConnectionStatus("disconnected");
      setIsRecording(false);
      setError(null);
      loggerRef.current?.info("Disconnected");

      // Clear session references
      openaiSessionIdRef.current = null;
      clientSessionIdRef.current = null;
      loggerRef.current = null;
      audioStartTimeRef.current = null;
      audioDurationRef.current = 0;

      console.log("✅ Disconnect completed");
    } catch (err) {
      console.error("❌ Error during disconnect:", err);
      loggerRef.current?.error("Error during disconnect", { error: err });
    }
  }, []);

  const getTimingStats = useCallback(() => {
    const connectRequested = latencyMarks.find((m) => m.mark === "connectRequested");
    const firstAudio = latencyMarks.find((m) => m.mark === "firstAudio");

    if (connectRequested && firstAudio) {
      return {
        ttfa: firstAudio.timestamp - connectRequested.timestamp,
      };
    }

    return {};
  }, [latencyMarks]);

  // Periodic audio duration tracking - update usage data
  useEffect(() => {
    if (connectionStatus === "connected" && audioStartTimeRef.current) {
      const interval = setInterval(() => {
        if (audioStartTimeRef.current) {
          const currentDuration = Date.now() - audioStartTimeRef.current;
          audioDurationRef.current = currentDuration;
          updateUsageData({
            durationMs: currentDuration,
            audioMinutes: currentDuration / (1000 * 60),
          });
        }
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [connectionStatus, updateUsageData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionStatus,
    isRecording,
    error,
    latencyMarks,
    transcripts,
    retrievalMetrics,
    sessionId,
    usageData,
    connect,
    disconnect,
    getTimingStats,
  };
}
