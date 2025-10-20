# Levels of Anonymity Guide

A comprehensive guide to the Thrive Realtime Voice Platform's 5-level anonymity system that provides users with granular control over their data privacy.

## Overview of the System

The Levels of Anonymity system is designed with a privacy-first approach, allowing users to choose how much data they want to share and store. Each level provides different privacy guarantees and capabilities.

### Why Multiple Identity Levels?

- **User Choice**: Users can choose their comfort level with data storage
- **Progressive Enhancement**: Features unlock as users provide more trust
- **Privacy by Design**: Data handling is transparent and user-controlled
- **Compliance**: Meets various privacy regulations and user expectations

### User Journey Through Levels

```
Ephemeral → Local → Anonymous → Pseudonymous → Authenticated
    ↓         ↓         ↓            ↓             ↓
  No data   Browser   Temp server  Persistent   Full account
  storage   only      storage      profile      access
```

## Level Details

### 1. Ephemeral

**Privacy Level**: Maximum
**Data Storage**: None
**Retention**: Immediate (in-memory only)

```typescript
const ephemeralConfig = {
  storage: "none",
  retention: "immediate",
  piiHandling: "block",
  externalAccess: false,
  features: ["basic_chat", "echo_tool"],
  description: "No data stored anywhere - everything processed in memory only",
};
```

**Use Cases**:

- One-time conversations
- Sensitive discussions
- Testing the platform
- Maximum privacy requirements

**Limitations**:

- No conversation history
- No external tool access
- No persistent features
- No data recovery

### 2. Local

**Privacy Level**: High
**Data Storage**: Browser only
**Retention**: Until cleared by user

```typescript
const localConfig = {
  storage: "browser",
  retention: "until_cleared",
  piiHandling: "allow",
  externalAccess: false,
  features: ["conversation_history", "local_tools"],
  description: "Data stored only in your browser - never sent to servers",
};
```

**Use Cases**:

- Personal conversations
- Local data analysis
- Offline-capable features
- Privacy-conscious users

**Limitations**:

- No cross-device sync
- No server-side features
- Limited to browser storage
- Data lost if browser cleared

### 3. Anonymous

**Privacy Level**: Medium-High
**Data Storage**: Server with anonymous ID
**Retention**: 14 days automatic deletion

```typescript
const anonymousConfig = {
  storage: "server",
  retention: "14_days",
  piiHandling: "redact",
  externalAccess: true,
  features: ["conversation_history", "external_tools", "server_features"],
  description: "Temporary server storage with anonymous ID - auto-deleted after 14 days",
};
```

**Use Cases**:

- Multi-session conversations
- External tool access
- Server-side features
- Temporary collaboration

**Benefits**:

- Cross-device access
- External tool integration
- Server-side processing
- Automatic cleanup

### 4. Pseudonymous

**Privacy Level**: Medium
**Data Storage**: Server with chosen nickname
**Retention**: 90 days

```typescript
const pseudonymousConfig = {
  storage: "server",
  retention: "90_days",
  piiHandling: "redact",
  externalAccess: true,
  features: ["persistent_profile", "nickname", "extended_history"],
  description: "Persistent profile with chosen nickname - 90-day retention",
};
```

**Use Cases**:

- Regular platform usage
- Personalized experience
- Extended conversation history
- Community features

**Benefits**:

- Chosen identity
- Longer retention
- Personalized features
- Community recognition

### 5. Authenticated

**Privacy Level**: Low (but controlled)
**Data Storage**: Server with full account
**Retention**: Permanent (user-controlled)

```typescript
const authenticatedConfig = {
  storage: "server",
  retention: "permanent",
  piiHandling: "allow",
  externalAccess: true,
  features: ["full_account", "data_export", "account_management"],
  description: "Full account access with permanent storage and full control",
};
```

**Use Cases**:

- Professional usage
- Long-term projects
- Data portability
- Full platform features

**Benefits**:

- Full feature access
- Data ownership
- Account management
- Data export/import

## Data Flow

### What Data is Stored at Each Level

```typescript
interface DataStorage {
  ephemeral: {
    memory: "conversation_buffer";
    disk: "none";
    server: "none";
  };
  local: {
    memory: "conversation_buffer";
    disk: "localStorage_indexedDB";
    server: "none";
  };
  anonymous: {
    memory: "conversation_buffer";
    disk: "localStorage_cookies";
    server: "encrypted_entries_14_days";
  };
  pseudonymous: {
    memory: "conversation_buffer";
    disk: "localStorage_cookies";
    server: "encrypted_entries_profile_90_days";
  };
  authenticated: {
    memory: "conversation_buffer";
    disk: "localStorage_cookies";
    server: "encrypted_entries_user_profile_permanent";
  };
}
```

### How Data is Protected

1. **Encryption**: All server data encrypted at rest
2. **PII Redaction**: Automatic based on identity level
3. **Access Controls**: Identity-based permissions
4. **Audit Logs**: All access tracked and logged
5. **Retention Policies**: Automatic deletion per level

### Retention Policies

```typescript
const RETENTION_POLICIES = {
  ephemeral: { maxAgeMs: 0 }, // Immediate
  local: { maxAgeMs: 0 }, // User-controlled
  anonymous: { maxAgeMs: 14 * 24 * 60 * 60 * 1000 }, // 14 days
  pseudonymous: { maxAgeMs: 90 * 24 * 60 * 60 * 1000 }, // 90 days
  authenticated: { maxAgeMs: Infinity }, // Permanent
};
```

### PII Redaction Strategies

```typescript
const PII_STRATEGIES = {
  ephemeral: "block", // Block execution if PII detected
  local: "allow", // Allow PII in local storage
  anonymous: "redact", // Redact PII before storage
  pseudonymous: "redact", // Redact PII before storage
  authenticated: "allow", // Allow PII with user consent
};
```

## Implementation Guide

### Setting Up Identity Management

```typescript
import { identityStore } from "@/lib/stores/identityStore";
import { useIdentity } from "@/lib/hooks/useIdentity";

// Initialize identity store
const identity = identityStore.getIdentity();

// Use in React components
function MyComponent() {
  const { level, upgradeToAnonymous } = useIdentity();

  return (
    <div>
      <p>Current level: {level}</p>
      <button onClick={upgradeToAnonymous}>Upgrade to Anonymous</button>
    </div>
  );
}
```

### Configuring Tool Policies

```typescript
import { registerTool } from "@/lib/tools/registry";

// Register tool with policy
registerTool({
  name: "weather",
  description: "Get weather information",
  policy: {
    minIdentityLevel: "anonymous",
    requiresExternalAccess: true,
    piiHandling: "redact",
    maxCallsPerSession: 5,
  },
  handler: weatherHandler,
});
```

### Customizing Retention Policies

```typescript
// Environment variables
RETENTION_ANONYMOUS_MAX_AGE_MS = 1209600000; // 14 days
RETENTION_PSEUDONYMOUS_MAX_AGE_MS = 7776000000; // 90 days
RETENTION_AUTHENTICATED_MAX_AGE_MS = 31536000000; // 1 year

// Runtime configuration
const config = loadRuntimeConfig();
config.policies.retention = {
  anonymous: { maxAgeMs: 14 * 24 * 60 * 60 * 1000 },
  pseudonymous: { maxAgeMs: 90 * 24 * 60 * 60 * 1000 },
  authenticated: { maxAgeMs: 365 * 24 * 60 * 60 * 1000 },
};
```

### Feature Flag Configuration

```typescript
// Enable/disable specific levels
FEATURE_ANONYMITY_EPHEMERAL = true;
FEATURE_ANONYMITY_LOCAL = true;
FEATURE_ANONYMITY_ANONYMOUS = true;
FEATURE_ANONYMITY_PSEUDONYMOUS = true;
FEATURE_ANONYMITY_AUTHENTICATED = true;

// Runtime feature flags
const featureFlags = {
  anonymityEphemeralEnabled: true,
  anonymityLocalEnabled: true,
  anonymityAnonymousEnabled: true,
  anonymityPseudonymousEnabled: true,
  anonymityAuthenticatedEnabled: true,
};
```

## User Experience

### Upgrade Prompts and Flows

The platform provides guided upgrade flows with clear consent requirements:

```typescript
// Upgrade prompt component
<UpgradePrompt
  trigger={<button>Upgrade Identity</button>}
  onUpgrade={(level) => {
    console.log(`Upgraded to ${level}`);
    // Handle upgrade completion
  }}
/>
```

### Consent Management

Each upgrade requires explicit user consent:

```typescript
const consentRequired = {
  anonymous: "Data will be stored on servers for 14 days",
  pseudonymous: "Data will be stored on servers for 90 days with your chosen nickname",
  authenticated: "Data will be stored permanently with your account",
};
```

### UI Components

```typescript
import { IdentityBadge, UpgradePrompt, RetentionInfo } from "@/components/identity";

function AppHeader() {
  return (
    <div className="flex items-center gap-4">
      <IdentityBadge />
      <UpgradePrompt />
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-4">
      <RetentionInfo />
      <UpgradePrompt trigger={<button>Change Identity Level</button>} />
    </div>
  );
}
```

## Security Guarantees

### By Identity Level

| Level         | Data Storage | PII Handling | External Access | Retention       |
| ------------- | ------------ | ------------ | --------------- | --------------- |
| Ephemeral     | None         | Block        | No              | Immediate       |
| Local         | Browser      | Allow        | No              | User-controlled |
| Anonymous     | Server       | Redact       | Yes             | 14 days         |
| Pseudonymous  | Server       | Redact       | Yes             | 90 days         |
| Authenticated | Server       | Allow        | Yes             | Permanent       |

### Privacy Controls

- **Data Minimization**: Only store what's necessary for the chosen level
- **Purpose Limitation**: Data used only for stated purposes
- **Storage Limitation**: Automatic deletion per retention policy
- **Transparency**: Clear information about data handling
- **User Control**: Users can upgrade/downgrade at any time

## Best Practices

### For Developers

1. **Always check identity level** before accessing external resources
2. **Respect PII handling policies** for each tool
3. **Implement proper consent flows** for upgrades
4. **Use feature flags** to control level availability
5. **Log security events** for audit trails

### For Users

1. **Start with ephemeral** to test the platform
2. **Upgrade gradually** as you need more features
3. **Understand retention policies** before upgrading
4. **Use local storage** for sensitive conversations
5. **Regularly review** your data and upgrade level

## Migration and Data Portability

### Upgrading Between Levels

```typescript
// Ephemeral → Anonymous
const { anonymousId } = await identityStore.upgradeToAnonymous();

// Anonymous → Pseudonymous
const { pseudonymId } = await identityStore.upgradeToPseudonymous("nickname");

// Pseudonymous → Authenticated
const { success } = await identityStore.linkToUser(userId);
```

### Data Export

```typescript
// Export data for migration
const exportData = await identityStore.exportData();

// Import data to new level
await identityStore.importData(exportData);
```

### Downgrading

Users can downgrade their identity level, which will:

- Stop storing new data at the higher level
- Retain existing data per the new level's retention policy
- Remove access to level-specific features

## Troubleshooting

### Common Issues

1. **Tool Access Denied**: Check if tool requires higher identity level
2. **PII Blocked**: Verify PII handling policy for current level
3. **Upgrade Failed**: Ensure user consent is provided
4. **Data Not Persisting**: Check if current level supports storage

### Debug Information

```typescript
// Get current identity debug info
const debugInfo = identityStore.getDebugInfo();
console.log("Identity Debug:", debugInfo);

// Check tool policy compliance
const canExecute = canExecuteTool(tool, identity, callCount);
console.log("Tool Access:", canExecute);
```

## Related Documentation

- [Security Guide](./security.md) - Detailed security implementation
- [API Reference](../api/auth.md) - Identity management APIs
- [Developer Guide](./developer-guide.md) - Implementation examples
- [Contracts](../api/contracts.md) - Type definitions
