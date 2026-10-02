import React, { useState } from 'react';
import {
  User as UserIcon,
  Music,
  Heart,
  Users,
  CheckCircle2,
  Edit3,
  Share2,
  CreditCard,
} from 'lucide-react';
import { User, UserSongBalance, Song } from '../types';
import { SongCard } from '../components/SongCard';

interface ProfileViewProps {
  user: User | null;
  balance: UserSongBalance | null;
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onOpenStudio: (song: Song) => void;
  navigate: (route: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  balance,
  songs,
  currentSong,
  isPlaying,
  onPlaySong,
  onOpenStudio,
  navigate,
}) => {
  const [activeTab, setActiveTab] = useState<'creations' | 'liked'>('creations');

  const creatorSongs = songs.filter((s) => s.creator_id === user?.id || s.creator_id === 'user-default-1');

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-28">
      {/* Profile Header Banner */}
      <div className="relative rounded-3xl bg-radial from-[#EFF6FF] to-white border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
              alt={user?.name || 'Utilisateur'}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%232563EB"/%3E%3Ctext x="50" y="55" font-family="Arial" font-size="36" fill="white" text-anchor="middle" dominant-baseline="middle"%3EIA%3C/text%3E%3C/svg%3E';
              }}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-400 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A]">
                  {user?.name}
                </h1>
                <span className="p-1 rounded-full bg-blue-100 text-[#2563EB]" title="Créateur Certifié">
                  <CheckCircle2 className="w-4 h-4 fill-current text-[#2563EB]" />
                </span>
              </div>
              <p className="text-xs font-semibold text-[#64748B] mt-0.5">@{user?.username} • {user?.email}</p>
              <p className="text-xs text-slate-700 mt-2 max-w-md">{user?.bio}</p>

              {/* Stats badges */}
              <div className="flex items-center gap-4 mt-3 text-xs font-bold text-slate-600">
                <span>
                  <strong className="text-[#0F172A]">{creatorSongs.length}</strong> morceaux
                </span>
                <span>•</span>
                <span>
                  <strong className="text-[#2563EB]">{balance?.available_songs ?? 0}</strong> chansons dispos
                </span>
                <span>•</span>
                <span>
                  <strong className="text-[#0F172A]">{balance?.total_purchased ?? 0}</strong> achetées
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/pricing')}
              className="px-4 py-2 rounded-xl bg-[#FF7A00] text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Acheter des chansons</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('creations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'creations'
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Morceaux Publiés ({creatorSongs.length})
        </button>
        <button
          onClick={() => setActiveTab('liked')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'liked'
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Favoris
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {creatorSongs.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            isPlaying={isPlaying && currentSong?.id === song.id}
            onPlay={onPlaySong}
            onOpenStudio={onOpenStudio}
          />
        ))}
      </div>
    </div>
  );
};
