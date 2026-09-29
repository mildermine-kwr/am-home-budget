import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://uyxsonpxogxoqqnkykzn.supabase.co'

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_royVseO0Ur2vD6p1zL5how_rDd2uO1-'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)