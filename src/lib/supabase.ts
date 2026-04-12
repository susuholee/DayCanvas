import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Todo = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'completed';
  category: string;
  priority: number;
  due_date: string | null;
  google_event_id: string | null;
  created_at: string;
};

export type Salary = {
  id: string;
  user_id: string;
  month: string;
  gross_salary: number;
  net_salary: number;
  pension: number;
  health_insurance: number;
  longterm_care: number;
  employment_insurance: number;
  income_tax: number;
  local_income_tax: number;
  created_at: string;
};

