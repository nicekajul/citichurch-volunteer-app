// Fails fast with a clear message at startup instead of a deep, opaque
// "Cannot read properties of undefined" error the first time a request
// touches Supabase.
const REQUIRED_ENV_VARS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const

export function assertRequiredEnvVars() {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        `Set them in .env.local (development) or your host's environment settings (production).`,
    )
  }
}
