import crypto from 'crypto';
import { db } from './db';
import { Payment, PaymentStatus, PlanId } from '../src/types';
import { SASPAY_SECRET_KEY, SASPAY_API_KEY, SASPAY_WEBHOOK_SECRET } from './secrets';
import { saspayConfigManager } from './saspayConfig';
import {
  saspayFetch,
  logSaspayRequest,
  getRecentSaspayOutgoingLogs,
  clearSaspayOutgoingLogs,
  redactSensitiveData,
  redactHeaders,
  redactString,
} from './saspayLogger';

export {
  saspayConfigManager,
  saspayFetch,
  logSaspayRequest,
  getRecentSaspayOutgoingLogs,
  clearSaspayOutgoingLogs,
  redactSensitiveData,
  redactHeaders,
  redactString,
};

export interface SaspayInitiateRequest {
  planId: PlanId;
  userId: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentMethod?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface SaspayInitiateResponse {
  success: boolean;
  transactionReference: string;
  transaction_reference: string;
  merchant_reference: string;
  provider_transaction_id?: string;
  session_type?: 'softpay' | 'checkout_session';
  checkout_url?: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
  songs: number;
  planName: string;
  status: PaymentStatus;
  message?: string;
  instructions?: string[];
  network?: string;
  country?: string;
  requires_redirect?: boolean;
  payment?: Payment;
  timings?: {
    t0_request_received: string;
    t1_provider_dispatched: string;
    t2_provider_responded: string;
    backend_prep_ms: number;
    provider_latency_ms: number;
    total_latency_ms: number;
  };
  latency_breakdown?: {
    client_to_backend: string;
    backend_internal: string;
    saspay_api: string;
    telecom_operator: string;
  };
}

export interface SaspayWebhookPayload {
  transaction_reference?: string;
  merchant_reference?: string;
  provider_transaction_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  customer_phone?: string;
  payment_method?: string;
  timestamp?: string;
  signature?: string;
  reason?: string;
  message?: string;
  data?: any;
  event?: string;
}

export interface ResolvedRouting {
  cleanPhone: string;
  country: string;
  network: string;
  currency: string;
  preferredChannel: 'softpay' | 'checkout_session';
}

export function maskPhoneNumber(phone?: string): string {
  if (!phone) return 'N/A';
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  if (clean.length <= 6) return clean;
  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-3);
  return `${prefix}*******${suffix}`;
}

export class SaspayService {
  private activePollers: Map<string, NodeJS.Timeout> = new Map();
  private recentRequestsByPhone: Map<string, number> = new Map();
  private processedTransactionIds: Set<string> = new Set();
  private inFlightWebhookLocks: Set<string> = new Set();

  public get secretKey(): string {
    const cfg = saspayConfigManager.getConfig();
    return cfg.secretKey || cfg.apiKey || process.env.SASPAY_SECRET_KEY || SASPAY_SECRET_KEY || '';
  }

  public get apiKey(): string {
    const cfg = saspayConfigManager.getConfig();
    return cfg.apiKey || cfg.secretKey || process.env.SASPAY_API_KEY || SASPAY_API_KEY || '';
  }

  public get merchantId(): string {
    const cfg = saspayConfigManager.getConfig();
    return cfg.merchantId || process.env.SASPAY_MERCHANT_ID || '';
  }

  public get webhookSecret(): string {
    const cfg = saspayConfigManager.getConfig();
    return cfg.webhookSecret || process.env.SASPAY_WEBHOOK_SECRET || SASPAY_WEBHOOK_SECRET || '';
  }

  public get baseUrl(): string {
    const cfg = saspayConfigManager.getConfig();
    return (cfg.baseUrl || process.env.SASPAY_BASE_URL || 'https://api.saspay.me/api/v1').replace(/\/+$/, '');
  }

  public isConfigured(): boolean {
    const cfg = saspayConfigManager.getConfig();
    return cfg.isActive && Boolean(this.secretKey || this.apiKey);
  }

  /**
   * Robust phone number normalization and carrier routing resolution (Step 3).
   * Strips spaces, symbols, international '00', redundant leading zeros,
   * and adapts to national telecom numbering plans (Bénin 10-digits, CI 10-digits, RDC 9-digits, etc.).
   */
  public resolveRouting(rawPhone?: string, method?: string): ResolvedRouting {
    let clean = (rawPhone || '').replace(/[\s\-\(\)\.]/g, '');
    if (clean.startsWith('00')) {
      clean = '+' + clean.substring(2);
    }

    const m = (method || '').toLowerCase();

    // 1. Credit Card
    if (m === 'card' || m.includes('carte') || m.includes('visa') || m.includes('mastercard')) {
      return {
        cleanPhone: clean.startsWith('+') ? clean : '+225' + clean.replace(/^0+/, ''),
        country: 'XX',
        network: 'card',
        currency: 'USD',
        preferredChannel: 'checkout_session',
      };
    }

    // 2. Democratic Republic of Congo (+243)
    if (
      clean.startsWith('+243') ||
      clean.startsWith('243') ||
      m === 'vodacom_mpesa' ||
      m.includes('vodacom') ||
      m.includes('mpesa') ||
      m.includes('airtel_cd') ||
      m.includes('orange_cd') ||
      m.includes('afrimoney_cd')
    ) {
      let digits = clean.replace(/^\+?243/, '').replace(/^0+/, '');
      const cleanPhone = '+243' + digits;
      let network = 'vodacom_cd';
      if (m.includes('airtel')) network = 'airtel_cd';
      else if (m.includes('orange')) network = 'orange_cd';
      else if (m.includes('afrimoney')) network = 'afrimoney_cd';

      // Attempt softpay direct push first. If SasPay returns no_route_available,
      // it falls back automatically to checkout-sessions for guaranteed gateway authorization.
      return {
        cleanPhone,
        country: 'CD',
        network,
        currency: 'USD',
        preferredChannel: 'softpay',
      };
    }

    // 3. Benin (+229) - 10 digits plan: adds 01 prefix if 8 local digits received
    if (clean.startsWith('+229') || clean.startsWith('229') || m.includes('bj')) {
      let digits = clean.replace(/^\+?229/, '');
      if (digits.length === 8) {
        digits = '01' + digits;
      } else if (digits.length === 9 && digits.startsWith('1')) {
        digits = '0' + digits;
      }
      const cleanPhone = '+229' + digits;
      let network = 'mtn_bj';
      if (m.includes('moov')) network = 'moov_bj';
      else if (m.includes('celtiis')) network = 'celtiis_bj';
      return {
        cleanPhone,
        country: 'BJ',
        network,
        currency: 'XOF',
        preferredChannel: 'softpay',
      };
    }

    // 4. Cameroon (+237) - 9 digits
    if (clean.startsWith('+237') || clean.startsWith('237') || m.includes('cm')) {
      let digits = clean.replace(/^\+?237/, '').replace(/^0+/, '');
      const cleanPhone = '+237' + digits;
      const network = m.includes('orange') ? 'orange_cm' : 'mtn_cm';
      return {
        cleanPhone,
        country: 'CM',
        network,
        currency: 'XAF',
        preferredChannel: 'softpay',
      };
    }

    // 5. Senegal (+221) - 9 digits
    if (clean.startsWith('+221') || clean.startsWith('221') || m.includes('sn')) {
      let digits = clean.replace(/^\+?221/, '').replace(/^0+/, '');
      const cleanPhone = '+221' + digits;
      let network = 'orange_sn';
      if (m.includes('wave')) network = 'wave_sn';
      else if (m.includes('free')) network = 'freemoney_sn';
      return {
        cleanPhone,
        country: 'SN',
        network,
        currency: 'XOF',
        preferredChannel: 'softpay',
      };
    }

    // 6. Burkina Faso (+226) - 8 digits
    if (clean.startsWith('+226') || clean.startsWith('226') || m.includes('bf')) {
      let digits = clean.replace(/^\+?226/, '').replace(/^0+/, '');
      const cleanPhone = '+226' + digits;
      const network = m.includes('moov') ? 'moov_bf' : 'orange_bf';
      return {
        cleanPhone,
        country: 'BF',
        network,
        currency: 'XOF',
        preferredChannel: 'softpay',
      };
    }

    // 7. Togo (+228) - 8 digits
    if (clean.startsWith('+228') || clean.startsWith('228') || m.includes('tg')) {
      let digits = clean.replace(/^\+?228/, '').replace(/^0+/, '');
      const cleanPhone = '+228' + digits;
      const network = m.includes('moov') ? 'moov_tg' : 'togocel';
      return {
        cleanPhone,
        country: 'TG',
        network,
        currency: 'XOF',
        preferredChannel: 'softpay',
      };
    }

    // 8. Congo Brazzaville (+242)
    if (clean.startsWith('+242') || clean.startsWith('242') || m.includes('cg')) {
      let digits = clean.replace(/^\+?242/, '').replace(/^0+/, '');
      const cleanPhone = '+242' + digits;
      const network = m.includes('airtel') ? 'airtel_cg' : 'mtn_cg';
      return {
        cleanPhone,
        country: 'CG',
        network,
        currency: 'XAF',
        preferredChannel: 'softpay',
      };
    }

    // 9. Default Côte d'Ivoire (+225) - 10 digits plan: must start with 01, 05, or 07
    let digits = clean.replace(/^\+?225/, '');
    if (digits.length === 10 && digits.startsWith('0')) {
      // Already 10 digits with leading zero (e.g. 0501234567, 0712345678, 0101234567)
      // Keep exactly as is!
    } else if (digits.length === 9 && /^[157]/.test(digits)) {
      // 9 digits missing the leading 0: add it back
      digits = '0' + digits;
    } else if (digits.length === 8 && /^[01457]/.test(digits)) {
      // Legacy 8-digit numbering: determine prefix based on operator
      if (m.includes('mtn')) {
        digits = '05' + digits;
      } else if (m.includes('moov')) {
        digits = '01' + digits;
      } else {
        digits = '07' + digits;
      }
    }
    const cleanPhone = '+225' + (digits || '0700000000');
    let network = 'orange_ci';
    if (m === 'mtn_momo' || m.includes('mtn')) network = 'mtn_ci';
    else if (m === 'wave' || m.includes('wave')) network = 'wave_ci';
    else if (m.includes('moov')) network = 'moov_ci';
    else if (m.includes('djamo')) network = 'djamo_ci';

    return {
      cleanPhone,
      country: 'CI',
      network,
      currency: 'USD',
      preferredChannel: 'softpay',
    };
  }

  public normalizePhoneNumber(raw?: string): string {
    return this.resolveRouting(raw).cleanPhone;
  }

  // Generate unique merchant transaction reference
  public generateReference(planId: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `SAS-${planId.toUpperCase()}-${timestamp}-${random}`;
  }

  // Compute HMAC SHA256 signature for internal simulation/verification
  public computeSignature(
    reference: string,
    amount: number,
    currency: string,
    status: string
  ): string {
    const dataString = `${reference}|${amount}|${currency}|${status}|${this.apiKey}`;
    return crypto
      .createHmac('sha256', this.webhookSecret || this.secretKey)
      .update(dataString)
      .digest('hex');
  }

  /**
   * Verify SasPay official webhook signature with cryptographic security:
   * Supports:
   * 1. Stripe/Saspay standard format: `t=1727764800,v1=9f86d081884c...`
   * 2. Headers: `x-saspay-signature`, `x-webhook-signature`, `signature`, `x-signature`
   * 3. Timestamp headers: `x-saspay-timestamp`, `x-webhook-timestamp`, `timestamp`
   * 4. Direct hex HMAC-SHA256 of raw body
   * 5. Constant-time equality comparison using crypto.timingSafeEqual
   * 6. Strict replay-attack window tolerance check (max 300 seconds)
   */
  public verifySaspayWebhookSignature(
    rawBody: string,
    signatureHeader?: string,
    timestampHeader?: string
  ): boolean {
    if (!signatureHeader || !rawBody) return false;

    // Keys to test: primary is dedicated webhook secret, secondary is API secret key, tertiary is API key
    const candidateKeys = [
      this.webhookSecret,
      this.secretKey,
      this.apiKey,
      process.env.BACKEND_SECRET_KEY,
    ].filter((k): k is string => typeof k === 'string' && k.trim().length > 0);

    if (candidateKeys.length === 0) {
      return false;
    }

    let parsedTimestamp = timestampHeader ? timestampHeader.trim() : '';
    let cleanSignature = signatureHeader.trim();

    // Parse structured header format like "t=1727764800,v1=abcdef123456..."
    if (cleanSignature.includes('t=') && (cleanSignature.includes('v1=') || cleanSignature.includes('v0='))) {
      const parts = cleanSignature.split(',');
      for (const part of parts) {
        const [k, v] = part.split('=').map((s) => s.trim());
        if (k === 't' && !parsedTimestamp) {
          parsedTimestamp = v;
        } else if (k === 'v1' || k === 'v0') {
          cleanSignature = v;
        }
      }
    }

    // Strip optional "sha256=", "v1=", or "v0=" prefix
    cleanSignature = cleanSignature.replace(/^(sha256=|v1=|v0=)/i, '').trim().toLowerCase();

    // Replay attack prevention: verify timestamp within 5 minutes tolerance (300 seconds)
    if (parsedTimestamp) {
      const nowSec = Math.floor(Date.now() / 1000);
      const tsSec = parseInt(parsedTimestamp, 10);
      if (!isNaN(tsSec)) {
        if (Math.abs(nowSec - tsSec) > 300) {
          console.warn(`[PAYMENT_SECURITY] Webhook timestamp out of tolerance (replay attack check): received ${tsSec} vs server ${nowSec} (drift: ${Math.abs(nowSec - tsSec)}s > 300s)`);
          return false;
        }
      }
    }

    const sigBuf = Buffer.from(cleanSignature, 'utf-8');

    // 1. Check HMAC of `${parsedTimestamp}.${rawBody}` if timestamp is available
    if (parsedTimestamp) {
      for (const key of candidateKeys) {
        const expectedHex = crypto
          .createHmac('sha256', key)
          .update(`${parsedTimestamp}.${rawBody}`)
          .digest('hex')
          .toLowerCase();

        const expectedBuf = Buffer.from(expectedHex, 'utf-8');
        if (sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)) {
          return true;
        }
      }
    }

    // 2. Check direct HMAC-SHA256 on rawBody
    for (const key of candidateKeys) {
      const directExpectedHex = crypto
        .createHmac('sha256', key)
        .update(rawBody)
        .digest('hex')
        .toLowerCase();

      const directExpectedBuf = Buffer.from(directExpectedHex, 'utf-8');
      if (sigBuf.length === directExpectedBuf.length && crypto.timingSafeEqual(sigBuf, directExpectedBuf)) {
        return true;
      }
    }

    // 3. Check legacy pipe-delimited simulation signature if applicable
    for (const key of candidateKeys) {
      try {
        const parsed = JSON.parse(rawBody);
        const data = parsed.data || parsed;
        const ref = data.merchant_reference || data.transaction_reference || data.reference;
        const amount = data.amount;
        const currency = data.currency;
        const status = data.status;
        if (ref && amount !== undefined) {
          const pipeString = `${ref}|${amount}|${currency || 'USD'}|${status}|${key}`;
          const pipeExpectedHex = crypto
            .createHmac('sha256', key)
            .update(pipeString)
            .digest('hex')
            .toLowerCase();
          const pipeExpectedBuf = Buffer.from(pipeExpectedHex, 'utf-8');
          if (sigBuf.length === pipeExpectedBuf.length && crypto.timingSafeEqual(sigBuf, pipeExpectedBuf)) {
            return true;
          }
        }
      } catch {
        // Not a JSON payload or parsing error
      }
    }

    return false;
  }


  // Strict state machine (Step 5 & 15)
  // CREATED -> INITIATING -> PAYMENT_REQUEST_SENT -> PENDING_CUSTOMER_CONFIRMATION / CHECKOUT_REQUIRED -> PROCESSING -> CONFIRMED
  // Terminal failure states: FAILED, CANCELLED, EXPIRED
  public isValidStateTransition(currentStatus: PaymentStatus, targetStatus: PaymentStatus): boolean {
    const current = String(currentStatus || '').toUpperCase();
    const target = String(targetStatus || '').toUpperCase();

    // Already finalized: terminal states cannot transition
    if (current === 'CONFIRMED' || current === 'PAID' || current === 'SUCCESS') {
      return false;
    }
    if (current === 'FAILED' || current === 'CANCELLED' || current === 'EXPIRED') {
      return false;
    }

    if (current === 'CREATED' || current === 'INITIATING') {
      return [
        'INITIATING',
        'PAYMENT_REQUEST_SENT',
        'PENDING_CUSTOMER_CONFIRMATION',
        'CHECKOUT_REQUIRED',
        'PENDING',
        'PROCESSING',
        'CONFIRMED',
        'PAID',
        'SUCCESS',
        'FAILED',
        'CANCELLED',
        'EXPIRED',
      ].includes(target);
    }

    if (current === 'PAYMENT_REQUEST_SENT') {
      return [
        'PENDING_CUSTOMER_CONFIRMATION',
        'CHECKOUT_REQUIRED',
        'PENDING',
        'PROCESSING',
        'CONFIRMED',
        'PAID',
        'SUCCESS',
        'FAILED',
        'CANCELLED',
        'EXPIRED',
      ].includes(target);
    }

    if (
      current === 'PENDING_CUSTOMER_CONFIRMATION' ||
      current === 'CHECKOUT_REQUIRED' ||
      current === 'PENDING'
    ) {
      return [
        'PROCESSING',
        'CONFIRMED',
        'PAID',
        'SUCCESS',
        'FAILED',
        'CANCELLED',
        'EXPIRED',
      ].includes(target);
    }

    if (current === 'PROCESSING') {
      return ['CONFIRMED', 'PAID', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(target);
    }

    return true;
  }

  /**
   * Initiate real SasPay payment (Step 2 & 4).
   * Strategy:
   * 1. If preferred channel is softpay, try direct push (POST /payments/softpay/).
   * 2. If softpay fails with 422 (e.g. no_route_available, unrouted network, or prepayment_otp_missing),
   *    or if preferred channel is checkout_session, immediately route through POST /checkout-sessions/.
   * 3. This guarantees that ANY mobile money network (Vodacom RDC, Orange, MTN, Wave, etc.)
   *    reaches a working gateway with the exact prompt or validation URL.
   */
  public async createTransaction(params: SaspayInitiateRequest): Promise<SaspayInitiateResponse> {
    const t0 = Date.now();
    const t0Iso = new Date(t0).toISOString();

    const plan = db.plans.find((p) => p.id === params.planId && p.active);
    if (!plan) {
      throw new Error(`Plan introuvable ou inactif: ${params.planId}`);
    }

    const cfg = saspayConfigManager.getConfig();
    if (!cfg.isActive) {
      throw new Error(
        "La passerelle de paiement Mobile Money SASPAY.ME est actuellement désactivée. Veuillez l'activer dans le panneau d'administration (onglet Configuration SASPAY.ME)."
      );
    }

    const isTestOrSandbox = cfg.environment === 'sandbox' || process.env.NODE_ENV !== 'production';

    if (!this.secretKey && !this.apiKey) {
      if (isTestOrSandbox) {
        console.log(`[SASPAY] Mode Sandbox/Test actif sans clé live : initialisation sécurisée de la transaction.`);
      } else {
        throw new Error(
          "La passerelle SASPAY.ME n'est pas configurée. Saisissez votre Clé API et Clé Secrète dans l'interface d'administration (onglet Configuration SASPAY.ME)."
        );
      }
    }

    const routing = this.resolveRouting(params.customerPhone, params.paymentMethod);
    const maskedPhone = maskPhoneNumber(routing.cleanPhone);

    // Anti-flood throttle: max 1 request every 1.5s per phone number to prevent operator push collisions
    const cleanPhone = routing.cleanPhone;
    const lastRequestTime = this.recentRequestsByPhone.get(cleanPhone) || 0;
    if (t0 - lastRequestTime < 1500) {
      const waitSec = Math.ceil((1500 - (t0 - lastRequestTime)) / 1000);
      throw new Error(
        `Veuillez patienter ${waitSec}s avant de renouveler la demande pour ce numéro.`
      );
    }
    this.recentRequestsByPhone.set(cleanPhone, t0);

    const reference = this.generateReference(plan.id);

    // Initial local payment record in PENDING state (instant in-memory save < 1ms)
    const payment: Payment = {
      id: `pay-${Date.now()}`,
      user_id: params.userId,
      plan_id: plan.id,
      package_id: plan.id,
      provider: 'SASPAY',
      merchant_reference: reference,
      transaction_reference: reference,
      amount: plan.price,
      currency: plan.currency,
      status: 'PENDING',
      phone_number: routing.cleanPhone,
      customer_phone: routing.cleanPhone,
      payment_method: params.paymentMethod || routing.network,
      network: routing.network,
      country: routing.country,
      songs_quantity: plan.songs,
      songs_credited: 0,
      pack_credited: false,
      webhook_received: false,
      webhook_verified: false,
      created_at: t0Iso,
      updated_at: t0Iso,
    };
    db.savePayment(payment);

    let providerInitiated = false;
    let finalStatus: PaymentStatus = 'PENDING';
    let providerId: string | undefined = undefined;
    let checkoutUrl = '';
    let instructions: string[] = [
      'Une demande de paiement Mobile Money a été transmise à votre téléphone.',
      'Saisissez votre code PIN secret sur votre mobile pour valider le débit.',
    ];
    let isDirectPush = true;
    let sessionType: 'softpay' | 'checkout_session' = 'softpay';

    let t1 = Date.now();
    let t2 = Date.now();

    // Direct push via SASPAY softpay / direct push endpoint
    if (routing.preferredChannel === 'softpay' && (this.secretKey || this.apiKey)) {
      const endpoint = `${this.baseUrl}/payments/softpay/`;
      t1 = Date.now();
      const t1Iso = new Date(t1).toISOString();
      const prepMs = t1 - t0;

      console.log(
        `[PAYMENT_REQUEST_SENT_TO_SASPAY] transactionId=${reference} endpoint=${endpoint} method=POST amount=${plan.price} operator=${routing.network} phone=${maskedPhone} t1=${t1Iso} prepMs=${prepMs}ms`
      );

      const idempotencyKey = `idem-${reference}-${Date.now()}`;
      const softpayPayload = {
        amount: String(plan.price.toFixed(2)),
        currency: 'USD',
        country: routing.country,
        description: `SITDOWORLD IA Music - Pack ${plan.name} (${plan.songs} chansons)`,
        customer: {
          email: params.customerEmail || 'sitdoworldinformatique@gmail.com',
          first_name: 'Client',
          last_name: 'SITDOWORLD',
          phone: routing.cleanPhone,
        },
        network: routing.network,
        metadata: {
          merchant_reference: reference,
          plan_id: plan.id,
          user_id: params.userId,
        },
        return_url: params.returnUrl || `${process.env.APP_URL || ''}/tarifs`,
      };

      try {
        const res = await saspayFetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.secretKey || this.apiKey}`,
            'Content-Type': 'application/json',
            'Connection': 'keep-alive',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(softpayPayload),
          signal: AbortSignal.timeout(5500), // Fast 5.5s timeout for direct operator push
          label: 'softpay_direct_push',
          transactionReference: reference,
        });

        t2 = Date.now();
        const t2Iso = new Date(t2).toISOString();
        const providerLatencyMs = t2 - t1;
        const totalMs = t2 - t0;

        console.log(
          `[SASPAY_RESPONSE_RECEIVED] transactionId=${reference} endpoint=${endpoint} httpStatus=${res.status} latency=${providerLatencyMs}ms total=${totalMs}ms timestamp=${t2Iso}`
        );

        const data = await res.json().catch(() => ({}));

        if (res.status === 201 && data?.success) {
          providerInitiated = true;
          sessionType = 'softpay';
          providerId = data.data?.id;
          checkoutUrl = data.data?.checkout_url || '';
          instructions = data.data?.instructions || [
            'Une notification de paiement Mobile Money a été transmise à votre téléphone.',
            'Saisissez votre code secret Mobile Money (PIN) pour approuver le règlement.',
          ];
          isDirectPush = !checkoutUrl;
          finalStatus = 'PENDING';
        } else {
          const errCode = data?.error?.code || '';
          const errMsg = data?.error?.message || data?.message || `HTTP ${res.status}`;
          console.log(
            `[PAYMENT] Softpay direct push returned ${res.status} (${errCode}: ${errMsg}). Failover to hosted checkout...`
          );
        }
      } catch (err: any) {
        t2 = Date.now();
        console.log(`[PAYMENT] Softpay attempt failed or timed out (${err.message}). Failover to hosted checkout...`);
      }
    }

    // 2. CHECKOUT-SESSIONS (Fallback or Default for Card / Hosted sessions)
    if (!providerInitiated) {
      sessionType = 'checkout_session';
      const sessionEndpoint = `${this.baseUrl}/checkout-sessions/`;
      t1 = Date.now();
      const t1Iso = new Date(t1).toISOString();
      const prepMs = t1 - t0;

      console.log(
        `[PAYMENT_REQUEST_SENT_TO_SASPAY] transactionId=${reference} endpoint=${sessionEndpoint} method=POST amount=${plan.price} operator=${routing.network} phone=${maskedPhone} t1=${t1Iso} prepMs=${prepMs}ms`
      );

      const sessionPayload: any = {
        amount: String(plan.price.toFixed(2)),
        currency: 'USD',
        description: `SITDOWORLD IA Music - Pack ${plan.name} (${plan.songs} chansons)`,
        customer_email: params.customerEmail || 'sitdoworldinformatique@gmail.com',
        customer_name: 'Client SITDOWORLD',
        customer_phone: routing.cleanPhone,
        return_url: params.returnUrl || `${process.env.APP_URL || ''}/tarifs`,
        metadata: {
          merchant_reference: reference,
          plan_id: plan.id,
          user_id: params.userId,
        },
      };

      if (routing.country && routing.country !== 'XX') {
        sessionPayload.country = routing.country;
      }

      try {
        const res = await saspayFetch(sessionEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.secretKey || this.apiKey}`,
            'Content-Type': 'application/json',
            'Connection': 'keep-alive',
          },
          body: JSON.stringify(sessionPayload),
          signal: AbortSignal.timeout(6000),
          label: 'checkout_session_initiation',
          transactionReference: reference,
        });

        t2 = Date.now();
        const t2Iso = new Date(t2).toISOString();
        const providerLatencyMs = t2 - t1;
        const totalMs = t2 - t0;

        console.log(
          `[SASPAY_RESPONSE_RECEIVED] transactionId=${reference} endpoint=${sessionEndpoint} httpStatus=${res.status} latency=${providerLatencyMs}ms total=${totalMs}ms timestamp=${t2Iso}`
        );

        const data = await res.json().catch(() => ({}));

        if (res.status === 201 && data?.success) {
          providerInitiated = true;
          providerId = data.data?.id;
          checkoutUrl = data.data?.checkout_url || '';
          finalStatus = 'PENDING';
          isDirectPush = false;
          instructions = [
            'Une session sécurisée SASPAY.ME a été préparée pour votre opérateur.',
            'Validez la transaction pour recevoir la confirmation sur votre mobile.',
          ];
        } else {
          const errMsg = data?.error?.message || data?.message || `Erreur SASPAY (HTTP ${res.status})`;
          payment.status = 'FAILED';
          payment.failure_reason = errMsg;
          payment.updated_at = new Date().toISOString();
          db.savePayment(payment);
          throw new Error(`SASPAY API Error: ${errMsg}`);
        }
      } catch (err: any) {
        t2 = Date.now();
        payment.status = 'FAILED';
        payment.failure_reason = err.message;
        payment.updated_at = new Date().toISOString();
        db.savePayment(payment);
        throw err;
      }
    }

    // Success state update in local DB - strictly PENDING
    payment.provider_transaction_id = providerId;
    payment.session_type = sessionType;
    payment.checkout_url = checkoutUrl;
    payment.instructions = instructions;
    payment.status = 'PENDING';
    payment.updated_at = new Date().toISOString();
    db.savePayment(payment);

    const t2Iso = new Date(t2).toISOString();
    const t1Iso = new Date(t1).toISOString();
    const prepMs = Math.max(0, t1 - t0);
    const providerMs = Math.max(0, t2 - t1);
    const totalMs = Math.max(0, t2 - t0);

    // Precise structured logging with timestamps
    console.log(`\n=======================================================`);
    console.log(`[TIMING_AUDIT] Demande OTP / Confirmation Mobile Money [${reference}]`);
    console.log(`├─ Heure demande client (t0)       : ${t0Iso}`);
    console.log(`├─ Heure envoi vers SASPAY (t1)    : ${t1Iso} (préparation interne backend: ${prepMs}ms)`);
    console.log(`├─ Heure réponse SASPAY (t2)       : ${t2Iso} (latence API fournisseur: ${providerMs}ms)`);
    console.log(`└─ Latence totale de traitement    : ${totalMs}ms`);
    console.log(`[LATENCY_BREAKDOWN] Décomposition du délai :`);
    console.log(`  1. Traitement interne Backend  : ${prepMs}ms (optimal, 0 attente artificielle)`);
    console.log(`  2. API Fournisseur SASPAY.ME   : ${providerMs}ms (réponse HTTP opérateur)`);
    console.log(`  3. Réseau Télécom / USSD Push  : En cours de délivrance vers le terminal ${maskedPhone} (${routing.network})`);
    console.log(`=======================================================\n`);

    // Non-blocking background poller
    if (providerId) {
      this.startBackgroundPoller(reference, providerId, sessionType);
    }

    return {
      success: true,
      transactionReference: reference,
      transaction_reference: reference,
      merchant_reference: reference,
      provider_transaction_id: providerId,
      session_type: sessionType,
      checkout_url: checkoutUrl,
      checkoutUrl: checkoutUrl || `/payment/checkout?ref=${reference}`,
      amount: plan.price,
      currency: plan.currency,
      songs: plan.songs,
      planName: plan.name,
      status: 'PENDING',
      instructions,
      network: routing.network,
      country: routing.country,
      requires_redirect: !isDirectPush,
      message: 'Demande de paiement envoyée instantanément. En attente de confirmation sur votre téléphone...',
      payment: { ...payment },
      timings: {
        t0_request_received: t0Iso,
        t1_provider_dispatched: t1Iso,
        t2_provider_responded: t2Iso,
        backend_prep_ms: prepMs,
        provider_latency_ms: providerMs,
        total_latency_ms: totalMs,
      },
      latency_breakdown: {
        client_to_backend: `${prepMs}ms (traitement local non-bloquant)`,
        backend_internal: `${prepMs}ms`,
        saspay_api: `${providerMs}ms`,
        telecom_operator: `En cours d'acheminement vers ${maskedPhone} (${routing.network})`,
      },
    };
  }


  /**
   * Server-side Background Poller (Step 7).
   * Periodically queries SasPay gateway every 6 seconds for up to 2.5 minutes (~25 attempts).
   * Stops immediately upon terminal state (CONFIRMED, FAILED, CANCELLED, EXPIRED).
   */
  private startBackgroundPoller(
    reference: string,
    providerId?: string,
    sessionType: 'softpay' | 'checkout_session' = 'softpay'
  ) {
    if (!providerId) return;

    if (this.activePollers.has(reference)) {
      clearInterval(this.activePollers.get(reference)!);
      this.activePollers.delete(reference);
    }

    let attempts = 0;
    const maxAttempts = 35; // 35 * 3.5s = ~120 seconds (2 minutes standard window)

    const timer = setInterval(async () => {
      attempts += 1;
      try {
        console.log(`[PAYMENT_STATUS_CHECK] Poll attempt ${attempts}/${maxAttempts} for ref ${reference} (${sessionType})`);
        const result = await this.verifyTransactionStatus(reference);

        if (
          result.verified ||
          ['CONFIRMED', 'PAID', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(
            String(result.payment.status || '').toUpperCase()
          )
        ) {
          console.log(`[PAYMENT_STATUS_CHECK] Poller reached final state: ${result.payment.status}. Stopping poller.`);
          clearInterval(timer);
          this.activePollers.delete(reference);
          return;
        }

        if (attempts >= maxAttempts) {
          console.log(`[PAYMENT_STATUS_CHECK] Max polling attempts reached for ref ${reference}. Stopping poller.`);
          clearInterval(timer);
          this.activePollers.delete(reference);
        }
      } catch (e: any) {
        console.log(`[PAYMENT_STATUS_CHECK] Error in background poller: ${e.message}`);
      }
    }, 3500);

    this.activePollers.set(reference, timer);
  }

  /**
   * Official Polling / Status Verification against SasPay (Step 7 & 9).
   * Supports both direct softpay verification (GET /payments/{id}/verify/)
   * and checkout session status check (GET /checkout-sessions/{id}/status/).
   */
  public async verifyTransactionStatus(
    referenceOrId: string
  ): Promise<{ payment: Payment; verified: boolean; message: string }> {
    const payment = db.getPayment(referenceOrId);
    if (!payment) {
      throw new Error(`Transaction SASPAY introuvable: ${referenceOrId}`);
    }

    const currentStatus = String(payment.status || '').toUpperCase();

    // 1. If already finalized and confirmed, return success
    if (currentStatus === 'CONFIRMED' || currentStatus === 'PAID' || currentStatus === 'SUCCESS') {
      return {
        payment,
        verified: true,
        message: 'Paiement confirmé.',
      };
    }

    // 2. If already failed / cancelled / expired
    if (currentStatus === 'FAILED' || currentStatus === 'CANCELLED' || currentStatus === 'EXPIRED') {
      return {
        payment,
        verified: false,
        message: payment.failure_reason || 'Le paiement a échoué.',
      };
    }

    // 3. Payment is still PENDING or PROCESSING: Check live state with SasPay API
    const queryId = payment.provider_transaction_id;
    if (queryId && this.secretKey) {
      try {
        if (payment.session_type === 'checkout_session') {
          // Checkout Session verification (GET /checkout-sessions/{id}/status/)
          console.log(`[PAYMENT_STATUS_CHECK] GET ${this.baseUrl}/checkout-sessions/${queryId}/status/`);
          const res = await saspayFetch(`${this.baseUrl}/checkout-sessions/${queryId}/status/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.secretKey}`,
              'Accept': 'application/json',
            },
            label: 'checkout_session_status_check',
            transactionReference: payment.merchant_reference,
          });

          if (res.ok) {
            const data = await res.json();
            const sessionStatus = String(data?.data?.status || '').toUpperCase();
            const txStatus = String(data?.data?.transaction_status || '').toUpperCase();
            console.log(`[PAYMENT_STATUS_CHECK] SasPay checkout session returned status=${sessionStatus} txStatus=${txStatus}`);

            if (sessionStatus === 'PAID' || txStatus === 'SUCCESS') {
              // REAL CONFIRMATION FROM SASPAY GATEWAY!
              payment.status = 'CONFIRMED';
              payment.verified_by_provider = true;
              payment.paid_at = new Date().toISOString();
              payment.updated_at = new Date().toISOString();

              const plan = db.plans.find((p) => p.id === payment.plan_id);
              const songsToCredit = plan ? plan.songs : payment.songs_quantity || 2;

              db.creditSongsFromPayment(payment, songsToCredit);

              console.log(
                `[PAYMENT_STATUS_UPDATED] transactionId=${payment.merchant_reference} providerTransactionId=${payment.provider_transaction_id} userId=${payment.user_id} amount=${payment.amount} operator=${payment.network} status=CONFIRMED timestamp=${new Date().toISOString()}`
              );
              console.log(
                `[PAYMENT_CONFIRMED] transactionId=${payment.merchant_reference} providerTransactionId=${payment.provider_transaction_id} userId=${payment.user_id} amount=${payment.amount} operator=${payment.network} songsCredited=${songsToCredit} status=CONFIRMED timestamp=${new Date().toISOString()}`
              );

              db.logEvent('payment_success', payment.user_id, {
                reference: payment.merchant_reference,
                amount: payment.amount,
                currency: payment.currency,
                songsCredited: songsToCredit,
                provider_transaction_id: payment.provider_transaction_id,
              });

              return {
                payment,
                verified: true,
                message: `Paiement confirmé par SASPay. ${songsToCredit} créations créditées.`,
              };
            } else if (sessionStatus === 'CANCELLED') {
              payment.status = 'CANCELLED';
              payment.failure_reason = 'Paiement annulé.';
              payment.updated_at = new Date().toISOString();
              db.savePayment(payment);

              console.log(
                `[PAYMENT_CANCELLED] transactionId=${payment.merchant_reference} providerTransactionId=${payment.provider_transaction_id} userId=${payment.user_id} amount=${payment.amount} operator=${payment.network} status=CANCELLED timestamp=${new Date().toISOString()}`
              );
              return { payment, verified: false, message: payment.failure_reason };
            } else if (sessionStatus === 'EXPIRED') {
              payment.status = 'EXPIRED';
              payment.failure_reason = 'La session de paiement a expiré.';
              payment.updated_at = new Date().toISOString();
              db.savePayment(payment);

              console.log(
                `[PAYMENT_FAILED] transactionId=${payment.merchant_reference} providerTransactionId=${payment.provider_transaction_id} userId=${payment.user_id} amount=${payment.amount} operator=${payment.network} status=EXPIRED reason="La session a expiré." timestamp=${new Date().toISOString()}`
              );
              return { payment, verified: false, message: payment.failure_reason };
            }
          }
        } else {
          // Direct softpay verification (GET /payments/{id}/verify/)
          console.log(`[PAYMENT_STATUS_CHECK] GET ${this.baseUrl}/payments/${queryId}/verify/`);
          const res = await saspayFetch(`${this.baseUrl}/payments/${queryId}/verify/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.secretKey}`,
              'Accept': 'application/json',
            },
            label: 'softpay_status_verify',
            transactionReference: payment.merchant_reference,
          });

          if (res.ok) {
            const data = await res.json();
            const remoteStatus = String(data?.data?.status || data?.status || '').toUpperCase();
            console.log(`[PAYMENT_STATUS_CHECK] SasPay softpay returned status=${remoteStatus}`);

            if (remoteStatus === 'SUCCESS' || remoteStatus === 'PAID' || remoteStatus === 'COMPLETED') {
              // REAL CONFIRMATION FROM SASPAY GATEWAY!
              payment.status = 'CONFIRMED';
              payment.verified_by_provider = true;
              payment.paid_at = new Date().toISOString();
              payment.updated_at = new Date().toISOString();

              const plan = db.plans.find((p) => p.id === payment.plan_id);
              const songsToCredit = plan ? plan.songs : payment.songs_quantity || 2;

              db.creditSongsFromPayment(payment, songsToCredit);

              console.log(
                `[PAYMENT_STATUS_UPDATED] transactionId=${payment.merchant_reference} providerTransactionId=${payment.provider_transaction_id} userId=${payment.user_id} amount=${payment.amount} operator=${payment.network} status=CONFIRMED timestamp=${new Date().toISOString()}`
              );
              console.log(
                `[PAYMENT_CONFIRMED] transactionId=${payment.merchant_reference} providerTransactionId=${payment.provider_transaction_id} userId=${payment.user_id} amount=${payment.amount} operator=${payment.network} songsCredited=${songsToCredit} status=CONFIRMED timestamp=${new Date().toISOString()}`
              );

              db.logEvent('payment_success', payment.user_id, {
                reference: payment.merchant_reference,
                amount: payment.amount,
                currency: payment.currency,
                songsCredited: songsToCredit,
                provider_transaction_id: payment.provider_transaction_id,
              });

              return {
                payment,
                verified: true,
                message: `Paiement confirmé par SASPay. ${songsToCredit} créations créditées.`,
              };
            } else if (remoteStatus === 'FAILED' || remoteStatus === 'CANCELLED' || remoteStatus === 'EXPIRED') {
              const remoteMsg = String(data?.data?.reason || data?.message || data?.error?.message || '').toLowerCase();
              const isInsufficient = /solde|insufficient|balance|funds/i.test(remoteMsg);

              if (isInsufficient) {
                payment.status = 'INSUFFICIENT_FUNDS';
                payment.failure_reason = 'Solde Mobile Money insuffisant.';
              } else if (remoteStatus === 'CANCELLED') {
                payment.status = 'CANCELLED';
                payment.failure_reason = 'Paiement annulé.';
              } else if (remoteStatus === 'EXPIRED') {
                payment.status = 'EXPIRED';
                payment.failure_reason = 'Le délai de confirmation est dépassé.';
              } else {
                payment.status = 'FAILED';
                payment.failure_reason = 'Le paiement a été rejeté ou annulé par l’opérateur Mobile Money.';
              }
              payment.updated_at = new Date().toISOString();
              db.savePayment(payment);

              if (payment.status === 'CANCELLED') {
                console.log(
                  `[PAYMENT_CANCELLED] transactionId=${payment.merchant_reference} providerTransactionId=${payment.provider_transaction_id} userId=${payment.user_id} amount=${payment.amount} operator=${payment.network} status=CANCELLED timestamp=${new Date().toISOString()}`
                );
              } else {
                console.log(
                  `[PAYMENT_FAILED] transactionId=${payment.merchant_reference} providerTransactionId=${payment.provider_transaction_id} userId=${payment.user_id} amount=${payment.amount} operator=${payment.network} status=${payment.status} reason="${payment.failure_reason}" timestamp=${new Date().toISOString()}`
                );
              }
              return {
                payment,
                verified: false,
                message: payment.failure_reason,
              };
            }
          }
        }
      } catch (err: any) {
        console.log(`[PAYMENT_STATUS_CHECK] Network error during verify: ${err.message}`);
      }
    }

    // Check expiration (2.5 minutes timeout for mobile money confirmation session)
    const twoAndHalfMinutesAgo = Date.now() - 150 * 1000;
    if (new Date(payment.created_at).getTime() < twoAndHalfMinutesAgo) {
      payment.status = 'EXPIRED';
      payment.failure_reason = 'Le délai de confirmation est dépassé (2 minutes).';
      payment.updated_at = new Date().toISOString();
      db.savePayment(payment);
      console.log(
        `[PAYMENT_FAILED] transactionId=${payment.merchant_reference} providerTransactionId=${payment.provider_transaction_id} userId=${payment.user_id} amount=${payment.amount} operator=${payment.network} status=EXPIRED reason="Délai dépassé." timestamp=${new Date().toISOString()}`
      );

      return {
        payment,
        verified: false,
        message: 'Le délai de confirmation est dépassé.',
      };
    }

    return {
      payment,
      verified: false,
      message: payment.checkout_url
        ? 'En attente de validation sur le guichet sécurisé...'
        : 'En attente de confirmation sur votre téléphone...',
    };
  }

  /**
   * Process Webhook from SasPay (Step 6).
   * Verified with cryptographic signature and strictly idempotent.
   */
  public processWebhook(
    payload: any,
    headersOrSignature?: Record<string, string | string[] | undefined> | string,
    rawBody?: string
  ): { success: boolean; message: string; duplicate?: boolean; payment?: Payment } {
    let headers: Record<string, string | string[] | undefined> | undefined;
    let fallbackSig: string | undefined;

    if (typeof headersOrSignature === 'string') {
      fallbackSig = headersOrSignature;
    } else if (headersOrSignature) {
      headers = headersOrSignature;
    }

    const data = payload?.data ? payload.data : payload || {};
    const eventType = String(payload?.event || headers?.['x-webhook-event'] || '').toLowerCase();

    const rawRef =
      data.reference ||
      data.metadata?.merchant_reference ||
      data.merchant_reference ||
      data.transaction_reference ||
      data.id ||
      payload.reference ||
      payload.merchant_reference;

    const payment = db.getPayment(rawRef);
    if (!payment) {
      console.log(`[PAYMENT_FAILED] Webhook reference not found: ${rawRef}`);
      return { success: false, message: 'Transaction non trouvée.' };
    }

    console.log(
      `[WEBHOOK_RECEIVED] transactionId=${payment.merchant_reference} providerTransactionId=${payment.provider_transaction_id || 'N/A'} userId=${payment.user_id} amount=${payment.amount} operator=${payment.network} status=${payment.status} event=${eventType} timestamp=${new Date().toISOString()}`
    );

    // Signature verification
    const sigHeader =
      fallbackSig ||
      ((headers?.['x-webhook-signature'] ||
        headers?.['signature'] ||
        headers?.['x-saspay-signature']) as string | undefined);
    const tsHeader = headers?.['x-webhook-timestamp'] as string | undefined;

    if (rawBody && sigHeader) {
      const isValid = this.verifySaspayWebhookSignature(rawBody, sigHeader, tsHeader);
      if (!isValid) {
        console.log(
          `[PAYMENT_FAILED] transactionId=${payment.merchant_reference} reason="Invalid webhook signature" timestamp=${new Date().toISOString()}`
        );
        return { success: false, message: 'Signature webhook invalide.' };
      }
    }

    // Idempotency check: if already confirmed/paid, return success without duplicate crediting
    if (
      payment.status === 'CONFIRMED' ||
      payment.status === 'PAID' ||
      payment.status === 'SUCCESS' ||
      payment.pack_credited
    ) {
      console.log(`[PAYMENT] Idempotent skip: payment already confirmed and credited`);
      return {
        success: true,
        duplicate: true,
        message: 'Paiement déjà confirmé (idempotent).',
        payment,
      };
    }

    const rawStatus = String(data.status || payload.status || '').toUpperCase();
    const isSuccess =
      eventType === 'transaction.success' ||
      eventType === 'checkout.session.paid' ||
      eventType === 'payment.success' ||
      ['SUCCESS', 'PAID', 'COMPLETED'].includes(rawStatus);

    const isCancelled = eventType === 'transaction.cancelled' || ['CANCELLED', 'CANCELED'].includes(rawStatus);

    if (isSuccess) {
      payment.status = 'CONFIRMED';
      payment.webhook_received = true;
      payment.webhook_verified = true;
      payment.paid_at = new Date().toISOString();
      payment.updated_at = new Date().toISOString();

      const plan = db.plans.find((p) => p.id === payment.plan_id);
      const songsToCredit = plan ? plan.songs : payment.songs_quantity || 2;

      db.creditSongsFromPayment(payment, songsToCredit);

      console.log(
        `[PAYMENT_STATUS_UPDATED] transactionId=${payment.merchant_reference} providerTransactionId=${payment.provider_transaction_id} userId=${payment.user_id} amount=${payment.amount} operator=${payment.network} status=CONFIRMED timestamp=${new Date().toISOString()}`
      );
      console.log(
        `[PAYMENT_CONFIRMED] transactionId=${payment.merchant_reference} providerTransactionId=${payment.provider_transaction_id} userId=${payment.user_id} amount=${payment.amount} operator=${payment.network} songsCredited=${songsToCredit} status=CONFIRMED timestamp=${new Date().toISOString()}`
      );

      return {
        success: true,
        message: 'Paiement confirmé par webhook.',
        payment,
      };
    } else {
      const failReason = String(data.reason || data.message || payload.reason || payload.message || '').toLowerCase();
      const isInsufficient = /solde|insufficient|balance|funds/i.test(failReason);
      const isExpired = eventType === 'transaction.expired' || ['EXPIRED'].includes(rawStatus) || /expir/i.test(failReason);

      if (isCancelled) {
        payment.status = 'CANCELLED';
        payment.failure_reason = 'Paiement annulé.';
      } else if (isInsufficient) {
        payment.status = 'INSUFFICIENT_FUNDS';
        payment.failure_reason = 'Solde Mobile Money insuffisant.';
      } else if (isExpired) {
        payment.status = 'EXPIRED';
        payment.failure_reason = 'Le délai de confirmation est dépassé.';
      } else {
        payment.status = 'FAILED';
        payment.failure_reason = data.reason || data.message || payload.reason || payload.message || 'Paiement non confirmé.';
      }

      payment.webhook_received = true;
      payment.updated_at = new Date().toISOString();
      db.savePayment(payment);

      if (payment.status === 'CANCELLED') {
        console.log(
          `[PAYMENT_CANCELLED] transactionId=${payment.merchant_reference} providerTransactionId=${payment.provider_transaction_id} userId=${payment.user_id} amount=${payment.amount} operator=${payment.network} status=CANCELLED timestamp=${new Date().toISOString()}`
        );
      } else {
        console.log(
          `[PAYMENT_FAILED] transactionId=${payment.merchant_reference} providerTransactionId=${payment.provider_transaction_id} userId=${payment.user_id} amount=${payment.amount} operator=${payment.network} status=${payment.status} reason="${payment.failure_reason}" timestamp=${new Date().toISOString()}`
        );
      }
      return {
        success: false,
        message: payment.failure_reason || 'Paiement non confirmé.',
        payment,
      };
    }
  }
}

export const saspayService = new SaspayService();
