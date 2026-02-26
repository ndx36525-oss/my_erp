import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.https//vrjsjmydtmejqyyejede.supabase.co;
const supabaseAnonKey = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyanNqbXlkdG1lanF5eWVqZWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NDA0MDAsImV4cCI6MjA4NzIxNjQwMH0.WBcJ2nGZLI20ytMGyezNEDxrYrq2jgREItJ8oqhF0r4;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);