import { getGeminiClient, GEMINI_MODEL } from './gemini';
import { db } from './db';

export interface CoachDomainInfo {
  id: string;
  name: string;
  specialist: string;
  promptPersona: string;
}

export const DOMAIN_PERSONAS: Record<string, CoachDomainInfo> = {
  agriculture: {
    id: 'agriculture',
    name: 'AGRICULTURE',
    specialist: 'Dr. Kwame Osei (Agronome Panafricain)',
    promptPersona: `Vous êtes Dr. Kwame Osei, agronome expert en agriculture tropicale et agrobusiness rentable en Afrique.
Vous conseillez avec pragmatisme sur :
- Le maraîchage intensif (tomates, oignons, piments) et les cycles de culture en saison sèche et des pluies.
- L'irrigation économe (goutte-à-goutte gravitaire, pompage solaire, retenues d'eau).
- La régénération des sols tropicaux, le compostage accéléré et les biopesticides naturels (neem, piment, cendre).
- Les cultures de rente et vivrières (manioc, maïs, anacarde, soja).
- Le chiffrage budgétaire précis en FCFA / USD pour 1 demi-hectare, 1 hectare ou plus.`,
  },
  elevage: {
    id: 'elevage',
    name: 'ÉLEVAGE',
    specialist: 'Dr. Aminata Diallo (Vétérinaire Zootechnicienne)',
    promptPersona: `Vous êtes Dr. Aminata Diallo, vétérinaire zootechnicienne experte des exploitations en Afrique subsaharienne.
Vous conseillez avec précision sur :
- L'aviculture (poulets de chair croissance rapide, poules pondeuses, goliaths/locaux améliorés).
- La pisciculture intensive hors-sol (clarias / silure et tilapia en bacs bâchés ou bétonnés).
- La formulation d'aliments locaux à moindre coût (tourteaux de soja/coton, son de blé/riz, farine de poisson, drêches).
- Le calendrier de prophylaxie, vaccination et biosécurité pour éviter les épidémies (Gumboro, Newcastle).
- Le modèle de rentabilité, taux de conversion alimentaire et calcul de marge par sujet.`,
  },
  construction: {
    id: 'construction',
    name: 'CONSTRUCTION',
    specialist: 'Ing. Paul N’Dri (Ingénieur Génie Civil & BTP)',
    promptPersona: `Vous êtes l'Ingénieur Paul N’Dri, spécialiste du BTP, gros œuvre et économie de chantier en Afrique.
Vous conseillez avec rigueur technique sur :
- Le devis quantitatif et estimatif (nombre de briques de 15/20 creuses ou pleines, sacs de ciment CPJ 42.5/32.5, gravier, sable de lagune/rivière).
- Les fondations adaptées (sols marécageux, argile gonflante, longrines, radiers).
- Les dosages du béton armé (poteaux, poutres, dalles 350 kg/m³) et ferraillage HA.
- La construction écologique : briques de terre comprimée (BTC), toiture isolante et ventilation naturelle.
- Les astuces anti-coulage de matériaux et contrôle de fidélité des artisans/ouvriers.`,
  },
  informatique: {
    id: 'informatique',
    name: 'INFORMATIQUE',
    specialist: 'Mamadou Touré (Architecte Logiciel & Consultant Tech)',
    promptPersona: `Vous êtes Mamadou Touré, architecte cloud et développeur full-stack spécialisé dans les solutions technologiques africaines.
Vous conseillez avec expertise sur :
- L'intégration des passerelles de paiement Mobile Money (Orange Money, MTN MoMo, Wave, M-Pesa, SasPay) et la gestion robuste des webhooks.
- Le développement web et mobile adapté aux connexions intermittentes (PWA, offline-first, compression de bande passante).
- L'utilisation de l'intelligence artificielle pour automatiser les PME africaines.
- Les architectures cloud résilientes et économiques (Docker, serverless, VPS à coût maîtrisé).
- La commercialisation de prestations numériques et le freelancing international.`,
  },
  commerce: {
    id: 'commerce',
    name: 'COMMERCE & ENTREPRENEURIAT',
    specialist: 'Fatou Bamba (Consultante Croissance Commerciale & E-commerce)',
    promptPersona: `Vous êtes Fatou Bamba, consultante en stratégie commerciale, importation et scaling business en Afrique.
Vous conseillez avec acuité sur :
- Les stratégies de vente conversationnelle à fort taux de conversion sur WhatsApp Business, Facebook Ads et TikTok.
- L'importation groupée sécurisée depuis la Chine (1688, Alibaba) et la Turquie avec transitaires fiables.
- La gestion rigoureuse de la trésorerie (BFR, trésorerie de roulement, seuil de rentabilité sans fuite de cash).
- La formalisation juridique (statut de l'entreprenant, SARL sous droit OHADA, bancarisation).
- La politique de prix, marges nettes réelles et techniques de fidélisation client.`,
  },
};

export async function askAfricanCoach(params: {
  message: string;
  domainId?: string;
  userId?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}): Promise<{ reply: string; domainInfo?: CoachDomainInfo }> {
  const { message, domainId, userId, history = [] } = params;

  const domain = domainId ? DOMAIN_PERSONAS[domainId] : undefined;

  const systemInstruction = domain
    ? `${domain.promptPersona}

DIRECTIVES FONDAMENTALES :
1. Vous parlez au nom de INTELLIGENCE AFRICAINE.
2. Vos réponses doivent être concrètes, structurées, sans jargon inutile, avec des étapes actionnables (Étape 1, Étape 2...) et des estimations financières réalistes pour l'Afrique quand pertinent.
3. Donnez des recommandations adaptées au climat, au contexte logistique et aux réalités économiques locales.
4. Concluez toujours par un conseil d'action immédiat pour démarrer aujourd'hui.`
    : `Vous êtes le Coach IA Principal de INTELLIGENCE AFRICAINE (« Votre coach IA pour apprendre, développer et transformer vos projets en Afrique »).

Votre rôle est d'accueillir et d'orienter l'utilisateur avec bienveillance, dynamisme et rigueur intellectuelle.
Vous pouvez donner des conseils stratégiques généraux sur :
1. L'AGRICULTURE
2. L'ÉLEVAGE
3. LA CONSTRUCTION
4. L'INFORMATIQUE
5. LE COMMERCE & L'ENTREPRENEURIAT

DIRECTIVES :
- Répondez avec clarté, pertinence et un regard panafricain tourné vers le succès et l'action.
- Si la question de l'utilisateur porte en profondeur sur un domaine spécifique, apportez une réponse immédiatement utile, puis mentionnez qu'un programme de coaching dédié à ce domaine est accessible pour un accompagnement complet et personnalisé.`;

  const ai = getGeminiClient();

  if (ai) {
    try {
      // Build contents array including conversation history
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      for (const h of history.slice(-6)) {
        contents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        });
      }

      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI generation timeout')), 4000)
      );

      const response = await Promise.race([
        ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: contents as any,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        }),
        timeoutPromise,
      ]);

      const text = response.text?.trim();
      if (text) {
        return { reply: text, domainInfo: domain };
      }
    } catch (err: any) {
      console.warn('[Coach AI] Gemini generation error, using fallback:', err?.message || err);
    }
  }

  // High-value pragmatic fallback if Gemini is not configured or fails
  const fallbackReply = generateDomainFallbackReply(message, domainId);
  return { reply: fallbackReply, domainInfo: domain };
}

function generateDomainFallbackReply(message: string, domainId?: string): string {
  const q = message.toLowerCase();

  if (domainId === 'agriculture' || q.includes('agri') || q.includes('tomate') || q.includes('champs') || q.includes('irrigation')) {
    return `### Conseil Stratégique Agriculture — INTELLIGENCE AFRICAINE

Pour réussir et maximiser votre rentabilité agricole :

1. **Étude du calendrier et du sol** :
   - Réalisez un test de porosité et de pH avec du matériel simple avant tout labour.
   - En saison sèche, préférez le maraîchage court cycle (tomates, piments, concombres) où les prix sur le marché sont doublés.

2. **Système d'irrigation économique** :
   - Privilégiez le goutte-à-goutte gravitaire avec un réservoir surélevé de 1 000 à 2 000 litres.
   - Vous économisez 60% d'eau par rapport à l'arrosage manuel tout en ciblant directement les racines.

3. **Fertilisation organique locale** :
   - Associez fiente de volaille bien séchée, cendre de bois et compost de résidus végétaux pour limiter l'achat d'engrais chimiques coûteux.

**Action recommandée dès aujourd'hui** : Définissez votre superficie exacte et sécurisez votre point d'eau avant tout achat de semences certifiées.`;
  }

  if (domainId === 'elevage' || q.includes('poulet') || q.includes('poisson') || q.includes('pisciculture') || q.includes('clarias')) {
    return `### Conseil Stratégique Élevage — INTELLIGENCE AFRICAINE

Voici les piliers pour rentabiliser votre élevage en climat tropical :

1. **Maîtrise de l'alimentation (70% des charges)** :
   - Évitez les marques d'aliments surévaluées pour les phases de finition : intégrez des tourteaux locaux (soja, coton) et des sous-produits de meunerie.
   - Respectez un indice de consommation rigoureux (1.6 à 1.8 kg d'aliment pour 1 kg de poulet vif).

2. **Biosécurité & Prophylaxie** :
   - Pédiluve avec désinfectant à l'entrée du bâtiment obligatoire.
   - Vaccinations strictes (J3 Newcastle, J7 Gumboro, rappels) avec vitamines anti-stress lors des vagues de chaleur.

3. **Accès au marché avant la production** :
   - Identifiez vos restaurants, ménages ou grossistes 3 semaines avant la maturité des sujets pour éviter de nourrir des animaux prêts à vendre.

**Action recommandée dès aujourd'hui** : Calculez votre coût de revient prévisionnel par sujet pour fixer votre prix de vente avec au moins 30% de marge nette.`;
  }

  if (domainId === 'construction' || q.includes('ciment') || q.includes('devis') || q.includes('brique') || q.includes('maison')) {
    return `### Conseil Stratégique Construction — INTELLIGENCE AFRICAINE

Pour sécuriser et optimiser votre budget de construction :

1. **Contrôle strict des approvisionnements** :
   - Achetez le ciment en direct chez les distributeurs agréés par lots de 50 à 100 sacs pour négocier 5 à 8% de remise.
   - Pour les agglos de 15, un dosage standard nécessite environ 28 à 32 sacs de ciment pour 1 000 agglos vibrés.

2. **Fondations et sol** :
   - Ne commencez jamais sans avoir creusé les fouilles jusqu'au bon sol porteur. Sur sol argileux, une longrine de rigidité évite les fissures futures.

3. **Prévention des pertes sur chantier** :
   - Tenez un registre de sortie de chantier signé chaque soir : sacs de ciment utilisés, fers coupés et sable consommé.

**Action recommandée dès aujourd'hui** : Établissez un métré détaillé poste par poste (fondations, élévation, toiture) avant d'engager le moindre acompte artisan.`;
  }

  if (domainId === 'informatique' || q.includes('code') || q.includes('site') || q.includes('application') || q.includes('mobile money')) {
    return `### Conseil Stratégique Tech — INTELLIGENCE AFRICAINE

Pour développer des solutions technologiques à fort impact sur le continent :

1. **Mobile-First & Faible Consommation de Données** :
   - Concevez des applications ultra-légères avec mise en cache locale (PWA / offline-first).
   - Minimisez les dépendances lourdes pour garantir un affichage en moins de 2 secondes en 3G/4G.

2. **Intégration Mobile Money robuste** :
   - Prévoyez toujours une gestion asynchrone par webhooks avec système de retry et signature HMAC pour sécuriser les transactions.
   - Offrez au moins deux opérateurs majeurs (ex: Orange Money + Wave ou MTN MoMo) pour couvrir 90% des utilisateurs locaux.

3. **Monétisation B2B directe** :
   - Proposez des abonnements simples par pack ou par volume d'usage payables instantanément via Mobile Money.

**Action recommandée dès aujourd'hui** : Validez le prototype auprès de 5 utilisateurs réels avant de coder l'ensemble de l'architecture backend.`;
  }

  if (domainId === 'commerce' || q.includes('vente') || q.includes('import') || q.includes('whatsapp') || q.includes('prix')) {
    return `### Conseil Stratégique Commerce & Entrepreneuriat — INTELLIGENCE AFRICAINE

Pour accélérer vos ventes et sécuriser votre marge :

1. **Tunnel WhatsApp Business professionnel** :
   - Configurez un catalogue propre avec photos sur fond neutre et tarifs affichés sans ambiguïté.
   - Utilisez des réponses rapides et relancez les paniers abandonnés dans les 2 heures avec un message personnalisé.

2. **Sécurisation des importations** :
   - Ne payez jamais l'intégralité d'une marchandise inconnue d'avance sans inspection vidéo ou transitaire de confiance basé sur place à Guangzhou ou Yiwu.
   - Intégrez toujours les frais de douane et de transport au kilo/CBM dans votre calcul de marge unitaire.

3. **Règle d'or de la trésorerie** :
   - Séparez le compte bancaire/Mobile Money de l'entreprise de votre compte personnel. Réinvestissez 70% des bénéfices dans le stock qui tourne vite.

**Action recommandée dès aujourd'hui** : Listez vos 3 produits les plus rentables et contactez vos 10 derniers clients pour une offre de réachat immédiate.`;
  }

  return `### Bienvenue sur INTELLIGENCE AFRICAINE

Votre coach IA est opérationnel pour vous accompagner dans la structuration et la réussite de vos projets en Afrique.

Nos 5 domaines d'expertise stratégique :
1. 🌾 **AGRICULTURE** : Maraîchage, irrigation solaire, fertilisation bio et rentabilité des cultures tropicales.
2. 🐔 **ÉLEVAGE** : Aviculture rentable, pisciculture en bacs hors-sol, alimentation locale et prophylaxie.
3. 🏗️ **CONSTRUCTION** : Chiffrage devis, dosage béton/briques, fondations adaptées et économie de chantier.
4. 💻 **INFORMATIQUE** : Développement web/mobile, intégration Mobile Money et solutions numériques PME.
5. 💼 **COMMERCE & ENTREPRENEURIAT** : Vente sur WhatsApp, importations sécurisées et gestion rigoureuse de cash-flow.

Posez votre question spécifique ou choisissez l'un des domaines ci-dessous pour débloquer votre coaching d'expert dédié !`;
}
