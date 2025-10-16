# TL;DR Getting Started

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
# Create Next.js project with TypeScript
npx create-next-app@latest my-voice-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd my-voice-app
```

### B. Install Platform Packages

Since the Thrive platform packages are internal to the monorepo, you'll need to reference them directly from the repository:

Add these dependencies to your `package.json`:

```json
{
  "dependencies": {
    "@thrive/realtime-core": "github:toddsor/thrive-realtime-voice-platform#main:packages/core",
    "@thrive/realtime-config": "github:toddsor/thrive-realtime-voice-platform#main:packages/config",
    "@thrive/realtime-contracts": "github:toddsor/thrive-realtime-voice-platform#main:packages/contracts",
    "@thrive/realtime-observability": "github:toddsor/thrive-realtime-voice-platform#main:packages/observability"
  }
}
```

Then run:

```bash
npm install
```

**Important**: Since these packages are TypeScript source code, you need to build them:

```bash
# Build the platform packages
cd node_modules/@thrive/realtime-core && npm run build
cd ../@thrive/realtime-config && npm run build
cd ../@thrive/realtime-contracts && npm run build
cd ../@thrive/realtime-observability && npm run build
cd ../../..
```

Or create a build script in your `package.json`:

```json
{
  "scripts": {
    "build:packages": "cd node_modules/@thrive/realtime-core && npm run build && cd ../@thrive/realtime-config && npm run build && cd ../@thrive/realtime-contracts && npm run build && cd ../@thrive/realtime-observability && npm run build && cd ../../.."
  }
}
```

Then run:

```bash
npm run build:packages
```

### C. Set Up Environment

```bash
echo OPENAI_API_KEY=your_key > .env.local
```

### D. Create Voice App

```typescript
// app/page.tsx
"use client";
import { useState, useCallback } from "react";
import { createTransport, RealtimeEventRouter } from "@thrive/realtime-core";
import { AgentConfig } from "@thrive/realtime-contracts";

export default function VoiceApp() {
  const [isConnected, setIsConnected] = useState(false);
  const [transcripts, setTranscripts] = useState<Array<{ id: string; role: string; text: string }>>([]);

  const connectToVoice = useCallback(async () => {
    try {
      // Get model configuration from platform API
      const modelResponse = await fetch("/api/config/model");
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
          console.log("Audio response received");
        },
      });

      // Connect to voice session
      await transport.connect({
        token: "dummy-token", // Transport will fetch its own token
        onEvent: (event) => eventRouter.routeEvent(event),
      });
    } catch (error) {
      console.error("Connection failed:", error);
    }
  }, []);

  return (
    <div>
      <h1>My Voice App</h1>
      <button onClick={connectToVoice}>{isConnected ? "Connected" : "Start Voice Chat"}</button>
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
// app/api/config/model/route.ts
import { NextResponse } from "next/server";
import { validateModel, AVAILABLE_MODELS } from "@thrive/realtime-config";

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
// app/api/realtime/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { loadRuntimeConfig } from "@thrive/realtime-config";
import { createLoggerFromEnv } from "@thrive/realtime-observability";

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
