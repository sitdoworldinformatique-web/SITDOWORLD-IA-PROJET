export type Genre =
  | 'Afrobeat'
  | 'Amapiano'
  | 'Gospel'
  | 'R&B'
  | 'Hip-Hop'
  | 'Pop'
  | 'Dance'
  | 'Reggae'
  | 'Drill'
  | 'Cinematic'
  | 'Lo-fi'
  | 'Jazz';

export type PlanId = 'starter' | 'creator' | 'pro' | 'studio' | 'master_vip';

export interface Plan {
  id: PlanId;
  name: string;
  songs: number;
  price: number;
  currency: string;
  active: boolean;
  features: string[];
  popular?: boolean;
}

export type PaymentStatus =
  | 'created'
  | 'pending'
  | 'processing'
  | 'confirmed'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'CREATED'
  | 'INITIATING'
  | 'PAYMENT_REQUEST_SENT'
  | 'PENDING_CUSTOMER_CONFIRMATION'
  | 'CHECKOUT_REQUIRED'
  | 'PENDING'
  | 'PROCESSING'
  | 'CONFIRMED'
  | 'PAID'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'INSUFFICIENT_FUNDS'
  | 'REFUNDED';

export type PaymentMethod =
  | 'orange_money'
  | 'mtn_momo'
  | 'wave'
  | 'vodacom_mpesa'
  | 'airtel_cd'
  | 'orange_cd'
  | 'moov_money'
  | 'card';

export interface Payment {
  id: string;
  user_id: string;
  plan_id: PlanId;
  package_id?: PlanId;
  provider: 'SASPAY';
  merchant_reference: string;
  transaction_reference: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider_transaction_id?: string;
  session_type?: 'softpay' | 'checkout_session';
  checkout_url?: string;
  instructions?: string[];
  network?: string;
  country?: string;
  phone_number?: string;
  customer_phone?: string;
  payment_method?: string;
  songs_quantity: number;
  songs_credited?: number;
  pack_credited?: boolean;
  verified_by_provider?: boolean;
  webhook_received?: boolean;
  webhook_verified?: boolean;
  paid_at?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSongBalance {
  id: string;
  user_id: string;
  available_songs: number;
  total_purchased: number;
  total_generated: number;
  updated_at: string;
}

export type TransactionType = 'PURCHASE' | 'GENERATION' | 'REFUND' | 'ADMIN_ADJUSTMENT';

export interface SongTransaction {
  id: string;
  user_id: string;
  song_id?: string;
  type: TransactionType;
  amount: number; // positive or negative
  reference: string;
  created_at: string;
}

export type GenerationStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'timeout'
  | 'QUEUED'
  | 'GENERATING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'TIMEOUT';

export interface GenerationStep {
  step: number;
  title: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'timeout';
  message?: string;
}

export interface GenerationJob {
  id: string;
  user_id: string;
  provider?: string;
  provider_task_id?: string;
  task_id?: string;
  idempotency_key?: string;
  title?: string;
  prompt: string;
  style?: string;
  lyrics?: string;
  genre: Genre | string;
  mood: string;
  language: string;
  voice: 'male' | 'female' | 'duet' | 'instrumental';
  is_instrumental: boolean;
  instrumental?: boolean;
  mode?: 'chanson' | 'instrumental';
  status: GenerationStatus;
  progress: number;
  current_step: number;
  model?: string;
  model_version?: string;
  audio_url?: string;
  stored_audio_url?: string;
  duration?: number;
  credits_reserved?: number;
  credits_consumed?: number;
  steps: GenerationStep[];
  song?: Song;
  versions?: {
    a?: Song;
    b?: Song;
  };
  error_code?: string;
  error_message?: string;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
}

export interface Song {
  id: string;
  title: string;
  prompt: string;
  lyrics?: string;
  genre: string;
  mood: string;
  duration: number; // in seconds
  bpm: number;
  key: string;
  creator_id: string;
  creator_name: string;
  creator_avatar?: string;
  cover_url: string;
  audio_url: string;
  stored_audio_url?: string;
  version_tag: 'VERSION A' | 'VERSION B' | 'ORIGINAL' | 'REMIX' | 'EXTENDED';
  is_public: boolean;
  likes_count: number;
  plays_count: number;
  shares_count: number;
  stems_extracted?: boolean;
  model_used?: string;
  created_at: string;
}

export interface Stem {
  id: string;
  song_id: string;
  name: 'Vocals' | 'Drums' | 'Bass' | 'Guitar' | 'Piano' | 'Synth' | 'FX';
  audio_url: string;
  volume: number;
  muted: boolean;
  solo: boolean;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  cover_url: string;
  creator_id: string;
  creator_name: string;
  songs: Song[];
  is_public: boolean;
  created_at: string;
}

export interface VoiceProfile {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  sample_url?: string;
  has_consent: boolean;
  consent_statement: string;
  created_at: string;
}

export interface Template {
  id: string;
  name?: string;
  title?: string;
  genre: string;
  mood?: string;
  prompt: string;
  suggested_bpm?: number;
  cover_url?: string;
  description: string;
}

export type PromptTemplate = Template;

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  role: 'user' | 'creator' | 'admin';
  status?: 'active' | 'suspended';
  is_vip?: boolean;
  created_at: string;
}

export interface SaaSGeneralSettings {
  appName: string;
  appTagline: string;
  supportEmail: string;
  defaultCurrency: 'USD' | 'EUR' | 'XOF' | 'GBP';
  defaultLanguage: 'fr' | 'en';
  maintenanceMode: boolean;
  allowRegistrations: boolean;
}

export interface SaaSAISettings {
  defaultMusicModel: string;
  lyricsModel: string;
  maxDurationSeconds: number;
  defaultSamplingQuality: 'studio_hd_wav' | 'standard_mp3' | 'audiophile_flac';
  aiCreativityTemperature: number;
  maxConcurrentGenerations: number;
  allowStemExtraction: boolean;
}

export interface SaaSBillingSettings {
  welcomeFreeSongs: number;
  unitSongPriceUSD: number;
  saspayGatewayActive: boolean;
  testMode: boolean;
  lowBalanceThreshold: number;
  autoRefundOnFailure: boolean;
}

export interface SaaSSecuritySettings {
  explicitLyricsFilter: boolean;
  copyrightProtection: boolean;
  maxDailyCreationsPerUser: number;
  watermarkAudioFreeTier: boolean;
  auditLogging: boolean;
}

export interface SaaSSettings {
  general: SaaSGeneralSettings;
  ai: SaaSAISettings;
  billing: SaaSBillingSettings;
  security: SaaSSecuritySettings;
  updatedAt: string;
  updatedBy?: string;
}

export interface AdminLog {
  id: string;
  event:
    | 'generation_started'
    | 'generation_completed'
    | 'generation_failed'
    | 'payment_created'
    | 'payment_success'
    | 'payment_failed'
    | 'webhook_received'
    | 'webhook_verified'
    | 'song_balance_updated'
    | 'saas_settings_updated'
    | 'user_status_changed'
    | 'plan_updated'
    | 'api_error'
    | 'payment_deleted'
    | 'test_payments_cleared'
    | 'song_deleted'
    | 'test_songs_cleared'
    | 'test_mrr_cleared'
    | 'database_disconnected'
    | 'database_connected';
  user_id?: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface DatabaseStatus {
  connected: boolean;
  type: 'supabase' | 'in_memory' | 'disconnected';
  url: string;
  restUrl: string;
  projectRef: string;
  status: 'connected' | 'disconnected' | 'awaiting_key';
  message: string;
  lastChecked: string;
  stats?: {
    songsCount: number;
    usersCount: number;
    paymentsCount: number;
  };
}

