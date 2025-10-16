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
echo "DATABASE_URL=postgresql://..." >> .env

# Run
npm run dev:full
# Visit http://localhost:3000
```

## 2. Create Standalone App (15 minutes)

### A. Create New Project
```bash
mkdir my-voice-app
cd my-voice-app
npm init -y
```

### B. Install Dependencies
```bash
# Install Next.js and React
npm install next react react-dom

# Install OpenAI SDK for Realtime API
npm install openai

# Install database (optional)
npm install prisma @prisma/client
```

### C. Set Up Basic Structure
```bash
mkdir -p app api pages components
echo "OPENAI_API_KEY=your_key" > .env.local
```

### D. Create Voice App
```typescript
// app/page.tsx
'use client';
import { useState } from 'react';

export default function VoiceApp() {
  const [isConnected, setIsConnected] = useState(false);
  
  const connectToVoice = async () => {
    // Connect to OpenAI Realtime API
    const response = await fetch('/api/voice/session', { method: 'POST' });
    const { client_secret } = await response.json();
    
    // Initialize WebSocket connection
    const ws = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01');
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'session.update',
        session: { client_secret }
      }));
      setIsConnected(true);
    };
  };

  return (
    <div>
      <h1>My Voice App</h1>
      <button onClick={connectToVoice}>
        {isConnected ? 'Connected' : 'Start Voice Chat'}
      </button>
    </div>
  );
}
```

### E. Create Session API
```typescript
// app/api/voice/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST() {
  const session = await openai.beta.realtime.sessions.create({
    model: 'gpt-4o-realtime-preview-2024-10-01',
  });

  return NextResponse.json(session);
}
```

**Done!** You have a basic standalone voice app using OpenAI's Realtime API directly.

> **Note**: For production features like tool execution, database persistence, and advanced monitoring, consider using the full platform packages.
