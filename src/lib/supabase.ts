import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client authenticated with the current Clerk session's JWT.
 * Requires a Supabase "Third-Party Auth" integration configured for Clerk
 * (Supabase dashboard -> Authentication -> Sign In / Providers -> Clerk).
 * This is what makes the RLS policies in supabase/schema.sql actually work —
 * auth.jwt() ->> 'sub' resolves to the Clerk user id on every query.
 */
export function createServerSupabaseClient(clerkToken: string | null): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: clerkToken ? { Authorization: `Bearer ${clerkToken}` } : {},
      },
    }
  );
}
