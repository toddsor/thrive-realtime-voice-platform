# @thrive/realtime-ui-components

This package provides a comprehensive set of UI components for the Thrive Realtime Voice Platform, built on top of shadcn/ui and optimized for voice applications.

## Features

- **Core UI Components**: Button, Card, Input, Label, Checkbox, Dialog, Alert, Badge, Separator, AlertDialog
- **Voice-Specific Components**: Cost tracking, usage statistics, live cost monitoring
- **Theme Support**: Built-in dark/light mode support with next-themes
- **Accessibility**: Full ARIA support and keyboard navigation
- **TypeScript**: Complete type definitions for all components
- **Customizable**: Highly customizable with CSS variables and Tailwind classes

## Installation

```bash
npm install @thrive/realtime-ui-components
```

## Usage

### Basic Components

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle } from "@thrive/realtime-ui-components";

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice Session</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Start Conversation</Button>
      </CardContent>
    </Card>
  );
}
```

### Voice-Specific Components

```tsx
import {
  CostDisplay,
  LiveCostTracker,
  UsageStats,
  type ModelPricing,
  type UsageData,
} from "@thrive/realtime-ui-components";

function VoiceDashboard() {
  const modelPricing: Record<string, ModelPricing> = {
    "gpt-realtime-mini": {
      name: "GPT-4o Realtime Mini",
      audioInputTokens: 0.5,
      audioCachedTokens: 0.25,
      audioOutputTokens: 1.5,
      textInputTokens: 0.5,
      textCachedTokens: 0.25,
      textOutputTokens: 1.5,
      description: "Fast and efficient",
    },
  };

  const usageData: UsageData = {
    sessionId: "session-123",
    startTime: Date.now() - 60000,
    durationMs: 60000,
    audioMinutes: 1.0,
    tokensInput: 1000,
    tokensOutput: 500,
    tokensCached: 200,
    toolCalls: 5,
    retrievals: 2,
    estimatedCost: 0.025,
  };

  return (
    <div className="space-y-4">
      <CostDisplay currentModelKey="gpt-realtime-mini" modelPricing={modelPricing} />
      <LiveCostTracker
        usageData={usageData}
        currentModelKey="gpt-realtime-mini"
        modelPricing={modelPricing}
        otherCosts={{
          toolCallOverhead: 0.001,
          retrievalOverhead: 0.002,
          sessionOverhead: 0.01,
          connectionOverhead: 0.005,
        }}
      />
      <UsageStats sessionUsage={usageData} onRefresh={() => console.log("Refreshing...")} />
    </div>
  );
}
```

### Theme Integration

```tsx
import { ThemeProvider } from "next-themes";
import { Toaster } from "@thrive/realtime-ui-components";

function App({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
```

## Component Props

### CostDisplay

| Prop              | Type                           | Description                       |
| ----------------- | ------------------------------ | --------------------------------- |
| `currentModelKey` | `string`                       | Key of the currently active model |
| `modelPricing`    | `Record<string, ModelPricing>` | All model pricing data            |
| `className`       | `string`                       | Additional CSS classes            |

### LiveCostTracker

| Prop              | Type                           | Description                       |
| ----------------- | ------------------------------ | --------------------------------- |
| `usageData`       | `UsageData \| null`            | Current session usage data        |
| `isActive`        | `boolean`                      | Whether the session is active     |
| `currentModelKey` | `string`                       | Key of the currently active model |
| `modelPricing`    | `Record<string, ModelPricing>` | All model pricing data            |
| `otherCosts`      | `OtherCosts`                   | Additional cost factors           |
| `className`       | `string`                       | Additional CSS classes            |

### UsageStats

| Prop            | Type                    | Description                 |
| --------------- | ----------------------- | --------------------------- |
| `sessionUsage`  | `SessionUsage \| null`  | Current session usage data  |
| `quotaStatus`   | `QuotaStatus \| null`   | User quota information      |
| `sessionStatus` | `SessionStatus \| null` | Session limits and warnings |
| `isLoading`     | `boolean`               | Loading state               |
| `error`         | `string \| null`        | Error message               |
| `onRefresh`     | `() => void`            | Refresh callback            |
| `className`     | `string`                | Additional CSS classes      |

## Styling

All components use Tailwind CSS classes and can be customized using:

1. **CSS Variables**: Override CSS custom properties for theming
2. **Tailwind Classes**: Pass custom classes via the `className` prop
3. **Component Variants**: Use built-in variant props for different styles

### CSS Variables

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}
```

## Dependencies

- React 19.1.0
- Radix UI primitives
- Lucide React icons
- Tailwind CSS
- class-variance-authority
- clsx
- tailwind-merge
- next-themes (for theme support)
- sonner (for toast notifications)

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Type check
npm run typecheck

# Lint
npm run lint

# Clean build artifacts
npm run clean
```

## License

MIT
