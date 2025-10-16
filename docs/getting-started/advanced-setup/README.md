# Advanced Setup Options

This section covers advanced installation configurations for the Thrive Realtime Voice Platform. Choose the setup that best fits your needs.

## Configuration Comparison

| Feature                   | Basic Setup         | Local Database    | Supabase Auth           |
| ------------------------- | ------------------- | ----------------- | ----------------------- |
| **Data Storage**          | Memory only         | PostgreSQL        | PostgreSQL              |
| **Authentication**        | None                | None              | Supabase + Google OAuth |
| **Session Persistence**   | ❌ Lost on restart  | ✅ Persistent     | ✅ Persistent           |
| **User Management**       | ❌ Anonymous only   | ❌ Anonymous only | ✅ Full user system     |
| **Cross-session History** | ❌ No               | ✅ Yes            | ✅ Yes                  |
| **Setup Complexity**      | ⭐ Simple           | ⭐⭐ Moderate     | ⭐⭐⭐ Advanced         |
| **Production Ready**      | ❌ Development only | ✅ Yes            | ✅ Yes                  |

## Quick Decision Tree

```
Do you need user authentication?
├─ No → Do you need data persistence?
│   ├─ No → [Basic Setup](../tldr.md) (Memory store, no auth)
│   └─ Yes → [Local Database Setup](./local-database.md) (PostgreSQL, no auth)
└─ Yes → [Supabase Auth Setup](./supabase-auth.md) (PostgreSQL + Supabase + Google OAuth)
```

## Setup Guides

### 1. [Local Database Setup](./local-database.md)

- **Best for**: Production apps that need data persistence but don't require user authentication
- **Features**: PostgreSQL database, session history, analytics, cross-session data
- **Setup time**: ~15 minutes
- **Requirements**: PostgreSQL installation, basic database knowledge

### 2. [Supabase Auth Setup](./supabase-auth.md)

- **Best for**: Production apps that need both data persistence and user authentication
- **Features**: PostgreSQL database + Supabase authentication + Google OAuth
- **Setup time**: ~30 minutes
- **Requirements**: Supabase account, Google Cloud Console project, PostgreSQL installation

## Migration Path

You can start with any setup and migrate to a more advanced one later:

```
Basic Setup → Local Database → Supabase Auth
```

Each migration preserves your existing data and configuration.

## Next Steps

After completing your chosen setup:

1. **Test the Demo App**: Visit `http://localhost:3000/demo` to verify everything works
2. **Explore the Code**: Check out the [Demo App README](../../../apps/demo-voice/README.md)
3. **Build Your Own**: Follow the [Creating Your First App](../first-app.md) guide
4. **Deploy**: See the [Deployment Guide](../../deployment/) for production deployment

## Troubleshooting

If you encounter issues:

1. Check the troubleshooting section in your chosen setup guide
2. Review the [Architecture Overview](../../architecture/) to understand the system
3. Check the [API Reference](../../api/) for detailed technical information
4. Open an issue on [GitHub](https://github.com/toddsor/thrive-realtime-voice-platform/issues)
