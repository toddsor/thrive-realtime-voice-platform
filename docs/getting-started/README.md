# Getting Started

Welcome to the Thrive Realtime Voice Platform! This guide will help you get up and running quickly.

## Prerequisites

- Node.js 20+
- npm or pnpm
- PostgreSQL database
- OpenAI API key with Realtime API access

## Quick Start

1. [TL;DR Quick Start](./tldr.md) - Get running in 5 minutes
2. [Installation](./installation.md) - Set up your development environment
3. [Quick Start Guide](./quick-start.md) - Build your first voice app
4. [Creating Your First App](./first-app.md) - Extend the platform

## Reference Implementation

The [Demo App](../../apps/demo-voice/README.md) serves as a complete reference implementation showcasing:

- **Platform Integration**: Proper use of all platform packages
- **Security Features**: Rate limiting, content safety, and PII redaction
- **Extensibility Patterns**: Custom tools, configurations, and patterns
- **Code Organization**: Clean separation between platform and demo code
- **Developer Experience**: Clear patterns and comprehensive examples

Start with the demo app to understand best practices, then adapt the patterns for your own application.

## Advanced Setup

For production applications with specific requirements:

- [Advanced Setup Options](./advanced-setup/) - Choose the right configuration for your needs
  - [Local Database Setup](./advanced-setup/local-database.md) - PostgreSQL with persistent storage
  - [Supabase Auth Setup](./advanced-setup/supabase-auth.md) - Full authentication with Google OAuth

## Next Steps

- Read the [Developer Guide](../guides/developer-guide.md) - Complete guide for building applications
- Learn about the [Architecture](../architecture/)
- Explore the [API Reference](../api/)
- Read the [Deployment Guide](../deployment/)
- Try the [Demo App](../../apps/demo-voice/README.md) - Complete reference implementation
