# Installation

## Clone the Repository

```bash
git clone https://github.com/yourusername/thrive-realtime-voice-platform.git
cd thrive-realtime-voice-platform
```

## Install Dependencies

```bash
npm install
```

## Set Up Environment Variables

Create a `.env` file in `apps/demo-voice/`:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/thrive_realtime

# Supabase (if using authentication)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Build Packages

```bash
npm run build
```

## Set Up Database

```bash
cd apps/demo-voice
npm run db:push
```

## Run the Demo App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the demo app.
