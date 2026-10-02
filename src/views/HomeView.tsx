import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  CheckCircle2,
  ArrowRight,
  Sprout,
  Beef,
  Building2,
  Laptop,
  TrendingUp,
  HelpCircle,
  RefreshCw,
  User as UserIcon,
  ShieldCheck,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';
import { CoachingDomain, ChatMessage, User } from '../types';
import { COACHING_DOMAINS } from '../data/coachingDomains';

interface HomeViewProps {
  navigate: (route: string) => void;
  user: User | null;
  onSelectDomainForPurchase: (domain: CoachingDomain) => void;
  unlockedDomains?: string[];
}

export const HomeView: React.FC<HomeViewProps> = ({
  navigate,
  user,
  onSelectDomainForPurchase,
  unlockedDomains = [],
}) => {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Bonjour et bienvenue sur **INTELLIGENCE AFRICAINE** ! 🌍\n\nJe suis votre coach IA dédié à l’apprentissage, au développement et à la concrétisation de vos projets en Afrique.\n\nPosez-moi une question sur votre projet ou choisissez un domaine de spécialisation ci-dessous pour débloquer un accompagnement d'expert sur mesure (Agriculture, Élevage, Construction, Informatique, Commerce).`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);

  // Voice Speech-To-Text state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Text-To-Speech state
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'fr-FR';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert('La reconnaissance vocale n’est pas supportée sur ce navigateur. Vous pouvez saisir votre question au clavier.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech recognition start error:', err);
        setIsListening(false);
      }
    }
  };

  const toggleSpeech = (id: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Check if a domain is purchased
  const isDomainUnlocked = (domainId: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'owner') return true;
    return unlockedDomains.includes(domainId) || Boolean(user.purchased_domains?.includes(domainId));
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    // Check if user is asking in a locked domain
    if (activeDomainId && !isDomainUnlocked(activeDomainId)) {
      const targetDomain = COACHING_DOMAINS.find((d) => d.id === activeDomainId);
      const lockedMsg: ChatMessage = {
        id: `locked-${Date.now()}`,
        role: 'assistant',
        content: `🔒 **Accès au domaine ${targetDomain?.name || ''} requis**\n\nPour obtenir des analyses approfondies, des calculs de devis et un accompagnement sur mesure de notre expert en **${targetDomain?.name}**, veuillez débloquer ce domaine.\n\nCliquez sur le bouton **Acheter le domaine** ci-dessous pour procéder au paiement sécurisé.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, lockedMsg]);
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      domainId: activeDomainId || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          domainId: activeDomainId,
          history,
          userId: user?.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'DOMAIN_LOCKED') {
          const targetDomain = COACHING_DOMAINS.find((d) => d.id === activeDomainId);
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              role: 'assistant',
              content: `🔒 **Domaine verrouillé** : ${data.error || 'Veuillez acheter ce domaine pour accéder au coach expert.'}`,
              timestamp: new Date().toISOString(),
            },
          ]);
          return;
        }
        throw new Error(data.error || 'Erreur du serveur IA');
      }

      const botReply: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Aucune réponse reçue.',
        timestamp: new Date().toISOString(),
        domainId: activeDomainId || undefined,
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `fallback-${Date.now()}`,
          role: 'assistant',
          content: `### Conseil INTELLIGENCE AFRICAINE\n\nMerci pour votre question : « ${text} ».\n\nVotre coach IA recommande de démarrer par une validation de vos coûts unitaires et une analyse précise de votre marché cible local. N'hésitez pas à reformuler ou à préciser votre localité (pays, ville, climat) pour une réponse plus ciblée.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDomainCard = (domain: CoachingDomain) => {
    if (isDomainUnlocked(domain.id)) {
      setActiveDomainId(domain.id);
      const coachWelcome: ChatMessage = {
        id: `switch-${domain.id}-${Date.now()}`,
        role: 'assistant',
        content: `👋 **Coach IA Spécialisé ${domain.name} activé !**\n\nJe suis **${domain.coachName}**, ${domain.coachTitle}.\n\nJe suis à votre disposition pour analyser vos devis, méthodes d'optimisation et stratégies de rentabilité. Que souhaitez-vous développer aujourd'hui ?`,
        timestamp: new Date().toISOString(),
        domainId: domain.id,
      };
      setMessages((prev) => [...prev, coachWelcome]);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } else {
      // Directs to payment flow
      onSelectDomainForPurchase(domain);
    }
  };

  const getDomainIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sprout':
        return <Sprout className="w-6 h-6 text-emerald-600" />;
      case 'Beef':
        return <Beef className="w-6 h-6 text-amber-600" />;
      case 'Building2':
        return <Building2 className="w-6 h-6 text-sky-600" />;
      case 'Laptop':
        return <Laptop className="w-6 h-6 text-blue-600" />;
      case 'TrendingUp':
        return <TrendingUp className="w-6 h-6 text-indigo-600" />;
      default:
        return <Brain className="w-6 h-6 text-blue-600" />;
    }
  };

  const activeDomain = activeDomainId
    ? COACHING_DOMAINS.find((d) => d.id === activeDomainId)
    : null;

  return (
    <div className="space-y-12 pb-24">
      {/* 1. HERO HEADER DE LA ZONE DE DISCUSSION */}
      <section className="text-center max-w-3xl mx-auto space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-black tracking-wide shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>PLATEFORME DE COACHING STRATÉGIQUE AFRICAIN</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Bienvenue sur <span className="text-blue-600">INTELLIGENCE AFRICAINE</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
          Votre coach IA pour apprendre, développer et transformer vos projets en Afrique.
        </p>

        {/* Active Domain Pill Indicator */}
        {activeDomain && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-blue-200 shadow-sm text-xs font-bold text-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Domaine actif : <strong className="text-blue-600">{activeDomain.name}</strong> ({activeDomain.coachName})</span>
            <button
              onClick={() => setActiveDomainId(null)}
              className="ml-2 text-slate-400 hover:text-slate-600 underline cursor-pointer"
            >
              Retour au coach général
            </button>
          </div>
        )}
      </section>

      {/* 2. GRANDE ZONE DE DISCUSSION DE TYPE CHATGPT */}
      <section className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden flex flex-col min-h-[520px] transition-all">
        {/* Chat Top Bar */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>{activeDomain ? activeDomain.name : 'ASSISTANT IA INTELLIGENCE AFRICAINE'}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  En ligne
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                {activeDomain ? activeDomain.coachTitle : 'Expertises : Agriculture, Élevage, BTP, Tech & Commerce'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMessages([
                  {
                    id: 'welcome-reset',
                    role: 'assistant',
                    content: `Nouvelle session démarrée. Quelle problématique souhaitez-vous explorer pour votre projet ?`,
                    timestamp: new Date().toISOString(),
                  },
                ]);
                setActiveDomainId(null);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Nouvelle conversation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nouvelle discussion</span>
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 max-h-[460px] bg-slate-50/30">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isSpeaking = speakingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <Brain className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`relative max-w-[85%] sm:max-w-[78%] rounded-2xl p-4.5 text-sm leading-relaxed transition-all shadow-xs ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                  }`}
                >
                  {/* Message formatted content */}
                  <div className="whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>

                  {/* Message Bottom Action & Timestamp */}
                  <div
                    className={`mt-2 flex items-center justify-between gap-3 text-[11px] ${
                      isUser ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {!isUser && (
                      <button
                        onClick={() => toggleSpeech(msg.id, msg.content)}
                        className="hover:text-blue-600 transition-colors p-1 rounded-md cursor-pointer flex items-center gap-1"
                        title={isSpeaking ? 'Arrêter la lecture vocale' : 'Écouter avec la synthèse vocale'}
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-[10px] text-blue-600 font-bold">Arrêter</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Écouter</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3.5 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Brain className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-600 flex items-center gap-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                <span>Votre coach IA prépare une analyse détaillée...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-6 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-500" />
            Suggestions :
          </span>
          {[
            'Comment lancer 500 poulets de chair ?',
            'Irrigation économique en saison sèche',
            'Chiffrer un devis de construction',
            'Vendre sur WhatsApp Business',
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSendMessage(prompt)}
              className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 whitespace-nowrap transition-colors cursor-pointer border border-transparent hover:border-blue-200"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 sm:gap-3"
          >
            {/* Voice Input Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-2xl transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
                  : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600'
              }`}
              title={isListening ? 'Écoute en cours... Cliquez pour arrêter' : 'Parler avec le microphone'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Input field */}
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  isListening
                    ? 'Parlez maintenant, votre voix est retranscrite...'
                    : activeDomain
                    ? `Posez votre question à ${activeDomain.coachName}...`
                    : 'Posez votre question à votre coach IA (ex: budget, technique, rentabilité)...'
                }
                className="w-full px-4 sm:px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
                disabled={isLoading}
              />
            </div>

            {/* Send button (Bouton bleu) */}
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="px-5 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
              id="send-chat-button"
            >
              <span className="hidden sm:inline">Envoyer</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
          {isListening && (
            <p className="text-[11px] font-semibold text-rose-600 mt-2 text-center animate-pulse">
              Microphone actif : parlez distinctement, votre question s'affiche automatiquement.
            </p>
          )}
        </div>
      </section>

      {/* 3. SOUS LA ZONE DE DISCUSSION : LES 5 DOMAINES DE COACHING */}
      <section className="space-y-6 pt-6" id="domaines">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>ACCOMPAGNEMENT EXPERT PANAFRICAIN</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Nos 5 Domaines de Coaching Stratégique
          </h2>
          <p className="text-sm text-slate-600">
            Sélectionnez votre domaine pour accéder au coach IA expert dédié à votre secteur d'activité.
          </p>
        </div>

        {/* Responsive Grid of 5 Domain Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {COACHING_DOMAINS.map((domain) => {
            const unlocked = isDomainUnlocked(domain.id);
            const isCurrentlyActive = activeDomainId === domain.id;

            return (
              <div
                key={domain.id}
                className={`relative rounded-3xl p-6 bg-white border transition-all duration-300 flex flex-col justify-between hover:shadow-xl ${
                  isCurrentlyActive
                    ? 'border-2 border-blue-600 shadow-lg shadow-blue-500/10 scale-102'
                    : unlocked
                    ? 'border-emerald-300 hover:border-emerald-500'
                    : 'border-slate-200 hover:border-blue-400'
                }`}
              >
                {/* Status Badge */}
                {unlocked ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs whitespace-nowrap">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>DÉBLOQUÉ</span>
                  </div>
                ) : (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs whitespace-nowrap">
                    <Lock className="w-2.5 h-2.5 text-amber-400" />
                    <span>ACCÈS PREMIUM</span>
                  </div>
                )}

                <div className="space-y-4 pt-2">
                  {/* Icon & Title */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      {getDomainIcon(domain.iconName)}
                    </div>
                    <div>
                      <h3 className="font-black text-base text-slate-900 tracking-tight leading-tight">
                        {domain.name}
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-500 mt-0.5 line-clamp-1">
                        {domain.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed min-h-[48px]">
                    {domain.description}
                  </p>

                  {/* Price Display */}
                  <div className="py-2.5 px-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black text-slate-900">${domain.price.toFixed(2)}</span>
                      <span className="text-[11px] font-bold text-blue-600">Paiement unique</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Soit environ {(domain.price * 650).toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>

                  {/* Key Topics List */}
                  <div className="space-y-1.5 pt-1 text-xs text-slate-700">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Inclus dans le coaching :
                    </div>
                    {domain.topics.slice(0, 3).map((topic, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-6 mt-4 border-t border-slate-100">
                  {unlocked ? (
                    <button
                      onClick={() => handleSelectDomainCard(domain)}
                      className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isCurrentlyActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>{isCurrentlyActive ? 'Coach Actif' : 'Ouvrir le Coach'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelectDomainCard(domain)}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>ACHETER LE DOMAINE</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. PARCOURS UTILISATEUR & SÉCURITÉ */}
      <section className="rounded-3xl bg-blue-50/60 border border-blue-100 p-6 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Parcours simple et transparent
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              Comment fonctionne INTELLIGENCE AFRICAINE ?
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-white border border-blue-100 shadow-xs">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs inline-flex items-center justify-center mb-2">
                1
              </span>
              <h4 className="font-bold text-xs text-slate-900">Connexion</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Créez votre compte en 1 minute</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-blue-100 shadow-xs">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs inline-flex items-center justify-center mb-2">
                2
              </span>
              <h4 className="font-bold text-xs text-slate-900">Choix du Domaine</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Agriculture, Élevage, BTP...</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-blue-100 shadow-xs">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs inline-flex items-center justify-center mb-2">
                3
              </span>
              <h4 className="font-bold text-xs text-slate-900">Paiement Mobile Money</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Orange, MTN, Wave, M-Pesa</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-blue-100 shadow-xs">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs inline-flex items-center justify-center mb-2">
                4
              </span>
              <h4 className="font-bold text-xs text-slate-900">Coach IA Débloqué</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Accès illimité à l'expert</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
