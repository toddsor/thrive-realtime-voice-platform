# TL;DR Getting Started

> **📦 All packages are now published to npm** under the `@thrivereflections/` scope! No need to build from source.

## 1. Run the Demo (5 minutes)

```bash
git clone https://github.com/toddsor/thrive-realtime-voice-platform.git
cd thrive-realtime-voice-platform
npm install
npm run build

# Set env vars
cd apps/demo-voice
echo "OPENAI_API_KEY=your_key" > .env

# Run (without database)
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
npm install @thrivereflections/realtime-core @thrivereflections/realtime-config @thrivereflections/realtime-contracts @thrivereflections/realtime-observability @thrivereflections/realtime-transport-websocket
```

### C. Set Up Environment

```bash
echo OPENAI_API_KEY=your_key > .env
```

### D. Create Voice App

```typescript
// src/app/page.tsx
"use client";
import { useState, useCallback } from "react";
import { createTransport, RealtimeEventRouter, RealtimeEvent } from "@thrivereflections/realtime-core";

export default function VoiceApp() {
  const [isConnected, setIsConnected] = useState(false);
  const [transcripts, setTranscripts] = useState<Array<{ id: string; role: string; text: string }>>([]);
  const [error, setError] = useState<string | null>(null);

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

      // Get model configuration from platform API
      const modelResponse = await fetch("/api/config/model");
      if (!modelResponse.ok) {
        throw new Error(`Failed to get model config: ${modelResponse.status}`);
      }
      const { model } = await modelResponse.json();
      console.log("Using model:", model);

      // Create transport using Thrive platform
      const transport = createTransport("websocket");

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
      });

      // Connect to voice session
      await transport.connect({
        token: "dummy-token", // Transport will fetch its own token
        onEvent: (event: RealtimeEvent) => eventRouter.routeEvent(event),
      });
    } catch (error) {
      console.error("Connection failed:", error);
      setError(error instanceof Error ? error.message : "Connection failed");
    }
  }, []);

  return (
    <div>
      <h1>My Voice App</h1>
      <button onClick={connectToVoice}>{isConnected ? "Connected" : "Start Voice Chat"}</button>
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

### E. Create Model Config API

```typescript
// src/app/api/config/model/route.ts
import { NextResponse } from "next/server";
import { validateModel, AVAILABLE_MODELS } from "@thrivereflections/realtime-config";

export async function GET() {
  const result = validateModel();

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error,
        availableModels: AVAILABLE_MODELS,
      },
      { status: result.error?.includes("not set") ? 500 : 400 }
    );
  }

  return NextResponse.json({
    model: result.model,
    availableModels: AVAILABLE_MODELS,
  });
}
```

### F. Create Session API

```typescript
// src/app/api/realtime/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { loadRuntimeConfig } from "@thrivereflections/realtime-config";
import { createLoggerFromEnv } from "@thrivereflections/realtime-observability";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const logger = createLoggerFromEnv();
  const config = loadRuntimeConfig();

  try {
    // Create OpenAI session using platform configuration
    const openaiResponse = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.openaiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "realtime=v1",
      },
      body: JSON.stringify({
        model: config.model, // Uses platform's model configuration
        voice: "alloy",
        instructions: "You are a helpful AI assistant.",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const sessionData = await openaiResponse.json();
    return NextResponse.json(sessionData);
  } catch (error) {
    logger.error("Session creation failed", { error });
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
```

**Done!** You have a basic standalone voice app using the Thrive platform.

> **Note**: The platform handles model configuration, session management, and provides additional features like tool execution, database persistence, and monitoring. See the [complete installation guide](./installation.md) for full setup.
