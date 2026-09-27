import {
  Plan,
  Payment,
  UserSongBalance,
  SongTransaction,
  Song,
  Playlist,
  VoiceProfile,
  Template,
  AdminLog,
  User,
  GenerationJob,
  SaaSSettings,
} from '../src/types';

export const DEFAULT_SAAS_SETTINGS: SaaSSettings = {
  general: {
    appName: 'SITDOWORLD AI MUSIC',
    appTagline: 'AI Music Studio for Creators',
    supportEmail: 'sitdoworldinformatique@gmail.com',
    defaultCurrency: 'USD',
    defaultLanguage: 'fr',
    maintenanceMode: false,
    allowRegistrations: true,
  },
  ai: {
    defaultMusicModel: 'lyria-3-pro-preview',
    lyricsModel: 'gemini-3.8-flash',
    maxDurationSeconds: 240,
    defaultSamplingQuality: 'studio_hd_wav',
    aiCreativityTemperature: 0.7,
    maxConcurrentGenerations: 5,
    allowStemExtraction: true,
  },
  billing: {
    welcomeFreeSongs: 2,
    unitSongPriceUSD: 1.5,
    saspayGatewayActive: true,
    testMode: false,
    lowBalanceThreshold: 1,
    autoRefundOnFailure: true,
  },
  security: {
    explicitLyricsFilter: true,
    copyrightProtection: true,
    maxDailyCreationsPerUser: 50,
    watermarkAudioFreeTier: false,
    auditLogging: true,
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'sitdoworldinformatique@gmail.com',
};

// Default Plans as specified by user requirements (Exact 5 Packs)
export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    songs: 2,
    price: 2.45,
    currency: 'USD',
    active: true,
    features: [
      '2 Chansons complètes en haute définition',
      'Chansons utilisables sans limite de temps',
      '1 chanson master par génération',
      'Export audio haute fidélité',
      'Accès complet au Studio Multitrack',
      'Stems isolés (Vocals, Drums, Bass...)',
      'Droits commerciaux d\'exploitation',
    ],
  },
  {
    id: 'creator',
    name: 'Creator',
    songs: 4,
    price: 4.60,
    currency: 'USD',
    active: true,
    popular: true,
    features: [
      '4 Chansons complètes en studio HD',
      'Chansons utilisables sans limite de temps',
      '1 chanson master par génération',
      'Export audio haute fidélité',
      'Accès complet au Studio Multitrack',
      'Stems isolés (Vocals, Drums, Bass...)',
      'Droits commerciaux d\'exploitation',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    songs: 6,
    price: 6.60,
    currency: 'USD',
    active: true,
    features: [
      '6 Chansons complètes ultra studio',
      'Chansons utilisables sans limite de temps',
      '1 chanson master par génération',
      'Export audio haute fidélité',
      'Accès complet au Studio Multitrack',
      'Stems isolés (Vocals, Drums, Bass...)',
      'Droits commerciaux d\'exploitation',
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    songs: 8,
    price: 8.60,
    currency: 'USD',
    active: true,
    features: [
      '8 Chansons de niveau production pro',
      'Chansons utilisables sans limite de temps',
      '1 chanson master par génération',
      'Export audio haute fidélité',
      'Accès complet au Studio Multitrack',
      'Stems isolés (Vocals, Drums, Bass...)',
      'Droits commerciaux d\'exploitation',
    ],
  },
  {
    id: 'master_vip',
    name: 'Master VIP',
    songs: 10,
    price: 10.00,
    currency: 'USD',
    active: true,
    features: [
      '10 Chansons complètes haute fidélité',
      'Chansons utilisables sans limite de temps',
      '1 chanson master par génération',
      'Export audio haute fidélité',
      'Accès complet au Studio Multitrack',
      'Stems isolés (Vocals, Drums, Bass...)',
      'Droits commerciaux d\'exploitation',
    ],
  },
];

// Initial Templates
export const TEMPLATES: Template[] = [
  {
    id: 'afrobeat',
    name: 'Afrobeat Energy',
    genre: 'Afrobeat',
    mood: 'Dansant & Positif',
    prompt: 'Afrobeat moderne et entraînant, log drums puissants, cuivres jazzy, guitare rythmée ouest-africaine et refrain explosif en français et pidgin',
    suggested_bpm: 104,
    cover_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
    description: 'Vibe chaleureuse nigériane et ivoirienne pour club et streaming.',
  },
  {
    id: 'amapiano',
    name: 'Amapiano Sunset',
    genre: 'Amapiano',
    mood: 'Chill & Envoûtant',
    prompt: 'Amapiano sud-africain authentique, log drums profonds, shaker hypnotique, nappes de piano jazz Rhodes et chant sensuel doux',
    suggested_bpm: 113,
    cover_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80',
    description: 'Basses profondes et harmonies jazzy venues de Soweto.',
  },
  {
    id: 'gospel',
    name: 'Gospel Elevation',
    genre: 'Gospel',
    mood: 'Spirituel & Inspirant',
    prompt: 'Chant gospel contemporain puissant avec chœur céleste, orgue Hammond chaleureux, batterie vivante et montée d’émotion inspirante',
    suggested_bpm: 82,
    cover_url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80',
    description: 'Harmonies vocales grandioses et élévation spirituelle.',
  },
  {
    id: 'rnb',
    name: 'R&B Velvet Nights',
    genre: 'R&B',
    mood: 'Sensuel & Mélancolique',
    prompt: 'R&B contemporain suave, guitare acoustique intime, voix de tête veloutée, 808 feutrée et ambiance nocturne romantique',
    suggested_bpm: 90,
    cover_url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80',
    description: 'Mélodies soyeuses et intimité nocturne.',
  },
  {
    id: 'hiphop',
    name: 'Hip-Hop Golden Era',
    genre: 'Hip-Hop',
    mood: 'Boom-Bap & Confiant',
    prompt: 'Hip-hop boom bap percutant, sample de vinyle poussiéreux, basse ronde, kicks tranchants et flow percutant articulé',
    suggested_bpm: 92,
    cover_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    description: 'Rythmiques franches et textures vintage urbaines.',
  },
  {
    id: 'pop',
    name: 'Pop Radio Anthem',
    genre: 'Pop',
    mood: 'Euphorisant & Brillant',
    prompt: 'Pop internationale lumineuse et entraînante, synthés scintillants, basse funk dynamique et refrain inoubliable prêt pour la radio',
    suggested_bpm: 120,
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    description: 'Production calibrée pour les hits radio mondiaux.',
  },
  {
    id: 'romantic',
    name: 'Romantic Serenade',
    genre: 'R&B',
    mood: 'Amoureux & Tendre',
    prompt: 'Ballade romantique délicate, piano à queue intime, violoncelle chaleureux et voix passionnée déclarant un amour éternel',
    suggested_bpm: 76,
    cover_url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=600&q=80',
    description: 'Une sérénade pure pour déclarer sa flamme.',
  },
  {
    id: 'sad',
    name: 'Melancholy Rain',
    genre: 'Lo-fi',
    mood: 'Triste & Nostalgique',
    prompt: 'Mélodie introspective triste au piano électrique tremolo, bruits de pluie lointains, guitare réverbérée et soupirs vocaux poignants',
    suggested_bpm: 70,
    cover_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    description: 'Vibe solitaire et réflexion mélancolique sous la pluie.',
  },
  {
    id: 'party',
    name: 'Party Anthem 3000',
    genre: 'Dance',
    mood: 'Festif & Survolté',
    prompt: 'Banger festif dance electro survitaminé, drop de basse percutant, synthés lasers et rythme taillé pour faire danser les foules',
    suggested_bpm: 128,
    cover_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80',
    description: 'L’énergie maximale des plus grands festivals.',
  },
  {
    id: 'motivation',
    name: 'Unstoppable Rise',
    genre: 'Cinematic',
    mood: 'Motivant & Épique',
    prompt: 'Morceau motivant puissant, montées de cuivres cinématiques, tambours guerriers, guitare électrique incisive et énergie triomphale',
    suggested_bpm: 110,
    cover_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    description: 'Pour le sport, le dépassement de soi et les moments héroïques.',
  },
  {
    id: 'wedding',
    name: 'Wedding Romance',
    genre: 'Pop',
    mood: 'Émotionnel & Célébration',
    prompt: 'Chanson d’ouverture de bal de mariage magique, violons majestueux, piano doux, mélodie lumineuse et paroles d’union sincère',
    suggested_bpm: 80,
    cover_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
    description: 'Pour immortaliser les plus beaux mariages.',
  },
  {
    id: 'birthday',
    name: 'Afro Birthday Vibe',
    genre: 'Afrobeat',
    mood: 'Joyeux & Célébration',
    prompt: 'Chanson joyeuse d’anniversaire afrobeat, trompettes festives, percussions sautillantes et ambiance de fête en famille et entre amis',
    suggested_bpm: 108,
    cover_url: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=600&q=80',
    description: 'Pour souhaiter un anniversaire inoubliable en musique.',
  },
  {
    id: 'cinematic',
    name: 'Epic Odyssey',
    genre: 'Cinematic',
    mood: 'Grandiosité & Mystère',
    prompt: 'Bande originale de film hollywoodien, orchestre philharmonique majestueux, chœurs épiques et crescendo spectaculaire de science-fiction',
    suggested_bpm: 85,
    cover_url: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80',
    description: 'Score cinématographique pour bandes annonces et films.',
  },
  {
    id: 'tiktok',
    name: 'TikTok Viral Hook',
    genre: 'Pop',
    mood: 'Accrocheur & Énergique',
    prompt: 'Court format ultra accrocheur, boucle vocale addictive, basse sautillante et gimmick viral conçu pour exploser sur TikTok et Reels',
    suggested_bpm: 124,
    cover_url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80',
    description: 'Conçu avec un hook de 15 secondes irrésistible.',
  },
  {
    id: 'youtube',
    name: 'Vlog Lifestyle Groove',
    genre: 'Lo-fi',
    mood: 'Positif & Décontracté',
    prompt: 'Musique de fond idéale pour créateur YouTube, guitare funk décontractée, basse groove subtile et ambiance lifestyle ensoleillée',
    suggested_bpm: 98,
    cover_url: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=600&q=80',
    description: 'La musique idéale qui met en valeur les vlogs et tutoriels.',
  },
  {
    id: 'advertisement',
    name: 'Brand Impact Commercial',
    genre: 'Pop',
    mood: 'Moderne & Dynamique',
    prompt: 'Thème publicitaire moderne, claquements de doigts rythmés, guitare acoustique entraînante et refrain optimiste inspirant confiance',
    suggested_bpm: 118,
    cover_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80',
    description: 'Format corporate et commercial élégant pour marques innovantes.',
  },
];

// Initial Seed Songs
export const INITIAL_SONGS: Song[] = [
  {
    id: 'song-seed-1',
    title: 'Soleil de Cotonou',
    prompt: 'Afrobeat doux avec kora moderne, guitare dansante et voix suave célébrant l’amour sous les tropiques',
    lyrics: `[Intro]\nYeah, Sitdoworld AI Music\nSous le soleil qui brille\n\n[Refrain]\nSoleil de Cotonou brille dans tes yeux\nQuand tu danses avec moi le monde est précieux\nBébé viens plus près, laisse parler le cœur\nAvec toi la vie n'a plus de rancœur\n\n[Couplet 1]\nLes vagues de l'océan chantent notre refrain\nTa main dans ma main jusqu'au petit matin`,
    genre: 'Afrobeat',
    mood: 'Romantique & Dansant',
    duration: 184,
    bpm: 104,
    key: 'F# Minor',
    creator_id: 'user-default-1',
    creator_name: 'Sitdo Music',
    creator_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    cover_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
    audio_url: 'https://audio.sunor.cc/audio/26364c90-6b75-45d7-9c3d-dd053c5c3d79/c106336e7aef4300.mp3',
    version_tag: 'ORIGINAL',
    is_public: true,
    likes_count: 142,
    plays_count: 1250,
    shares_count: 38,
    stems_extracted: true,
    created_at: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(),
  },
  {
    id: 'song-seed-2',
    title: 'Amapiano Midnight Prayer',
    prompt: 'Amapiano spirituel avec log drum lourd, piano jazz introspectif et voix féminine envoûtante',
    lyrics: `[Intro]\nDeep night, quiet soul\nLet the bass take control\n\n[Chorus]\nMidnight prayer through the sound\nJoy and peace will be found\nFeel the log drum resonance\nThis is our holy dance`,
    genre: 'Amapiano',
    mood: 'Spirituel & Chill',
    duration: 192,
    bpm: 113,
    key: 'C Minor',
    creator_id: 'user-demo-2',
    creator_name: 'Lindiwe Keys',
    creator_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    cover_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80',
    audio_url: 'https://audio.sunor.cc/audio/26364c90-6b75-45d7-9c3d-dd053c5c3d79/79a48a32f4c06200.mp3',
    version_tag: 'ORIGINAL',
    is_public: true,
    likes_count: 98,
    plays_count: 890,
    shares_count: 24,
    stems_extracted: true,
    created_at: new Date(Date.now() - 3600 * 1000 * 24 * 3).toISOString(),
  },
  {
    id: 'song-seed-3',
    title: 'Mon Amour Pour Toi',
    prompt: 'Afrobeat romantique en français avec guitare acoustique, chant masculin passionné et percussions modernes',
    lyrics: `[Intro]\nPour toi mon amour...\n\n[Refrain]\nMon amour pour la vie\nDans tes yeux tout s'illumine\nAvec toi je renais\nPour toujours et à jamais`,
    genre: 'Afrobeat',
    mood: 'Inspirant & Majestueux',
    duration: 180,
    bpm: 105,
    key: 'G Major',
    creator_id: 'user-demo-3',
    creator_name: 'Emmanuel Choir',
    creator_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    cover_url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80',
    audio_url: 'https://audio.sunor.cc/audio/ece5be6f-1853-4204-8fc5-c4c8a6c4f80f/88efad07b10bb9e3.mp3',
    version_tag: 'ORIGINAL',
    is_public: true,
    likes_count: 254,
    plays_count: 2100,
    shares_count: 76,
    stems_extracted: true,
    created_at: new Date(Date.now() - 3600 * 1000 * 24 * 5).toISOString(),
  },
  {
    id: 'song-seed-4',
    title: 'Neon Drift (Cyber R&B)',
    prompt: 'R&B futuriste, synthés 80s analogiques, beat trap feutré et harmonies vocales soyeuses',
    genre: 'R&B',
    mood: 'Nocturne & Sensuel',
    duration: 168,
    bpm: 88,
    key: 'D Minor',
    creator_id: 'user-default-1',
    creator_name: 'Sitdo Music',
    creator_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    cover_url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80',
    audio_url: 'https://audio.sunor.cc/audio/ece5be6f-1853-4204-8fc5-c4c8a6c4f80f/5cd9c7d548a522e8.mp3',
    version_tag: 'ORIGINAL',
    is_public: true,
    likes_count: 87,
    plays_count: 640,
    shares_count: 19,
    stems_extracted: false,
    created_at: new Date(Date.now() - 3600 * 1000 * 24 * 1).toISOString(),
  },
];

// In-Memory Global Database Class
class Database {
  public users: Map<string, User> = new Map();
  public songBalances: Map<string, UserSongBalance> = new Map();
  public transactions: SongTransaction[] = [];
  public payments: Map<string, Payment> = new Map();
  public songs: Map<string, Song> = new Map();
  public playlists: Map<string, Playlist> = new Map();
  public voiceProfiles: Map<string, VoiceProfile> = new Map();
  public generationJobs: Map<string, GenerationJob> = new Map();
  public adminLogs: AdminLog[] = [];
  public plans: Plan[] = [...PLANS];
  public templates: Template[] = [...TEMPLATES];

  public saasSettings: SaaSSettings = { ...DEFAULT_SAAS_SETTINGS };

  constructor() {
    this.seed();
  }

  private seed() {
    // Default logged in user (matches the prompt owner sitdoworldinformatique@gmail.com)
    const defaultUser: User = {
      id: 'user-default-1',
      email: 'sitdoworldinformatique@gmail.com',
      name: 'Sitdo Creator',
      username: 'sitdoworld',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      bio: 'Fondateur & producteur musical chez SITDOWORLD AI MUSIC. Créateur de sonorités afrobeat et cinématographiques.',
      role: 'admin',
      status: 'active',
      is_vip: true,
      created_at: new Date(Date.now() - 3600 * 1000 * 24 * 30).toISOString(),
    };
    this.users.set(defaultUser.id, defaultUser);

    // Additional SaaS customer accounts
    const clientUsers: User[] = [
      {
        id: 'user-client-2',
        email: 'amara.music@afrostudio.sn',
        name: 'Amara Diop',
        username: 'amaradiop',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        bio: 'Producteur indépendant Dakar & Paris. Spécialiste Mbalax & Afro-fusion.',
        role: 'creator',
        status: 'active',
        is_vip: true,
        created_at: new Date(Date.now() - 3600 * 1000 * 24 * 20).toISOString(),
      },
      {
        id: 'user-client-3',
        email: 'kofi.beats@gmail.com',
        name: 'Kofi Mensah',
        username: 'kofibeats',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        bio: 'Beatmaker & topliner basé à Accra.',
        role: 'user',
        status: 'active',
        is_vip: false,
        created_at: new Date(Date.now() - 3600 * 1000 * 24 * 14).toISOString(),
      },
      {
        id: 'user-client-4',
        email: 'chloe.sound@paris-vibes.fr',
        name: 'Chloé Laurent',
        username: 'chloelaurent',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        bio: 'Chanteuse & parolière Pop / R&B.',
        role: 'creator',
        status: 'active',
        is_vip: false,
        created_at: new Date(Date.now() - 3600 * 1000 * 24 * 9).toISOString(),
      },
      {
        id: 'user-client-5',
        email: 'david.dj@abidjan-night.ci',
        name: "David N'Guessan",
        username: 'daviddj',
        avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
        bio: 'DJ Résident Abidjan.',
        role: 'user',
        status: 'suspended',
        is_vip: false,
        created_at: new Date(Date.now() - 3600 * 1000 * 24 * 25).toISOString(),
      },
    ];

    for (const u of clientUsers) {
      this.users.set(u.id, u);
    }

    // Initial balance: 8 available songs (as requested in dashboard spec: "Chansons disponibles: 8")
    this.songBalances.set(defaultUser.id, {
      id: 'bal-1',
      user_id: defaultUser.id,
      available_songs: 8,
      total_purchased: 10,
      total_generated: 2,
      updated_at: new Date().toISOString(),
    });

    this.songBalances.set('user-client-2', {
      id: 'bal-2',
      user_id: 'user-client-2',
      available_songs: 14,
      total_purchased: 20,
      total_generated: 6,
      updated_at: new Date().toISOString(),
    });

    this.songBalances.set('user-client-3', {
      id: 'bal-3',
      user_id: 'user-client-3',
      available_songs: 3,
      total_purchased: 5,
      total_generated: 2,
      updated_at: new Date().toISOString(),
    });

    this.songBalances.set('user-client-4', {
      id: 'bal-4',
      user_id: 'user-client-4',
      available_songs: 6,
      total_purchased: 10,
      total_generated: 4,
      updated_at: new Date().toISOString(),
    });

    this.songBalances.set('user-client-5', {
      id: 'bal-5',
      user_id: 'user-client-5',
      available_songs: 0,
      total_purchased: 2,
      total_generated: 2,
      updated_at: new Date().toISOString(),
    });

    // Seed initial transaction
    this.transactions.push({
      id: 'tx-seed-1',
      user_id: defaultUser.id,
      type: 'PURCHASE',
      amount: 8,
      reference: 'SAS-INIT-PACK-PRO-8821',
      created_at: new Date(Date.now() - 3600 * 1000 * 24 * 7).toISOString(),
    });

    // Seed diverse SASPAY payments for realistic SaaS revenue
    const demoPayments: Payment[] = [
      {
        id: 'pay-seed-1',
        user_id: defaultUser.id,
        plan_id: 'pro',
        package_id: 'pro',
        provider: 'SASPAY',
        amount: 6.60,
        currency: 'USD',
        songs_quantity: 6,
        songs_credited: 6,
        status: 'SUCCESS',
        payment_method: 'SASPAY_CARD',
        merchant_reference: 'SAS-INIT-PACK-PRO-8821',
        transaction_reference: 'SAS-INIT-PACK-PRO-8821',
        created_at: new Date(Date.now() - 3600 * 1000 * 24 * 7).toISOString(),
        updated_at: new Date(Date.now() - 3600 * 1000 * 24 * 7).toISOString(),
      },
      {
        id: 'pay-seed-2',
        user_id: 'user-client-2',
        plan_id: 'master_vip',
        package_id: 'master_vip',
        provider: 'SASPAY',
        amount: 10.00,
        currency: 'USD',
        songs_quantity: 10,
        songs_credited: 10,
        status: 'SUCCESS',
        payment_method: 'SASPAY_MOMO',
        merchant_reference: 'SAS-2026-AMARA-9921',
        transaction_reference: 'SAS-2026-AMARA-9921',
        created_at: new Date(Date.now() - 3600 * 1000 * 24 * 4).toISOString(),
        updated_at: new Date(Date.now() - 3600 * 1000 * 24 * 4).toISOString(),
      },
      {
        id: 'pay-seed-3',
        user_id: 'user-client-4',
        plan_id: 'studio',
        package_id: 'studio',
        provider: 'SASPAY',
        amount: 8.60,
        currency: 'USD',
        songs_quantity: 8,
        songs_credited: 8,
        status: 'SUCCESS',
        payment_method: 'SASPAY_CARD',
        merchant_reference: 'SAS-2026-CHLOE-4412',
        transaction_reference: 'SAS-2026-CHLOE-4412',
        created_at: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(),
      },
      {
        id: 'pay-seed-4',
        user_id: 'user-client-3',
        plan_id: 'creator',
        package_id: 'creator',
        provider: 'SASPAY',
        amount: 4.60,
        currency: 'USD',
        songs_quantity: 4,
        songs_credited: 4,
        status: 'SUCCESS',
        payment_method: 'SASPAY_MOMO',
        merchant_reference: 'SAS-2026-KOFI-7821',
        transaction_reference: 'SAS-2026-KOFI-7821',
        created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
        updated_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
      },
    ];

    for (const p of demoPayments) {
      this.payments.set(p.id, p);
      if (p.transaction_reference) {
        this.payments.set(p.transaction_reference, p);
      }
    }

    // Seed initial songs
    for (const s of INITIAL_SONGS) {
      this.songs.set(s.id, s);
    }

    // Seed default playlist
    const defaultPlaylist: Playlist = {
      id: 'playlist-1',
      title: 'Afro Hits & Amapiano Vibe',
      description: 'Mes meilleures créations générées sur SITDOWORLD AI MUSIC Studio.',
      cover_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
      creator_id: defaultUser.id,
      creator_name: defaultUser.name,
      songs: [INITIAL_SONGS[0], INITIAL_SONGS[1]],
      is_public: true,
      created_at: new Date(Date.now() - 3600 * 1000 * 24 * 5).toISOString(),
    };
    this.playlists.set(defaultPlaylist.id, defaultPlaylist);

    // Seed a voice profile
    const defaultVoice: VoiceProfile = {
      id: 'voice-profile-1',
      user_id: defaultUser.id,
      name: 'Sitdo Warm Baritone',
      description: 'Timbre masculin chaud et profond, parfait pour refrains afrobeat et R&B.',
      sample_url: '',
      has_consent: true,
      consent_statement: 'I confirm that I own this voice or have permission to use it.',
      created_at: new Date(Date.now() - 3600 * 1000 * 24 * 10).toISOString(),
    };
    this.voiceProfiles.set(defaultVoice.id, defaultVoice);

    // Seed initial logs
    this.logEvent('payment_success', defaultUser.id, {
      reference: 'SAS-INIT-PACK-PRO-8821',
      amount: 10,
      currency: 'USD',
      songsCredited: 8,
    });
  }

  public logEvent(event: AdminLog['event'], userId?: string, details: Record<string, unknown> = {}) {
    const log: AdminLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      event,
      user_id: userId,
      details,
      timestamp: new Date().toISOString(),
    };
    this.adminLogs.unshift(log);
    // Keep max 200 logs
    if (this.adminLogs.length > 200) {
      this.adminLogs.pop();
    }
  }

  // Save payment indexed by both ID and transaction reference
  public savePayment(payment: Payment): void {
    if (payment.id) {
      this.payments.set(payment.id, payment);
    }
    if (payment.transaction_reference) {
      this.payments.set(payment.transaction_reference, payment);
    }
    if (payment.provider_transaction_id) {
      this.payments.set(payment.provider_transaction_id, payment);
    }
  }

  // Get payment with multi-index fallback (never fails with "Transaction non trouvée" if transaction exists)
  public getPayment(identifier?: string): Payment | undefined {
    if (!identifier) return undefined;
    const cleanId = String(identifier).trim();
    if (this.payments.has(cleanId)) {
      return this.payments.get(cleanId);
    }
    for (const p of this.payments.values()) {
      if (
        p.transaction_reference === cleanId ||
        p.id === cleanId ||
        (p.provider_transaction_id && p.provider_transaction_id === cleanId) ||
        (cleanId.startsWith('SAS-') && p.transaction_reference && p.transaction_reference.includes(cleanId))
      ) {
        return p;
      }
    }
    return undefined;
  }

  // Get user song balance safely
  public getBalance(userId: string): UserSongBalance {
    let bal = this.songBalances.get(userId);
    if (!bal) {
      bal = {
        id: `bal-${userId}`,
        user_id: userId,
        available_songs: 2, // New sign-up welcome gift 2 songs
        total_purchased: 0,
        total_generated: 0,
        updated_at: new Date().toISOString(),
      };
      this.songBalances.set(userId, bal);
    }
    return bal;
  }

  // Deduct song on validated generation
  public deductSong(userId: string, songId: string, reference: string): boolean {
    const bal = this.getBalance(userId);
    if (bal.available_songs <= 0) {
      return false;
    }
    bal.available_songs -= 1;
    bal.total_generated += 1;
    bal.updated_at = new Date().toISOString();
    this.songBalances.set(userId, bal);

    this.transactions.unshift({
      id: `tx-gen-${Date.now()}`,
      user_id: userId,
      song_id: songId,
      type: 'GENERATION',
      amount: -1,
      reference,
      created_at: new Date().toISOString(),
    });

    this.logEvent('song_balance_updated', userId, {
      reason: 'GENERATION',
      deducted: 1,
      available_songs: bal.available_songs,
      reference,
    });

    return true;
  }

  public reservedGenerations = new Set<string>();
  public committedGenerations = new Set<string>();
  public releasedGenerations = new Set<string>();

  // Reserve 1 song credit at the start of generation (Section 10)
  public reserveSong(userId: string, jobId: string, reference: string): boolean {
    if (this.reservedGenerations.has(jobId)) return true;
    const bal = this.getBalance(userId);
    if (bal.available_songs <= 0) return false;
    bal.available_songs -= 1;
    bal.updated_at = new Date().toISOString();
    this.songBalances.set(userId, bal);
    this.reservedGenerations.add(jobId);

    this.transactions.unshift({
      id: `tx-res-${Date.now()}`,
      user_id: userId,
      song_id: jobId,
      type: 'GENERATION',
      amount: -1,
      reference: `RESERVED-${reference}`,
      created_at: new Date().toISOString(),
    });

    console.log(`[CREDIT_RESERVATION] generationId=${jobId} userId=${userId} timestamp=${new Date().toISOString()} status=RESERVED`);
    return true;
  }

  // Confirm credit consumption only when audio is validated and successful (Section 10)
  public commitSong(userId: string, jobId: string, reference: string): boolean {
    if (this.committedGenerations.has(jobId)) return true;
    const bal = this.getBalance(userId);
    bal.total_generated += 1;
    bal.updated_at = new Date().toISOString();
    this.songBalances.set(userId, bal);
    this.committedGenerations.add(jobId);
    console.log(`[CREDIT_COMMIT] generationId=${jobId} userId=${userId} timestamp=${new Date().toISOString()} status=COMMITTED`);
    return true;
  }

  // Release/Refund 1 credit if generation fails or times out (Section 10)
  public releaseSong(userId: string, jobId: string, reason: string): boolean {
    if (this.releasedGenerations.has(jobId)) return true;
    if (this.committedGenerations.has(jobId)) return false; // Already finalized
    if (this.reservedGenerations.has(jobId)) {
      const bal = this.getBalance(userId);
      bal.available_songs += 1;
      bal.updated_at = new Date().toISOString();
      this.songBalances.set(userId, bal);
      this.releasedGenerations.add(jobId);

      this.transactions.unshift({
        id: `tx-rel-${Date.now()}`,
        user_id: userId,
        song_id: jobId,
        type: 'REFUND',
        amount: 1,
        reference: `RELEASED-${jobId}`,
        created_at: new Date().toISOString(),
      });

      console.log(`[CREDIT_RELEASE] generationId=${jobId} userId=${userId} timestamp=${new Date().toISOString()} status=RELEASED reason="${reason}"`);
      return true;
    }
    return false;
  }

  // Index lookup for provider task id (Section 11 & 15)
  public findJobByTaskId(taskId: string): GenerationJob | undefined {
    if (!taskId) return undefined;
    for (const job of this.generationJobs.values()) {
      if (job.task_id === taskId || job.provider_task_id === taskId) {
        return job;
      }
    }
    return undefined;
  }

  // Refund song if generation fails before completion
  public refundSong(userId: string, reference: string, reason: string): void {
    if (this.releaseSong(userId, reference, reason)) {
      return;
    }
    const bal = this.getBalance(userId);
    bal.available_songs += 1;
    if (bal.total_generated > 0) {
      bal.total_generated -= 1;
    }
    bal.updated_at = new Date().toISOString();
    this.songBalances.set(userId, bal);

    this.transactions.unshift({
      id: `tx-ref-${Date.now()}`,
      user_id: userId,
      type: 'REFUND',
      amount: 1,
      reference,
      created_at: new Date().toISOString(),
    });

    this.logEvent('song_balance_updated', userId, {
      reason: 'REFUND',
      refunded: 1,
      cause: reason,
      available_songs: bal.available_songs,
      reference,
    });
  }

  // Credit songs on verified SASPAY payment (with IDEMPOTENCY & STRICT CRYPTOGRAPHIC VERIFICATION)
  public creditSongsFromPayment(payment: Payment, songsCount: number): boolean {
    const rawStatus = String(payment.status || '').toUpperCase();

    // 1. Strict status validation: must be CONFIRMED, PAID, or SUCCESS
    if (rawStatus !== 'CONFIRMED' && rawStatus !== 'PAID' && rawStatus !== 'SUCCESS') {
      this.logEvent('api_error', payment.user_id, {
        error: 'Refused crediting songs: payment status is not verified CONFIRMED/PAID/SUCCESS',
        current_status: payment.status,
        reference: payment.merchant_reference || payment.transaction_reference,
      });
      return false;
    }

    // 2. Strict verification check: must have passed cryptographic webhook verification or server-side SasPay status verify
    if (!payment.webhook_verified && !payment.verified_by_provider) {
      this.logEvent('api_error', payment.user_id, {
        error: 'Refused crediting songs: payment has not passed verified webhook or server-side SasPay verification',
        reference: payment.merchant_reference || payment.transaction_reference,
      });
      return false;
    }

    // 3. Strict Idempotency Check: prevent duplicate credits
    if (payment.pack_credited) {
      this.logEvent('webhook_verified', payment.user_id, {
        warning: 'Double credit prevented! pack_credited is already true.',
        reference: payment.merchant_reference || payment.transaction_reference,
      });
      return false;
    }

    const ref = payment.merchant_reference || payment.transaction_reference;
    const existingSuccessTx = this.transactions.find(
      (tx) =>
        (tx.reference === ref ||
          tx.reference === payment.transaction_reference ||
          tx.reference === payment.merchant_reference) &&
        tx.type === 'PURCHASE'
    );
    if (existingSuccessTx) {
      this.logEvent('webhook_verified', payment.user_id, {
        warning: 'Double credit prevented! Payment reference already credited.',
        reference: ref,
      });
      return false;
    }

    const bal = this.getBalance(payment.user_id);
    bal.available_songs += songsCount;
    bal.total_purchased += songsCount;
    bal.updated_at = new Date().toISOString();
    this.songBalances.set(payment.user_id, bal);

    payment.pack_credited = true;
    payment.songs_credited = songsCount;
    this.savePayment(payment);

    this.transactions.unshift({
      id: `tx-pur-${Date.now()}`,
      user_id: payment.user_id,
      type: 'PURCHASE',
      amount: songsCount,
      reference: ref,
      created_at: new Date().toISOString(),
    });

    this.logEvent('song_balance_updated', payment.user_id, {
      reason: 'PURCHASE',
      added: songsCount,
      available_songs: bal.available_songs,
      reference: ref,
      amount: payment.amount,
      currency: payment.currency,
    });

    return true;
  }

  // ---------------- SAAS SETTINGS MANAGEMENT ----------------
  public getSaaSSettings(): SaaSSettings {
    return { ...this.saasSettings };
  }

  public updateSaaSSettings(updates: Partial<SaaSSettings>, updatedBy: string = 'sitdoworldinformatique@gmail.com'): SaaSSettings {
    this.saasSettings = {
      ...this.saasSettings,
      ...updates,
      general: {
        ...this.saasSettings.general,
        ...(updates.general || {}),
      },
      ai: {
        ...this.saasSettings.ai,
        ...(updates.ai || {}),
      },
      billing: {
        ...this.saasSettings.billing,
        ...(updates.billing || {}),
      },
      security: {
        ...this.saasSettings.security,
        ...(updates.security || {}),
      },
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    this.logEvent('saas_settings_updated', undefined, {
      updatedBy,
      changes: updates,
      timestamp: this.saasSettings.updatedAt,
    });

    return { ...this.saasSettings };
  }

  public resetSaaSSettings(updatedBy: string = 'sitdoworldinformatique@gmail.com'): SaaSSettings {
    this.saasSettings = {
      ...DEFAULT_SAAS_SETTINGS,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    this.logEvent('saas_settings_updated', undefined, {
      action: 'RESET_TO_DEFAULTS',
      updatedBy,
    });

    return { ...this.saasSettings };
  }

  public updateUser(userId: string, updates: Partial<User>): User | null {
    const user = this.users.get(userId);
    if (!user) return null;

    const updatedUser: User = {
      ...user,
      ...updates,
    };
    this.users.set(userId, updatedUser);

    this.logEvent('user_status_changed', userId, {
      changes: updates,
    });

    return updatedUser;
  }

  public updatePlan(planId: string, updates: Partial<Plan>): Plan | null {
    const index = this.plans.findIndex((p) => p.id === planId);
    if (index === -1) return null;

    this.plans[index] = {
      ...this.plans[index],
      ...updates,
    };

    this.logEvent('plan_updated', undefined, {
      planId,
      changes: updates,
    });

    return this.plans[index];
  }

  public deletePayment(paymentId: string): boolean {
    const payment = this.getPayment(paymentId);
    if (!payment) return false;
    this.payments.delete(payment.id);
    if (payment.transaction_reference) this.payments.delete(payment.transaction_reference);
    if (payment.provider_transaction_id) this.payments.delete(payment.provider_transaction_id);
    this.transactions = this.transactions.filter(
      (tx) => tx.reference !== payment.transaction_reference && tx.reference !== payment.merchant_reference
    );
    this.logEvent('payment_deleted', 'admin', { paymentId: payment.id, amount: payment.amount });
    return true;
  }

  public clearTestPayments(): { deletedCount: number; clearedRevenueUSD: number } {
    const uniquePayments = Array.from(new Map(Array.from(this.payments.values()).map((p) => [p.id, p])).values());
    let deletedCount = 0;
    let clearedRevenueUSD = 0;

    for (const p of uniquePayments) {
      clearedRevenueUSD += p.amount || 0;
      this.payments.delete(p.id);
      if (p.transaction_reference) this.payments.delete(p.transaction_reference);
      if (p.provider_transaction_id) this.payments.delete(p.provider_transaction_id);
      deletedCount++;
    }

    this.transactions = this.transactions.filter((tx) => tx.type !== 'PURCHASE' || !tx.reference.includes('SAS-'));

    this.logEvent('test_payments_cleared', 'admin', {
      deletedCount,
      clearedRevenueUSD,
      note: 'Réinitialisation des revenus et transactions de test par l’administrateur',
    });

    return { deletedCount, clearedRevenueUSD };
  }

  public deleteSong(songId: string): boolean {
    const exists = this.songs.has(songId);
    if (!exists) return false;
    const s = this.songs.get(songId);
    this.songs.delete(songId);
    this.logEvent('song_deleted', 'admin', { songId, title: s?.title });
    return true;
  }

  public clearTestSongs(): { deletedCount: number; remainingSongs: number } {
    const allSongs = Array.from(this.songs.values());
    let deletedCount = 0;

    for (const s of allSongs) {
      const isTestSong =
        s.id.startsWith('song-seed-') ||
        s.creator_name === 'Studio Test' ||
        s.creator_id === 'user-demo-2' ||
        s.creator_id === 'user-demo-3' ||
        s.prompt.toLowerCase().includes('lydia') ||
        s.prompt.toLowerCase().includes('test') ||
        s.title.toLowerCase().includes('test') ||
        s.title.toLowerCase().includes('lydia') ||
        s.title === 'Soleil de Cotonou' ||
        s.title === 'Amapiano Midnight Prayer' ||
        s.title === 'Mon Amour Pour Toi' ||
        s.title === 'Neon Drift (Cyber R&B)';

      if (isTestSong) {
        this.songs.delete(s.id);
        deletedCount++;
      }
    }

    if (deletedCount === 0 && allSongs.length > 0) {
      for (const s of allSongs) {
        if (s.id.includes('seed')) {
          this.songs.delete(s.id);
          deletedCount++;
        }
      }
    }

    this.logEvent('test_songs_cleared', 'admin', {
      deletedCount,
      remainingSongs: this.songs.size,
      note: 'Suppression des chansons de test par l’administrateur',
    });

    return { deletedCount, remainingSongs: this.songs.size };
  }
}

export const db = new Database();
