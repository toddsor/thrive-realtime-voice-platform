# TL;DR Getting Started

## 1. Run the Demo (5 minutes)

```bash
git clone <repo>
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

### A. Create App Structure
```bash
mkdir -p apps/my-app
cd apps/my-app
npm init -y
```

### B. Install Platform Packages
```bash
npm install @thrive/realtime-contracts @thrive/realtime-core
npm install @thrive/realtime-transport-websocket
npm install next react react-dom
```

### C. Copy Base Schema
```bash
cp ../../packages/store-prisma/prisma/schema.prisma ./prisma/
# Add your app-specific tables
```

### D. Create Basic App
See [Creating Your First App](./first-app.md) for full walkthrough.

**Done!** You have an independent app that extends the platform.
