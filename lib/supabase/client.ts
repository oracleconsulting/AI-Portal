import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Return a mock client during build time if env vars are not set
  if (!url || !key || key === 'placeholder_key_for_build') {
    return {
      auth: {
        getUser: async () => ({ data: { user: null } }),
        signInWithPassword: async () => ({ error: { message: 'Not configured' } }),
        signOut: async () => {},
        exchangeCodeForSession: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null }),
          }),
          in: () => ({
            order: () => ({
              limit: async () => ({ data: [] }),
            }),
          }),
          order: () => ({
            limit: async () => ({ data: [] }),
          }),
        }),
        insert: async () => ({ error: null }),
        update: async () => ({ error: null }),
      }),
    } as any
  }

  return createBrowserClient(url, key)
}

