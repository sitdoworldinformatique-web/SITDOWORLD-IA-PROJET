import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Lock,
  RefreshCw,
  Clock,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { Plan, PaymentMethod, UserSongBalance, Payment } from '../types';

interface PaymentViewProps {
  plan: Plan | null;
  onBack: () => void;
  onSuccess: (newBalance: UserSongBalance) => void;
  navigate: (route: string) => void;
}

type PaymentFlowState = 'FORM' | 'WAITING_CONFIRMATION' | 'SUCCESS' | 'FAILED';

export const PaymentView: React.FC<PaymentViewProps> = ({
  plan,
  onBack,
  onSuccess,
  navigate,
}) => {
  const [phone, setPhone] = useState('+243 81 234 56 78');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vodacom_mpesa');
  const [flowState, setFlowState] = useState<PaymentFlowState>('FORM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active transaction tracking
  const [activePayment, setActivePayment] = useState<Payment | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 2-minute countdown display (Step 8)
  const [countdownSeconds, setCountdownSeconds] = useState<number>(120);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  if (!plan) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8">
        <p className="text-sm font-bold text-slate-600 mb-4">Aucun pack sélectionné pour le paiement.</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white font-bold text-xs"
        >
          Retour aux tarifs
        </button>
      </div>
    );
  }

  // Format seconds to mm:ss
  const formatCountdown = (totalSeconds: number): string => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 1. Submit real payment request to backend
  const handleInitiatePayment = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: plan.id,
          customer_phone: phone,
          payment_method: paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la transaction SASPAY.');
      }

      const reference = data.merchant_reference || data.transactionReference || data.transaction_reference;

      // Use returned payment object directly to eliminate unnecessary sequential network delay
      const currentPayment: Payment = data.payment || {
        id: reference,
        user_id: 'user-default-1',
        merchant_reference: reference,
        transaction_reference: reference,
        status: data.status || 'PENDING_CUSTOMER_CONFIRMATION',
        amount: data.amount || plan.price,
        currency: data.currency || plan.currency,
        plan_id: plan.id,
        created_at: new Date().toISOString(),
        instructions: data.instructions,
        checkout_url: data.checkout_url,
      };

      setActivePayment(currentPayment);
      setFlowState('WAITING_CONFIRMATION');

      // Start 2-minute visual countdown (Step 8)
      setCountdownSeconds(120);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start server status polling
      startPolling(reference);
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible d’initialiser le paiement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Polling loop: queries /api/payments/status/:reference every 3.5s
  const startPolling = (reference: string) => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }

    pollingTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status/${reference}`);
        if (!res.ok) return;

        const data = await res.json();
        const p: Payment = data.payment;
        setActivePayment(p);

        const statusUpper = String(p.status).toUpperCase();

        // STRICT CHECK: ONLY CONFIRMED / PAID / SUCCESS credits the pack
        if (statusUpper === 'CONFIRMED' || statusUpper === 'PAID' || statusUpper === 'SUCCESS') {
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          setFlowState('SUCCESS');
          if (data.balance) {
            onSuccess(data.balance);
          }
        } else if (
          statusUpper === 'FAILED' ||
          statusUpper === 'CANCELLED' ||
          statusUpper === 'EXPIRED' ||
          statusUpper === 'INSUFFICIENT_FUNDS'
        ) {
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          setFlowState('FAILED');
          setErrorMsg(
            p.failure_reason ||
              (statusUpper === 'INSUFFICIENT_FUNDS'
                ? 'Solde Mobile Money insuffisant.'
                : statusUpper === 'CANCELLED'
                ? 'Paiement annulé.'
                : statusUpper === 'EXPIRED'
                ? 'Le délai de confirmation est dépassé.'
                : 'Paiement échoué.')
          );
        }
      } catch (e) {
        // Transient network error during polling, keep waiting
      }
    }, 3500);
  };

  // 3. Manual status refresh
  const handleManualCheck = async () => {
    if (!activePayment) return;
    setIsCheckingStatus(true);
    try {
      const ref = activePayment.merchant_reference || activePayment.transaction_reference;
      const res = await fetch(`/api/payments/status/${ref}`);
      if (!res.ok) throw new Error('Transaction non trouvée.');

      const data = await res.json();
      const p: Payment = data.payment;
      setActivePayment(p);

      const statusUpper = String(p.status).toUpperCase();
      if (statusUpper === 'CONFIRMED' || statusUpper === 'PAID' || statusUpper === 'SUCCESS') {
        if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        setFlowState('SUCCESS');
        if (data.balance) {
          onSuccess(data.balance);
        }
      } else if (
        statusUpper === 'FAILED' ||
        statusUpper === 'CANCELLED' ||
        statusUpper === 'EXPIRED' ||
        statusUpper === 'INSUFFICIENT_FUNDS'
      ) {
        if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        setFlowState('FAILED');
        setErrorMsg(
          p.failure_reason ||
            (statusUpper === 'INSUFFICIENT_FUNDS'
              ? 'Solde Mobile Money insuffisant.'
              : statusUpper === 'CANCELLED'
              ? 'Paiement annulé.'
              : statusUpper === 'EXPIRED'
              ? 'Le délai de confirmation est dépassé.'
              : 'Paiement échoué.')
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleCancelPayment = () => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setFlowState('FORM');
    setActivePayment(null);
    setErrorMsg(null);
  };

  // Compute status badge & description according to Step 8 & 11
  const getStatusText = (status?: string, hasCheckoutUrl?: boolean) => {
    const s = String(status || '').toUpperCase();
    switch (s) {
      case 'CHECKOUT_REQUIRED':
        return 'En attente de validation sur le guichet sécurisé...';
      case 'PAYMENT_REQUEST_SENT':
      case 'PENDING_CUSTOMER_CONFIRMATION':
        return 'Demande envoyée, en attente de votre PIN sur le téléphone...';
      case 'PENDING':
        return hasCheckoutUrl
          ? 'En attente de validation sur le guichet sécurisé...'
          : 'En attente de confirmation sur votre téléphone...';
      case 'PROCESSING':
        return 'Paiement en cours de traitement...';
      case 'CONFIRMED':
      case 'PAID':
      case 'SUCCESS':
        return 'Paiement confirmé.';
      case 'FAILED':
        return 'Paiement échoué.';
      case 'CANCELLED':
        return 'Paiement annulé.';
      case 'EXPIRED':
        return 'Le délai de confirmation est dépassé.';
      default:
        return hasCheckoutUrl
          ? 'En attente de validation sur le guichet sécurisé...'
          : 'En attente de confirmation sur votre téléphone...';
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-28">
      {flowState === 'FORM' && (
        <button
          onClick={onBack}
          className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Changer de pack</span>
        </button>
      )}

      {/* STATE 1: WAITING FOR CONFIRMATION (Step 8 & 11) */}
      {flowState === 'WAITING_CONFIRMATION' && activePayment && (
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 space-y-6 shadow-xl animate-in zoom-in-95">
          {/* Conditional Display: Direct Phone Push VS Secure Checkout Portal */}
          {activePayment.checkout_url ? (
            /* CASE A: CHECKOUT_REQUIRED (Operator portal / Web authorization required) */
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-sm animate-pulse">
                <ExternalLink className="w-9 h-9" />
              </div>

              {/* Countdown 02:00 -> 01:59 ... */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-sm font-mono font-black tracking-widest shadow-md">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
                <span>{formatCountdown(countdownSeconds)}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A]">
                Validation sur le guichet sécurisé
              </h2>

              <p className="text-sm font-bold text-blue-900 bg-blue-50 border border-blue-200/90 p-3.5 rounded-2xl max-w-md mx-auto leading-relaxed">
                Pour le réseau <span className="uppercase">{activePayment.network || activePayment.payment_method}</span>, la confirmation du paiement s'effectue sur le guichet officiel sécurisé de paiement.
              </p>

              <p className="text-xs font-semibold text-slate-500">
                Statut : <span className="font-bold text-[#0F172A]">{getStatusText(activePayment.status, true)}</span>
              </p>

              {/* Prominent Action Button to Open Secure Checkout */}
              <div className="pt-2">
                <a
                  href={activePayment.checkout_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-6 rounded-2xl bg-[#FF7A00] hover:bg-[#e66e00] text-white font-black text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-98"
                >
                  <span>Ouvrir le guichet sécurisé SASPAY</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">
                  Après avoir validé votre paiement sur le guichet, cette page détectera automatiquement la confirmation et créditera vos {plan.songs} créations.
                </p>
              </div>
            </div>
          ) : (
            /* CASE B: PENDING_CUSTOMER_CONFIRMATION (Direct Phone Push USSD / SMS Sent) */
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm animate-pulse">
                <Smartphone className="w-9 h-9" />
              </div>

              {/* Countdown 02:00 -> 01:59 ... */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-sm font-mono font-black tracking-widest shadow-md">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span>{formatCountdown(countdownSeconds)}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A]">
                Demande de paiement envoyée.
              </h2>

              <p className="text-sm font-bold text-amber-900 bg-amber-50 border border-amber-200/90 p-3.5 rounded-2xl max-w-md mx-auto leading-relaxed">
                Consultez l'écran de votre téléphone portable : une invite Mobile Money a été transmise. Saisissez votre code PIN secret pour confirmer le débit.
              </p>

              <p className="text-xs font-semibold text-slate-500">
                Statut : <span className="font-bold text-[#0F172A]">{getStatusText(activePayment.status, false)}</span>
              </p>
            </div>
          )}

          {/* Transaction Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Pack sélectionné</span>
              <span className="font-extrabold text-[#0F172A]">{plan.name} ({plan.songs} chansons)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Montant à régler</span>
              <span className="font-black text-[#FF7A00] text-sm">${plan.price.toFixed(2)} {plan.currency}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Numéro Mobile Money</span>
              <span className="font-mono font-bold text-slate-800">{activePayment.phone_number || activePayment.customer_phone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Opérateur / Réseau</span>
              <span className="font-bold text-slate-800 uppercase">{activePayment.network || activePayment.payment_method}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 pt-2">
              <span className="text-slate-500">Référence transaction</span>
              <span className="font-mono text-[11px] text-slate-600">{activePayment.merchant_reference}</span>
            </div>
            {activePayment.provider_transaction_id && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">ID SASPay</span>
                <span className="font-mono text-[11px] text-slate-600 truncate max-w-[200px]">{activePayment.provider_transaction_id}</span>
              </div>
            )}
          </div>

          {/* SECURITY & PIN NOTICE */}
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-extrabold">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Consignes de sécurité PIN</span>
            </div>
            <p className="text-blue-800 text-[11px] leading-relaxed">
              1. Saisissez votre code PIN secret uniquement sur l'invite officielle ou le guichet sécurisé.<br />
              2. <strong>SITDOWORLD IA MUSIC ne vous demandera JAMAIS votre code PIN.</strong>
            </p>
          </div>

          {/* Polling & action buttons */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF7A00]" />
              <span>Vérification automatique du statut en cours...</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleManualCheck}
                disabled={isCheckingStatus}
                className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                <span>Actualiser statut</span>
              </button>

              <button
                type="button"
                onClick={handleCancelPayment}
                className="py-3 px-4 rounded-xl border border-red-200 hover:bg-red-50 text-xs font-bold text-red-700 cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 2: PAYMENT SUCCESS / CONFIRMED (Step 8 & 14) */}
      {flowState === 'SUCCESS' && activePayment && (
        <div className="bg-white rounded-3xl border-2 border-emerald-300 p-8 text-center space-y-6 shadow-xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Paiement confirmé
            </span>
            <h2 className="text-2xl font-black text-[#0F172A] mt-2">
              Votre pack est maintenant disponible.
            </h2>
            <p className="text-xs text-emerald-700 font-bold mt-1">
              +{plan.songs} créations de chansons ajoutées à votre compte SITDOWORLD IA MUSIC.
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              Référence transaction : <code className="font-mono text-slate-800">{activePayment.merchant_reference}</code>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Pack activé</span>
              <span className="font-bold text-[#0F172A]">{plan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Montant réglé</span>
              <span className="font-bold text-[#0F172A]">${activePayment.amount} {activePayment.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Méthode de paiement</span>
              <span className="font-bold text-[#0F172A] uppercase">
                {activePayment.network || activePayment.payment_method}
              </span>
            </div>
            {activePayment.provider_transaction_id && (
              <div className="flex justify-between">
                <span className="text-slate-500">ID SASPay</span>
                <span className="font-mono text-slate-800">{activePayment.provider_transaction_id}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-emerald-800 font-extrabold text-sm">
              <span>Crédit total crédité</span>
              <span>+{plan.songs} chansons</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/create')}
            className="w-full py-4 rounded-2xl bg-[#FF7A00] hover:bg-[#e66e00] text-white font-extrabold text-sm shadow-md shadow-orange-500/25 cursor-pointer"
          >
            Aller au Studio & Créer maintenant
          </button>
        </div>
      )}

      {/* STATE 3: PAYMENT FAILED / CANCELLED / EXPIRED / INSUFFICIENT_FUNDS (Section 22) */}
      {flowState === 'FAILED' && (
        (() => {
          const status = String(activePayment?.status || '').toUpperCase();
          const reason = String(errorMsg || activePayment?.failure_reason || '').toLowerCase();
          const isInsufficient = status === 'INSUFFICIENT_FUNDS' || reason.includes('solde') || reason.includes('insufficient') || reason.includes('balance');
          const isCancelled = status === 'CANCELLED' || reason.includes('annul') || reason.includes('cancel');
          const isExpired = status === 'EXPIRED' || reason.includes('dépassé') || reason.includes('expir');

          let badge = 'Paiement Échoué';
          let title = 'Paiement échoué';
          let subtitle = 'Votre pack n\'a pas été activé.';
          let explanation = 'La transaction n’a pas pu être validée par l’opérateur Mobile Money. Aucun montant n’a été prélevé sur votre compte.';
          let badgeColor = 'text-red-700 bg-red-50 border-red-200';

          if (isInsufficient) {
            badge = 'Solde Insuffisant';
            title = 'Solde Mobile Money insuffisant';
            subtitle = 'Votre pack n\'a pas été activé.';
            explanation = 'Le solde de votre compte Mobile Money est insuffisant pour valider cet achat. Veuillez recharger votre compte puis réessayer.';
            badgeColor = 'text-amber-800 bg-amber-50 border-amber-200';
          } else if (isCancelled) {
            badge = 'Paiement Annulé';
            title = 'Paiement annulé';
            subtitle = 'Votre pack n\'a pas été activé.';
            explanation = 'La demande de paiement a été annulée. Aucun montant n’a été prélevé sur votre compte Mobile Money.';
            badgeColor = 'text-slate-700 bg-slate-100 border-slate-300';
          } else if (isExpired) {
            badge = 'Délai Dépassé';
            title = 'Le délai de confirmation est dépassé';
            subtitle = 'Votre pack n\'a pas été activé.';
            explanation = 'Le délai imparti pour confirmer le paiement Mobile Money est écoulé. Aucun montant n’a été prélevé sur votre compte.';
            badgeColor = 'text-orange-800 bg-orange-50 border-orange-200';
          }

          return (
            <div className="bg-white rounded-3xl border-2 border-red-200 p-8 text-center space-y-6 shadow-xl animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-sm">
                <XCircle className="w-10 h-10" />
              </div>

              <div>
                <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${badgeColor}`}>
                  {badge}
                </span>
                <h2 className="text-2xl font-black text-[#0F172A] mt-2">
                  {title}
                </h2>
                <p className="text-xs font-bold text-red-600 mt-1">
                  {subtitle}
                </p>
                {errorMsg && !errorMsg.includes(title) && (
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">
                    Détail : {errorMsg}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left text-slate-600">
                <p>{explanation}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setFlowState('FORM');
                    setErrorMsg(null);
                  }}
                  className="py-3.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-extrabold text-xs cursor-pointer"
                >
                  Réessayer le paiement
                </button>
                <button
                  onClick={onBack}
                  className="py-3.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Retour aux tarifs
                </button>
              </div>
            </div>
          );
        })()
      )}

      {/* STATE 4: CHECKOUT FORM */}
      {flowState === 'FORM' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#2563EB]">
                Guichet Sécurisé SASPAY
              </span>
              <h2 className="text-xl font-black text-[#0F172A]">Finalisation de la commande</h2>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-[#FF7A00]">${plan.price.toFixed(2)}</span>
              <span className="text-[10px] text-slate-400 block font-semibold">USD</span>
            </div>
          </div>

          {/* Plan Recap */}
          <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-blue-200 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-[#0F172A]">{plan.name}</h3>
              <p className="text-xs text-[#2563EB] font-bold">
                {plan.songs} créations complètes • Utilisables sans limite de temps
              </p>
            </div>
            <span className="text-xs font-black text-slate-700 bg-white px-3 py-1 rounded-xl shadow-xs">
              {plan.songs} morceaux
            </span>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-[#0F172A]">
              Choisissez votre méthode de paiement Mobile Money
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: 'vodacom_mpesa', label: 'Vodacom M-Pesa', color: 'border-red-600 bg-red-50 text-red-700', badge: 'RDC (+243)' },
                { id: 'airtel_cd', label: 'Airtel Money RDC', color: 'border-red-600 bg-red-50 text-red-700', badge: 'RDC (+243)' },
                { id: 'orange_cd', label: 'Orange Money RDC', color: 'border-orange-600 bg-orange-50 text-orange-700', badge: 'RDC (+243)' },
                { id: 'orange_money', label: 'Orange Money CI/SN', color: 'border-orange-500 bg-orange-50 text-orange-800', badge: 'CI / SN / CM' },
                { id: 'mtn_momo', label: 'MTN MoMo', color: 'border-yellow-500 bg-yellow-50 text-yellow-800', badge: 'CI / BJ / CM' },
                { id: 'wave', label: 'Wave Mobile', color: 'border-cyan-500 bg-cyan-50 text-cyan-800', badge: 'CI / SN' },
                { id: 'card', label: 'Carte Bancaire', color: 'border-blue-500 bg-blue-50 text-blue-700', badge: 'Visa/Mastercard' },
              ].map((method) => {
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(method.id as any);
                      const isRdc = method.id === 'vodacom_mpesa' || method.id === 'airtel_cd' || method.id === 'orange_cd';
                      if (isRdc && (!phone || phone.startsWith('+225'))) {
                        setPhone('+243 81 234 56 78');
                      } else if (!isRdc && method.id !== 'card' && phone.startsWith('+243')) {
                        setPhone('+225 07 00 00 00');
                      }
                    }}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition-all text-left flex flex-col justify-between gap-1.5 cursor-pointer ${
                      isSelected
                        ? `${method.color} shadow-xs scale-[1.02]`
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Smartphone className={`w-4 h-4 shrink-0 ${method.id.includes('cd') || method.id === 'vodacom_mpesa' ? 'text-red-600' : 'text-slate-700'}`} />
                      <span className="truncate">{method.label}</span>
                    </div>
                    <span className="text-[10px] opacity-75 font-semibold">{method.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phone Number / Account Info */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#0F172A]">
                {paymentMethod === 'vodacom_mpesa' || paymentMethod === 'airtel_cd' || paymentMethod === 'orange_cd'
                  ? 'Numéro de téléphone RDC (+243)'
                  : 'Numéro de téléphone Mobile Money'}
              </label>
              {(paymentMethod === 'vodacom_mpesa' || paymentMethod === 'airtel_cd' || paymentMethod === 'orange_cd') && (
                <span className="text-[10px] font-black uppercase text-red-600 bg-red-100 px-2 py-0.5 rounded-md">
                  Réseau RDC (+243)
                </span>
              )}
            </div>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={
                paymentMethod === 'vodacom_mpesa' || paymentMethod === 'airtel_cd' || paymentMethod === 'orange_cd'
                  ? '+243 81 000 00 00'
                  : '+225 07 00 00 00'
              }
              className={`w-full p-3 rounded-xl border text-sm font-semibold focus:outline-hidden ${
                paymentMethod === 'vodacom_mpesa' || paymentMethod === 'airtel_cd' || paymentMethod === 'orange_cd'
                  ? 'bg-red-50/40 border-red-200 focus:border-red-600 text-slate-900'
                  : 'bg-slate-50 border-slate-200 focus:border-[#2563EB]'
              }`}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {paymentMethod === 'vodacom_mpesa' || paymentMethod === 'airtel_cd' || paymentMethod === 'orange_cd'
                ? 'Une invite de validation USSD sécurisée vous sera transmise sur votre numéro pour autoriser le débit avec votre code PIN.'
                : 'Une invite de validation USSD sécurisée vous sera transmise pour autoriser le débit sur votre téléphone.'}
            </p>
          </div>

          {/* Security note */}
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Chiffrement TLS 256 bits et vérification webhook avec signature HMAC SHA-256.</span>
          </div>

          {/* Pay Button */}
          <button
            onClick={handleInitiatePayment}
            disabled={isSubmitting || !phone.trim()}
            className="w-full py-4 rounded-2xl bg-[#FF7A00] hover:bg-[#e66e00] disabled:opacity-50 text-white font-black text-sm tracking-wide shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Envoi de la demande SASPAY...</span>
              </>
            ) : (
              <>
                <span>Payer ${plan.price.toFixed(2)} via SASPAY</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
