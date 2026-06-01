import { createClient } from '@supabase/supabase-js'

// Client admin — SERVER SIDE ONLY (API routes)
// Ne jamais importer dans un composant client
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
