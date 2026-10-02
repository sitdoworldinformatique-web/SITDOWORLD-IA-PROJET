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
  Sparkles,
  Brain,
} from 'lucide-react';
import { Plan, PaymentMethod, UserSongBalance, Payment, CoachingDomain } from '../types';
import { COACHING_DOMAINS } from '../data/coachingDomains';

interface PaymentViewProps {
  plan?: Plan | null;
  domain?: CoachingDomain | null;
  onBack: () => void;
  onSuccess: (newBalance?: UserSongBalance, unlockedDomainId?: string) => void;
  navigate: (route: string) => void;
}

type PaymentFlowState = 'FORM' | 'WAITING_CONFIRMATION' | 'SUCCESS' | 'FAILED';

export const PaymentView: React.FC<PaymentViewProps> = ({
  plan,
  domain: propDomain,
  onBack,
  onSuccess,
  navigate,
}) => {
  // If neither plan nor domain is passed, default to first domain
  const domain = propDomain || (!plan ? COACHING_DOMAINS[0] : null);

  const [phone, setPhone] = useState('+225 07 12 34 56 78');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('orange_money');
  const [flowState, setFlowState] = useState<PaymentFlowState>('FORM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active transaction tracking
  const [activePayment, setActivePayment] = useState<Payment | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 2-minute countdown display
  const [countdownSeconds, setCountdownSeconds] = useState<number>(120);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  const itemName = domain ? `Domaine ${domain.name}` : plan ? `Pack ${plan.name}` : 'Coaching Stratégique';
  const itemPrice = domain ? domain.price : plan ? plan.price : 15;
  const itemCurrency = domain ? domain.currency : plan ? plan.currency : 'USD';
  const itemDescription = domain
    ? domain.description
    : plan
    ? `${plan.songs} créations musicales en haute fidélité`
    : 'Accès illimité au coach IA expert';

  // Format seconds to mm:ss
  const formatCountdown = (totalSeconds: number): string => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 1. Submit payment request
  const handleInitiatePayment = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('sitdoworld_user_id') : null;
      const effectiveUserId = storedUserId && storedUserId !== 'guest' ? storedUserId : 'user-default-1';

      if (domain) {
        // Unlock domain for user
        const res = await fetch(`/api/domains/${domain.id}/purchase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: effectiveUserId,
            paymentMethod,
            phoneNumber: phone,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erreur lors du déblocage du domaine.');
        }

        // Direct success on domain unlock
        setFlowState('SUCCESS');
        onSuccess(undefined, domain.id);
        return;
      }

      // Music Plan Flow via SASPAY
      if (plan) {
        const res = await fetch('/api/payments/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan_id: plan.id,
            customer_phone: phone,
            payment_method: paymentMethod,
            userId: effectiveUserId,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erreur lors de la création de la transaction SASPAY.');
        }

        const reference = data.merchant_reference || data.transactionReference || data.transaction_reference;

        const currentPayment: Payment = data.payment || {
          id: reference,
          user_id: effectiveUserId,
          merchant_reference: reference,
          transaction_reference: reference,
          status: data.status || 'PENDING',
          amount: data.amount || plan.price,
          currency: data.currency || plan.currency,
          plan_id: plan.id,
          created_at: new Date().toISOString(),
          instructions: data.instructions,
          checkout_url: data.checkout_url,
        };

        setActivePayment(currentPayment);
        setFlowState('WAITING_CONFIRMATION');

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

        startPolling(reference);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible d’initialiser le paiement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Polling loop for SASPAY
  const startPolling = (reference: string) => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);

    pollingTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status/${reference}`);
        if (!res.ok) return;

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
          setErrorMsg(p.failure_reason || 'Paiement non validé.');
        }
      } catch (e) {
        // Transient network error
      }
    }, 3500);
  };

  const handleCancelPayment = () => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setFlowState('FORM');
    setActivePayment(null);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-28">
      {flowState === 'FORM' && (
        <button
          onClick={onBack}
          className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </button>
      )}

      {/* STATE 1: WAITING FOR CONFIRMATION */}
      {flowState === 'WAITING_CONFIRMATION' && activePayment && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xl animate-in zoom-in-95">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-xs animate-pulse">
              <Smartphone className="w-9 h-9" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-sm font-mono font-black tracking-widest shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
              <span>{formatCountdown(countdownSeconds)}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Validation sur votre téléphone
            </h2>

            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Une demande de débit Mobile Money de <strong>${itemPrice.toFixed(2)}</strong> a été envoyée au <strong>{phone}</strong>. Veuillez saisir votre code secret PIN pour confirmer l'achat de <strong>{itemName}</strong>.
            </p>

            {activePayment.checkout_url && (
              <div className="pt-2">
                <a
                  href={activePayment.checkout_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>Ouvrir la page de validation sécurisée</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCancelPayment}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* STATE 2: SUCCESS */}
      {flowState === 'SUCCESS' && (
        <div className="bg-white rounded-3xl border border-emerald-200 p-8 text-center space-y-6 shadow-xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              Paiement Confirmé
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              Félicitations ! Accès Débloqué
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Votre achat pour <strong>{itemName}</strong> (${itemPrice.toFixed(2)}) a été validé avec succès.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
              <Brain className="w-4 h-4 text-blue-600" />
              <span>Votre Coach IA Spécialisé est prêt</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vous pouvez dès maintenant lui poser toutes vos questions d'expertise, calculs de rentabilité et plans d'action.
            </p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>Accéder directement à mon Coach IA</span>
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STATE 3: FAILED */}
      {flowState === 'FAILED' && (
        <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
            <XCircle className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Paiement Non Validé</h2>
            <p className="text-sm text-rose-600 font-semibold">
              {errorMsg || 'La transaction n’a pas pu être finalisée.'}
            </p>
            <p className="text-xs text-slate-500">
              Veuillez vérifier votre solde Mobile Money et que votre numéro est bien habilité pour les transactions en ligne.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setFlowState('FORM');
                setErrorMsg(null);
              }}
              className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
            >
              Réessayer le paiement
            </button>
            <button
              onClick={onBack}
              className="px-5 py-3.5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* STATE 4: INITIAL PAYMENT FORM */}
      {flowState === 'FORM' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-lg">
          {/* Header */}
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>PAIEMENT SÉCURISÉ INTELLIGENCE AFRICAINE</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900">
              Débloquer {itemName}
            </h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {itemDescription}
            </p>
          </div>

          {/* Price Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 block uppercase">
                Montant total à régler
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black text-slate-900">
                  ${itemPrice.toFixed(2)}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  ({(itemPrice * 650).toLocaleString('fr-FR')} FCFA)
                </span>
              </div>
            </div>
            <span className="text-xs font-black text-blue-700 bg-blue-100 px-3 py-1 rounded-xl shadow-xs">
              Paiement Unique
            </span>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-900">
              Choisissez votre moyen de paiement Mobile Money ou Carte
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: 'orange_money', label: 'Orange Money', color: 'border-orange-500 bg-orange-50 text-orange-800', badge: 'CI / SN / CM / ML' },
                { id: 'mtn_momo', label: 'MTN MoMo', color: 'border-yellow-500 bg-yellow-50 text-yellow-800', badge: 'CI / BJ / CM / GH' },
                { id: 'wave', label: 'Wave Money', color: 'border-cyan-500 bg-cyan-50 text-cyan-800', badge: 'CI / SN' },
                { id: 'vodacom_mpesa', label: 'Vodacom M-Pesa', color: 'border-red-600 bg-red-50 text-red-700', badge: 'RDC (+243)' },
                { id: 'airtel_cd', label: 'Airtel Money', color: 'border-red-600 bg-red-50 text-red-700', badge: 'RDC / GA / CG' },
                { id: 'card', label: 'Carte Bancaire', color: 'border-blue-500 bg-blue-50 text-blue-700', badge: 'Visa / Mastercard' },
              ].map((method) => {
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(method.id as any);
                    }}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition-all text-left flex flex-col justify-between gap-1.5 cursor-pointer ${
                      isSelected
                        ? `${method.color} shadow-xs scale-[1.02]`
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 shrink-0 text-slate-700" />
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
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Numéro de téléphone du compte Mobile Money
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+225 07 00 00 00"
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold focus:outline-hidden focus:border-blue-600 focus:bg-white transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Une notification USSD sécurisée vous invitera à autoriser le montant avec votre code secret.
            </p>
          </div>

          {/* Security note */}
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Chiffrement bancaire TLS 256 bits et passerelle sécurisée panafricaine.</span>
          </div>

          {/* Pay Button (Bouton Bleu) */}
          <button
            onClick={handleInitiatePayment}
            disabled={isSubmitting || !phone.trim()}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-sm tracking-wide shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
            id="pay-button"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Traitement du paiement en cours...</span>
              </>
            ) : (
              <>
                <span>PAYER ${itemPrice.toFixed(2)}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
