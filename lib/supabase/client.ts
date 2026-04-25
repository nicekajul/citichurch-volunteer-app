import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null
let clientUrl: string | undefined

// Return a singleton browser client so all providers share the same session.
// Re-creates if env vars weren't available on the first call.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If we already have a valid client for the current URL, reuse it
  if (client && clientUrl === url && url) return client

  if (!url || !key) {
    const errorMsg = `Missing Supabase config:
    - URL: ${url ? 'set' : 'NOT SET'}
    - ANON_KEY: ${key ? 'set' : 'NOT SET'}`
    console.error(errorMsg)
    throw new Error(errorMsg)
  }

  client = createBrowserClient(url, key)
  clientUrl = url
  return client
}
