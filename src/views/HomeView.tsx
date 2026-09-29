import React from 'react';
import {
  Sparkles,
  Compass,
  ArrowRight,
  TrendingUp,
  Headphones,
  Flame,
  Music,
  CheckCircle2,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { Song, Playlist, Genre, Plan } from '../types';
import { SongCard } from '../components/SongCard';

interface HomeViewProps {
  navigate: (route: string) => void;
  songs: Song[];
  playlists: Playlist[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onSelectGenre: (genre: string) => void;
  onOpenStudio: (song: Song) => void;
  plans?: Plan[];
  onSelectPlan?: (plan: Plan) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  navigate,
  songs,
  playlists,
  currentSong,
  isPlaying,
  onPlaySong,
  onSelectGenre,
  onOpenStudio,
  plans = [],
  onSelectPlan,
}) => {
  const genres: { name: Genre; desc: string; color: string; icon: string }[] = [
    { name: 'Afrobeat', desc: 'Burna, Wizkid & Rema vibes', color: 'from-amber-500 to-orange-600', icon: '🥁' },
    { name: 'Amapiano', desc: 'Log drums & jazz piano', color: 'from-orange-500 to-amber-600', icon: '🎹' },
    { name: 'Gospel', desc: 'Chœurs célestes & foi', color: 'from-blue-600 to-indigo-700', icon: '✨' },
    { name: 'R&B', desc: 'Sensuel, doux & intime', color: 'from-purple-600 to-pink-600', icon: '🌙' },
    { name: 'Hip-Hop', desc: 'Boom-bap & trap percutant', color: 'from-slate-800 to-slate-950', icon: '🎤' },
    { name: 'Pop', desc: 'Mélodies solaires & radio', color: 'from-pink-500 to-rose-600', icon: '⭐' },
    { name: 'Dance', desc: 'Drops énergiques & club', color: 'from-cyan-500 to-blue-600', icon: '⚡' },
    { name: 'Reggae', desc: 'Vibrations positives & dub', color: 'from-emerald-600 to-green-700', icon: '🌴' },
    { name: 'Drill', desc: 'Gliding 808s sombres & flow', color: 'from-neutral-700 to-neutral-900', icon: '🔥' },
    { name: 'Cinematic', desc: 'Orchestral grandiose & épique', color: 'from-blue-800 to-slate-900', icon: '🎬' },
    { name: 'Lo-fi', desc: 'Chill, pluie & nostalgie', color: 'from-indigo-400 to-purple-500', icon: '☕' },
    { name: 'Jazz', desc: 'Harmonies cuivrées & swing', color: 'from-amber-600 to-yellow-700', icon: '🎷' },
  ];

  const popularSongs = [...songs].sort((a, b) => b.plays_count - a.plays_count).slice(0, 4);
  const newSongs = [...songs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4);

  return (
    <div className="space-y-14 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-radial from-[#EFF6FF] via-white to-white border border-blue-100 p-8 sm:p-12 lg:p-16 shadow-xs">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-400/15 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-blue-200 text-[#2563EB] text-xs font-bold mb-6 shadow-xs">
            <Sparkles className="w-4 h-4 text-[#FF7A00]" />
            <span>AI Music Studio for Creators</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0F172A] tracking-tight leading-[1.1] mb-6">
            Transforme tes idées en <span className="text-[#FF7A00]">chansons</span>.
          </h1>

          <p className="text-lg sm:text-xl text-[#64748B] font-normal leading-relaxed mb-8 max-w-2xl">
            Décris simplement la musique que tu imagines. Notre studio IA transforme ton idée en une véritable création musicale.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate('/create')}
              className="px-7 py-3.5 rounded-xl bg-[#FF7A00] hover:bg-[#e66e00] text-white font-extrabold text-base tracking-wide shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              <span>Créer une chanson</span>
            </button>

            <button
              onClick={() => navigate('/discover')}
              className="px-7 py-3.5 rounded-xl bg-white hover:bg-blue-50/50 text-[#2563EB] border-2 border-[#2563EB] font-bold text-base transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Compass className="w-5 h-5" />
              <span>Découvrir</span>
            </button>
          </div>

          {/* Value props */}
          <div className="mt-10 pt-8 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
              <span>1 chanson master par génération</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#FF7A00]" />
              <span>Studio multitrack & stems</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
              <span>Packs flexibles dès $2.45 via SASPAY</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. QUE VEUX-TU CRÉER AUJOURD'HUI ? (12 Cards) */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Que veux-tu créer aujourd'hui ?
            </h2>
            <p className="text-sm text-[#64748B] mt-1">
              Choisis ton univers sonore favori pour composer instantanément.
            </p>
          </div>
          <button
            onClick={() => navigate('/templates')}
            className="hidden sm:flex items-center gap-1 text-sm font-bold text-[#2563EB] hover:text-blue-700"
          >
            <span>Voir les 16 templates</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {genres.map((g) => (
            <button
              key={g.name}
              onClick={() => {
                onSelectGenre(g.name);
                navigate('/create');
              }}
              className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#FF7A00] hover:shadow-lg transition-all text-left flex flex-col justify-between group cursor-pointer"
            >
              <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">
                {g.icon}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#0F172A] group-hover:text-[#FF7A00] transition-colors">
                  {g.name}
                </h3>
                <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                  {g.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. CRÉATIONS POPULAIRES */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-100 text-[#FF7A00]">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                Créations populaires
              </h2>
              <p className="text-xs text-[#64748B]">Les morceaux les plus écoutés créés avec l'IA</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/discover')}
            className="text-sm font-bold text-[#2563EB] hover:text-blue-700 flex items-center gap-1"
          >
            <span>Explorer tout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {popularSongs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              isPlaying={isPlaying && currentSong?.id === song.id}
              onPlay={onPlaySong}
              onOpenStudio={onOpenStudio}
            />
          ))}
        </div>
      </section>

      {/* 4. NOUVEAUTÉS */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-[#2563EB]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                Nouveautés du studio
              </h2>
              <p className="text-xs text-[#64748B]">Chansons fraîchement finalisées par la communauté</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/discover')}
            className="text-sm font-bold text-[#2563EB] hover:text-blue-700 flex items-center gap-1"
          >
            <span>Voir plus</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {newSongs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              isPlaying={isPlaying && currentSong?.id === song.id}
              onPlay={onPlaySong}
              onOpenStudio={onOpenStudio}
            />
          ))}
        </div>
      </section>

      {/* 5. PLAYLISTS & CRÉATEURS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Playlists card */}
        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-[#2563EB]" />
              <h3 className="font-extrabold text-lg text-[#0F172A]">Playlists Officielles</h3>
            </div>
            <button
              onClick={() => navigate('/playlists')}
              className="text-xs font-bold text-[#2563EB]"
            >
              Gérer
            </button>
          </div>
          <div className="space-y-3">
            {playlists.slice(0, 2).map((pl) => (
              <div
                key={pl.id}
                onClick={() => navigate('/playlists')}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer"
              >
                <img
                  src={pl.cover_url}
                  alt={pl.title}
                  className="w-14 h-14 rounded-xl object-cover"
                />
                <div className="truncate flex-1">
                  <h4 className="font-bold text-sm text-[#0F172A] truncate">{pl.title}</h4>
                  <p className="text-xs text-[#64748B] truncate">{pl.description}</p>
                  <span className="text-[11px] font-semibold text-[#2563EB]">
                    {pl.songs.length} morceaux
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Creator spotlight card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#EFF6FF] to-white border border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#FF7A00]" />
            <h3 className="font-extrabold text-lg text-[#0F172A]">Espace Créateurs & Droits</h3>
          </div>
          <p className="text-sm text-[#64748B] mb-5">
            Sur <strong>SITDOWORLD AI MUSIC</strong>, vous détenez les droits de création sur vos morceaux. Exportez les stems complets, remixez vos tracks dans le Studio multitrack et téléchargez vos WAV.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/create')}
              className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              Ouvrir le Studio
            </button>
            <button
              onClick={() => navigate('/voices')}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-300 font-bold text-xs cursor-pointer"
            >
              Sitdoworld Voice
            </button>
          </div>
        </div>
      </section>

      {/* 6. SECTION TARIFS & PACKS DE CHANSONS (Visibilité Complète sous la Page d'Accueil) */}
      <section className="pt-8 border-t border-slate-200/90 space-y-8" id="tarifs-accueil">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-[#FF7A00] text-xs font-black shadow-xs">
            <Sparkles className="w-4 h-4" />
            <span>GRILLE TARIFAIRE OFFICIELLE • PAIEMENT MOBILE MONEY DIRECT</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] tracking-tight">
            Tarifs simples et transparents. <span className="text-[#FF7A00]">Pas d'abonnement forcé</span>.
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            Achetez uniquement les chansons dont vous avez besoin. Vos crédits n'expirent jamais. Règlement instantané par <strong>Mobile Money</strong> (Orange Money, MTN MoMo, Wave, Vodacom M-Pesa, Airtel) ou Carte bancaire via SASPAY.ME.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {(plans && plans.length > 0 ? plans : [
            { id: 'starter', name: 'Pack Découverte', songs: 5, price: 2.45, currency: 'USD', popular: false, active: true },
            { id: 'creator', name: 'Pack Créateur', songs: 10, price: 4.90, currency: 'USD', popular: true, active: true },
            { id: 'pro', name: 'Pack Studio Pro', songs: 25, price: 9.80, currency: 'USD', popular: false, active: true },
            { id: 'master', name: 'Pack Élite Label', songs: 60, price: 19.50, currency: 'USD', popular: false, active: true },
            { id: 'mega', name: 'Pack Ultra Hit', songs: 150, price: 39.00, currency: 'USD', popular: false, active: true },
          ] as Plan[]).map((plan) => {
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

                  {/* Price */}
                  <div className="mb-5 pb-5 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-[#0F172A]">${plan.price.toFixed(2)}</span>
                      <span className="text-xs font-semibold text-[#64748B]">USD unique</span>
                    </div>
                    <p className="text-xs font-bold text-[#FF7A00] mt-1">
                      {plan.songs} chansons complètes master
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Soit ${(plan.price / plan.songs).toFixed(2)} / chanson
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6 text-xs text-slate-700">
                    <div className="flex items-center gap-2 font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Crédits valables à vie sans expiration</span>
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
                      <span>Accès Studio multitrack & stems</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                      <span>Droits commerciaux inclus</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => (onSelectPlan ? onSelectPlan(plan) : navigate('/pricing'))}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 ${
                    isPopular
                      ? 'bg-[#FF7A00] hover:bg-[#e66e00] text-white shadow-orange-500/25'
                      : 'bg-[#2563EB] hover:bg-blue-700 text-white shadow-blue-500/20'
                  }`}
                  id={`home-plan-btn-${plan.id}`}
                >
                  <span>Acheter {plan.songs} chansons</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Mobile Money Operators Trust Banner */}
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-[#0F172A]">
                Paiement Sécurisé Mobile Money & Cartes via SASPAY.ME
              </h4>
              <p className="text-xs text-slate-500">
                Orange Money, MTN Mobile Money, Wave, Vodacom M-Pesa, Airtel Money, Moov, Visa, Mastercard.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#2563EB]">
            <span>Validation directe par code PIN sur votre mobile</span>
          </div>
        </div>
      </section>
    </div>
  );
};
