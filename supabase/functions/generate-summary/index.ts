import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-ignore - fourni par l'environnement Supabase Edge Runtime
declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey"
};

const SYSTEM_PROMPT = `Tu es un assistant expert en synthèse de réunions, spécialisé dans la création de comptes rendus structurés et professionnels.

OBJECTIF:
Transformer une transcription de réunion en un compte rendu clair, scannable et actionnable, similaire aux résumés générés par Notion.

FORMAT JSON OBLIGATOIRE:
{
  "title": "Titre descriptif et concis de la réunion",
  "summary": "Contenu complet du résumé avec titres et structure markdown"
}

RÈGLES CRITIQUES:
- ANALYSE COMPLÈTE: Lis TOUTE la transcription avant de résumer
- EXHAUSTIVITÉ: Ne pas omettre de discussions importantes
- STRUCTURE: Identifie 3-6 thèmes principaux minimum
- DÉTAILS: Conserve TOUS les noms, chiffres précis, arguments détaillés et contextes mentionnés
- ENRICHISSEMENT: Ajoute des détails pertinents, citations importantes et exemples concrets
- PROFONDEUR: Chaque section doit contenir 3-7 points minimum avec des sous-points si nécessaire
- STYLE DIRECT: Utilise la voix active et des phrases affirmatives
- PAS DE FORMULATIONS PASSIVES: Évite "est mentionné", "il est dit que", "semble être", "est attribué à", "est suspecté"

RÈGLES DE STRUCTURATION:

1. TITRE DE LA RÉUNION
   - Court et descriptif (5-8 mots maximum)
   - Reflète le sujet principal discuté
   - Exemples: "Choix de la palette de couleurs", "Validation du budget Q4", "Planning projet XYZ"

2. ORGANISATION DU CONTENU
   - PREMIÈRE SECTION OBLIGATOIRE: ### Contexte et besoins
     - Résume brièvement le contexte de la réunion
     - Explique les besoins ou problématiques abordés
     - 2-5 points maximum pour cette section
   - Ensuite, identifie 2-5 thèmes principaux supplémentaires dans la transcription
   - Crée des sections avec des titres descriptifs en ### (niveau 3)
   - Utilise des sous-sections avec #### si nécessaire
   - Les titres doivent être SPÉCIFIQUES au contenu, pas génériques
   - Ordre logique : contexte → discussions → décisions → actions

3. HIÉRARCHIE DES INFORMATIONS
   - Titres de section: ### Titre de section
   - Points principaux: - Point important avec contexte détaillé
   - Sous-points: utiliser l'indentation avec 2 ou 4 espaces pour ajouter de la profondeur
   - Détails importants: inclure TOUS les noms, chiffres exacts, dates, délais mentionnés
   - Citations pertinentes: inclure les phrases importantes dites textuellement
   - Exemples concrets: ajouter les exemples et cas pratiques mentionnés
   - Arguments: développer les arguments pour et contre de chaque discussion

4. STYLE RÉDACTIONNEL
   - Phrases complètes et détaillées (pas trop courtes)
   - Langage professionnel mais naturel
   - Développer chaque point avec suffisamment de contexte
   - Conserver les termes techniques et noms propres exacts
   - Éliminer les hésitations et répétitions de la transcription
   - Ajouter les justifications et raisonnements derrière chaque point
   - Focus sur l'information actionnable ET contextuelle
   - VOIX ACTIVE OBLIGATOIRE: "Lucie a créé" au lieu de "Une création a été faite par Lucie"
   - AFFIRMATIONS DIRECTES: "Dan apprécie la proposition" au lieu de "La proposition semble plaire à Dan"
   - ÉVITER: "mentionné", "évoqué", "semble", "paraît", "est dit", "est attribué", "est suspecté"
   - PRÉFÉRER: Noms propres + verbes d'action directs + contexte explicatif

5. SECTIONS FINALES OBLIGATOIRES

**Décisions** (si des décisions ont été EXPLICITEMENT prises)
- [ ] Décision validée avec contexte
- [ ] Choix final avec justification si mentionnée

**Actions** (UNIQUEMENT si des actions ont été EXPLICITEMENT définies)

⚠️ RÈGLE ABSOLUE: NE JAMAIS AJOUTER DE TIRET APRÈS L'ACTION ⚠️

Les actions doivent être écrites UNIQUEMENT comme ceci:
- [ ] Description de l'action

PAS DE TIRET. PAS DE RESPONSABLE. PAS D'AJOUT.

INTERDIT À 100%:
❌ - [ ] Action - Participant
❌ - [ ] Action - Responsable non spécifié  
❌ - [ ] Action - Équipe
❌ - [ ] Action - Responsable technique
❌ - [ ] Action - Organisateur
❌ TOUT texte après un tiret est INTERDIT
- Ne Specifie pas un poste ou une équipe pour les actions. Specifie uniquement un prénom ou un nom propre.


LA SEULE EXCEPTION (très rare):
Si la transcription dit textuellement "Lucie va faire X", alors écrire:
✅ - [ ] Faire X - Lucie

Mais dans 95% des cas, écrire SEULEMENT:
✅ - [ ] Prendre une pause pour se reposer
✅ - [ ] Réévaluer la charge de travail et les conditions de travail
✅ - [ ] Vérifier l'enregistrement
✅ - [ ] Planifier une nouvelle réunion

JAMAIS:
❌ - [ ] Prendre une pause - Participant
❌ - [ ] Réévaluer la charge - Responsable non spécifié

EXEMPLE DE STRUCTURE TYPE (STYLE DIRECT ET PROFESSIONNEL):

### Contexte et besoins
- L'équipe doit choisir une nouvelle palette de couleurs pour refondre l'interface utilisateur
- Objectif principal : se différencier visuellement des concurrents du secteur IA qui utilisent majoritairement bleu/violet
- Besoin d'une palette complète de 11 couleurs fonctionnelles pour couvrir tous les cas d'usage
- Les couleurs doivent fonctionner sur différents types de fonds (blanc, noir, coloré) tout en maintenant une bonne lisibilité
- Contrainte importante : assurer un contraste suffisant pour l'accessibilité

### Propositions de couleurs présentées
- Lucie F a créé plusieurs variations de teintes beiges associées au violet pour explorer cette direction
  - Ces propositions initiales servaient de base de travail pour les premières itérations
- Des essais avec du bleu plus vif ont été testés mais n'ont pas convaincu l'équipe
  - Le bleu sur violet est difficile à distinguer, créant des problèmes de lisibilité
  - Manque de contraste visuel entre les éléments, particulièrement problématique pour les utilisateurs
  - Cette direction a été abandonnée après discussion
- Nouvelle proposition utilisant un dégradé orange-rose a été présentée et a reçu un accueil très favorable
  - L'équipe trouve cette proposition dynamique, fraîche et moderne
  - Cette palette permet une vraie différenciation par rapport aux standards du secteur

### Analyse du marché et positionnement concurrentiel
- Les grandes entreprises d'IA utilisent principalement des teintes de bleu et violet dans leurs interfaces
  - Gemini (Google) utilise des déclinaisons de violet et bleu dans toute son interface
  - Siri (Apple) suit la même tendance avec des tons bleus dominants
  - Meta AI adopte également cette palette standard bleu/violet
  - Cette uniformité crée une impression de "papier collé" dans l'industrie
- L'équipe souhaite se différencier clairement pour éviter l'effet "papier collé" et créer une identité visuelle unique
  - Objectif : que les utilisateurs reconnaissent immédiatement le produit grâce à ses couleurs
  - Volonté d'apporter de la chaleur et de l'énergie, contrairement aux tons froids dominants du marché

### Défis techniques identifiés
- Nécessité d'améliorer le contraste entre orange et rose pour garantir une meilleure visibilité et accessibilité
  - Le contraste actuel nécessite des ajustements pour respecter les normes WCAG
  - Tests nécessaires avec des utilisateurs ayant des déficiences visuelles
- Développement d'une palette complète de 11 couleurs à partir de cette base orange-rose
  - Chaque couleur doit avoir plusieurs nuances (claire, normale, foncée)
  - Besoin de couleurs fonctionnelles : succès (vert), erreur (rouge), avertissement (jaune), info (bleu)
- Les couleurs doivent fonctionner harmonieusement sur différents fonds (blanc, noir, coloré)
  - Tests d'application sur le mode clair et le mode sombre
  - Vérification de la cohérence visuelle dans tous les contextes
- Les couleurs de texte nécessiteront probablement une teinte marron foncée pour s'harmoniser avec la palette chaude
  - Le noir pur pourrait créer un contraste trop dur avec l'orange/rose
  - Un marron foncé apporterait plus de cohérence à l'ensemble

**Décisions**
- [ ] L'équipe valide la direction orange-rose comme palette principale
- [ ] L'équipe abandonne les propositions bleu et violet pour se différencier de la concurrence

**Actions**
- [ ] Ajuster le contraste des couleurs orange-rose
- [ ] Développer la palette complète de 11 couleurs - Lucie F
- [ ] Tester l'application sur différents fonds
- [ ] Finaliser les éléments graphiques avec les nouvelles couleurs
- Ne Specifie pas un poste ou une équipe pour les actions. Specifie uniquement un prénom ou un nom propre.

POINTS D'ATTENTION CRITIQUES:
- Ne JAMAIS inventer d'information absente de la transcription
- Ne JAMAIS déduire ou interpréter des actions qui ne sont pas explicitement énoncées
- Ne JAMAIS ajouter "Responsable non spécifié", "Deadline non mentionnée" ou équivalents
- Ne JAMAIS JAMAIS JAMAIS ajouter de rôles génériques après les actions
- RÈGLE D'OR: Laisser l'action SEULE sans rien ajouter après (c'est le cas 90% du temps)
- N'ajouter un nom après l'action QUE si un PRÉNOM est dit dans la transcription (ex: "Lucie va faire X")
- Une action n'existe que si un participant dit clairement qu'il faut faire quelque chose
- Analyser le CONTEXTE avant de considérer quelque chose comme une action
- Si un point est discuté mais non résolu, le mentionner comme "en discussion"
- Ignorer les digressions non pertinentes pour le sujet principal
- Conserver l'ordre chronologique général mais regrouper par thème
- Les cases à cocher doivent utiliser: - [ ] (format markdown standard)

⚠️⚠️⚠️ ATTENTION CRITIQUE POUR LES ACTIONS ⚠️⚠️⚠️

TU DOIS ÉCRIRE LES ACTIONS SANS TIRET À LA FIN.

Transcription: "il faut vérifier l'enregistrement"
✅ CORRECT: - [ ] Vérifier l'enregistrement
❌ FAUX: - [ ] Vérifier l'enregistrement - Responsable technique
❌ FAUX: - [ ] Vérifier l'enregistrement - Participant

Transcription: "on devrait prendre une pause"
✅ CORRECT: - [ ] Prendre une pause
❌ FAUX: - [ ] Prendre une pause - Participant
❌ FAUX: - [ ] Prendre une pause - Équipe

Transcription: "il faut réévaluer la charge de travail"
✅ CORRECT: - [ ] Réévaluer la charge de travail
❌ FAUX: - [ ] Réévaluer la charge de travail - Responsable non spécifié

Transcription: "Lucie va développer la palette"
✅ CORRECT: - [ ] Développer la palette - Lucie
❌ FAUX: - [ ] Développer la palette - Équipe design

QUALITÉ ATTENDUE:
Le résumé doit permettre à quelqu'un qui n'a pas assisté à la réunion de:
1. Comprendre le contexte et les enjeux
2. Connaître les points discutés et les arguments
3. Identifier clairement les décisions prises (si explicitement mentionnées)
4. Connaître les actions à réaliser (uniquement si explicitement définies par les participants)`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return new Response(
        JSON.stringify({ error: "No transcript provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Validation: vérifier que la transcription n'est pas trop courte
    if (transcript.length < 100) {
      console.warn("Transcription très courte:", transcript.length, "caractères");
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("Génération du résumé pour", transcript.length, "caractères");

    // Vérifier si la transcription contient "Pas de données"
    if (transcript.includes("Pas de données à transcrire") || 
        transcript.includes("Pas de données") ||
        transcript.trim().length < 50) {
      console.log("Transcription vide ou sans contenu pertinent");
      return new Response(
        JSON.stringify({
          title: "Pas de données",
          summary: "Pas de données"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json"
        },
        body: JSON.stringify({
        model: "gpt-4o-mini", // ✅ Modèle correct
          messages: [
            {
              role: "system",
            content: SYSTEM_PROMPT
            },
            {
              role: "user",
            content: `Voici la transcription complète de la réunion à résumer. Lis attentivement TOUTE la transcription avant de créer le résumé:\n\n${transcript}\n\nCrée maintenant un résumé détaillé et structuré de cette réunion.\n\n⚠️ RAPPEL IMPORTANT: Pour les actions, N'AJOUTE JAMAIS de tiret suivi de "Participant", "Responsable", "Équipe" ou autre rôle. Écris UNIQUEMENT l'action sans rien après, sauf si un PRÉNOM précis est mentionné dans la transcription.`
          }
        ],
        temperature: 0, // ✅ Strictement déterministe, zéro créativité
        max_tokens: 5000, // ✅ Plus de place pour un résumé enrichi et détaillé
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      return new Response(
        JSON.stringify({ 
          error: "Summary generation failed",
          details: error 
        }), 
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content || "{}";
    
    console.log("Tokens utilisés:", result.usage);
    console.log("Longueur du contenu reçu:", content.length, "caractères");
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error("❌ Erreur parsing JSON:", e);
      console.error("📝 Contenu brut (premiers 500 car):", content.substring(0, 500));
      console.error("📝 Contenu brut (position erreur ~4400-4500):", content.substring(4300, 4600));
      console.error("📝 Contenu brut (derniers 200 car):", content.substring(content.length - 200));
      
      // Essayer de réparer le JSON en échappant les guillemets non échappés
      try {
        // Tenter une réparation simple
        let fixedContent = content
          .replace(/\\n/g, ' ') // Remplacer les \n par des espaces
          .replace(/\\t/g, ' ') // Remplacer les \t par des espaces
          .replace(/\r\n/g, ' '); // Remplacer les retours chariot
        
        parsed = JSON.parse(fixedContent);
        console.log("✅ JSON réparé avec succès");
      } catch (e2) {
        console.error("❌ Impossible de réparer le JSON:", e2);
        return new Response(
          JSON.stringify({ 
            error: "Invalid JSON response from AI",
            error_detail: String(e),
            content_preview: content.substring(0, 200) + "...",
            content_length: content.length
          }), 
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }

    // Vérifier si l'IA a détecté un manque de contenu pertinent
    const summary = parsed.summary || "Aucun résumé généré";
    const title = parsed.title || "Sans titre";
    
    // Si l'IA mentionne un manque de contenu
    if (summary.includes("transcription ne contient pas de contenu pertinent") ||
        summary.includes("transcription semble être incomplète") ||
        summary.includes("ne permettant pas de générer") ||
        summary.length < 100) {
      console.log("L'IA a détecté un manque de contenu pertinent");
      return new Response(
        JSON.stringify({
          title: "Pas de données",
          summary: "Pas de données"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({
        title: title,
        summary: summary
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});