import React from 'react';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Smartphone,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { Plan, PlanId } from '../types';

interface PricingViewProps {
  plans: Plan[];
  onSelectPlan: (plan: Plan) => void;
}

export const PricingView: React.FC<PricingViewProps> = ({ plans, onSelectPlan }) => {
  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-28 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-100 text-[#FF7A00] text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PAIEMENT PAR PACK • SANS ENGAGEMENT</span>
        </div>
        <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">
          Des packs simples. <span className="text-[#FF7A00]">Pas d'abonnement forcé</span>.
        </h1>
        <p className="text-base text-[#64748B]">
          Achetez uniquement les chansons dont vous avez besoin. Vos crédits n'expirent jamais et sont utilisables sans limite de temps.
        </p>
      </div>

      {/* Plans Grid (5 Packs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {plans.map((plan) => {
          const isPopular = plan.popular;
          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between h-full ${
                isPopular
                  ? 'bg-white border-2 border-[#FF7A00] shadow-xl shadow-orange-500/10 scale-102 z-10'
                  : 'bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-lg'
              }`}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#FF7A00] text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm whitespace-nowrap">
                  <Flame className="w-3 h-3 fill-current" />
                  <span>LE PLUS POPULAIRE</span>
                </div>
              )}

              <div>
                <div className="mb-4">
                  <span className="text-xs font-black uppercase text-[#2563EB] tracking-wider block">
                    {plan.name}
                  </span>
                  <h3 className="text-xl font-black text-[#0F172A] mt-1">{plan.name}</h3>
                </div>

                {/* Price Display */}
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-[#0F172A]">${plan.price.toFixed(2)}</span>
                    <span className="text-xs font-semibold text-[#64748B]">paiement unique</span>
                  </div>
                  <p className="text-[11px] font-bold text-[#FF7A00] mt-1">
                    {plan.songs} chansons complètes haute fidélité
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Soit ${(plan.price / plan.songs).toFixed(2)} par morceau
                  </p>
                </div>

                {/* Features list */}
                <div className="space-y-2.5 mb-6 text-xs text-slate-700">
                  <div className="flex items-center gap-2 font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Chansons utilisables sans limite de temps</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>1 chanson master par génération</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>Export audio haute fidélité</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>Accès complet au Studio Multitrack</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>Stems isolés (Vocals, Drums, Bass...)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>Droits commerciaux d'exploitation</span>
                  </div>
                </div>
              </div>

              {/* Action button */}
              <button
                onClick={() => onSelectPlan(plan)}
                className={`w-full py-3.5 rounded-2xl font-extrabold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  isPopular
                    ? 'bg-[#FF7A00] hover:bg-[#e66e00] text-white shadow-orange-500/25'
                    : 'bg-[#2563EB] hover:bg-blue-700 text-white shadow-blue-500/20'
                }`}
              >
                <span>Acheter {plan.songs} chansons</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          );
        })}
      </div>

      {/* SASPAY Badge & Supported Payment Methods (Section 21) */}
      <div className="rounded-3xl bg-slate-50 border border-slate-200 p-6 sm:p-8 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
          <span>Passerelle de paiement officielle sécurisée SASPAY</span>
        </div>

        <p className="text-sm font-semibold text-slate-700 max-w-xl mx-auto">
          Paiement instantané en Afrique et à l'international avec vos méthodes favorites :
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          {[
            { name: 'Orange Money', color: 'bg-orange-600 text-white' },
            { name: 'MTN MoMo', color: 'bg-yellow-400 text-black' },
            { name: 'Wave Mobile Money', color: 'bg-cyan-500 text-white' },
            { name: 'Vodacom (M-Pesa)', color: 'bg-red-600 text-white' },
            { name: 'Carte Bancaire (Visa / Mastercard)', color: 'bg-blue-600 text-white' },
          ].map((m) => (
            <span
              key={m.name}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold shadow-xs ${m.color}`}
            >
              {m.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
