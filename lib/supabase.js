import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://jhqyicdxyqrjvfzzzajh.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpocXlpY2R4eXFyanZmenp6YWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNzg0NTksImV4cCI6MjA4MDY1NDQ1OX0.sII8qsottG1BFC1efWpqA6P9y_6Vm6fkItW7rFgLKM8"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)