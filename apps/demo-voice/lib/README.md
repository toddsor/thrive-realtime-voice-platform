# Demo App Library Structure

This directory contains the library code for the demo application, organized to demonstrate best practices for integrating with the Thrive Realtime Voice Platform.

## Directory Structure

### `/platform/` - Platform Integration Examples

Contains reusable patterns and examples for integrating with the platform:

- **`index.ts`** - Main exports for platform integration utilities
- **`costCalculation.ts`** - Shared cost calculation utilities
- **`agentConfig.ts`** - Agent configuration patterns and examples
- **`tools/`** - Custom tool examples and registry patterns
  - **`weatherTool.ts`** - Example custom tool implementation
  - **`registry.ts`** - Tool registry pattern for scalable tool management

### `/demo/` - Demo-Specific Code

Contains code specific to the demo application:

- **`index.ts`** - Main exports for demo-specific utilities
- **`hooks/`** - React hooks for the demo
- **`components/`** - Demo-specific UI components
- **`store/`** - Demo-specific data persistence

### `/config/` - Configuration Management

Contains configuration files and utilities:

- **`agentConfig.ts`** - Agent configuration patterns
- **`systemPrompts.ts`** - System prompt definitions

### `/utils/` - Shared Utilities

Contains utility functions used across the application:

- **`costCalculation.ts`** - Cost calculation utilities
- **`utils.ts`** - General utility functions

## Usage Patterns

### Platform Integration

```typescript
import { calculateUsageCost, createCustomAgentConfig, initializeToolRegistry } from "@/lib/platform";
```

### Demo-Specific Code

```typescript
import { useRealtimeVoice, demoStore } from "@/lib/demo";
```

## Best Practices Demonstrated

1. **Separation of Concerns**: Platform integration code is separated from demo-specific code
2. **Reusable Patterns**: Platform utilities can be easily copied to other projects
3. **Clear Exports**: Each directory has a clear index.ts with well-documented exports
4. **Type Safety**: All utilities are properly typed with TypeScript
5. **Documentation**: Each utility includes JSDoc comments explaining usage

## Adding New Features

### Adding a New Platform Integration

1. Create the utility in `/platform/`
2. Add proper TypeScript types
3. Include JSDoc documentation
4. Export from `/platform/index.ts`

### Adding Demo-Specific Code

1. Create the utility in `/demo/` or appropriate subdirectory
2. Add proper TypeScript types
3. Export from `/demo/index.ts` if it's a main utility

This structure makes it easy for developers to understand what code is reusable (platform) vs. what is demo-specific, and provides clear patterns for building their own applications.
