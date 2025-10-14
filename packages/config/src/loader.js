function requireEnv(name) {
    const v = process.env[name];
    if (!v)
        throw new Error(`Missing required env: ${name}`);
    return v;
}
function getEnv(name, defaultValue) {
    return process.env[name] ?? defaultValue;
}
export function loadRuntimeConfig() {
    const featureFlags = {
        transport: process.env.FEATURE_TRANSPORT ?? "webrtc",
        bargeIn: process.env.FEATURE_BARGE_IN !== "false",
        captions: process.env.FEATURE_CAPTIONS !== "false",
        tools: process.env.FEATURE_TOOLS !== "false",
        memory: process.env.FEATURE_MEMORY ?? "off",
    };
    const policies = {
        maxPayloadBytes: Number(process.env.MAX_PAYLOAD_BYTES ?? 524288),
        maxSessionMinutes: Number(process.env.MAX_SESSION_MINUTES ?? 15),
        allowUnconsentedStorage: process.env.ALLOW_UNCONSENTED_STORAGE === "true",
        rateLimit: {
            sessions: {
                max: Number(process.env.RATE_LIMIT_SESSIONS_MAX ?? 10),
                window: Number(process.env.RATE_LIMIT_SESSIONS_WINDOW ?? 60000),
            },
            toolCalls: {
                max: Number(process.env.RATE_LIMIT_TOOLS_MAX ?? 20),
                window: Number(process.env.RATE_LIMIT_TOOLS_WINDOW ?? 60000),
            },
        },
    };
    return {
        model: getEnv("OPENAI_API_REALTIME_MODEL", "gpt-realtime-mini"),
        openaiKey: requireEnv("OPENAI_API_KEY"),
        baseUrl: process.env.OPENAI_BASE_URL,
        featureFlags,
        policies,
    };
}
export function loadDatabaseConfig() {
    if (!process.env.DATABASE_URL)
        return null;
    return {
        url: process.env.DATABASE_URL,
        directUrl: process.env.DIRECT_URL,
    };
}
export function loadAuthConfig() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey)
        return {};
    return {
        supabase: {
            url: supabaseUrl,
            anonKey: supabaseKey,
            providers: {
                google: process.env.SUPABASE_AUTH_GOOGLE_CLIENT_ID && process.env.SUPABASE_AUTH_GOOGLE_SECRET
                    ? { clientId: process.env.SUPABASE_AUTH_GOOGLE_CLIENT_ID, secret: process.env.SUPABASE_AUTH_GOOGLE_SECRET }
                    : undefined,
                linkedin: process.env.SUPABASE_AUTH_LINKEDIN_CLIENT_ID && process.env.SUPABASE_AUTH_LINKEDIN_SECRET
                    ? {
                        clientId: process.env.SUPABASE_AUTH_LINKEDIN_CLIENT_ID,
                        secret: process.env.SUPABASE_AUTH_LINKEDIN_SECRET,
                    }
                    : undefined,
                facebook: process.env.SUPABASE_AUTH_FACEBOOK_CLIENT_ID && process.env.SUPABASE_AUTH_FACEBOOK_SECRET
                    ? {
                        clientId: process.env.SUPABASE_AUTH_FACEBOOK_CLIENT_ID,
                        secret: process.env.SUPABASE_AUTH_FACEBOOK_SECRET,
                    }
                    : undefined,
            },
        },
    };
}
// Helper function to load all configs at once
export function loadAllConfigs() {
    return {
        runtime: loadRuntimeConfig(),
        database: loadDatabaseConfig(),
        auth: loadAuthConfig(),
    };
}
