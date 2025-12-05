import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Log for debugging
  if (typeof window !== 'undefined') {
    console.log('Supabase client init:', { 
      hasUrl: !!url, 
      hasKey: !!key,
      urlPrefix: url?.substring(0, 30) 
    })
  }

  // Return a mock client during build time if env vars are not set
  if (!url || !key) {
    console.warn('Supabase env vars not set, using mock client')
    const mockQuery = {
      eq: () => mockQuery,
      neq: () => mockQuery,
      gt: () => mockQuery,
      gte: () => mockQuery,
      lt: () => mockQuery,
      lte: () => mockQuery,
      is: () => mockQuery,
      in: () => mockQuery,
      order: () => mockQuery,
      limit: () => mockQuery,
      single: async () => ({ data: null, error: null }),
      then: async (resolve: (value: { data: never[], error: null }) => void) => resolve({ data: [], error: null }),
    }
    
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ data: null, error: { message: 'Not configured' } }),
        signOut: async () => ({ error: null }),
        exchangeCodeForSession: async () => ({ data: null, error: null }),
      },
      from: () => ({
        select: () => mockQuery,
        insert: () => ({ select: () => mockQuery, single: async () => ({ data: null, error: null }) }),
        update: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
        delete: () => ({ eq: async () => ({ error: null }) }),
      }),
    } as any
  }

  return createBrowserClient(url, key)
}

