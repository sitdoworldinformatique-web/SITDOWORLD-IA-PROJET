import React, { useState } from 'react';
import {
  Users,
  Search,
  Crown,
  ShieldCheck,
  UserCheck,
  UserX,
  PlusCircle,
  MinusCircle,
  Sparkles,
  Music,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  UserPlus,
  ShieldAlert,
  X,
} from 'lucide-react';
import { User, UserSongBalance } from '../../types';

interface UserWithBalance extends User {
  balance?: UserSongBalance;
}

interface SaaSUsersTabProps {
  users: UserWithBalance[];
  currentUser?: User | null;
  onAdjustBalance: (userId: string, amount: number, reason: string) => Promise<boolean>;
  onUpdateUser: (userId: string, updates: Partial<User>) => Promise<boolean>;
  onAddAdmin?: (email: string, name?: string) => Promise<boolean>;
  onRemoveAdmin?: (userId: string) => Promise<boolean>;
  onRefresh: () => void;
}

export const SaaSUsersTab: React.FC<SaaSUsersTabProps> = ({
  users,
  currentUser,
  onAdjustBalance,
  onUpdateUser,
  onAddAdmin,
  onRemoveAdmin,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'vip' | 'admins'>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithBalance | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(5);
  const [adjustReason, setAdjustReason] = useState<string>('Bonus de fidélité créateur');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [toast, setToast] = useState<{ text: string; isError?: boolean } | null>(null);
  const [adminToRevoke, setAdminToRevoke] = useState<UserWithBalance | null>(null);

  const showToast = (text: string, isError = false) => {
    setToast({ text, isError });
    setTimeout(() => setToast(null), 3500);
  };

  // Add Admin Modal State
  const [addAdminModalOpen, setAddAdminModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  const isOwner = currentUser?.role === 'owner';

  const administrators = users.filter((u) => u.role === 'admin' || u.role === 'owner');

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'active') return u.status !== 'suspended';
    if (statusFilter === 'suspended') return u.status === 'suspended';
    if (statusFilter === 'vip') return !!u.is_vip;
    if (statusFilter === 'admins') return u.role === 'admin' || u.role === 'owner';

    return true;
  });

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsAdjusting(true);
    const success = await onAdjustBalance(selectedUser.id, adjustAmount, adjustReason);
    setIsAdjusting(false);
    if (success) {
      showToast(
        `Solde mis à jour pour ${selectedUser.name} : ${adjustAmount > 0 ? '+' : ''}${adjustAmount} chansons.`
      );
      setSelectedUser(null);
    }
  };

  const toggleUserStatus = async (user: UserWithBalance) => {
    if (user.role === 'owner') {
      showToast('Impossible de suspendre le propriétaire principal.', true);
      return;
    }
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    const ok = await onUpdateUser(user.id, { status: newStatus });
    if (ok) {
      showToast(`Statut de ${user.name} modifié : ${newStatus === 'active' ? 'Activé' : 'Suspendu'}`);
    }
  };

  const toggleVipStatus = async (user: UserWithBalance) => {
    const newVip = !user.is_vip;
    const ok = await onUpdateUser(user.id, { is_vip: newVip });
    if (ok) {
      showToast(`${user.name} ${newVip ? 'est désormais Client VIP ⭐' : 'retiré du statut VIP'}`);
    }
  };

  const handleRoleChange = async (user: UserWithBalance, newRole: 'admin' | 'creator' | 'user') => {
    if (!isOwner) {
      showToast('Seul le propriétaire du SaaS peut modifier les rôles.', true);
      return;
    }
    if (user.role === 'owner') {
      showToast('Impossible de modifier le rôle du propriétaire principal.', true);
      return;
    }
    const ok = await onUpdateUser(user.id, { role: newRole });
    if (ok) {
      showToast(`Rôle de ${user.name} passé à : ${newRole}`);
    }
  };

  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
      showToast('Veuillez saisir une adresse email valide.', true);
      return;
    }
    if (!onAddAdmin) return;

    setIsAddingAdmin(true);
    const ok = await onAddAdmin(newAdminEmail.trim(), newAdminName.trim());
    setIsAddingAdmin(false);
    if (ok) {
      setNewAdminEmail('');
      setNewAdminName('');
      setAddAdminModalOpen(false);
    }
  };

  const confirmRevokeAdmin = async () => {
    if (!adminToRevoke) return;
    if (!isOwner) {
      showToast('Seul le propriétaire du SaaS peut révoquer un administrateur.', true);
      setAdminToRevoke(null);
      return;
    }
    if (adminToRevoke.role === 'owner') {
      showToast('Impossible de révoquer le propriétaire principal.', true);
      setAdminToRevoke(null);
      return;
    }
    if (onRemoveAdmin) {
      await onRemoveAdmin(adminToRevoke.id);
    } else {
      await onUpdateUser(adminToRevoke.id, { role: 'creator' });
    }
    showToast(`Droits administrateur retirés à ${adminToRevoke.name}.`);
    setAdminToRevoke(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. ADMINISTRATION TEAM & ROLES SECTION (Step 4) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>GESTION PRIVÉE DES ACCÈS & RÔLES</span>
            </div>
            <h3 className="text-lg font-black text-[#0F172A]">
              Équipe d'Administration du SaaS
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Les administrateurs sont nommés exclusivement depuis cette interface par le propriétaire.
            </p>
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={() => setAddAdminModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto transition-all active:scale-98"
              id="admin-add-administrator-btn"
            >
              <UserPlus className="w-4 h-4" />
              <span>Ajouter un Administrateur</span>
            </button>
          )}
        </div>

        {/* Administrators Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {administrators.map((admin) => {
            const isTargetOwner = admin.role === 'owner';
            return (
              <div
                key={admin.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                  isTargetOwner
                    ? 'bg-amber-50/60 border-amber-200 shadow-xs'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={admin.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${admin.id}`}
                    alt={admin.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-300 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-slate-900 truncate">
                        {admin.name}
                      </span>
                      {isTargetOwner ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-700" />
                          <span>Propriétaire</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-wider shrink-0">
                          Admin
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono truncate block mt-0.5">
                      {admin.email}
                    </span>
                  </div>
                </div>

                {isOwner && !isTargetOwner && (
                  <button
                    type="button"
                    onClick={() => setAdminToRevoke(admin)}
                    title="Retirer les droits administrateur"
                    className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold cursor-pointer transition-colors shrink-0"
                  >
                    Révoquer
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {!isOwner && (
          <p className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
            ℹ️ Vous êtes connecté en tant qu'administrateur autorisé. Seul le compte propriétaire principal peut nommer ou révoquer d'autres administrateurs.
          </p>
        )}
      </div>

      {/* 2. TOP FILTER & SEARCH BAR */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Quick Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `Tous (${users.length})` },
            { id: 'admins', label: `Équipe Admin (${administrators.length})` },
            { id: 'active', label: `Actifs (${users.filter((u) => u.status !== 'suspended').length})` },
            { id: 'vip', label: `VIP ⭐ (${users.filter((u) => u.is_vip).length})` },
            { id: 'suspended', label: `Suspendus (${users.filter((u) => u.status === 'suspended').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 animate-in fade-in ${
            toast.isError
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {toast.isError ? (
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* 3. USERS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Utilisateur / Client</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4">Rôle</th>
                <th className="py-3.5 px-4">VIP</th>
                <th className="py-3.5 px-4">Solde Chansons</th>
                <th className="py-3.5 px-4">Générations</th>
                <th className="py-3.5 px-5 text-right">Actions Administrateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Aucun utilisateur correspondant à votre recherche.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const available = u.balance?.available_songs ?? 0;
                  const totalGen = u.balance?.total_generated ?? 0;
                  const isSuspended = u.status === 'suspended';
                  const isUserOwner = u.role === 'owner';

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSuspended ? 'bg-rose-50/30 opacity-75' : ''
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              u.avatar_url ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`
                            }
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-extrabold text-slate-900 block flex items-center gap-1.5">
                              {u.name}
                              {u.is_vip && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.5 rounded-sm">
                                  VIP
                                </span>
                              )}
                              {isUserOwner && (
                                <span className="bg-amber-200 text-amber-900 text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase">
                                  Propriétaire
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            isSuspended
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSuspended ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                          />
                          {isSuspended ? 'Suspendu' : 'Actif'}
                        </span>
                      </td>

                      {/* Role Selector / Badge */}
                      <td className="py-3.5 px-4">
                        {isUserOwner ? (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
                            Propriétaire
                          </span>
                        ) : isOwner ? (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u, e.target.value as any)}
                            className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="creator">Créateur</option>
                            <option value="admin">Administrateur</option>
                            <option value="user">Utilisateur</option>
                          </select>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold uppercase">
                            {u.role}
                          </span>
                        )}
                      </td>

                      {/* VIP Toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => toggleVipStatus(u)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                            u.is_vip
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          <Crown className="w-3.5 h-3.5" />
                          <span>{u.is_vip ? 'VIP Actif' : 'Standard'}</span>
                        </button>
                      </td>

                      {/* Song Balance */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-900 font-mono text-sm">
                            {available}
                          </span>
                          <span className="text-slate-400 text-[11px]">chanson{available > 1 ? 's' : ''}</span>
                        </div>
                      </td>

                      {/* Total Generated */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-slate-600 font-semibold">{totalGen} créées</span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(u);
                            setAdjustAmount(5);
                            setAdjustReason('Crédit accordé par l’administration');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-[#2563EB] hover:bg-blue-100 text-xs font-bold cursor-pointer transition-colors"
                          title="Ajuster le solde de chansons"
                        >
                          + Crédits
                        </button>

                        {!isUserOwner && (
                          <button
                            type="button"
                            onClick={() => toggleUserStatus(u)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                              isSuspended
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            }`}
                          >
                            {isSuspended ? 'Réactiver' : 'Suspendre'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD ADMINISTRATOR (Owner Only) */}
      {addAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-700 font-black text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>Nommer un Administrateur</span>
              </div>
              <button
                type="button"
                onClick={() => setAddAdminModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Saisissez l'adresse email de l'utilisateur à nommer administrateur. Cet utilisateur aura accès au tableau de bord administrateur (gestion du catalogue, des paiements, des utilisateurs et du suivi technique).
            </p>

            <form onSubmit={handleCreateAdminSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-900">
                  Adresse email du compte
                </label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin.collaborateur@domaine.com"
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-900">
                  Nom d'affichage (optionnel)
                </label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Ex: Marc Dubois (Admin Studio)"
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Cet administrateur ne pourra pas modifier les accès du propriétaire ni supprimer l'administrateur principal.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddAdminModalOpen(false)}
                  className="py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isAddingAdmin || !newAdminEmail.trim()}
                  className="py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black shadow-md cursor-pointer transition-all"
                >
                  {isAddingAdmin ? 'Nomination...' : 'Confirmer la nomination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADJUST USER BALANCE */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600 font-black text-sm">
                <Sparkles className="w-5 h-5" />
                <span>Ajuster Solde de Chansons</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p className="font-extrabold text-slate-900">{selectedUser.name}</p>
              <p className="text-slate-500 font-mono text-[11px]">{selectedUser.email}</p>
              <p className="text-orange-600 font-bold pt-1">
                Solde actuel : {selectedUser.balance?.available_songs ?? 0} chansons
              </p>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-900">
                  Nombre de chansons à créditer ou déduire
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[2, 5, 10, -1].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAdjustAmount(amt)}
                      className={`py-1.5 rounded-lg text-xs font-black border transition-colors cursor-pointer ${
                        adjustAmount === amt
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {amt > 0 ? `+${amt}` : amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-900">
                  Motif de l'ajustement
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ex: Geste commercial, régularisation, bonus"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="py-3 rounded-xl bg-[#FF7A00] hover:bg-[#e66e00] disabled:opacity-50 text-white text-xs font-black shadow-md cursor-pointer transition-all"
                >
                  {isAdjusting ? 'Enregistrement...' : 'Valider le solde'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Admin Confirmation Modal */}
      {adminToRevoke && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Révoquer les droits administrateur
                </h3>
                <p className="text-xs text-slate-500">
                  Cette action retirera l'accès au tableau de bord.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              Êtes-vous sûr de vouloir retirer les permissions d'administration accordées à{' '}
              <strong className="text-slate-900">{adminToRevoke.name}</strong> (
              <span className="font-mono text-slate-700">{adminToRevoke.email}</span>) ?
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setAdminToRevoke(null)}
                className="py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmRevokeAdmin}
                className="py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-98"
              >
                Confirmer la révocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
