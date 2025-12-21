import { mockSupabase, mockApiFetch } from './mock-api';

export const supabase = mockSupabase as any;
export const publicAnonKey = 'mock-anon-key';
export const API_BASE_URL = 'http://mock-api.local/functions/v1/make-server-8457b97f';
export const apiFetch = mockApiFetch;
