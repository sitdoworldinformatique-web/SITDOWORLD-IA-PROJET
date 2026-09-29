import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Sliders,
  Users,
  Layers,
  DollarSign,
  Sparkles,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Cpu,
  Music,
  Trash2,
} from 'lucide-react';
import { Plan, User, Payment, SaaSSettings, Song } from '../types';
import { SaaSOverviewTab } from '../components/admin/SaaSOverviewTab';
import { SaaSSettingsTab } from '../components/admin/SaaSSettingsTab';
import { SaaSUsersTab } from '../components/admin/SaaSUsersTab';
import { SaaSPlansTab } from '../components/admin/SaaSPlansTab';
import { SaaSAIAndAuditTab } from '../components/admin/SaaSAIAndAuditTab';
import { SaaSAISettingsTab } from '../components/admin/SaaSAISettingsTab';
import { SaaSSongsTab } from '../components/admin/SaaSSongsTab';
import { SaspayConfigTab } from '../components/admin/SaspayConfigTab';

export const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'saspay_config' | 'ai_settings' | 'settings' | 'songs' | 'users' | 'plans' | 'billing' | 'ai_logs'
  >('overview');

  const [stats, setStats] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [saasSettings, setSaasSettings] = useState<SaaSSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, paymentsRes, songsRes, logsRes, plansRes, settingsRes] = await Promise.all([
        fetch('/api/admin/stats').then((r) => r.json()).catch(() => null),
        fetch('/api/admin/users').then((r) => r.json()).catch(() => ({ users: [] })),
        fetch('/api/admin/payments').then((r) => r.json()).catch(() => ({ payments: [] })),
        fetch('/api/admin/songs').then((r) => r.json()).catch(() => ({ songs: [] })),
        fetch('/api/admin/logs').then((r) => r.json()).catch(() => ({ logs: [] })),
        fetch('/api/plans').then((r) => r.json()).catch(() => ({ plans: [] })),
        fetch('/api/admin/saas-settings').then((r) => r.json()).catch(() => ({ settings: null })),
      ]);

      if (statsRes) setStats(statsRes);
      if (usersRes?.users) setUsers(usersRes.users);
      if (paymentsRes?.payments) setPayments(paymentsRes.payments);
      if (songsRes?.songs) setSongs(songsRes.songs);
      if (logsRes?.logs) setLogs(logsRes.logs);
      if (plansRes?.plans) setPlans(plansRes.plans);
      if (settingsRes?.settings) setSaasSettings(settingsRes.settings);
    } catch (err) {
      console.error('Erreur chargement admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (updated: SaaSSettings): Promise<boolean> => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/saas-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur mise à jour paramètres');
      setSaasSettings(data.settings);
      setToastMessage('Paramètres du SaaS enregistrés avec succès !');
      setTimeout(() => setToastMessage(null), 3500);
      return true;
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
      return false;
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetSettings = async (): Promise<boolean> => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/saas-settings/reset', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur réinitialisation');
      setSaasSettings(data.settings);
      setToastMessage('Paramètres réinitialisés aux valeurs recommandées.');
      setTimeout(() => setToastMessage(null), 3500);
      return true;
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
      return false;
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAdjustBalance = async (
    userId: string,
    amount: number,
    reason: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/adjust-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason }),
      });
      if (!res.ok) throw new Error('Échec ajustement');
      await fetchData();
      return true;
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
      return false;
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Échec mise à jour utilisateur');
      await fetchData();
      return true;
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
      return false;
    }
  };

  const handleUpdatePlan = async (planId: string, updates: Partial<Plan>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Échec mise à jour plan');
      await fetchData();
      return true;
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
      return false;
    }
  };

  const handleDeleteSong = async (songId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/songs/${songId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Échec suppression chanson');
      setSongs((prev) => prev.filter((s) => s.id !== songId));
      await fetchData();
      setToastMessage('Chanson supprimée avec succès du catalogue.');
      setTimeout(() => setToastMessage(null), 3500);
      return true;
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
      return false;
    }
  };

  const handleClearTestSongs = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/songs/clear-test', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec suppression des tests');
      await fetchData();
      setToastMessage(data.message || 'Toutes les chansons de test ont été supprimées.');
      setTimeout(() => setToastMessage(null), 4000);
      return true;
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
      return false;
    }
  };

  const handleDeletePayment = async (paymentId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Échec suppression paiement');
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      await fetchData();
      setToastMessage('Transaction supprimée avec succès.');
      setTimeout(() => setToastMessage(null), 3500);
      return true;
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
      return false;
    }
  };

  const handleClearTestPayments = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/payments/clear-test', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec réinitialisation revenus');
      await fetchData();
      setToastMessage(data.message || 'Revenus et transactions de test supprimés. Chiffre d’affaires réinitialisé à 0$.');
      setTimeout(() => setToastMessage(null), 4000);
      return true;
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
      return false;
    }
  };

  const handleClearTestMRR = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/mrr/clear-test', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec suppression MRR test');
      await fetchData();
      setToastMessage(data.message || 'Chiffre MRR test supprimé avec succès. MRR réinitialisé à $0.');
      setTimeout(() => setToastMessage(null), 4000);
      return true;
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
      return false;
    }
  };

  const handleExportReport = () => {
    const reportData = {
      appName: saasSettings?.general.appName || 'SITDOWORLD AI MUSIC',
      exportedAt: new Date().toISOString(),
      admin: 'sitdoworldinformatique@gmail.com',
      stats,
      settings: saasSettings,
      usersCount: users.length,
      paymentsCount: payments.length,
      revenueUSD: stats?.totalRevenue || 0,
      mrrUSD: stats?.mrr || 0,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saas-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold">Chargement du tableau de bord administrateur SaaS...</p>
      </div>
    );
  }

  const isMaintenance = saasSettings?.general.maintenanceMode;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6" id="saas-admin-container">
      {/* Top Global Dashboard Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Tableau de Bord Administrateur SaaS
            </h1>

            {/* Status Pills */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                isMaintenance
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isMaintenance ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
              <span>{isMaintenance ? 'Mode Maintenance' : 'SaaS Opérationnel'}</span>
            </span>

            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
              Suno v6 Connecté
            </span>
          </div>

          <p className="text-xs text-slate-500 pl-1">
            Supervisez les indicateurs économiques, configurez les paramètres du SaaS, pilotez le moteur SunoAPI v6 et gérez les comptes clients.
          </p>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Rafraîchir les métriques"
            id="admin-refresh-btn"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualiser</span>
          </button>

          <button
            type="button"
            onClick={handleExportReport}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            id="admin-export-btn"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter Rapport SaaS</span>
          </button>
        </div>
      </div>

      {/* Global Toast */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { id: 'overview', label: "Vue d'Ensemble", icon: TrendingUp },
          { id: 'saspay_config', label: 'Configuration SASPAY.ME', icon: DollarSign },
          { id: 'ai_settings', label: 'Fournisseurs & Clés IA', icon: Cpu },
          { id: 'settings', label: 'Paramètres du SaaS', icon: Sliders },
          { id: 'songs', label: 'Chansons du SaaS', icon: Music },
          { id: 'users', label: 'Utilisateurs & Soldes', icon: Users },
          { id: 'plans', label: 'Grille Tarifaire (Packs)', icon: Layers },
          { id: 'billing', label: 'Finances & SASPAY', icon: DollarSign },
          { id: 'ai_logs', label: 'Moteur IA Suno v6 & Audit', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}
              id={`admin-tab-${tab.id}`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <SaaSOverviewTab
          stats={stats}
          payments={payments}
          onNavigateTab={(tab) => setActiveTab(tab as any)}
          onRefresh={fetchData}
          onClearTestRevenue={handleClearTestPayments}
          onClearTestMRR={handleClearTestMRR}
          onClearTestSongs={handleClearTestSongs}
        />
      )}

      {/* TAB SASPAY CONFIG */}
      {activeTab === 'saspay_config' && <SaspayConfigTab />}

      {/* TAB AI SETTINGS */}
      {activeTab === 'ai_settings' && <SaaSAISettingsTab />}

      {/* TAB 2: SAAS SETTINGS */}
      {activeTab === 'settings' && (
        <SaaSSettingsTab
          settings={saasSettings}
          onSave={handleSaveSettings}
          onReset={handleResetSettings}
          saving={savingSettings}
        />
      )}

      {/* TAB SONGS CATALOGUE */}
      {activeTab === 'songs' && (
        <SaaSSongsTab
          songs={songs}
          onRefresh={fetchData}
          onDeleteSong={handleDeleteSong}
          onClearTestSongs={handleClearTestSongs}
        />
      )}

      {/* TAB 3: USERS & BALANCES */}
      {activeTab === 'users' && (
        <SaaSUsersTab
          users={users}
          onAdjustBalance={handleAdjustBalance}
          onUpdateUser={handleUpdateUser}
          onRefresh={fetchData}
        />
      )}

      {/* TAB 4: PLANS */}
      {activeTab === 'plans' && (
        <SaaSPlansTab
          plans={plans}
          onUpdatePlan={handleUpdatePlan}
          onRefresh={fetchData}
        />
      )}

      {/* TAB 5: BILLING & TRANSACTIONS */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Historique des Transactions & Paiements SASPAY
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Suivi en direct des encaissements par carte bancaire et Mobile Money (Wave, Orange, MTN).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-400 font-bold uppercase">Volume Total :</span>
                <span className="text-2xl font-black text-emerald-600 font-mono">
                  ${stats?.totalRevenue || 0} USD
                </span>
              </div>

              {payments.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearTestPayments}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                  id="admin-clear-test-revenue-btn"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer le Revenu de Test ($0)</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-4">Référence SASPAY</th>
                    <th className="py-3.5 px-4">Utilisateur</th>
                    <th className="py-3.5 px-4">Pack</th>
                    <th className="py-3.5 px-4">Méthode</th>
                    <th className="py-3.5 px-4">Montant</th>
                    <th className="py-3.5 px-4 text-center">Statut</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                        Aucun paiement enregistré pour l'instant. Le chiffre d'affaires est à 0$.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-5 text-slate-400 whitespace-nowrap font-sans">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {p.transaction_reference}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-sans">
                          {p.user_id}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 font-bold uppercase text-[10px]">
                            {p.plan_id} (+{p.songs_credited} chansons)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-sans">
                          {p.payment_method || 'SASPAY Mobile/Card'}
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          ${p.amount} {p.currency}
                        </td>
                        <td className="py-3.5 px-4 text-center font-sans">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                              p.status === 'SUCCESS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right font-sans">
                          <button
                            type="button"
                            onClick={() => handleDeletePayment(p.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Supprimer cette transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AI & AUDIT LOGS */}
      {activeTab === 'ai_logs' && (
        <SaaSAIAndAuditTab logs={logs} onRefresh={fetchData} />
      )}
    </div>
  );
};
