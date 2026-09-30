import React from 'react';
import { Lock, ShieldAlert, Sparkles, CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';
import { Plan } from '../types';

interface StudioLockedGateProps {
  plans: Plan[];
  onSelectPlan: (plan: Plan) => void;
  navigate: (route: string) => void;
  title?: string;
  reason?: 'no_pack' | 'zero_remaining';
}

export const StudioLockedGate: React.FC<StudioLockedGateProps> = ({
  plans,
  onSelectPlan,
  navigate,
  title = "Accès au Studio de Création Réservé",
  reason = 'no_pack',
}) => {
  return (
    <div className="max-w-5xl mx-auto space-y-10 py-8 px-4 sm:px-6">
      {/* Paywall Banner */}
      <div className="rounded-3xl bg-radial from-orange-50 via-white to-white border-2 border-orange-200 p-8 sm:p-12 text-center shadow-lg relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-[#FF7A00] text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-orange-500/30">
          <Lock className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-[#FF7A00] text-xs font-black mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PACK COMMERCIAL STRICTEMENT REQUIS</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight max-w-2xl mx-auto leading-tight">
          {reason === 'zero_remaining'
            ? 'Vous avez utilisé toutes vos chansons'
            : title}
        </h1>

        <p className="text-sm sm:text-base text-[#64748B] mt-4 max-w-2xl mx-auto leading-relaxed">
          {reason === 'zero_remaining'
            ? 'Votre solde actuel est de 0 chanson. Pour composer une nouvelle musique avec le studio IA, veuillez recharger votre compte avec un nouveau pack.'
            : 'Pour accéder au studio de création, composer des morceaux avec des paroles personnalisées, choisir les voix IA et exporter les stems multitrack, vous devez préalablement acheter un pack de chansons. Aucune génération gratuite n’est autorisée.'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <button
            onClick={() => {
              const el = document.getElementById('gate-plans');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-6 py-3 rounded-xl bg-[#FF7A00] hover:bg-[#e66e00] text-white font-extrabold text-sm shadow-md shadow-orange-500/25 flex items-center gap-2 cursor-pointer transition-all"
          >
            <CreditCard className="w-4 h-4" />
            <span>Choisir un Pack ci-dessous</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-sm cursor-pointer transition-all"
          >
            Retour à l'accueil
          </button>
        </div>

        {/* Security and transparency guarantee */}
        <div className="mt-8 pt-6 border-t border-orange-100 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Paiement sécurisé Mobile Money (Orange, MTN, Wave, M-Pesa)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Activation instantanée après confirmation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Crédits valables à vie sans expiration</span>
          </div>
        </div>
      </div>

      {/* Plans Section */}
      <div id="gate-plans" className="space-y-6 pt-4">
        <div className="text-center">
          <h2 className="text-2xl font-black text-[#0F172A]">
            Choisissez votre pack pour débloquer le studio
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Tarifs fixes et transparents en USD. Règlement immédiat par téléphone.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {plans.map((plan) => {
            const isPopular = plan.popular;
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-5 flex flex-col justify-between transition-all bg-white ${
                  isPopular
                    ? 'border-2 border-[#FF7A00] shadow-xl shadow-orange-500/10'
                    : 'border border-slate-200 hover:border-blue-300'
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#FF7A00] text-white text-[10px] font-black uppercase tracking-wider shadow-xs whitespace-nowrap">
                    RECOMMANDÉ
                  </span>
                )}

                <div>
                  <span className="text-[11px] font-black uppercase text-[#2563EB] tracking-wider block">
                    {plan.name}
                  </span>
                  <div className="mt-2 mb-3">
                    <span className="text-3xl font-black text-[#0F172A]">${plan.price.toFixed(2)}</span>
                    <span className="text-[11px] font-semibold text-slate-500 ml-1">USD</span>
                    <p className="text-xs font-bold text-[#FF7A00] mt-0.5">
                      {plan.songs} chansons master
                    </p>
                  </div>

                  <ul className="space-y-1.5 text-[11px] text-slate-600 mb-5">
                    <li className="flex items-center gap-1.5 font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Validité illimitée à vie</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                      <span>Studio multitrack & stems</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                      <span>Droits commerciaux inclus</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPlan(plan)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    isPopular
                      ? 'bg-[#FF7A00] hover:bg-[#e66e00] text-white shadow-md'
                      : 'bg-[#2563EB] hover:bg-blue-700 text-white'
                  }`}
                >
                  <span>Acheter ce pack</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
