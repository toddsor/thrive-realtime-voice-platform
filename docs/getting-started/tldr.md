# TL;DR Getting Started

> **📦 All packages are now published to npm** under the `@thrivereflections/` scope! No need to build from source.

## 1. Run the Demo (5 minutes)

```bash
git clone https://github.com/toddsor/thrive-realtime-voice-platform.git
cd thrive-realtime-voice-platform
npm install
npm run build
cd apps/demo-voice

# Set env vars (baseUrl defaults to https://api.openai.com)
echo "OPENAI_API_KEY=your_key" > .env

# Run (without database)
npm install
npm run dev
# Visit http://localhost:3000/demo
```

> **Note**: This runs without database persistence. For full features including user authentication and data persistence, see the [complete installation guide](./installation.md).

## 2. Create Standalone App (15 minutes)

### A. Create Next.js Project

```bash
# Create Next.js project with TypeScript (non-interactive)
npx create-next-app@latest my-voice-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
cd my-voice-app
```

### B. Install Platform Packages

Install the Thrive platform packages from npm:

```bash
npm install @thrivereflections/realtime-core @thrivereflections/realtime-config @thrivereflections/realtime-contracts @thrivereflections/realtime-observability @thrivereflections/realtime-transport-websocket @thrivereflections/realtime-security @thrivereflections/realtime-usage
```

### C. Set Up Environment

```bash
echo OPENAI_API_KEY=your_key > .env
# Optional: Override default OpenAI base URL
# echo OPENAI_BASE_URL=https://api.openai.com >> .env
```

### D. Create Voice App

```typescript
// src/app/page.tsx
"use client";
import { useState, useCallback, useRef } from "react";
import { initRealtime, RealtimeEventRouter, RealtimeEvent } from "@thrivereflections/realtime-core";
import { createLoggerFromEnv } from "@thrivereflections/realtime-observability";

export default function VoiceApp() {
  const [isConnected, setIsConnected] = useState(false);
  const [transcripts, setTranscripts] = useState<Array<{ id: string; role: string; text: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const realtimeRef = useRef<any>(null);

  // Audio playback function
  const playAudio = useCallback((audioData: Int16Array) => {
    try {
      // Convert Int16Array to AudioBuffer
      const audioContext = new AudioContext({ sampleRate: 24000 });
      const audioBuffer = audioContext.createBuffer(1, audioData.length, 24000);
      const channelData = audioBuffer.getChannelData(0);

      // Convert Int16 to Float32
      for (let i = 0; i < audioData.length; i++) {
        channelData[i] = audioData[i] / 32768.0;
      }

      // Play audio
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (err) {
      console.error("Audio playback failed:", err);
    }
  }, []);

  const connectToVoice = useCallback(async () => {
    try {
      setError(null);

      // Get runtime configuration from platform API
      const configResponse = await fetch("/api/config/runtime");
      if (!configResponse.ok) {
        throw new Error(`Failed to get runtime config: ${configResponse.status}`);
      }
      const runtimeConfig = await configResponse.json();
      console.log("Using model:", runtimeConfig.model);

      // Generate client session ID for tracking
      const clientSessionId = crypto.randomUUID();
      const correlationId = crypto.randomUUID();

      // Set up event router
      const eventRouter = new RealtimeEventRouter({
        onSessionCreated: (sessionId) => {
          console.log("Session created:", sessionId);
          setIsConnected(true);
        },
        onTranscript: (transcript) => {
          setTranscripts((prev) => [
            ...prev,
            {
              id: transcript.id,
              role: transcript.role,
              text: transcript.text,
            },
          ]);
        },
        onAudioResponse: (audioData) => {
          // Handle audio playback
          console.log("Audio response received, playing...");
          playAudio(audioData);
        },
        onError: (error) => {
          console.error("Event error:", error);
          setError(error instanceof Error ? error.message : "Connection error");
        },
      });

      // Create token getter function with proper headers
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
        logger: createLoggerFromEnv(correlationId),
      });

      realtimeRef.current = realtime;

      // Start the connection
      await realtime.start();
    } catch (error) {
      console.error("Connection failed:", error);
      setError(error instanceof Error ? error.message : "Connection failed");
    }
  }, [playAudio]);

  const disconnect = useCallback(async () => {
    if (realtimeRef.current) {
      await realtimeRef.current.stop();
      realtimeRef.current = null;
      setIsConnected(false);
    }
  }, []);

  return (
    <div>
      <h1>My Voice App</h1>
      <button onClick={connectToVoice} disabled={isConnected}>
        {isConnected ? "Connected" : "Start Voice Chat"}
      </button>
      {isConnected && (
        <button onClick={disconnect} style={{ marginLeft: "10px" }}>
          Disconnect
        </button>
      )}
      {error && <div style={{ color: "red", marginTop: "10px" }}>Error: {error}</div>}
      <div>
        {transcripts.map((t) => (
          <div key={t.id}>
            <strong>{t.role}:</strong> {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### E. Create Runtime Config API

```typescript
// src/app/api/config/runtime/route.ts
import { NextResponse } from "next/server";
import { loadPublicRuntimeConfig } from "@thrivereflections/realtime-config";

export async function GET() {
  const publicConfig = loadPublicRuntimeConfig();
  return NextResponse.json(publicConfig);
}
```

### F. Create Session API

```typescript
// src/app/api/realtime/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { loadRuntimeConfig, getAgentConfigWithUser } from "@thrivereflections/realtime-config";
import { createLoggerFromEnv } from "@thrivereflections/realtime-observability";
import { checkRateLimit, RATE_LIMITS } from "@thrivereflections/realtime-security";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const clientSessionId = request.headers.get("x-client-session-id");
  const correlationId = crypto.randomUUID();
  const logger = createLoggerFromEnv(correlationId);

  // Set session IDs in logger
  logger.setSessionIds(clientSessionId || undefined);

  try {
    // Rate limiting check
    const rateLimitResult = checkRateLimit(request, RATE_LIMITS.SESSION_CREATION);
    if (!rateLimitResult.allowed) {
      logger.warn("Rate limit exceeded for session creation", {
        clientSessionId,
        correlationId,
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
      });

      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": RATE_LIMITS.SESSION_CREATION.maxRequests.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    logger.info("Session creation requested", {
      clientSessionId,
      correlationId,
      rateLimitRemaining: rateLimitResult.remaining,
    });

    // Load configurations
    const config = loadRuntimeConfig();
    const agentConfig = await getAgentConfigWithUser({ sub: "anonymous", tenant: "default" }, {});

    // Create OpenAI session using configured baseUrl
    const openaiResponse = await fetch(`${config.baseUrl}/v1/realtime/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.openaiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "realtime=v1",
      },
      body: JSON.stringify({
        model: config.model,
        voice: agentConfig.voice,
        instructions: agentConfig.persona,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1",
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
        temperature: 0.8,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      logger.error("OpenAI session creation failed", {
        clientSessionId,
        correlationId,
        status: openaiResponse.status,
        error: errorText,
      });
      throw new Error(`Failed to create OpenAI session: ${openaiResponse.status}`);
    }

    const sessionData = await openaiResponse.json();

    logger.info("Session created successfully", {
      clientSessionId,
      correlationId,
      model: config.model,
    });

    // Return the session configuration for the client
    const response = {
      sessionId: clientSessionId,
      transport: config.featureFlags.transport,
      config: agentConfig,
      timings: {
        sessionRequested: Date.now(),
        sessionCreated: Date.now(),
      },
      client_secret: sessionData.client_secret, // Include the client_secret for the client to use
      model: config.model,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Session creation failed", {
      clientSessionId,
      correlationId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Done!** You have a basic standalone voice app using the Thrive platform.

## Key Improvements in This Pattern

✅ **Uses `initRealtime()`** - Platform's high-level API instead of direct transport  
✅ **Proper session tracking** - Includes `x-client-session-id` header  
✅ **Correct token handling** - Handles both `client_secret` and `sessionId` formats  
✅ **Structured logging** - Uses platform's logging utilities  
✅ **Error handling** - Comprehensive error management  
✅ **Connection lifecycle** - Proper connect/disconnect management

> **Note**: The platform handles model configuration, session management, and provides additional features like tool execution, database persistence, and monitoring. See the [complete installation guide](./installation.md) for full setup.
