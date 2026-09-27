import React, { useState } from 'react';
import {
  Layers,
  Save,
  CheckCircle2,
  Sparkles,
  DollarSign,
  Music,
  Star,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react';
import { Plan } from '../../types';

interface SaaSPlansTabProps {
  plans: Plan[];
  onUpdatePlan: (planId: string, updates: Partial<Plan>) => Promise<boolean>;
  onRefresh: () => void;
}

export const SaaSPlansTab: React.FC<SaaSPlansTabProps> = ({
  plans,
  onUpdatePlan,
  onRefresh,
}) => {
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<Partial<Plan>>({});
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const startEdit = (p: Plan) => {
    setEditingPlanId(p.id);
    setPlanForm({
      price: p.price,
      songs: p.songs,
      name: p.name,
      active: p.active !== false,
      popular: !!p.popular,
    });
  };

  const handleSave = async (planId: string) => {
    setSavingPlanId(planId);
    const ok = await onUpdatePlan(planId, planForm);
    setSavingPlanId(null);
    if (ok) {
      setToastMessage(`Plan ${planForm.name || planId} mis à jour avec succès !`);
      setEditingPlanId(null);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
              Grille Tarifaire SaaS
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Packs de Chansons & Abonnements
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ajustez le prix en USD, le volume de chansons attribué et la mise en avant des formules sur la page d'achat.
          </p>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((p) => {
          const isEditing = editingPlanId === p.id;
          const currentPrice = isEditing ? (planForm.price ?? p.price) : p.price;
          const currentSongs = isEditing ? (planForm.songs ?? p.songs) : p.songs;
          const currentName = isEditing ? (planForm.name ?? p.name) : p.name;
          const currentPopular = isEditing ? (planForm.popular ?? !!p.popular) : !!p.popular;
          const currentActive = isEditing ? (planForm.active ?? (p.active !== false)) : (p.active !== false);

          const unitPrice = currentSongs > 0 ? (currentPrice / currentSongs).toFixed(2) : '0.00';

          return (
            <div
              key={p.id}
              className={`bg-white rounded-3xl p-6 border transition-all relative flex flex-col justify-between ${
                currentPopular
                  ? 'border-orange-500 shadow-md ring-2 ring-orange-500/10'
                  : 'border-slate-200/90 shadow-xs'
              } ${!currentActive ? 'opacity-60 bg-slate-50' : ''}`}
            >
              {currentPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <Star className="w-3 h-3 fill-white" />
                  <span>Recommandé</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    ID: {p.id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {currentActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                {isEditing ? (
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        Nom de l'offre
                      </label>
                      <input
                        type="text"
                        value={currentName}
                        onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">
                          Prix ($)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={currentPrice}
                          onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">
                          Chansons
                        </label>
                        <input
                          type="number"
                          value={currentSongs}
                          onChange={(e) => setPlanForm({ ...planForm, songs: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2">
                      <span className="font-semibold text-slate-700 text-[11px]">Badge Populaire</span>
                      <input
                        type="checkbox"
                        checked={currentPopular}
                        onChange={(e) => setPlanForm({ ...planForm, popular: e.target.checked })}
                        className="w-4 h-4 accent-orange-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 text-[11px]">Pack Disponible</span>
                      <input
                        type="checkbox"
                        checked={currentActive}
                        onChange={(e) => setPlanForm({ ...planForm, active: e.target.checked })}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-black text-slate-900 mb-1">{p.name}</h3>
                    <div className="flex items-baseline gap-1 my-3">
                      <span className="text-3xl font-black text-slate-900">${p.price}</span>
                      <span className="text-xs text-slate-400 font-semibold">USD</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-4 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Volume inclus :</span>
                        <span className="font-black text-slate-900 font-mono">
                          {p.songs} morceaux
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Coût unitaire :</span>
                        <span className="font-semibold text-emerald-600 font-mono">
                          ${unitPrice} / chanson
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditingPlanId(null)}
                      className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={savingPlanId === p.id}
                      onClick={() => handleSave(p.id)}
                      className="flex-1 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      {savingPlanId === p.id ? 'Sauvegarde...' : 'Valider'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Modifier ce Pack
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
