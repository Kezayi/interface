import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Configuration Supabase manquante!', {
    VITE_SUPABASE_URL: supabaseUrl ? '✓ Défini' : '✗ Manquant',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '✓ Défini' : '✗ Manquant',
  });
  console.error('Veuillez vérifier le fichier .env à la racine du projet');
}

console.log('✓ Supabase initialisé avec succès');
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-client-info': 'supabase-js-web',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export type MemorialType = 'recent' | 'past';

export type Memorial = {
  id: string;
  author_id: string;
  author_name: string;
  heir_email: string;
  memorial_type: MemorialType;
  deceased_full_name: string;
  deceased_photo_url: string;
  date_of_birth: string;
  date_of_death: string;
  announcement_text: string;
  house_address_text?: string;
  house_gps_lat?: number;
  house_gps_lng?: number;
  funeral_date?: string;
  funeral_time?: string;
  funeral_location?: string;
  funeral_steps?: FuneralStep[];
  contributions_enabled: boolean;
  contributions_disabled_at?: string;
  created_at: string;
  updated_at: string;
};

export type FuneralStep = {
  type: 'vigil' | 'service' | 'burial' | 'other';
  description: string;
  time?: string;
  location?: string;
};

export type GestureType = 'rip' | 'candle' | 'flower';

export type Relationship = 'parent' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild' | 'uncle_aunt' | 'cousin' | 'friend' | 'colleague' | 'neighbor' | 'acquaintance' | 'other';

export type Gesture = {
  id: string;
  memorial_id: string;
  user_id?: string;
  gesture_type: GestureType;
  is_paid: boolean;
  payment_amount?: number;
  guestbook_message_id?: string;
  created_at: string;
};

export type MediaItem = {
  url: string;
  type: 'photo' | 'video';
};

export type GuestbookMessage = {
  id: string;
  memorial_id: string;
  user_id?: string;
  author_name: string;
  author_email: string;
  author_phone: string;
  relationship: Relationship;
  message_text: string;
  rip_count: number;
  candle_count: number;
  flower_count: number;
  media_items?: MediaItem[];
  created_at: string;
};

export type MemorialFollower = {
  id: string;
  memorial_id: string;
  user_id: string;
  notify_funeral_updates: boolean;
  notify_funeral_reminder: boolean;
  created_at: string;
};

export type FuneralContribution = {
  id: string;
  memorial_id: string;
  contributor_user_id?: string;
  contributor_name?: string;
  contributor_phone?: string;
  amount: number;
  payment_status: 'pending' | 'completed' | 'failed';
  payment_reference?: string;
  created_at: string;
};
