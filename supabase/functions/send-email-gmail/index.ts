import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64
    contentType: string;
  }>;
}

// Fonction pour encoder en base64url (sans padding) - ROBUSTE avec chunking
function base64UrlEncode(data: Uint8Array): string {
  const chunkSize = 32768; // 32KB chunks pour éviter memory limit
  let base64 = '';
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, Math.min(i + chunkSize, data.length));
    const chunkArray = Array.from(chunk);
    base64 += btoa(String.fromCharCode.apply(null, chunkArray));
  }
  
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Fonction pour créer un message MIME ROBUSTE avec multipart
function createMimeMessage(
  to: string,
  subject: string,
  html: string,
  attachments?: EmailRequest['attachments']
): string {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  const lines: string[] = [];
  
  // Headers principaux
  lines.push(`To: ${to}`);
  lines.push(`Subject: ${subject}`);
  lines.push('MIME-Version: 1.0');
  lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  lines.push('');
  
  // Partie HTML
  lines.push(`--${boundary}`);
  lines.push('Content-Type: text/html; charset="UTF-8"');
  lines.push('Content-Transfer-Encoding: quoted-printable');
  lines.push('');
  lines.push(html);
  lines.push('');
  
  // Pièces jointes
  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      lines.push(`--${boundary}`);
      lines.push(`Content-Type: ${att.contentType}; name="${att.filename}"`);
      lines.push('Content-Transfer-Encoding: base64');
      lines.push(`Content-Disposition: attachment; filename="${att.filename}"`);
      lines.push('');
      
      // Découper le base64 en lignes de 76 caractères (standard RFC)
      const base64Content = att.content;
      for (let i = 0; i < base64Content.length; i += 76) {
        lines.push(base64Content.substring(i, i + 76));
      }
      lines.push('');
    }
  }
  
  // Fermeture
  lines.push(`--${boundary}--`);
  
  return lines.join('\r\n');
}

// Fonction pour rafraîchir le token d'accès
async function refreshAccessToken(
  refreshToken: string, 
  clientId: string, 
  clientSecret: string
): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Token refresh error:', error);
    throw new Error('Failed to refresh access token');
  }

  return await response.json();
}

// Fonction pour envoyer le message via Gmail API
async function sendGmailMessage(
  accessToken: string, 
  message: { raw: string }
): Promise<{ id: string; threadId: string }> {
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Gmail API error:', error);
    throw new Error(`Gmail API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('🚀 [Gmail] Début du traitement');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer l'utilisateur authentifié
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('✅ [Gmail] User authentifié:', user.email);

    // Récupérer les paramètres de l'email
    const emailRequest: EmailRequest = await req.json();
    const { to, subject, html, attachments } = emailRequest;

    console.log('📧 [Gmail] Destinataire:', to);
    console.log('📧 [Gmail] Sujet:', subject);
    console.log('📎 [Gmail] Nombre de PJ:', attachments?.length || 0);

    // Vérifier la taille totale des pièces jointes (limite: 10MB pour Edge Functions)
    if (attachments && attachments.length > 0) {
      // Vérifier le nombre de PJ
      if (attachments.length > 10) {
        throw new Error(
          `Trop de pièces jointes (${attachments.length}). ` +
          `Maximum: 10 fichiers par email.`
        );
      }
      
      const totalSize = attachments.reduce((sum, att) => {
        // Le base64 est déjà encodé, calculer la taille réelle
        const estimatedSize = (att.content.length * 3) / 4;
        return sum + estimatedSize;
      }, 0);
      
      // Limite réduite à 10MB pour éviter memory limit des Edge Functions
      // (le message MIME + encodage peut faire x3 en mémoire)
      const maxSize = 10 * 1024 * 1024; // 10MB
      const totalMB = Math.round(totalSize / 1024 / 1024 * 10) / 10;
      
      console.log(`📎 [Gmail] Taille totale des PJ: ${totalMB}MB (${attachments.length} fichiers)`);
      
      if (totalSize > maxSize) {
        throw new Error(
          `Les pièces jointes sont trop volumineuses (${totalMB}MB). ` +
          `Limite pour Edge Functions: 10MB. ` +
          `\n\nSolutions:\n` +
          `• Réduire la taille des fichiers\n` +
          `• Envoyer en plusieurs emails\n` +
          `• Utiliser un service de partage (Google Drive, Dropbox, etc.)`
        );
      }
    }

    // Récupérer les tokens Gmail de l'utilisateur
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('gmail_access_token, gmail_refresh_token, gmail_token_expiry, gmail_connected')
      .eq('user_id', user.id)
      .maybeSingle();

    if (settingsError || !settings) {
      throw new Error('Impossible de récupérer les paramètres Gmail');
    }

    if (!settings.gmail_connected || !settings.gmail_refresh_token) {
      throw new Error('Gmail non connecté. Veuillez vous connecter à Gmail dans les Paramètres.');
    }

    console.log('🔑 [Gmail] Tokens récupérés');

    // Vérifier et rafraîchir le token si nécessaire
    let accessToken = settings.gmail_access_token;
    const now = new Date();
    const expiry = settings.gmail_token_expiry ? new Date(settings.gmail_token_expiry) : null;

    if (!accessToken || !expiry || expiry <= now) {
      console.log('🔄 [Gmail] Rafraîchissement du token nécessaire');
      
      const clientId = Deno.env.get('GMAIL_CLIENT_ID')!;
      const clientSecret = Deno.env.get('GMAIL_CLIENT_SECRET')!;

      const tokenData = await refreshAccessToken(
        settings.gmail_refresh_token,
        clientId,
        clientSecret
      );

      accessToken = tokenData.access_token;
      const expiryDate = new Date(now.getTime() + tokenData.expires_in * 1000);

      console.log('✅ [Gmail] Token rafraîchi');

      // Mettre à jour le token en base
      await supabase
        .from('user_settings')
        .update({
          gmail_access_token: accessToken,
          gmail_token_expiry: expiryDate.toISOString(),
        })
        .eq('user_id', user.id);
    } else {
      console.log('✅ [Gmail] Token valide');
    }

    // Créer le message MIME
    console.log('📝 [Gmail] Construction du message MIME...');
    const mimeMessage = createMimeMessage(to, subject, html, attachments);
    
    console.log(`📏 [Gmail] Taille du message: ${Math.round(mimeMessage.length / 1024)}KB`);

    // Encoder en base64url
    console.log('🔐 [Gmail] Encodage base64url...');
    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(mimeMessage);
    const encodedMessage = base64UrlEncode(messageBytes);

    console.log(`📏 [Gmail] Message encodé: ${Math.round(encodedMessage.length / 1024)}KB`);

    // Envoyer via Gmail API
    console.log('📤 [Gmail] Envoi via Gmail API...');
    const result = await sendGmailMessage(accessToken, { raw: encodedMessage });

    console.log('✅ [Gmail] Email envoyé avec succès!', result.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.id,
        threadId: result.threadId,
        message: 'Email envoyé avec succès via Gmail'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ [Gmail] Erreur:', error);
    
    // Messages d'erreur clairs pour l'utilisateur
    let userMessage = error.message;
    
    if (error.message.includes('Unauthorized')) {
      userMessage = 'Session expirée. Veuillez vous reconnecter.';
    } else if (error.message.includes('Gmail non connecté')) {
      userMessage = 'Gmail non connecté. Allez dans Paramètres > Méthode d\'envoi email > Connecter Gmail.';
    } else if (error.message.includes('trop volumineuses')) {
      // Garder le message tel quel (déjà clair)
    } else if (error.message.includes('Gmail API error')) {
      userMessage = 'Erreur Gmail API. Vérifiez que votre compte Gmail est bien connecté.';
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: userMessage,
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
