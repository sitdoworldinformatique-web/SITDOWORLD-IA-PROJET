import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Music,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  PieChart,
  Clock,
  Layers,
  Settings,
  CreditCard,
  Trash2,
} from 'lucide-react';
import { Payment } from '../../types';

interface SaaSOverviewTabProps {
  stats: any | null;
  payments: Payment[];
  onNavigateTab: (tabId: string) => void;
  onRefresh: () => void;
  onClearTestRevenue?: () => void;
  onClearTestMRR?: () => void;
  onClearTestSongs?: () => void;
}

export const SaaSOverviewTab: React.FC<SaaSOverviewTabProps> = ({
  stats,
  payments,
  onNavigateTab,
  onRefresh,
  onClearTestRevenue,
  onClearTestMRR,
  onClearTestSongs,
}) => {
  const mrr = stats?.mrr ?? 0;
  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalUsers = stats?.totalUsers ?? 5;
  const activeUsers = stats?.activeUsers ?? 4;
  const totalSongs = stats?.totalSongs ?? 6;
  const totalJobs = stats?.totalJobs ?? 8;
  const songsByGenre = stats?.songsByGenre ?? {
    Afrobeat: 3,
    Amapiano: 2,
    Gospel: 1,
    'R&B': 1,
  };

  const totalGenreCount = Object.values(songsByGenre as Record<string, number>).reduce(
    (a, b) => a + b,
    0
  ) || 1;

  // Revenue by payment method
  const revenueCard = payments
    .filter((p) => p.payment_method?.includes('CARD'))
    .reduce((acc, p) => acc + p.amount, 0);
  const revenueMoMo = payments
    .filter((p) => p.payment_method?.includes('MOMO'))
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Executive SaaS KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR Card */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                MRR (Revenu Récurrent)
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">${mrr}</span>
              {mrr > 0 ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +28%
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  0$ (Réel)
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block font-medium">
              Marge brute estimée : ~84%
            </span>
          </div>

          {onClearTestMRR && (
            <button
              type="button"
              onClick={onClearTestMRR}
              className={`mt-3 w-full py-1.5 px-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mrr > 0
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 hover:border-rose-300 active:scale-95'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200/80'
              }`}
              title="Supprimer le chiffre test du MRR et réinitialiser à 0$"
              id="card-clear-test-mrr-btn"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{mrr > 0 ? 'Supprimer le MRR test ($0)' : 'MRR réinitialisé ($0)'}</span>
            </button>
          )}
        </div>

        {/* Total SASPAY Revenue */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Chiffre d'Affaires Global
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-600">${totalRevenue}</span>
            <span className="text-xs font-mono font-bold text-slate-400">USD</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            100% collecté via SASPAY Gateway
          </span>
        </div>

        {/* Active SaaS Users */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Clients & Créateurs
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{totalUsers}</span>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              {activeUsers} actifs
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            {stats?.vipUsers || 1} client VIP • Taux conversion 80%
          </span>
        </div>

        {/* AI Music Productions */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Musique Produite (Suno v6)
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-600">{totalSongs}</span>
            <span className="text-xs font-bold text-slate-500">pistes</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            {stats?.totalDurationMinutes || 18} min audio HD • {totalJobs} jobs IA
          </span>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Genre Breakdown Progress Bar */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Répartition des Chansons Créées par Genre
                </h3>
                <p className="text-[11px] text-slate-400">Volume de production musicale sur le SaaS</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500">{totalGenreCount} morceaux analysés</span>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(songsByGenre as Record<string, number>).map(([genre, count], idx) => {
              const pct = Math.round((count / totalGenreCount) * 100);
              const colors = [
                'bg-orange-500',
                'bg-blue-600',
                'bg-emerald-500',
                'bg-purple-600',
                'bg-pink-500',
              ];
              const color = colors[idx % colors.length];

              return (
                <div key={genre} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      <span>{genre}</span>
                    </span>
                    <span className="font-mono text-slate-500">
                      {count} titre{count > 1 ? 's' : ''} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>✨ Moteur de synthèse : SunoAPI (Suno v6)</span>
            <button
              onClick={() => onNavigateTab('ai_logs')}
              className="text-purple-600 font-bold hover:underline cursor-pointer"
            >
              Tester le moteur audio →
            </button>
          </div>
        </div>

        {/* SASPAY Payment Breakdown */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Passerelle SASPAY</h3>
              <p className="text-[11px] text-slate-400">Répartition des encaissements</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Cartes Bancaires (Visa/MC)</span>
              <span className="font-black text-slate-900">${revenueCard} USD</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{
                  width: `${totalRevenue > 0 ? (revenueCard / totalRevenue) * 100 : 50}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-slate-600 font-medium">Mobile Money (Wave, Orange, MTN)</span>
              <span className="font-black text-slate-900">${revenueMoMo} USD</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF7A00] rounded-full"
                style={{
                  width: `${totalRevenue > 0 ? (revenueMoMo / totalRevenue) * 100 : 50}%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <button
              onClick={() => onNavigateTab('billing')}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Gérer les Transactions SASPAY
            </button>
            <button
              onClick={() => onNavigateTab('settings')}
              className="w-full py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Configurer les Paramètres SaaS
            </button>
          </div>
        </div>
      </div>

      {/* Test Data Cleanup & Reset Card */}
      <div className="bg-gradient-to-r from-rose-50/80 via-orange-50/60 to-amber-50/80 rounded-3xl p-6 border-2 border-rose-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Nettoyage des Données de Test (Chiffre d'Affaires & Chansons)</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  Zone Administrateur
                </span>
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Réinitialisez les métriques financières de démonstration pour démarrer avec une comptabilité réelle à 0$, ou purgez les morceaux de test générés lors des vérifications de l'IA.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onClearTestMRR && (
              <button
                type="button"
                onClick={onClearTestMRR}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border-2 border-emerald-300 font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
                id="overview-clear-test-mrr-btn"
                title="Supprimer le chiffre de test du MRR pour afficher 0$"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Supprimer le MRR Test ($0)</span>
              </button>
            )}

            {onClearTestRevenue && (
              <button
                type="button"
                onClick={onClearTestRevenue}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border-2 border-rose-300 font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
                id="overview-clear-test-revenue-btn"
              >
                <DollarSign className="w-4 h-4" />
                <span>Supprimer le Revenu de Test ($0)</span>
              </button>
            )}

            {onClearTestSongs && (
              <button
                type="button"
                onClick={onClearTestSongs}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
                id="overview-clear-test-songs-btn"
              >
                <Music className="w-4 h-4" />
                <span>Supprimer les Chansons de Test</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Admin Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigateTab('settings')}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Settings className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-slate-900 block">Paramètres du SaaS</span>
          <span className="text-[11px] text-slate-500">
            Ajuster branding, quotas Suno v6, prix et modération
          </span>
        </button>

        <button
          onClick={() => onNavigateTab('users')}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-purple-400 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-slate-900 block">Gestion Utilisateurs & Soldes</span>
          <span className="text-[11px] text-slate-500">
            Créditer des chansons, attribuer badge VIP, suspendre compte
          </span>
        </button>

        <button
          onClick={() => onNavigateTab('plans')}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-orange-400 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-slate-900 block">Grille Tarifaire des Packs</span>
          <span className="text-[11px] text-slate-500">
            Modifier les prix (3$, 6$, 10$, 12$) et nombre de chansons
          </span>
        </button>
      </div>
    </div>
  );
};
