# Supabase Authentication Setup

This guide shows you how to set up the Thrive Realtime Voice Platform with Supabase authentication and Google OAuth, plus a local PostgreSQL database for data storage.

## Overview

The Supabase auth setup provides:

- **User Authentication**: Secure user login and session management
- **Google OAuth**: One-click login with Google accounts
- **Persistent Storage**: PostgreSQL database for conversation data
- **User Management**: Full user system with profiles and preferences
- **Data Isolation**: Each user's data is properly separated

This setup is ideal for production applications that need both user authentication and data persistence.

## Prerequisites

- Node.js 20 or higher
- PostgreSQL 12 or higher
- Supabase account (free tier available)
- Google Cloud Console project
- OpenAI API key with Realtime API access

## Part A: Set Up Supabase Project

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `thrive-realtime-voice`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be ready (2-3 minutes)

### 2. Get Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL**: `https://[project-ref].supabase.co`
   - **anon public key**: `eyJ...` (long string)

## Part B: Configure Google OAuth

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Enter project name: `Thrive Realtime Voice`
4. Click "Create"

### 2. Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and press "Enable"

### 3. Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - **User Type**: External
   - **App Name**: Thrive Realtime Voice
   - **User Support Email**: Your email
   - **Developer Contact**: Your email
4. For the OAuth client:
   - **Application Type**: Web application
   - **Name**: Thrive Realtime Voice Web
   - **Authorized redirect URIs**:
     ```
     https://[your-project-ref].supabase.co/auth/v1/callback
     ```
     Replace `[your-project-ref]` with your actual Supabase project reference
5. Click "Create"
6. Copy the **Client ID** and **Client Secret**

### 4. Configure Supabase Google Provider

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Find "Google" and click the toggle to enable it
3. Enter your Google OAuth credentials:
   - **Client ID**: From step 3 above
   - **Client Secret**: From step 3 above
4. Click "Save"

## Part C: Set Up Local Database

Follow the same steps as the [Local Database Setup](./local-database.md):

1. **Install PostgreSQL** (if not already installed)
2. **Create Database**:
   ```bash
   psql -U postgres
   CREATE DATABASE thrive_realtime;
   \q
   ```

## Part D: Configure Environment Variables

Create a `.env` file in `apps/demo-voice/`:

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/thrive_realtime

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Replace:

- `your_openai_api_key_here` with your OpenAI API key
- `your_password` with your PostgreSQL password
- `[your-project-ref]` with your Supabase project reference
- `your_supabase_anon_key_here` with your Supabase anon key

## Part E: Run Migrations and Start

1. **Install Dependencies**:

   ```bash
   cd thrive-realtime-voice-platform
   npm install
   ```

2. **Run Database Migrations**:

   ```bash
   cd apps/demo-voice
   npm run db:push
   ```

3. **Start the Application**:

   ```bash
   npm run dev
   ```

4. **Test the Setup**:
   - Visit `http://localhost:3000/demo`
   - Click "Login" (you should see a Google login button)
   - Sign in with your Google account
   - Start a voice session and enable "Save session history"
   - Check that your user data appears in the database

## Troubleshooting

### Google OAuth Issues

**Error**: `redirect_uri_mismatch`

- **Solution**: Ensure the redirect URI in Google Cloud Console exactly matches:
  ```
  https://[your-project-ref].supabase.co/auth/v1/callback
  ```
- Check that there are no trailing slashes or extra characters

**Error**: `invalid_client`

- **Solution**: Verify your Client ID and Client Secret are correct
- Ensure the Google+ API is enabled in your Google Cloud project

**Error**: `access_denied`

- **Solution**: Check your OAuth consent screen configuration
- Ensure the app is published or add test users

### Supabase Connection Issues

**Error**: `Invalid API key`

- **Solution**: Verify your Supabase URL and anon key are correct
- Check that you're using the anon key, not the service role key

**Error**: `Failed to fetch`

- **Solution**: Check your internet connection
- Verify the Supabase URL is accessible

**Error**: `JWT expired`

- **Solution**: Clear your browser's local storage and try again
- Check that your system clock is correct

### Database Connection Problems

**Error**: `Database not available, skipping Prisma store creation`

- **Solution**: Verify your `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check that the database exists

**Error**: `relation "AppUser" does not exist`

- **Solution**: Run migrations again:
  ```bash
  npm run db:push --force-reset
  ```

### Auth Token Validation Failures

**Error**: `Invalid JWT token`

- **Solution**: Check that your Supabase anon key is correct
- Verify the token format in browser dev tools

**Error**: `User not found`

- **Solution**: The user sync process may have failed
- Check the server logs for user sync errors
- Try logging out and back in

## Architecture Explanation

### Authentication Flow

1. **User Clicks Login**: Browser redirects to Supabase auth
2. **Google OAuth**: Supabase redirects to Google for authentication
3. **Google Callback**: Google redirects back to Supabase with auth code
4. **Token Exchange**: Supabase exchanges code for JWT tokens
5. **App Redirect**: Supabase redirects back to your app with tokens
6. **User Sync**: App creates/updates `AppUser` record in local database

### User Sync Mechanism

The platform automatically syncs Supabase users with the local database:

- **First Login**: Creates new `AppUser` record with Supabase user data
- **Subsequent Logins**: Updates existing `AppUser` record
- **Data Linking**: All session data is linked to the `AppUser` record

### Data Separation

- **Supabase**: Handles authentication, user profiles, OAuth providers
- **Local PostgreSQL**: Stores conversation data, sessions, analytics
- **Benefits**: Full control over your data, no vendor lock-in for conversation data

### Security Features

- **JWT Tokens**: Secure session management
- **OAuth 2.0**: Industry-standard authentication
- **Data Isolation**: Each user only sees their own data
- **Token Validation**: Server-side token verification

## Next Steps

1. **Test User Flows**: Try logging in/out, creating sessions
2. **Explore User Data**: Check how user data is stored and linked
3. **Customize UI**: Modify the login/logout experience
4. **Add More Providers**: Configure additional OAuth providers
5. **Deploy**: See the [Deployment Guide](../../deployment/) for production deployment

## Production Considerations

- **Domain Configuration**: Update redirect URIs for your production domain
- **OAuth Consent**: Submit your app for verification if needed
- **Database Security**: Use connection pooling and proper access controls
- **Monitoring**: Set up monitoring for auth failures and database performance
- **Backup Strategy**: Regular backups of both Supabase and PostgreSQL data
