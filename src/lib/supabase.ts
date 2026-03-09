/**
 * Supabase Client Configuration
 * Initializes and exports the Supabase client for database operations
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      donors: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string;
          email: string;
          phone: string;
          blood_group: string;
          location: unknown;
          address: string;
          last_donation_date: string | null;
          is_available: boolean;
          is_eligible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          full_name: string;
          email: string;
          phone: string;
          blood_group: string;
          location?: unknown;
          address: string;
          last_donation_date?: string | null;
          is_available?: boolean;
          is_eligible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          full_name?: string;
          email?: string;
          phone?: string;
          blood_group?: string;
          location?: unknown;
          address?: string;
          last_donation_date?: string | null;
          is_available?: boolean;
          is_eligible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      hospitals: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string;
          phone: string;
          location: unknown;
          address: string;
          license_number: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          email: string;
          phone: string;
          location: unknown;
          address: string;
          license_number: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          email?: string;
          phone?: string;
          location?: unknown;
          address?: string;
          license_number?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      blood_requests: {
        Row: {
          id: string;
          hospital_id: string;
          blood_group: string;
          urgency_level: string;
          quantity: number;
          location: unknown;
          status: string;
          radius_km: number;
          matched_donor_id: string | null;
          fulfilled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hospital_id: string;
          blood_group: string;
          urgency_level?: string;
          quantity: number;
          location: unknown;
          status?: string;
          radius_km?: number;
          matched_donor_id?: string | null;
          fulfilled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          hospital_id?: string;
          blood_group?: string;
          urgency_level?: string;
          quantity?: number;
          location?: unknown;
          status?: string;
          radius_km?: number;
          matched_donor_id?: string | null;
          fulfilled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        matched_bloodbank_id: string | null;

blood_banks?: {
  name: string;
  phone: string;
  location?: any;
};

      };
      notifications: {
        Row: {
          id: string;
          request_id: string;
          donor_id: string;
          hospital_id: string;
          message: string;
          notification_type: string;
          status: string;
          sent_at: string;
          expires_at: string;
          response: string | null;
          responded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          donor_id: string;
          hospital_id: string;
          message: string;
          notification_type?: string;
          status?: string;
          sent_at?: string;
          expires_at?: string;
          response?: string | null;
          responded_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          donor_id?: string;
          hospital_id?: string;
          message?: string;
          notification_type?: string;
          status?: string;
          sent_at?: string;
          expires_at?: string;
          response?: string | null;
          responded_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
