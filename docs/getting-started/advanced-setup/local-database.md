# Local Database Setup

This guide shows you how to set up the Thrive Realtime Voice Platform with a local PostgreSQL database for persistent data storage.

## Overview

The local database setup provides:

- **Persistent Storage**: Data survives server restarts
- **Session History**: Track conversations across sessions
- **Analytics**: Detailed usage metrics and cost tracking
- **Cross-session Data**: Users can access their conversation history

This setup is ideal for production applications that need data persistence but don't require user authentication.

## Prerequisites

- Node.js 20 or higher
- PostgreSQL 12 or higher
- OpenAI API key with Realtime API access
- Basic familiarity with databases

## Step 1: Install PostgreSQL

### Windows

1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the setup wizard
3. Remember the password you set for the `postgres` user
4. Add PostgreSQL to your PATH (usually done automatically)

### macOS

```bash
# Using Homebrew
brew install postgresql
brew services start postgresql

# Or download from postgresql.org
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Step 2: Create Database

1. Open a terminal/command prompt
2. Connect to PostgreSQL:
   ```bash
   psql -U postgres
   ```
3. Create the database:
   ```sql
   CREATE DATABASE thrive_realtime;
   ```
4. Exit PostgreSQL:
   ```sql
   \q
   ```

## Step 3: Clone and Install

```bash
git clone https://github.com/toddsor/thrive-realtime-voice-platform.git
cd thrive-realtime-voice-platform
npm install
```

## Step 4: Configure Environment

Create a `.env` file in `apps/demo-voice/`:

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/thrive_realtime
```

Replace:

- `your_openai_api_key_here` with your actual OpenAI API key
- `your_password` with the PostgreSQL password you set during installation

## Step 5: Run Database Migrations

```bash
cd apps/demo-voice
npm run db:push
```

This will create all the necessary tables in your PostgreSQL database.

## Step 6: Verify Setup

1. **Check Database Connection**:

   ```bash
   npm run db:studio
   ```

   This opens Prisma Studio where you can browse your database tables.

2. **Start the Application**:

   ```bash
   npm run dev
   ```

3. **Test the Demo**:
   - Visit `http://localhost:3000/demo`
   - Click "Connect" to start a voice session
   - Enable "Save session history" in the Session Settings
   - Have a conversation
   - Check Prisma Studio to see the data being stored

## Troubleshooting

### Connection Errors

**Error**: `ECONNREFUSED` or `Connection refused`

- **Solution**: Ensure PostgreSQL is running
  - Windows: Check Services or restart from Start Menu
  - macOS: `brew services start postgresql`
  - Linux: `sudo systemctl start postgresql`

**Error**: `password authentication failed`

- **Solution**: Verify your password in the `DATABASE_URL`
- Try connecting manually: `psql -U postgres -h localhost`

**Error**: `database "thrive_realtime" does not exist`

- **Solution**: Create the database manually:
  ```sql
  psql -U postgres -c "CREATE DATABASE thrive_realtime;"
  ```

### Migration Failures

**Error**: `Prisma schema validation failed`

- **Solution**: Ensure you're in the correct directory (`apps/demo-voice`)
- Check that `prisma/schema.prisma` exists

**Error**: `Permission denied`

- **Solution**: Ensure your PostgreSQL user has CREATE privileges
  ```sql
  psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE thrive_realtime TO postgres;"
  ```

### Permission Issues

**Error**: `relation does not exist`

- **Solution**: Run migrations again:
  ```bash
  npm run db:push --force-reset
  ```

## Architecture Explanation

### Database Schema

The platform uses a comprehensive schema with these key models:

- **AppUser**: User accounts and authentication data
- **Session**: Voice conversation sessions
- **Transcript**: Individual conversation messages
- **UsageEvent**: Token usage and cost tracking
- **ToolEvent**: Tool execution logs
- **Summary**: Conversation summaries

### Data Flow

1. **Session Creation**: When a user starts a voice session, a `Session` record is created
2. **Real-time Storage**: As the conversation progresses:
   - `Transcript` records store each message
   - `UsageEvent` records track token usage
   - `ToolEvent` records log any tool executions
3. **Session End**: When the session ends, a `Summary` may be generated
4. **Persistence**: All data is stored in PostgreSQL and survives server restarts

### Benefits

- **Reliability**: Data is never lost due to server restarts
- **Analytics**: Rich data for usage analysis and cost tracking
- **Scalability**: PostgreSQL handles concurrent users efficiently
- **Backup**: Standard PostgreSQL backup tools work out of the box

## Next Steps

1. **Explore the Data**: Use Prisma Studio to browse your conversation data
2. **Build Analytics**: Query the database for usage insights
3. **Add Authentication**: Consider upgrading to [Supabase Auth Setup](./supabase-auth.md)
4. **Deploy**: See the [Deployment Guide](../../deployment/) for production deployment

## Production Considerations

- **Backup Strategy**: Set up regular PostgreSQL backups
- **Monitoring**: Monitor database performance and disk usage
- **Security**: Use environment variables for sensitive data
- **Scaling**: Consider connection pooling for high-traffic applications
