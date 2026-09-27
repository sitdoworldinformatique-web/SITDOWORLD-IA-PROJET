import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Music,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Activity,
  Terminal,
  Search,
  Check,
} from 'lucide-react';
import { AdminLog, PlanId } from '../../types';

interface SaaSAIAndAuditTabProps {
  logs: AdminLog[];
  onRefresh: () => void;
}

export const SaaSAIAndAuditTab: React.FC<SaaSAIAndAuditTabProps> = ({ logs, onRefresh }) => {
  // Suno & Gemini test states
  const [isTestingSuno, setIsTestingSuno] = useState(false);
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Webhook Simulator states
  const [testUserId, setTestUserId] = useState('user-admin-1');
  const [testPlanId, setTestPlanId] = useState<PlanId>('pro');
  const [testAmount, setTestAmount] = useState(10);
  const [testMethod, setTestMethod] = useState('orange_money');
  const [testStatus, setTestStatus] = useState<'SUCCESS' | 'FAILED'>('SUCCESS');
  const [testReference, setTestReference] = useState(`SAS-SIM-${Date.now()}`);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);

  // Logs search & filter
  const [logFilter, setLogFilter] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [viewingLogDetails, setViewingLogDetails] = useState<AdminLog | null>(null);

  const handleTestSuno = async () => {
    setIsTestingSuno(true);
    setTestError(null);
    setTestResult(null);
    try {
      const res = await fetch('/api/music/test-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors du test de SunoAPI');
      setTestResult(data);
      onRefresh();
    } catch (err: any) {
      setTestError(err.message);
    } finally {
      setIsTestingSuno(false);
    }
  };

  const handleTestGemini = async () => {
    setIsTestingGemini(true);
    setTestError(null);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors du test de Gemini');
      setTestResult({
        ...data,
        type: 'gemini',
      });
      onRefresh();
    } catch (err: any) {
      setTestError(err.message);
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setSimResult(null);

    const payload = {
      event: 'payment.completed',
      data: {
        transaction_reference: testReference,
        provider_transaction_id: `SASPAY-TX-${Math.floor(100000 + Math.random() * 900000)}`,
        status: testStatus,
        amount: Number(testAmount),
        currency: 'USD',
        payment_method: testMethod,
        customer: {
          id: testUserId,
          email: 'sitdoworldinformatique@gmail.com',
          phone: '+22507000000',
        },
        metadata: {
          user_id: testUserId,
          plan_id: testPlanId,
          songs: testPlanId === 'starter' ? 2 : testPlanId === 'creator' ? 4 : testPlanId === 'pro' ? 6 : testPlanId === 'studio' ? 8 : 10,
        },
        created_at: new Date().toISOString(),
      },
    };

    try {
      const res = await fetch('/api/webhooks/saspay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setSimResult({ ok: res.ok, data });
      onRefresh();
      // Generate new reference for next test
      setTestReference(`SAS-SIM-${Date.now()}`);
    } catch (err: any) {
      setSimResult({ ok: false, error: err.message });
    } finally {
      setIsSimulating(false);
    }
  };

  const filteredLogs = logs.filter((l) => {
    const matchesText =
      l.event.toLowerCase().includes(logFilter.toLowerCase()) ||
      (l.user_id && l.user_id.toLowerCase().includes(logFilter.toLowerCase())) ||
      JSON.stringify(l.details).toLowerCase().includes(logFilter.toLowerCase());

    if (!matchesText) return false;
    if (selectedEventType !== 'all' && l.event !== selectedEventType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* SECTION 1: GEMINI & LYRIA 3.5 PRO API ENVIRONMENT */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  Moteur IA Musical : SunoAPI (Suno v6) & Studio IA
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Suno v6 Actif & Connecté
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Moteur principal : <span className="font-mono text-purple-400 font-semibold">SunoAPI v6</span> • Clé API privée sécurisée côté serveur.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleTestGemini}
              disabled={isTestingGemini}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border border-slate-700 disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${isTestingGemini ? 'animate-spin' : ''}`} />
              <span>{isTestingGemini ? 'Test...' : 'Test Gemini 3.8 Flash'}</span>
            </button>

            <button
              onClick={handleTestSuno}
              disabled={isTestingSuno}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-98 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              <Music className={`w-3.5 h-3.5 ${isTestingSuno ? 'animate-spin' : ''}`} />
              <span>{isTestingSuno ? 'Génération Suno en cours...' : 'Tester Suno v6 (MP3 Stéréo)'}</span>
            </button>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">MOTEUR MUSICAL</span>
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-extrabold text-white">Suno v6 (SunoAPI)</span>
            </div>
            <span className="text-[10px] text-purple-300 mt-1 block">Modèle Haute Fidélité V6</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">PAROLES & PROMPT</span>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-extrabold text-white">Mode A & Mode B</span>
            </div>
            <span className="text-[10px] text-blue-300 mt-1 block">Simple & Custom Personnalisé</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">QUALITÉ AUDIO</span>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-extrabold text-white">Audio MP3 Stéréo</span>
            </div>
            <span className="text-[10px] text-emerald-300 mt-1 block">Master 320 kbps Stéréo</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">SÉCURITÉ DU BACKEND</span>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-extrabold text-white">API Protégée</span>
            </div>
            <span className="text-[10px] text-purple-300 mt-1 block">Proxy Node.js Sécurisé</span>
          </div>
        </div>

        {/* Live Test Diagnostic Output */}
        {testError && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold block">Erreur lors de l'exécution du test :</span>
              <span className="font-mono">{testError}</span>
            </div>
          </div>
        )}

        {testResult && (
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Test d'intégration SunoAPI réussi avec succès !
              </span>
              <span className="text-[10px] font-mono text-purple-400 font-bold">
                {testResult.model || 'Suno v6 (SunoAPI)'}
              </span>
            </div>

            {testResult.audioUrl && (
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    <Music className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Audio Synthétisé (Suno v6 MP3)
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Durée: {Math.round(testResult.duration || 180)}s • MP3 Stéréo
                    </span>
                  </div>
                </div>

                <audio controls src={testResult.audioUrl} className="h-9 w-full sm:w-64" />
              </div>
            )}

            <pre className="text-[11px] font-mono text-slate-300 bg-slate-950 p-3 rounded-xl overflow-x-auto max-h-40">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* SECTION 2: SASPAY WEBHOOK SIMULATOR */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Simulateur de Webhook SASPAY
            </h3>
            <p className="text-xs text-slate-500">
              Testez la réception des notifications de paiement SASPAY en temps réel et vérifiez l'incrémentation instantanée du solde de chansons.
            </p>
          </div>
        </div>

        <form onSubmit={handleSimulateWebhook} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">ID Utilisateur Cible</label>
            <input
              type="text"
              value={testUserId}
              onChange={(e) => setTestUserId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Formule / Pack</label>
            <select
              value={testPlanId}
              onChange={(e) => {
                const p = e.target.value as PlanId;
                setTestPlanId(p);
                setTestAmount(p === 'starter' ? 2.45 : p === 'creator' ? 4.60 : p === 'pro' ? 6.60 : p === 'studio' ? 8.60 : 10.00);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
            >
              <option value="starter">Pack Starter (2 chansons - $2.45)</option>
              <option value="creator">Pack Creator (4 chansons - $4.60)</option>
              <option value="pro">Pack Pro (6 chansons - $6.60)</option>
              <option value="studio">Pack Studio (8 chansons - $8.60)</option>
              <option value="master_vip">Pack Master VIP (10 chansons - $10.00)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Moyen de Paiement</label>
            <select
              value={testMethod}
              onChange={(e) => setTestMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
            >
              <option value="orange_money">Orange Money</option>
              <option value="mtn_momo">MTN Mobile Money</option>
              <option value="wave">Wave Mobile</option>
              <option value="card">Carte Bancaire Visa / Mastercard</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Statut Transaction</label>
            <select
              value={testStatus}
              onChange={(e) => setTestStatus(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
            >
              <option value="SUCCESS">SUCCESS (Paiement Validé)</option>
              <option value="FAILED">FAILED (Échec de Paiement)</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Référence Unique Transaction (Anti-double débit)
            </label>
            <input
              type="text"
              value={testReference}
              onChange={(e) => setTestReference(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSimulating}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isSimulating ? 'Émission webhook...' : 'Simuler Webhook SASPAY'}</span>
            </button>
          </div>
        </form>

        {simResult && (
          <div
            className={`p-4 rounded-2xl text-xs border ${
              simResult.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {simResult.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              )}
              <span>
                {simResult.ok
                  ? 'Webhook SASPAY traité et validé avec succès par le serveur !'
                  : 'Échec du traitement du webhook.'}
              </span>
            </div>
            <pre className="font-mono text-[10px] overflow-x-auto mt-2 bg-white/70 p-2.5 rounded-xl border border-slate-200">
              {JSON.stringify(simResult.data || simResult.error, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* SECTION 3: REAL-TIME AUDIT LOGS */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Journal d'Audit Système & Sécurité
              </h3>
              <p className="text-[11px] text-slate-400">
                Traçabilité des paiements SASPAY, générations IA et changements de statut.
              </p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrer les logs..."
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="pl-7 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
            >
              <option value="all">Tous les événements</option>
              <option value="payment_success">Paiement validé</option>
              <option value="song_balance_updated">Solde mis à jour</option>
              <option value="webhook_verified">Webhook vérifié</option>
              <option value="saas_settings_updated">Paramètres SaaS modifiés</option>
              <option value="user_status_changed">Statut utilisateur modifié</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase sticky top-0">
              <tr>
                <th className="py-2.5 px-4">Date / Heure</th>
                <th className="py-2.5 px-4">Événement</th>
                <th className="py-2.5 px-4">Utilisateur</th>
                <th className="py-2.5 px-4">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 font-sans">
                    Aucun événement correspondant aux critères.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold">
                        {l.event}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-slate-600 font-semibold">
                      {l.user_id || 'Système'}
                    </td>
                    <td className="py-2 px-4 text-slate-500 truncate max-w-xs">
                      <button
                        type="button"
                        onClick={() => setViewingLogDetails(l)}
                        className="text-left hover:text-blue-600 truncate block w-full cursor-pointer"
                      >
                        {JSON.stringify(l.details)}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Details Modal */}
      {viewingLogDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-mono font-bold text-purple-700">
                Événement : {viewingLogDetails.event}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {new Date(viewingLogDetails.timestamp).toLocaleString()}
              </span>
            </div>
            <pre className="text-xs font-mono bg-slate-900 text-slate-100 p-4 rounded-2xl overflow-x-auto max-h-60">
              {JSON.stringify(viewingLogDetails, null, 2)}
            </pre>
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setViewingLogDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
