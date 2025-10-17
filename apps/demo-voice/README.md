# Demo Voice App

A comprehensive reference implementation of the Thrive Realtime Voice Platform, showcasing all platform packages working together in a production-ready Next.js application with advanced patterns, security features, and extensibility examples.

> **📚 Platform Documentation**: See the [main platform docs](../../docs/) for complete documentation, architecture overview, and getting started guides.

## Overview

This demo app demonstrates the [Multi-App Schema Extension Pattern](../../docs/architecture/multi-app-pattern.md) by extending the platform's base schema with demo-specific tables and operations. It serves as a complete reference implementation showing best practices for:

- **Platform Integration**: Proper use of all platform packages
- **Security**: Rate limiting, content safety, and PII redaction
- **Extensibility**: Custom tools, configurations, and patterns
- **Code Organization**: Clean separation between platform and demo code
- **Developer Experience**: Clear patterns and comprehensive examples

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

- **Security & Rate Limiting**: API protection with configurable rate limits
- **Health Monitoring**: System health checks and metrics
- **Usage Analytics**: Detailed usage tracking and cost calculation
- **Content Safety**: PII redaction and content filtering
- **SRE Tools**: Circuit breakers, alerts, and synthetic monitoring
- **Custom Tools**: Extensible tool system with registry pattern
- **Configuration Management**: Flexible agent configuration with validation
- **Cost Tracking**: Centralized cost calculation utilities

## Key Features & Patterns

### 🔒 Security Features

- **Rate Limiting**: Configurable rate limits on API endpoints
- **Content Safety**: PII redaction and content filtering
- **Input Validation**: Comprehensive validation for all inputs

### 🛠️ Extensibility Patterns

- **Tool Registry**: Scalable pattern for adding custom tools
- **Agent Configurations**: Flexible agent setup with validation
- **Configuration Management**: Context-based configuration selection

### 📊 Cost Management

- **Centralized Calculation**: Shared cost calculation utilities
- **Real-time Tracking**: Live cost monitoring during sessions
- **Model Support**: Both GPT-4 Realtime and Mini models

### 🏗️ Code Organization

- **Platform/Demo Separation**: Clear separation of reusable vs demo code
- **Type Safety**: Comprehensive TypeScript interfaces
- **Error Handling**: Robust error handling throughout

### 📚 Developer Experience

- **Clear Examples**: Comprehensive examples for all patterns
- **Documentation**: Inline documentation and README guides
- **Best Practices**: Demonstrates platform integration best practices

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

### Platform Integration Patterns

This demo demonstrates proper integration with all platform packages:

- **High-Level APIs**: Uses `initRealtime()` for voice connections
- **Configuration**: Leverages `getAgentConfigWithUser()` and feature flags
- **Authentication**: Uses `SupabaseAuthProvider` from platform
- **Security**: Implements rate limiting with platform utilities
- **Cost Tracking**: Uses centralized cost calculation utilities
- **Tool Management**: Demonstrates registry pattern for extensibility
- **Error Handling**: Proper error handling and logging throughout

### Application Structure

```
apps/demo-voice/
├── app/
│   ├── demo/                 # Main voice interface
│   ├── api/                  # API routes
│   │   ├── realtime/         # Voice session management (with rate limiting)
│   │   ├── tools/            # Tool gateway (with registry pattern)
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
│   ├── platform/             # Reusable platform integration patterns
│   │   ├── index.ts          # Platform utilities exports
│   │   └── tools/            # Custom tool examples
│   ├── demo/                 # Demo-specific code
│   │   └── index.ts          # Demo utilities exports
│   ├── hooks/                # React hooks
│   ├── config/               # Configuration files with validation
│   ├── utils/                # Shared utilities (cost calculation)
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

### With Custom Tools

1. The demo includes example custom tools:
   - **Weather Tool**: Ask "What's the weather in New York?"
   - **Calendar Tool**: Say "Create a meeting for tomorrow at 2 PM"
2. Tools are managed through the registry pattern
3. View tool usage and results in the interface

### With Custom Agent Configurations

1. The demo shows different agent types:
   - **Support Agent**: Empathetic and solution-oriented
   - **Sales Agent**: Persuasive and focused on needs
   - **Technical Agent**: Precise and detailed
2. Agent configurations include validation
3. Feature flags control behavior (memory, captions, etc.)

### With Security Features

1. API calls are automatically rate-limited
2. Session creation: 10 per hour per IP
3. Tool calls: 30 per minute per IP
4. Rate limit headers are included in responses

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

1. Create tool handler in `lib/platform/tools/`
2. Register using the tool registry pattern
3. Update agent configuration to include new tools
4. Example: See `weatherTool.ts` and `registry.ts`

### Custom Agent Configurations

1. Use `createCustomAgentConfig()` for simple overrides
2. Create specialized configs in `agentConfigs` object
3. Use `getAgentConfigForContext()` for context-based selection
4. Validate configurations with `validateAgentConfig()`

### Custom UI Components

1. Add components to `components/ui/`
2. Use standard React components and shadcn/ui primitives
3. Follow the platform/demo separation pattern
4. Export from appropriate index files

### Custom Authentication

1. Implement auth provider interface
2. Update configuration
3. Add UI components
4. Follow the patterns in `lib/auth/`

### Code Organization

1. **Platform Code**: Put reusable patterns in `lib/platform/`
2. **Demo Code**: Put demo-specific code in `lib/demo/`
3. **Utilities**: Shared utilities go in `lib/utils/`
4. **Configuration**: Agent and system configs in `lib/config/`

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
