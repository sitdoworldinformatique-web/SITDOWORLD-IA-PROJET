import crypto from 'crypto';
import { db } from './db';
import { Payment, PaymentStatus, PlanId } from '../src/types';
import { SASPAY_SECRET_KEY, SASPAY_API_KEY, SASPAY_WEBHOOK_SECRET } from './secrets';

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
}

export class SaspayService {
  private apiKey: string;
  private secretKey: string;
  private webhookSecret: string;
  private baseUrl: string;
  private activePollers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.secretKey = SASPAY_SECRET_KEY;
    this.apiKey = SASPAY_API_KEY || SASPAY_SECRET_KEY;
    this.webhookSecret =
      process.env.SASPAY_WEBHOOK_SECRET ||
      SASPAY_WEBHOOK_SECRET ||
      'ce1cbaf1598a05c29cb316f2058b3ab793e8626ec44899e733868ff5a0649847';
    this.baseUrl = process.env.SASPAY_BASE_URL || 'https://api.saspay.me/api/v1';
  }

  // Normalize phone number and resolve carrier routing according to SasPay specifications
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
      };
    }

    // 2. Democratic Republic of Congo (+243)
    if (clean.startsWith('+243') || clean.startsWith('243') || m === 'vodacom_mpesa' || m.includes('vodacom') || m.includes('mpesa')) {
      if (!clean.startsWith('+')) {
        if (clean.startsWith('243')) clean = '+' + clean;
        else clean = '+243' + clean.replace(/^0+/, '');
      }
      let network = 'vodacom_cd';
      if (m.includes('airtel')) network = 'airtel_cd';
      else if (m.includes('orange')) network = 'orange_cd';
      else if (m.includes('afrimoney')) network = 'afrimoney_cd';
      return { cleanPhone: clean, country: 'CD', network, currency: 'USD' };
    }

    // 3. Cameroon (+237)
    if (clean.startsWith('+237') || clean.startsWith('237')) {
      if (!clean.startsWith('+')) clean = '+' + clean;
      const network = m.includes('orange') ? 'orange_cm' : 'mtn_cm';
      return { cleanPhone: clean, country: 'CM', network, currency: 'USD' };
    }

    // 4. Benin (+229)
    if (clean.startsWith('+229') || clean.startsWith('229')) {
      if (!clean.startsWith('+')) clean = '+' + clean;
      let network = 'mtn_bj';
      if (m.includes('moov')) network = 'moov_bj';
      else if (m.includes('celtiis')) network = 'celtiis_bj';
      return { cleanPhone: clean, country: 'BJ', network, currency: 'USD' };
    }

    // 5. Senegal (+221)
    if (clean.startsWith('+221') || clean.startsWith('221')) {
      if (!clean.startsWith('+')) clean = '+' + clean;
      let network = 'orange_sn';
      if (m.includes('wave')) network = 'wave_sn';
      else if (m.includes('free')) network = 'freemoney_sn';
      return { cleanPhone: clean, country: 'SN', network, currency: 'USD' };
    }

    // 6. Burkina Faso (+226)
    if (clean.startsWith('+226') || clean.startsWith('226')) {
      if (!clean.startsWith('+')) clean = '+' + clean;
      const network = m.includes('moov') ? 'moov_bf' : 'orange_bf';
      return { cleanPhone: clean, country: 'BF', network, currency: 'USD' };
    }

    // 7. Togo (+228)
    if (clean.startsWith('+228') || clean.startsWith('228')) {
      if (!clean.startsWith('+')) clean = '+' + clean;
      const network = m.includes('moov') ? 'moov_tg' : 'togocel';
      return { cleanPhone: clean, country: 'TG', network, currency: 'USD' };
    }

    // 8. Default Côte d'Ivoire (+225)
    if (!clean.startsWith('+')) {
      if (clean.startsWith('225')) {
        clean = '+' + clean;
      } else {
        clean = '+225' + clean.replace(/^0+/, '');
      }
    }

    let network = 'orange_ci';
    if (m === 'mtn_momo' || m.includes('mtn')) network = 'mtn_ci';
    else if (m === 'wave' || m.includes('wave')) network = 'wave_ci';
    else if (m.includes('moov')) network = 'moov_ci';
    else if (m.includes('djamo')) network = 'djamo_ci';

    return { cleanPhone: clean, country: 'CI', network, currency: 'USD' };
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

  // Compute HMAC SHA256 signature for internal verification
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

  // Verify SasPay official webhook signature: HMAC-SHA256 of `${timestamp}.${rawBody}`
  public verifySaspayWebhookSignature(
    rawBody: string,
    signatureHeader?: string,
    timestampHeader?: string
  ): boolean {
    if (!signatureHeader) return false;

    // Keys to test: primary is webhook secret, fallback is API secret key
    const candidateKeys = [this.webhookSecret, this.secretKey].filter(Boolean);

    // Check tolerance (5 minutes) if timestamp is present
    if (timestampHeader) {
      const now = Math.floor(Date.now() / 1000);
      const ts = Number(timestampHeader);
      if (Math.abs(now - ts) > 300) {
        console.log(`[PAYMENT] Webhook timestamp out of tolerance: ${ts} vs now ${now}`);
        return false;
      }

      for (const key of candidateKeys) {
        const expected = crypto
          .createHmac('sha256', key)
          .update(`${timestampHeader}.${rawBody}`)
          .digest('hex');
        try {
          const a = Buffer.from(signatureHeader.toLowerCase());
          const b = Buffer.from(expected.toLowerCase());
          if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
            return true;
          }
        } catch {
          // Continue to next candidate key
        }
      }
      return false;
    }

    // Direct HMAC on body if no timestamp header
    for (const key of candidateKeys) {
      const directExpected = crypto
        .createHmac('sha256', key)
        .update(rawBody)
        .digest('hex');
      try {
        const a = Buffer.from(signatureHeader.toLowerCase());
        const b = Buffer.from(directExpected.toLowerCase());
        if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
          return true;
        }
      } catch {
        // Continue to next candidate key
      }
    }

    return false;
  }

  // Strict state machine (Step 5)
  // CREATED -> PENDING -> PROCESSING -> CONFIRMED (PAID/SUCCESS)
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

    // From CREATED
    if (current === 'CREATED') {
      return ['PENDING', 'PROCESSING', 'CONFIRMED', 'PAID', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(target);
    }

    // From PENDING
    if (current === 'PENDING') {
      return ['PROCESSING', 'CONFIRMED', 'PAID', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(target);
    }

    // From PROCESSING
    if (current === 'PROCESSING') {
      return ['CONFIRMED', 'PAID', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(target);
    }

    return true;
  }

  // Initiate real SasPay payment
  public async createTransaction(params: SaspayInitiateRequest): Promise<SaspayInitiateResponse> {
    const plan = db.plans.find((p) => p.id === params.planId && p.active);
    if (!plan) {
      throw new Error(`Plan introuvable ou inactif: ${params.planId}`);
    }

    const routing = this.resolveRouting(params.customerPhone, params.paymentMethod);
    const maskedPhone = routing.cleanPhone.slice(0, 4) + '••••' + routing.cleanPhone.slice(-2);

    console.log(`[PAYMENT_INIT_STARTED] plan=${plan.id} price=${plan.price}USD phone=${maskedPhone} country=${routing.country} network=${routing.network}`);

    // Double payment prevention: reuse if pending in the last 2 minutes
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    for (const existing of db.payments.values()) {
      if (
        existing.user_id === params.userId &&
        existing.plan_id === plan.id &&
        (existing.status === 'PENDING' || existing.status === 'PROCESSING') &&
        new Date(existing.created_at).getTime() > twoMinutesAgo
      ) {
        console.log(`[PAYMENT] Reusing active pending payment: ${existing.merchant_reference}`);
        return {
          success: true,
          transactionReference: existing.merchant_reference,
          transaction_reference: existing.merchant_reference,
          merchant_reference: existing.merchant_reference,
          provider_transaction_id: existing.provider_transaction_id,
          checkout_url: existing.checkout_url,
          checkoutUrl: existing.checkout_url || `/payment/checkout?ref=${existing.merchant_reference}`,
          amount: existing.amount,
          currency: existing.currency,
          songs: existing.songs_quantity,
          planName: plan.name,
          status: existing.status,
          instructions: existing.instructions,
          network: existing.network,
          country: existing.country,
          message: 'Paiement déjà en attente. Vérifiez votre téléphone Mobile Money pour confirmer.',
        };
      }
    }

    const reference = this.generateReference(plan.id);

    // Initial local payment record in CREATED/PENDING state (NO CREDITS GIVEN)
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.savePayment(payment);

    console.log(`[PAYMENT_REQUEST_SENT_TO_SASPAY] POST ${this.baseUrl}/payments/softpay/`);

    const idempotencyKey = `idem-${reference}-${Date.now()}`;
    const payload = {
      amount: String(plan.price),
      currency: plan.currency, // 'USD' (SasPay automatically converts to local currency)
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
      return_url: params.returnUrl || `${process.env.APP_URL || ''}/pricing`,
    };

    try {
      const res = await fetch(`${this.baseUrl}/payments/softpay/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      console.log(`[SASPAY_RESPONSE_RECEIVED] HTTP ${res.status}`);
      const data = await res.json().catch(() => ({}));

      if (res.status === 201 && data?.success) {
        const providerId = data.data?.id;
        const checkoutUrl = data.data?.checkout_url || '';
        const instructions = data.data?.instructions || [];

        payment.provider_transaction_id = providerId;
        payment.checkout_url = checkoutUrl;
        payment.instructions = instructions;
        payment.status = 'PENDING';
        payment.updated_at = new Date().toISOString();
        db.savePayment(payment);

        console.log(`[PAYMENT_PROVIDER_TRANSACTION_CREATED] provider_id=${providerId}`);
        console.log(`[MOBILE_MONEY_PUSH_REQUESTED] network=${routing.network} phone=${maskedPhone}`);
        console.log(`[PAYMENT_PENDING] reference=${reference} status=PENDING`);

        db.logEvent('payment_created', params.userId, {
          reference,
          merchant_reference: reference,
          provider_transaction_id: providerId,
          planId: plan.id,
          amount: plan.price,
          currency: plan.currency,
          country: routing.country,
          network: routing.network,
          has_checkout_url: !!checkoutUrl,
          status: 'PENDING',
        });

        // Launch server-side background poller (Step 7)
        this.startBackgroundPoller(reference, providerId);

        return {
          success: true,
          transactionReference: reference,
          transaction_reference: reference,
          merchant_reference: reference,
          provider_transaction_id: providerId,
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
          message: checkoutUrl
            ? 'Demande de paiement transmise. Veuillez valider sur votre téléphone ou ouvrir la page de validation.'
            : 'Demande de paiement envoyée. Vérifiez votre téléphone Mobile Money et saisissez votre PIN pour confirmer.',
        };
      } else {
        const errMsg = data?.error ? JSON.stringify(data.error) : data?.message || `Erreur SASPAY (HTTP ${res.status})`;
        console.log(`[PAYMENT_FAILED] Gateway rejected payment: ${errMsg}`);
        payment.status = 'FAILED';
        payment.failure_reason = errMsg;
        payment.updated_at = new Date().toISOString();
        db.savePayment(payment);

        db.logEvent('payment_failed', params.userId, {
          reference,
          error: errMsg,
          status: 'FAILED',
        });

        throw new Error(`Échec de l'initiation SASPAY: ${errMsg}`);
      }
    } catch (err: any) {
      console.log(`[PAYMENT_FAILED] Exception during SASPAY push: ${err.message}`);
      throw err;
    }
  }

  // Server-side Background Poller (Step 7)
  // Periodically queries GET /payments/{id}/verify/ every 6 seconds for up to 2.5 minutes
  private startBackgroundPoller(reference: string, providerId?: string) {
    if (!providerId) return;

    // Clear existing timer if any
    if (this.activePollers.has(reference)) {
      clearInterval(this.activePollers.get(reference)!);
      this.activePollers.delete(reference);
    }

    let attempts = 0;
    const maxAttempts = 25; // 25 * 6s = 150 seconds (~2.5 minutes)

    const timer = setInterval(async () => {
      attempts += 1;
      try {
        console.log(`[PAYMENT_STATUS_CHECK] Poll attempt ${attempts}/${maxAttempts} for ref ${reference}`);
        const result = await this.verifyTransactionStatus(reference);

        if (result.verified || ['CONFIRMED', 'PAID', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(result.payment.status.toUpperCase())) {
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
    }, 6000);

    this.activePollers.set(reference, timer);
  }

  // Official Polling / Status Verification against SasPay (Step 7 & 9)
  public async verifyTransactionStatus(
    referenceOrId: string
  ): Promise<{ payment: Payment; verified: boolean; message: string }> {
    const payment = db.getPayment(referenceOrId);
    if (!payment) {
      throw new Error(`Transaction SASPAY introuvable: ${referenceOrId}`);
    }

    const currentStatus = String(payment.status || '').toUpperCase();

    // If already finalized and confirmed, return success
    if (currentStatus === 'CONFIRMED' || currentStatus === 'PAID' || currentStatus === 'SUCCESS') {
      return {
        payment,
        verified: true,
        message: 'Paiement confirmé.',
      };
    }

    // If already failed / cancelled / expired
    if (currentStatus === 'FAILED' || currentStatus === 'CANCELLED' || currentStatus === 'EXPIRED') {
      return {
        payment,
        verified: false,
        message: payment.failure_reason || 'Le paiement a échoué.',
      };
    }

    // Payment is still PENDING or PROCESSING: Check live state with SasPay API
    const queryId = payment.provider_transaction_id;
    if (queryId && this.secretKey) {
      try {
        console.log(`[PAYMENT_STATUS_CHECK] GET ${this.baseUrl}/payments/${queryId}/verify/`);
        const res = await fetch(`${this.baseUrl}/payments/${queryId}/verify/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Accept': 'application/json',
          },
        });

        if (res.ok) {
          const data = await res.json();
          const remoteStatus = String(data?.data?.status || data?.status || '').toUpperCase();
          console.log(`[PAYMENT_STATUS_CHECK] SasPay verify returned status=${remoteStatus}`);

          if (remoteStatus === 'SUCCESS' || remoteStatus === 'PAID' || remoteStatus === 'COMPLETED') {
            // CONFIRMATION RÉELLE CÔTÉ SASPAY!
            payment.status = 'CONFIRMED';
            payment.verified_by_provider = true;
            payment.paid_at = new Date().toISOString();
            payment.updated_at = new Date().toISOString();

            const plan = db.plans.find((p) => p.id === payment.plan_id);
            const songsToCredit = plan ? plan.songs : payment.songs_quantity || 2;

            db.creditSongsFromPayment(payment, songsToCredit);

            console.log(`[PAYMENT_CONFIRMED] payment confirmed via SasPay verify endpoint`);
            console.log(`[PAYMENT] songs_credited=${songsToCredit}`);

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
          } else if (remoteStatus === 'FAILED' || remoteStatus === 'CANCELLED') {
            payment.status = remoteStatus === 'CANCELLED' ? 'CANCELLED' : 'FAILED';
            payment.failure_reason = 'Le paiement a été rejeté ou annulé par l’opérateur Mobile Money.';
            payment.updated_at = new Date().toISOString();
            db.savePayment(payment);

            console.log(`[PAYMENT_FAILED] status=${payment.status}`);
            return {
              payment,
              verified: false,
              message: payment.failure_reason,
            };
          }
        }
      } catch (err: any) {
        console.log(`[PAYMENT_STATUS_CHECK] Network error during verify: ${err.message}`);
      }
    }

    // Check expiration (2.5 minutes for mobile money session)
    const twoAndHalfMinutesAgo = Date.now() - 150 * 1000;
    if (new Date(payment.created_at).getTime() < twoAndHalfMinutesAgo) {
      payment.status = 'EXPIRED';
      payment.failure_reason = 'Le délai de confirmation est dépassé (2 minutes).';
      payment.updated_at = new Date().toISOString();
      db.savePayment(payment);
      console.log(`[PAYMENT_FAILED] reference=${payment.merchant_reference} reason=EXPIRED`);

      return {
        payment,
        verified: false,
        message: 'Le délai de confirmation est dépassé.',
      };
    }

    return {
      payment,
      verified: false,
      message: 'En attente de confirmation sur votre téléphone...',
    };
  }

  // Process Webhook from SasPay (Step 6)
  public processWebhook(
    payload: any,
    headersOrSignature?: Record<string, string | string[] | undefined> | string,
    rawBody?: string
  ): { success: boolean; message: string; duplicate?: boolean; payment?: Payment } {
    console.log(`[WEBHOOK_RECEIVED] incoming webhook event`);

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
        console.log(`[PAYMENT_FAILED] Invalid webhook signature`);
        return { success: false, message: 'Signature webhook invalide.' };
      }
    }

    // Idempotency check: if already confirmed/paid, return success
    if (payment.status === 'CONFIRMED' || payment.status === 'PAID' || payment.status === 'SUCCESS' || payment.pack_credited) {
      console.log(`[PAYMENT] Idempotent skip: payment already confirmed and credited`);
      return {
        success: true,
        duplicate: true,
        message: 'Paiement déjà confirmé (idempotent).',
        payment,
      };
    }

    const rawStatus = String(data.status || payload.status || '').toUpperCase();
    const isSuccess = eventType === 'transaction.success' || ['SUCCESS', 'PAID', 'COMPLETED'].includes(rawStatus);
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

      console.log(`[PAYMENT_CONFIRMED] Webhook processed successfully, songs credited=${songsToCredit}`);

      return {
        success: true,
        message: 'Paiement confirmé par webhook.',
        payment,
      };
    } else {
      payment.status = isCancelled ? 'CANCELLED' : 'FAILED';
      payment.failure_reason = data.reason || data.message || 'Paiement non confirmé.';
      payment.webhook_received = true;
      payment.updated_at = new Date().toISOString();
      db.savePayment(payment);

      console.log(`[PAYMENT_FAILED] Webhook reported failure: ${payment.failure_reason}`);
      return {
        success: false,
        message: payment.failure_reason || 'Paiement non confirmé.',
        payment,
      };
    }
  }
}

export const saspayService = new SaspayService();
