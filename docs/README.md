# Thrive Realtime Voice Platform

A TypeScript monorepo for building realtime voice applications with OpenAI's Realtime API.

## Overview

The Thrive Realtime Voice Platform provides a comprehensive set of packages and tools for building production-ready voice applications with real-time streaming, tool execution, and RAG support.

## Key Features

- 🎙️ **Realtime Voice API** - OpenAI Realtime API integration
- 🔌 **Multiple Transports** - WebRTC and WebSocket support
- 🛠️ **Tool Gateway** - Execute tools with RAG support
- 📊 **SRE & Monitoring** - Built-in observability and alerting
- 🔐 **Authentication** - Supabase integration
- 💾 **Database** - Prisma with PostgreSQL
- 🎨 **UI Components** - React 19 components with shadcn/ui

## Quick Links

- [Getting Started](./getting-started/) - [TL;DR Quick Start](./getting-started/tldr.md)
- [Advanced Setup](./getting-started/advanced-setup/) - Production configurations
- [Architecture Overview](./architecture/) - [Design Principles](./architecture/design-principles.md)
- [API Reference](./api/)
- [Deployment Guides](./deployment/)

## Packages

- **@thrivereflections/realtime-contracts** - Core TypeScript interfaces
- **@thrivereflections/realtime-core** - Core runtime logic
- **@thrivereflections/realtime-transport-websocket** - WebSocket transport
- **@thrivereflections/realtime-transport-webrtc** - WebRTC transport
- **@thrivereflections/realtime-tool-gateway** - Tool execution with RAG
- **@thrivereflections/realtime-observability** - Logging and monitoring
- **@thrivereflections/realtime-sre** - Site reliability engineering
- **@thrivereflections/realtime-usage** - Usage tracking and cost estimation
- **@thrivereflections/realtime-security** - Security utilities
- **@thrivereflections/realtime-config** - Configuration management
- **@thrivereflections/realtime-auth-supabase** - Supabase authentication
- **@thrivereflections/realtime-store-prisma** - Prisma database layer
- **@thrivereflections/realtime-lib** - Shared utilities

## Applications

- **[demo-voice](../apps/demo-voice/README.md)** - Reference implementation and demo app
  - Demonstrates the [Multi-App Schema Extension Pattern](./architecture/multi-app-pattern.md)
  - Complete Next.js app with authentication, database, and realtime features
  - See [Demo App README](../apps/demo-voice/README.md) for detailed setup and usage
