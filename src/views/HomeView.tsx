import React from 'react';
import {
  Sparkles,
  Compass,
  ArrowRight,
  TrendingUp,
  Headphones,
  Flame,
  CheckCircle2,
  Users,
  ShieldCheck,
  CreditCard,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { Song, Playlist, Genre } from '../types';
import { SongCard } from '../components/SongCard';

interface HomeViewProps {
  navigate: (route: string) => void;
  songs: Song[];
  playlists: Playlist[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onSelectGenre?: (genre: string) => void;
  onOpenStudio?: (song: Song) => void;
  hasActivePack?: boolean;
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
  hasActivePack = false,
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

  const goToTarifs = () => {
    navigate('/tarifs');
  };

  const handleGenreClick = (genreName: string) => {
    if (hasActivePack) {
      if (onSelectGenre) onSelectGenre(genreName);
      navigate('/create');
    } else {
      goToTarifs();
    }
  };

  return (
    <div className="space-y-16 pb-24">
      {/* 1. HERO SECTION (Vitrine Commerciale & Présentation - Pas de cartes de prix ici) */}
      <section className="relative overflow-hidden rounded-3xl bg-radial from-[#EFF6FF] via-white to-white border border-blue-100 p-8 sm:p-12 lg:p-16 shadow-xs">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-400/15 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-blue-200 text-[#2563EB] text-xs font-bold mb-6 shadow-xs">
            <Sparkles className="w-4 h-4 text-[#FF7A00]" />
            <span>AI Music Studio for Creators • Accès par Packs Uniques</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0F172A] tracking-tight leading-[1.1] mb-6">
            Transforme tes idées en <span className="text-[#FF7A00]">chansons</span>.
          </h1>

          <p className="text-lg sm:text-xl text-[#64748B] font-normal leading-relaxed mb-8 max-w-2xl">
            Décris simplement la musique que tu imagines. Notre studio IA transforme ton idée en une véritable création musicale haute fidélité avec paroles, voix et stems multitrack.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            {hasActivePack ? (
              <button
                onClick={() => navigate('/create')}
                className="px-7 py-3.5 rounded-xl bg-[#FF7A00] hover:bg-[#e66e00] text-white font-extrabold text-base tracking-wide shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
                id="hero-create-cta"
              >
                <Sparkles className="w-5 h-5" />
                <span>Accéder au Studio de Création</span>
              </button>
            ) : (
              <button
                onClick={goToTarifs}
                className="px-7 py-3.5 rounded-xl bg-[#FF7A00] hover:bg-[#e66e00] text-white font-extrabold text-base tracking-wide shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
                id="hero-buy-pack-cta"
              >
                <CreditCard className="w-5 h-5" />
                <span>Acheter un Pack</span>
              </button>
            )}

            <button
              onClick={() => navigate('/discover')}
              className="px-7 py-3.5 rounded-xl bg-white hover:bg-blue-50/50 text-[#2563EB] border-2 border-[#2563EB] font-bold text-base transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Compass className="w-5 h-5" />
              <span>Découvrir les Morceaux</span>
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
              <span>Studio multitrack & stems isolés</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Crédits valables à vie sans expiration</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. COMMENT ÇA MARCHE ? (3 Étapes Simples) */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-xs">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-black uppercase text-[#2563EB] tracking-wider block mb-2">
            SIMPLICITÉ & TRANSPARENCE
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
            Comment fonctionne SITDOWORLD AI MUSIC ?
          </h2>
          <p className="text-sm text-[#64748B] mt-2">
            Une expérience fluide de la commande jusqu'à l'export master de votre chanson.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF7A00] font-black text-base flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="font-extrabold text-base text-[#0F172A] mb-2">
                Choisissez votre Pack
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Sélectionnez le nombre de chansons désiré sur la page officielle des tarifs. Aucun abonnement récurrent forcé. Règlement instantané par <strong>Mobile Money</strong> ou Carte bancaire via SASPAY.ME.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] font-bold text-[#FF7A00]">
              Activation instantanée après confirmation PIN
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563EB] font-black text-base flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="font-extrabold text-base text-[#0F172A] mb-2">
                Décrivez votre Morceau
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Indiquez le style (Afrobeat, Gospel, Amapiano, R&B...), vos paroles ou votre thème. Notre IA génère une composition studio originale et complète.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] font-bold text-[#2563EB]">
              1 crédit = 1 chanson master complète
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-black text-base flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="font-extrabold text-base text-[#0F172A] mb-2">
                Exportez Master & Stems
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Écoutez votre chanson, téléchargez le fichier audio haute définition et ouvrez le Studio multitrack pour exporter les stems individuels (voix, percussions, basse).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] font-bold text-emerald-700">
              Droits commerciaux d'exploitation inclus
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATALOGUE DES STYLES & UNIVERS MUSICAUX */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Catalogue des Styles & Univers Sonores
            </h2>
            <p className="text-sm text-[#64748B] mt-1">
              Explorez les univers musicaux pris en charge par notre moteur de composition IA.
            </p>
          </div>
          <button
            onClick={goToTarifs}
            className="flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:text-blue-700 bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-200 cursor-pointer self-start sm:self-auto"
          >
            <span>Acheter un pack</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {genres.map((g) => (
            <div
              key={g.name}
              onClick={() => handleGenreClick(g.name)}
              className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#FF7A00] hover:shadow-lg transition-all text-left flex flex-col justify-between group cursor-pointer"
              title={hasActivePack ? `Créer en style ${g.name}` : `Achetez un pack pour composer en ${g.name}`}
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
            </div>
          ))}
        </div>
      </section>

      {/* 4. CRÉATIONS POPULAIRES */}
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
              <p className="text-xs text-[#64748B]">Extraits de morceaux créés avec notre moteur studio</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/discover')}
            className="text-sm font-bold text-[#2563EB] hover:text-blue-700 flex items-center gap-1 cursor-pointer"
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
              onOpenStudio={hasActivePack ? onOpenStudio : undefined}
            />
          ))}
        </div>
      </section>

      {/* 5. NOUVEAUTÉS DU STUDIO */}
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
              <p className="text-xs text-[#64748B]">Chansons récemment composées par la communauté</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/discover')}
            className="text-sm font-bold text-[#2563EB] hover:text-blue-700 flex items-center gap-1 cursor-pointer"
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
              onOpenStudio={hasActivePack ? onOpenStudio : undefined}
            />
          ))}
        </div>
      </section>

      {/* 6. PLAYLISTS & PRÉSENTATION DES DROITS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Playlists card */}
        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-[#2563EB]" />
              <h3 className="font-extrabold text-lg text-[#0F172A]">Playlists Officielles</h3>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Écoute Libre
            </span>
          </div>
          <div className="space-y-3">
            {playlists.slice(0, 2).map((pl) => (
              <div
                key={pl.id}
                onClick={() => {
                  if (pl.songs && pl.songs.length > 0) {
                    onPlaySong(pl.songs[0]);
                  }
                }}
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
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#EFF6FF] to-white border border-blue-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#FF7A00]" />
              <h3 className="font-extrabold text-lg text-[#0F172A]">Studio Multitrack & Droits Commerciaux</h3>
            </div>
            <p className="text-sm text-[#64748B] mb-5 leading-relaxed">
              Sur <strong>SITDOWORLD AI MUSIC</strong>, chaque pack acheté vous confère la pleine propriété commerciale sur vos morceaux. Exportez les stems séparés (Vocals, Drums, Bass, Synth) et réarrangez vos productions dans notre studio.
            </p>
          </div>
          <div className="pt-2">
            {hasActivePack ? (
              <button
                onClick={() => navigate('/studio')}
                className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>Ouvrir mon Studio Multitrack</span>
              </button>
            ) : (
              <button
                onClick={goToTarifs}
                className="px-5 py-2.5 rounded-xl bg-[#FF7A00] hover:bg-[#e66e00] text-white font-extrabold text-xs shadow-sm cursor-pointer flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Acheter un Pack pour Débloquer le Studio</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 7. FAQ (Questions Fréquentes) */}
      <section className="rounded-3xl bg-white border border-slate-200/80 p-8 sm:p-10 space-y-6">
        <div className="max-w-2xl">
          <span className="text-xs font-black uppercase text-[#2563EB] tracking-wider block mb-1">
            FAQ & CONDITIONS DU SERVICE
          </span>
          <h2 className="text-2xl font-extrabold text-[#0F172A]">
            Questions fréquentes
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <h4 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#FF7A00] shrink-0" />
              Y a-t-il une création gratuite sans achat ?
            </h4>
            <p className="leading-relaxed">
              Non. SITDOWORLD AI MUSIC fonctionne strictement sur achat préalable d'un pack. Aucune chanson gratuite n'est proposée. Cela permet de réserver 100% de la puissance de calcul aux créateurs sérieux et de garantir une génération rapide en haute fidélité.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <h4 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#2563EB] shrink-0" />
              Mes chansons achetées ont-elles une date d'expiration ?
            </h4>
            <p className="leading-relaxed">
              Vos crédits n'expirent jamais. Que vous utilisiez vos chansons aujourd'hui, dans un mois ou dans un an, votre solde reste intégralement disponible sur votre compte.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <h4 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              Quels opérateurs Mobile Money sont acceptés ?
            </h4>
            <p className="leading-relaxed">
              Notre passerelle sécurisée SASPAY.ME prend en charge Orange Money, MTN MoMo, Wave, Vodacom M-Pesa, Airtel Money, Moov Money, ainsi que les cartes Visa et Mastercard.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <h4 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
              Quand le studio de création est-il débloqué ?
            </h4>
            <p className="leading-relaxed">
              L'accès à l'espace de création complet est accordé dès la confirmation réelle de votre paiement par l'opérateur Mobile Money avec votre code PIN ou par carte bancaire.
            </p>
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION COMMERCIAL VERS LA PAGE OFFICIELLE DES TARIFS (Zéro tableau de prix sur l'accueil) */}
      <section className="rounded-3xl bg-radial from-slate-900 via-slate-950 to-black text-white p-8 sm:p-12 text-center space-y-6 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-[#FF7A00] text-xs font-black">
            <CreditCard className="w-4 h-4" />
            <span>PAIEMENT SÉCURISÉ MOBILE MONEY VIA SASPAY.ME</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Prêt à composer vos propres morceaux ?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Consultez nos packs de chansons à la carte sur notre page officielle des tarifs. Paiement rapide et sécurisé par Mobile Money avec confirmation directe sur votre téléphone.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={goToTarifs}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FF7A00] hover:bg-[#e66e00] text-white font-black text-sm tracking-wide shadow-lg shadow-orange-500/25 cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2"
              id="home-bottom-buy-pack-cta"
            >
              <CreditCard className="w-4 h-4" />
              <span>Acheter un Pack</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/discover')}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Écouter les Chansons</span>
            </button>
          </div>
        </div>

        {/* Mobile Money Operators Trust Strip */}
        <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Paiement 100% sécurisé SASPAY.ME</span>
          </div>
          <div>• Orange Money, MTN MoMo, Wave, Vodacom M-Pesa, Airtel</div>
          <div>• Validation secrète par code PIN sur votre mobile</div>
        </div>
      </section>
    </div>
  );
};
