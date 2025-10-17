import { useState, useCallback, useRef, useEffect } from "react";
import { AgentConfig } from "@thrivereflections/realtime-contracts";
import { ConsoleLogger } from "@thrivereflections/realtime-observability";
import { demoStore } from "@/lib/store";
import {
  initRealtime,
  RealtimeEventRouter,
  Transcript as EventTranscript,
  UsageInfo,
  RealtimeEvent,
} from "@thrivereflections/realtime-core";
import {
  calculateUsageCostForDemo as calculateUsageCost,
  calculateTranscriptCost,
  createInitialUsageData,
  updateUsageDataWithCost,
  type UsageData,
} from "@/lib/utils/costCalculation";

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

// UsageData interface is now imported from costCalculation utility

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
  const [retrievalMetrics, setRetrievalMetrics] = useState<RetrievalMetrics>({
    totalRetrievals: 0,
    averageRetrievalTime: 0,
  });
  const modelRef = useRef<string>("gpt-realtime-mini");

  // Audio duration tracking
  const audioDurationRef = useRef<number>(0);
  const audioStartTimeRef = useRef<number | null>(null);

  // Refs for platform integration
  const realtimeRef = useRef<any>(null);
  const eventRouterRef = useRef<RealtimeEventRouter | null>(null);
  const loggerRef = useRef<ConsoleLogger | null>(null);
  const clientSessionIdRef = useRef<string | null>(null);
  const openaiSessionIdRef = useRef<string | null>(null);

  // Cost calculation is now handled by the shared utility

  const updateUsageData = useCallback((updates: Partial<UsageData>) => {
    setUsageData((prev) => {
      if (!prev) return null;

      // Use the shared utility to update and recalculate cost
      return updateUsageDataWithCost(prev, updates, modelRef.current as "gpt-realtime" | "gpt-realtime-mini");
    });
  }, []);

  const addLatencyMark = useCallback((mark: string, timestamp: number, duration?: number) => {
    const newMark: LatencyMark = { mark, timestamp, duration };
    setLatencyMarks((prev) => [...prev, newMark]);
    loggerRef.current?.logLatencyMark(mark, timestamp, duration);
  }, []);

  const saveTranscriptToStore = useCallback(async (transcript: Transcript, config: AgentConfig) => {
    if (config.featureFlags.memory && config.featureFlags.memory !== "off" && openaiSessionIdRef.current) {
      try {
        await demoStore.appendTranscript(openaiSessionIdRef.current, {
          role: transcript.role,
          text: transcript.text,
          startedAt: transcript.timestamp,
          endedAt: transcript.timestamp,
        });
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
          await demoStore.appendToolEvent(openaiSessionIdRef.current, {
            name: toolEvent.name,
            args: toolEvent.args,
            result: toolEvent.result,
          });
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
        const audioContext = new AudioContext({ sampleRate: 24000 });
        const float32Array = new Float32Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          float32Array[i] = audioData[i] / 32768.0;
        }

        const audioBuffer = audioContext.createBuffer(1, float32Array.length, 24000);
        audioBuffer.copyToChannel(float32Array, 0);

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
        console.log("🚀 Starting voice connection using platform APIs...");
        setConnectionStatus("connecting");
        setError(null);
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

        // Get runtime configuration from server
        const configResponse = await fetch("/api/config/runtime");
        const runtimeConfig = await configResponse.json();
        modelRef.current = runtimeConfig.model;

        // Create event router for handling realtime events
        const eventRouter = new RealtimeEventRouter({
          onSessionCreated: async (sessionId, _session) => {
            console.log("🎉 Session created:", sessionId);
            openaiSessionIdRef.current = sessionId;
            setSessionId(sessionId);
            loggerRef.current?.setSessionIds(clientSessionId, sessionId);
            addLatencyMark("sessionCreated", Date.now());

            // Save session metadata to demoStore
            try {
              const consent = localStorage.getItem("voice-consent") === "ACCEPTED" ? "ACCEPTED" : "DECLINED";
              const timings = {
                providerSessionId: sessionId,
                connectRequested: Date.now() - 1000,
                sessionIssued: Date.now(),
              };

              await demoStore.saveSessionMeta(
                sessionId,
                user ? { appUserId: user.sub, authUserId: user.sub } : null,
                config,
                timings,
                consent
              );
              console.log("💾 Session metadata saved to demoStore");
            } catch (error) {
              console.error("Failed to save session metadata:", error);
            }

            // Initialize usage data using shared utility
            const now = Date.now();
            const initialUsageData = {
              ...createInitialUsageData(sessionId),
              estimatedCost: 0,
            };
            setUsageData(initialUsageData);
            audioStartTimeRef.current = now;
            audioDurationRef.current = 0;
            console.log("📊 Usage tracking started for session:", sessionId);
          },

          onTranscript: async (transcript: EventTranscript) => {
            console.log("📝 Transcript received:", transcript);
            const estimatedTokens = Math.ceil(transcript.text.length / 4);
            const messageCost = calculateTranscriptCost(transcript.text, transcript.role, transcript.type);

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
                      estimatedCost: messageCost,
                    }
                  : undefined,
            };

            setTranscripts((prev) => {
              const updated = [...prev, newTranscript];
              return updated.slice(-100);
            });

            saveTranscriptToStore(newTranscript, config);
          },

          onPartialTranscript: (text: string) => {
            console.log("📝 Partial transcript:", text);
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
                toolCalls: 1,
              });
              console.log(`📊 Tracked tool call: ${toolCall.name}`);

              // Track retrieval metrics
              if (toolCall.name === "retrieve_docs" && toolResult.ok) {
                const retrievalStartTime = Date.now() - 1000;
                const retrievalDuration = Date.now() - retrievalStartTime;

                updateUsageData({
                  retrievals: 1,
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
              if (realtimeRef.current?.transport) {
                realtimeRef.current.transport.send({
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
              if (realtimeRef.current?.transport) {
                realtimeRef.current.transport.send({
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

            if (usage.input_tokens || usage.output_tokens || usage.cached_tokens) {
              setUsageData((prev) => {
                if (!prev) return null;

                const updated = { ...prev };

                updated.tokensInput += usage.input_tokens || 0;
                updated.tokensOutput += usage.output_tokens || 0;
                updated.tokensCached += usage.cached_tokens || 0;

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

                updated.estimatedCost = calculateUsageCost(
                  updated,
                  modelRef.current as "gpt-realtime" | "gpt-realtime-mini"
                );

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
          },

          onLatencyMark: (mark, timestamp) => {
            addLatencyMark(mark, timestamp);
          },
        });

        eventRouterRef.current = eventRouter;

        // Create token getter function
        const getToken = async () => {
          const response = await fetch("/api/realtime/session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-client-session-id": clientSessionId,
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to get session token: ${response.status}`);
          }

          const sessionData = await response.json();
          return sessionData.client_secret || sessionData.sessionId;
        };

        // Initialize realtime connection using platform's initRealtime
        const realtime = initRealtime(runtimeConfig, {
          getToken,
          onEvent: (event) => eventRouter.routeEvent(event as RealtimeEvent),
          logger: loggerRef.current,
        });

        realtimeRef.current = realtime;

        // Start the connection
        await realtime.start();

        setConnectionStatus("connected");
        addLatencyMark("connected", Date.now());
        loggerRef.current?.info("Realtime connection established");

        console.log("✅ Voice connection setup complete using platform APIs");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("❌ Connection failed with error:", err);

        setError(errorMessage);
        setConnectionStatus("error");
        loggerRef.current?.error("Connection failed", {
          error: errorMessage,
        });
      }
    },
    [addLatencyMark, playAudioResponse, saveTranscriptToStore, saveToolEventToStore, updateUsageData]
  );

  const disconnect = useCallback(async () => {
    try {
      console.log("🧹 Starting disconnect process...");

      // Track final audio duration
      if (audioStartTimeRef.current) {
        const finalDuration = Date.now() - audioStartTimeRef.current;
        updateUsageData({
          durationMs: finalDuration,
          audioMinutes: finalDuration / (1000 * 60),
        });
        console.log("📊 Final audio duration tracked:", finalDuration, "ms");
      }

      // Clean up realtime connection
      if (realtimeRef.current) {
        console.log("🔌 Closing realtime connection...");
        await realtimeRef.current.stop();
        realtimeRef.current = null;
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
  }, [updateUsageData]);

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

  // Periodic audio duration tracking
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
      }, 5000);

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
