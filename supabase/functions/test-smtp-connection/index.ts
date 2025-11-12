// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import nodemailer from 'npm:nodemailer@6.9.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    console.log('📋 Auth header présent:', !!authHeader);
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Extraire le token du header
    const token = authHeader.replace('Bearer ', '');
    
    // Créer un client Supabase avec le token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { Authorization: authHeader } 
        },
        auth: {
          persistSession: false
        }
      }
    );

    // Vérifier le token avec getUser() qui utilise le token du header
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    console.log('👤 User récupéré:', user?.id, 'Error:', userError?.message);
    
    if (userError || !user) {
      console.error('❌ Auth error:', userError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Non authentifié. Veuillez vous reconnecter.',
          details: userError?.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Client avec SERVICE_ROLE key pour accéder aux fonctions RPC
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const { host, port, user: smtpUser, password, secure, userId, useExistingPassword } = await req.json();

    console.log('🔌 Test de connexion SMTP:', { host, port, user: smtpUser, secure, useExistingPassword });

    // Vérifier que user correspond à userId
    if (user.id !== userId) {
      throw new Error('Unauthorized');
    }

    let finalPassword = password;

    // Si useExistingPassword, récupérer et déchiffrer le mot de passe
    if (useExistingPassword && !password) {
      console.log('🔐 Récupération du mot de passe existant...');
      
      // Utiliser supabaseAdmin pour accéder aux données
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('user_settings')
        .select('smtp_password_encrypted')
        .eq('user_id', userId)
        .maybeSingle();

      if (settingsError || !settings?.smtp_password_encrypted) {
        console.error('❌ Erreur récupération settings:', settingsError);
        throw new Error('Mot de passe SMTP non trouvé');
      }

      // Déchiffrer le mot de passe avec supabaseAdmin
      const { data: decryptedPassword, error: decryptError } = await supabaseAdmin
        .rpc('decrypt_smtp_password', {
          encrypted_password: settings.smtp_password_encrypted,
          user_id: userId
        });

      if (decryptError || !decryptedPassword) {
        console.error('❌ Erreur déchiffrement:', decryptError);
        throw new Error('Impossible de déchiffrer le mot de passe');
      }

      finalPassword = decryptedPassword;
      console.log('✅ Mot de passe déchiffré');
    }

    if (!finalPassword) {
      throw new Error('Mot de passe requis');
    }

    // Tester la connexion SMTP avec Nodemailer
    console.log('📧 Tentative de connexion au serveur SMTP...');

    const transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: secure, // true pour 465, false pour 587
      auth: {
        user: smtpUser,
        pass: finalPassword,
      },
      // Timeout de 10 secondes
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    try {
      // Vérifier la connexion
      await transporter.verify();
      console.log('✅ Connexion SMTP réussie et vérifiée');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Connexion SMTP réussie'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (smtpError: any) {
      console.error('❌ Erreur SMTP:', smtpError);

      // Messages d'erreur plus explicites
      let errorMessage = 'Connexion échouée';
      
      if (smtpError.message?.includes('authentication failed') || 
          smtpError.message?.includes('Invalid credentials') ||
          smtpError.message?.includes('535') ||
          smtpError.responseCode === 535) {
        errorMessage = 'Authentification échouée. Vérifiez votre email et mot de passe.';
      } else if (smtpError.code === 'EAUTH') {
        errorMessage = 'Authentification échouée. Pour Gmail, utilisez un mot de passe d\'application.';
      } else if (smtpError.code === 'ECONNREFUSED' || smtpError.code === 'ETIMEDOUT') {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez l\'adresse et le port.';
      } else if (smtpError.code === 'ESOCKET' || smtpError.message?.includes('timeout')) {
        errorMessage = 'Délai d\'attente dépassé. Vérifiez votre connexion internet.';
      } else if (smtpError.message?.includes('TLS') || 
                 smtpError.message?.includes('SSL') ||
                 smtpError.code === 'ETLS') {
        errorMessage = 'Erreur de sécurité. Vérifiez le port (587 pour TLS, 465 pour SSL).';
      } else {
        errorMessage = smtpError.message || 'Erreur inconnue';
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200, // Toujours 200 pour que le client puisse lire l'erreur
        }
      );
    }
  } catch (error: any) {
    console.error('❌ Erreur:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur serveur'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});

