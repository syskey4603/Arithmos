import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wyddqwmoltzmasxerbpn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZGRxd21vbHR6bWFzeGVyYnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjQ0MDYsImV4cCI6MjA5MDQ0MDQwNn0.iCw4oxJ7XRMlxcZczKqXU4iBMV2v6PEm4ZGxp-T6cAY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
