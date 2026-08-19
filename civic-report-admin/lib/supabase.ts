import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dotvdqgeftgciiayogkp.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_H3MGmJNBeQtEMsY4aBSbTw_77LcQf21';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
