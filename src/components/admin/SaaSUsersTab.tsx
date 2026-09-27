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
} from 'lucide-react';
import { User, UserSongBalance } from '../../types';

interface UserWithBalance extends User {
  balance?: UserSongBalance;
}

interface SaaSUsersTabProps {
  users: UserWithBalance[];
  onAdjustBalance: (userId: string, amount: number, reason: string) => Promise<boolean>;
  onUpdateUser: (userId: string, updates: Partial<User>) => Promise<boolean>;
  onRefresh: () => void;
}

export const SaaSUsersTab: React.FC<SaaSUsersTabProps> = ({
  users,
  onAdjustBalance,
  onUpdateUser,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'vip'>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithBalance | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(5);
  const [adjustReason, setAdjustReason] = useState<string>('Bonus de fidélité créateur');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'active') return u.status !== 'suspended';
    if (statusFilter === 'suspended') return u.status === 'suspended';
    if (statusFilter === 'vip') return !!u.is_vip;

    return true;
  });

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsAdjusting(true);
    const success = await onAdjustBalance(selectedUser.id, adjustAmount, adjustReason);
    setIsAdjusting(false);
    if (success) {
      setToastMessage(
        `Solde mis à jour pour ${selectedUser.name} : ${adjustAmount > 0 ? '+' : ''}${adjustAmount} chansons.`
      );
      setSelectedUser(null);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const toggleUserStatus = async (user: UserWithBalance) => {
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    const ok = await onUpdateUser(user.id, { status: newStatus });
    if (ok) {
      setToastMessage(`Statut de ${user.name} modifié : ${newStatus === 'active' ? 'Activé' : 'Suspendu'}`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const toggleVipStatus = async (user: UserWithBalance) => {
    const newVip = !user.is_vip;
    const ok = await onUpdateUser(user.id, { is_vip: newVip });
    if (ok) {
      setToastMessage(`${user.name} ${newVip ? 'est désormais Client VIP ⭐' : 'retiré du statut VIP'}`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleRoleChange = async (user: UserWithBalance, newRole: 'admin' | 'creator' | 'user') => {
    const ok = await onUpdateUser(user.id, { role: newRole });
    if (ok) {
      setToastMessage(`Rôle de ${user.name} passé à : ${newRole}`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
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
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Users Table */}
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
                  const available = u.balance?.available_songs ?? 2;
                  const totalGen = u.balance?.total_generated ?? 0;
                  const isSuspended = u.status === 'suspended';

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

                      {/* Role Selector */}
                      <td className="py-3.5 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value as any)}
                          className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="user">Utilisateur</option>
                          <option value="creator">Créateur</option>
                          <option value="admin">Administrateur</option>
                        </select>
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
                        <span className="font-mono text-slate-600">{totalGen} créées</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setAdjustAmount(5);
                              setAdjustReason('Crédit accordé par l’administration');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Ajuster le solde de chansons"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Ajuster Solde</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleUserStatus(u)}
                            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                              isSuspended
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            }`}
                            title={isSuspended ? 'Réactiver le compte' : 'Suspendre le compte'}
                          >
                            {isSuspended ? (
                              <UserCheck className="w-4 h-4" />
                            ) : (
                              <UserX className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Balance Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAdjustSubmit}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900">
                  Ajuster le solde de chansons
                </h4>
                <p className="text-xs text-slate-500">
                  Client : <span className="font-bold text-slate-800">{selectedUser.name}</span> ({selectedUser.email})
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs flex justify-between items-center">
              <span className="text-slate-500 font-medium">Solde actuel disponible :</span>
              <span className="font-black text-slate-900 font-mono text-sm">
                {selectedUser.balance?.available_songs ?? 2} chansons
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantité de chansons (+ pour ajouter, - pour déduire)
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[1, 5, 10, 20].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAdjustAmount(n)}
                    className={`py-1.5 rounded-xl text-xs font-bold border ${
                      adjustAmount === n
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    +{n}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motif de l'ajustement (visible dans l'audit)
              </label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                placeholder="Ex: Geste commercial, régularisation SASPAY..."
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isAdjusting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                {isAdjusting ? 'Mise à jour...' : 'Appliquer l’ajustement'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
