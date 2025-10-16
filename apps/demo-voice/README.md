# Demo Voice App

A complete reference implementation of the Thrive Realtime Voice Platform, showcasing all platform packages working together in a production-ready Next.js application.

> **📚 Platform Documentation**: See the [main platform docs](../../docs/) for complete documentation, architecture overview, and getting started guides.

## Overview

This demo app demonstrates the [Multi-App Schema Extension Pattern](../../docs/architecture/multi-app-pattern.md) by extending the platform's base schema with demo-specific tables and operations.

## Features

### Core Voice Features

- **Real-time Voice Communication**: WebRTC and WebSocket transport support
- **AI-Powered Conversations**: OpenAI Realtime API integration
- **Live Captions**: Real-time transcription with smooth scrolling
- **Tool Integration**: RAG (Retrieval Augmented Generation) with document search
- **Cost Tracking**: Real-time usage monitoring and cost estimation

### Authentication (Optional)

- **Multi-Provider Auth**: Google, LinkedIn, Facebook OAuth
- **Email/Password**: Traditional authentication
- **Anonymous Mode**: Works without authentication in development
- **User Sync**: Automatic synchronization with database

### Data Persistence (Optional)

- **Session Storage**: PostgreSQL with Prisma ORM
- **Transcript History**: Conversation persistence
- **Tool Event Tracking**: Function call logging
- **Privacy Controls**: PII redaction and consent management

### Advanced Features

- **Health Monitoring**: System health checks and metrics
- **Usage Analytics**: Detailed usage tracking and quotas
- **Content Safety**: PII redaction and content filtering
- **Rate Limiting**: API protection and abuse prevention
- **SRE Tools**: Circuit breakers, alerts, and synthetic monitoring

## Database Schema

This demo app demonstrates the [Multi-App Schema Extension Pattern](../../docs/architecture/multi-app-pattern.md) by combining:

1. **Base Platform Schema** - Core tables from `packages/store-prisma`
2. **Demo-Specific Extensions** - `DemoSession` and `DemoFeedback` tables
3. **Relations** - Links between demo and platform tables

### Demo-Specific Tables

#### `DemoSession`

- `id` - UUID primary key
- `userId` - User identifier (references `AppUser`)
- `sessionName` - Human-readable session name
- `demoType` - Enum: 'VOICE', 'CHAT', 'VIDEO'
- `metadata` - JSON field for additional data
- `status` - Enum: 'ACTIVE', 'COMPLETED', 'CANCELLED'
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

#### `DemoFeedback`

- `id` - UUID primary key
- `sessionId` - Reference to DemoSession
- `userId` - User identifier
- `rating` - Integer 1-5
- `feedback` - Optional text feedback
- `category` - String category (e.g., 'voice_quality', 'response_time')
- `createdAt` - Timestamp

### Schema Implementation

See [`lib/README.md`](./lib/README.md) for detailed implementation of the multi-app pattern.

## Quick Start

> **🚀 For complete setup instructions, see the [Platform Getting Started Guide](../../docs/getting-started/).**

### Prerequisites

- Node.js 20+
- npm or pnpm
- OpenAI API key (required)
- Supabase account (optional, for authentication)
- PostgreSQL database (optional, for persistence)

### Installation

1. **Clone the platform repository**:

   ```bash
   git clone https://github.com/toddsor/thrive-realtime-voice-platform.git
   cd thrive-realtime-voice-platform
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Build all packages**:

   ```bash
   npm run build
   ```

4. **Set up environment variables**:

   ```bash
   cd apps/demo-voice
   cp .env.example .env.local
   ```

5. **Configure your environment**:
   Edit `.env.local` with your API keys and configuration.

6. **Run the demo**:

   ```bash
   npm run dev
   ```

7. **Open your browser**:
   Navigate to `http://localhost:3000/demo`

## Environment Configuration

### Required Variables

```bash
# OpenAI Configuration (Required)
OPENAI_API_KEY=your_openai_api_key_here
```

### Optional Variables

```bash
# Supabase Configuration (Optional - for authentication)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OAuth Providers (Optional)
SUPABASE_AUTH_GOOGLE_CLIENT_ID=
SUPABASE_AUTH_GOOGLE_SECRET=
SUPABASE_AUTH_LINKEDIN_CLIENT_ID=
SUPABASE_AUTH_LINKEDIN_SECRET=
SUPABASE_AUTH_FACEBOOK_CLIENT_ID=
SUPABASE_AUTH_FACEBOOK_SECRET=

# Database (Optional - for persistence)
DATABASE_URL=postgresql://...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Architecture

### Platform Packages Used

- `@thrivereflections/realtime-contracts` - Core TypeScript interfaces
- `@thrivereflections/realtime-core` - Voice communication engine
- `@thrivereflections/realtime-config` - Configuration management
- `@thrivereflections/realtime-observability` - Logging and monitoring
- `@thrivereflections/realtime-store-prisma` - Database persistence
- `@thrivereflections/realtime-tool-gateway` - Function calling and RAG
- `@thrivereflections/realtime-auth-supabase` - Authentication
- `@thrivereflections/realtime-transport-webrtc` - WebRTC transport
- `@thrivereflections/realtime-transport-websocket` - WebSocket transport
- `@thrivereflections/realtime-usage` - Cost tracking and analytics
- `@thrivereflections/realtime-security` - Security and content safety
- `@thrivereflections/realtime-sre` - SRE tools and monitoring

### Application Structure

```
apps/demo-voice/
├── app/
│   ├── demo/                 # Main voice interface
│   ├── api/                  # API routes
│   │   ├── realtime/         # Voice session management
│   │   ├── tools/            # Tool gateway
│   │   ├── auth/             # Authentication endpoints
│   │   ├── internal/         # Internal persistence APIs
│   │   ├── health/           # Health checks
│   │   ├── config/           # Configuration APIs
│   │   ├── monitoring/       # Monitoring and alerts
│   │   └── usage/            # Usage tracking
│   └── layout.tsx            # Root layout
├── components/
│   ├── auth/                 # Authentication components
│   └── ui/                   # UI components
├── lib/
│   ├── hooks/                # React hooks
│   ├── config/               # Configuration files
│   ├── supabase/             # Supabase client utilities
│   ├── auth/                 # Auth provider
│   └── stores/               # Data stores
└── package.json              # Dependencies
```

## API Routes

### Core Routes (Required)

- `POST /api/realtime/session` - Create voice session
- `POST /api/tools/gateway` - Tool execution gateway
- `POST /api/internal/session-created` - Session persistence
- `POST /api/internal/transcript-append` - Transcript persistence
- `POST /api/internal/tool-event-append` - Tool event persistence

### Authentication Routes (Optional)

- `GET /api/auth/providers` - Available auth providers
- `GET /api/auth/session` - Current session info
- `POST /api/auth/signout` - Sign out
- `POST /api/auth/validate` - Validate session
- `GET /api/auth/callback` - OAuth callback

### Health & Config Routes

- `GET /api/health` - System health check
- `GET /api/health/tools` - Tool health check
- `GET /api/config/model` - Current model configuration

### Advanced Routes (Optional)

- `GET /api/monitoring/synthetic` - Synthetic monitoring
- `POST /api/alerts/webhook` - Alert webhook
- `GET /api/usage/current` - Current usage stats
- `GET /api/usage/history` - Usage history
- `GET /api/usage/quota/[userId]` - User quota
- `GET /api/usage/session-status/[sessionId]` - Session status

## Usage Examples

### Basic Voice Chat

1. Open the demo page
2. Click "Connect" to start a voice session
3. Allow microphone access
4. Start speaking - the AI will respond in real-time
5. View live captions and cost tracking

### With Authentication

1. Configure Supabase environment variables
2. Click "Sign In" to authenticate
3. Your sessions will be persisted to the database
4. View usage history and analytics

### With RAG Tools

1. Ensure database is configured
2. The AI can search through documents using the `retrieve_docs` tool
3. View tool usage in the interface
4. Monitor retrieval metrics

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

## Customization

### Adding New Tools

1. Create tool handler in `lib/tools/`
2. Register in `app/api/tools/gateway/route.ts`
3. Update agent configuration

### Custom UI Components

1. Add components to `components/ui/`
2. Use standard React components and shadcn/ui primitives
3. Use in your application

### Custom Authentication

1. Implement auth provider interface
2. Update configuration
3. Add UI components

## Troubleshooting

### Common Issues

**Voice not working**:

- Check microphone permissions
- Verify OpenAI API key
- Check browser console for errors

**Authentication not working**:

- Verify Supabase configuration
- Check OAuth provider settings
- Ensure redirect URLs are correct

**Database errors**:

- Verify DATABASE_URL is correct
- Run Prisma migrations
- Check database connectivity

**Build errors**:

- Ensure all platform packages are built
- Check TypeScript configuration
- Verify all dependencies are installed

### Getting Help

1. Check the platform documentation
2. Review the API route implementations
3. Examine the component source code
4. Check browser console for errors
5. Review server logs

## Contributing

This demo app serves as a reference implementation. When contributing:

1. Follow the platform's coding standards
2. Update documentation for any changes
3. Test all features thoroughly
4. Ensure backward compatibility
5. Update examples and guides

## License

This demo app is part of the Thrive Realtime Voice Platform and follows the same license terms.
