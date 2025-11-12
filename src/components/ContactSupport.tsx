import { useState, useEffect } from 'react';
import { Mail, Upload, Send, CheckCircle, AlertCircle, Loader2, X, Image as ImageIcon, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SUPPORT_EMAIL = 'support@hallia.ai';
const SUPPORT_STORAGE_BUCKET = 'Compte-rendu';
const SUPPORT_STORAGE_PREFIX = 'support-tickets';

const sanitizeFilename = (filename: string, fallbackExt = 'png') => {
  if (!filename) {
    return `capture.${fallbackExt}`;
  }

  const parts = filename.split('.');
  const rawExt = parts.length > 1 ? parts.pop() : null;
  const extension = (rawExt ?? fallbackExt).toLowerCase().replace(/[^a-z0-9]/g, '') || fallbackExt;
  const rawBase = parts.join('.') || 'capture';
  const base = rawBase.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '') || 'capture';

  return `${base}.${extension}`;
};

interface ContactSupportProps {
  userId: string;
  userEmail?: string;
  reloadTrigger?: number;
}

type ProblemCategory = 'feature' | 'quota' | 'bug' | 'other';

interface EmailConfig {
  method: 'gmail' | 'smtp' | 'local';
  email: string;
  isConfigured: boolean;
}

export const ContactSupport = ({ userId, userEmail, reloadTrigger }: ContactSupportProps) => {
  console.log('✅ ContactSupport: Rendu du composant, userId:', userId);
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProblemCategory>('feature');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [successContext, setSuccessContext] = useState<'direct' | 'local'>('direct');

  // Créer les URLs de preview pour les screenshots
  useEffect(() => {
    // Créer les nouvelles URLs
    const newUrls = screenshots.map(file => URL.createObjectURL(file));
    setPreviewUrls(newUrls);
    
    // Cleanup: révoquer les URLs quand le composant se démonte ou que screenshots change
    return () => {
      newUrls.forEach(url => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenshots]);

  // Charger la configuration email au démarrage et quand on revient sur la page
  useEffect(() => {
    console.log('🔄 Contact: trigger de rechargement (trigger:', reloadTrigger, ')');
    loadEmailConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, reloadTrigger]);

  const loadEmailConfig = async () => {
    if (!userId) {
      console.warn('❌ Contact: userId non défini');
      setIsLoadingConfig(false);
      return;
    }
    
    setIsLoadingConfig(true);
    try {
      console.log('🔍 Contact: Chargement config pour userId:', userId);
      const { data: settings } = await supabase
        .from('user_settings')
        .select('email_method, smtp_user, gmail_email, gmail_connected')
        .eq('user_id', userId)
        .maybeSingle();

      if (settings) {
        const method = (settings.email_method as 'gmail' | 'smtp' | 'local') || 'local';
        const resolvedEmail =
          method === 'gmail' && settings.gmail_connected
            ? settings.gmail_email || userEmail || ''
            : method === 'smtp'
              ? settings.smtp_user || userEmail || ''
              : userEmail || settings.smtp_user || '';

        const isConfigured =
          method === 'gmail'
            ? !!settings.gmail_connected
            : method === 'smtp'
              ? !!settings.smtp_user
              : !!(resolvedEmail && resolvedEmail.trim().length > 0);

        setEmailConfig({
          method,
          email: resolvedEmail,
          isConfigured,
        });
      } else {
        const fallbackEmail = userEmail || '';
        setEmailConfig({
          method: 'local',
          email: fallbackEmail,
          isConfigured: !!(fallbackEmail && fallbackEmail.trim().length > 0),
        });
      }
    } catch (error) {
      console.error('Erreur chargement config email:', error);
      setEmailConfig({
        method: 'local',
        email: userEmail || '',
        isConfigured: false
      });
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const categories = [
    { id: 'feature' as const, label: 'Demande de fonctionnalité', icon: '✨' },
    { id: 'quota' as const, label: 'Question quota', icon: '📊' },
    { id: 'bug' as const, label: 'Problème technique', icon: '🐛' },
    { id: 'other' as const, label: 'Autre', icon: '💬' },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      alert('Seules les images sont acceptées (PNG, JPG, GIF, etc.)');
    }
    
    // Limiter à 3 fichiers max
    const newScreenshots = [...screenshots, ...imageFiles].slice(0, 3);
    setScreenshots(newScreenshots);
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== index));
  };

  const uploadScreenshotsAndGetLinks = async (files: File[], sanitizedNames: string[]): Promise<string[]> => {
    if (!userId) {
      throw new Error('Utilisateur non authentifié. Veuillez vous reconnecter.');
    }

    if (files.length === 0) {
      return [];
    }

    const urls: string[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sanitizedName = sanitizedNames[i] || sanitizeFilename(file.name, 'png');
      const uniquePath = `${userId}/${SUPPORT_STORAGE_PREFIX}/${timestamp}_${i}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from(SUPPORT_STORAGE_BUCKET)
        .upload(uniquePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'image/png',
        });

      if (uploadError) {
        console.error('❌ Erreur upload capture support:', uploadError);
        throw new Error("Erreur lors de l'upload des captures d'écran. Veuillez réessayer ou retirer les captures.");
      }

      const { data: publicData } = supabase.storage
        .from(SUPPORT_STORAGE_BUCKET)
        .getPublicUrl(uniquePath);

      if (!publicData?.publicUrl) {
        console.error('❌ Impossible de générer le lien public pour la capture:', uniquePath);
        throw new Error('Impossible de générer les liens des captures d\'écran. Veuillez réessayer.');
      }

      urls.push(publicData.publicUrl);
    }

    return urls;
  };

  const convertScreenshotsToBase64 = async (files: File[], sanitizedNames: string[]) => {
    if (files.length === 0) {
      return [];
    }

    const attachments: Array<{ filename: string; content: string; contentType: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sanitizedName = sanitizedNames[i] || sanitizeFilename(file.name, 'png');

      const base64Content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });

      attachments.push({
        filename: sanitizedName,
        content: base64Content,
        contentType: file.type || 'image/png',
      });
    }

    return attachments;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !subject.trim() || !message.trim()) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      return;
    }

    if (!emailConfig) {
      setErrorMessage('Impossible de déterminer la méthode d\'envoi. Veuillez recharger la page.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      return;
    }

    if (emailConfig.method !== 'local' && !emailConfig.isConfigured) {
      setErrorMessage('Veuillez configurer votre méthode d\'envoi d\'email dans les paramètres avant d\'envoyer un message.');
      setShowError(true);
      setTimeout(() => setShowError(false), 8000);
      return;
    }

    if (emailConfig.method === 'local' && (!emailConfig.email || !emailConfig.email.trim())) {
      setErrorMessage('Nous n\'avons pas trouvé votre adresse email. Veuillez vérifier vos informations ou choisir une autre méthode d\'envoi.');
      setShowError(true);
      setTimeout(() => setShowError(false), 8000);
      return;
    }

    setIsSending(true);
    setShowError(false);

    try {
      const sanitizedNames = screenshots.map((file, index) =>
        sanitizeFilename(file?.name || `capture_${index + 1}.png`, 'png')
      );

      let screenshotReferences: string[] = [];
      let screenshotAttachments: Array<{ filename: string; content: string; contentType: string }> = [];

      if (screenshots.length > 0) {
        if (emailConfig.method === 'local') {
          screenshotReferences = await uploadScreenshotsAndGetLinks(screenshots, sanitizedNames);
        } else {
          screenshotAttachments = await convertScreenshotsToBase64(screenshots, sanitizedNames);
          screenshotReferences = sanitizedNames;
        }
      }

      const insertPayload = {
        user_id: userId,
        name: name.trim(),
        email: emailConfig.email,
        category,
        subject: subject.trim(),
        message: message.trim(),
        screenshots: screenshotReferences,
        status: 'new' as const,
      };

      const { data: insertedTicket, error: insertError } = await supabase
        .from('support_tickets')
        .insert(insertPayload)
        .select('id')
        .single();

      if (insertError) {
        throw insertError;
      }

      const ticketId = insertedTicket?.id;

      try {
        await supabase.functions.invoke('support-auto-reply', {
          body: {
            to: emailConfig.email,
            name: name.trim() || undefined,
            ticketId,
          },
        });
      } catch (autoReplyError) {
        console.error('Erreur envoi réponse automatique:', autoReplyError);
      }

      const categoryLabels: Record<string, string> = {
        feature: 'Demande de fonctionnalité',
        quota: 'Question quota',
        bug: 'Problème technique',
        other: 'Autre',
      };

      if (emailConfig.method === 'local') {
        const subjectLine = `[Support] ${categoryLabels[category] || category} - ${subject.trim()}`;
        const bodyLines: string[] = [
          'Bonjour Hallia,',
          '',
          `Nom : ${name.trim()}`,
          `Email : ${emailConfig.email}`,
          `Catégorie : ${categoryLabels[category] || category}`,
        ];

        if (ticketId) {
          bodyLines.push(`Ticket ID : ${ticketId}`);
        }

        bodyLines.push('', message.trim());

        if (screenshotReferences.length > 0) {
          bodyLines.push('', 'Captures d\'écran :');
          screenshotReferences.forEach((url, index) => {
            bodyLines.push(`${index + 1}. ${url}`);
          });
          bodyLines.push('', 'Note : Ces captures sont partagées sous forme de liens cliquables (aucune pièce jointe).');
        }

        bodyLines.push('', '---', "Envoyé depuis l'application Hallia Réunions");

        const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

        window.open(mailtoUrl, '_blank');

        setSuccessContext('local');
      } else {
        const { data: userSettings } = await supabase
          .from('user_settings')
          .select('email_method, smtp_host, smtp_port, smtp_user, smtp_password_encrypted, smtp_secure, gmail_connected')
          .eq('user_id', userId)
          .maybeSingle();

        if (!userSettings) {
          throw new Error('Configuration email non trouvée. Veuillez configurer votre méthode d\'envoi d\'email dans les paramètres.');
        }

        const categoryLabel = categoryLabels[category] || category;

        let emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #F97316;">Nouveau message de support</h2>
            
            <div style="background: #FFF7ED; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>De :</strong> ${name}</p>
              <p><strong>Email :</strong> ${emailConfig.email}</p>
              <p><strong>Catégorie :</strong> ${categoryLabel}</p>
              ${ticketId ? `<p><strong>Ticket ID :</strong> ${ticketId}</p>` : ''}
              <p><strong>Sujet :</strong> ${subject}</p>
            </div>
            
            <div style="background: #ffffff; padding: 20px; border: 1px solid #FDBA74; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #9A3412; margin-top: 0;">Message :</h3>
              <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
            </div>
        `;

        if (screenshotAttachments.length > 0) {
          const attachmentList = screenshotAttachments
            .map((att, index) => `<li>${index + 1}. ${att.filename}</li>`)
            .join('');
          emailBody += `
            <div style="margin: 20px 0;">
              <h3 style="color: #9A3412;">Pièces jointes :</h3>
              <p style="color: #78716C;">📎 ${screenshotAttachments.length} fichier(s) joint(s).</p>
              <ul style="margin: 8px 0 0 18px; color: #9A3412;">${attachmentList}</ul>
            </div>
          `;
        }

        emailBody += `
            <hr style="border: none; border-top: 1px solid #FDBA74; margin: 30px 0;">
            <p style="color: #78716C; font-size: 12px;">
              Ce message a été envoyé depuis l'application Hallia Réunions<br>
              User ID: ${userId}<br>
              Ticket ID: ${ticketId ?? 'N/A'}
            </p>
          </div>
        `;

        const attachmentsListText = screenshotAttachments.length > 0
          ? `\nCaptures d'écran (${screenshotAttachments.length}) :\n${screenshotAttachments.map((att, index) => `${index + 1}. ${att.filename}`).join('\n')}\n`
          : '';

        const textBody = `
Support Hallia - ${categoryLabel}
Ticket ID: ${ticketId ?? 'N/A'}

De : ${name}
Email : ${emailConfig.email}
Catégorie : ${categoryLabel}
Sujet : ${subject}

Message :
${message}

${attachmentsListText}
---
Ce message a été envoyé depuis l'application Hallia Réunions
User ID: ${userId}
        `.trim();

        const emailFunction = emailConfig.method === 'gmail' ? 'send-email-gmail' : 'send-email-smtp';

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }

        const requestBody = emailFunction === 'send-email-gmail'
          ? {
              to: SUPPORT_EMAIL,
              subject: `[Support] ${categoryLabel} - ${subject}`,
              html: emailBody,
              attachments: screenshotAttachments,
            }
          : {
              userId,
              to: [SUPPORT_EMAIL],
              subject: `[Support] ${categoryLabel} - ${subject}`,
              htmlBody: emailBody,
              textBody,
              attachments: screenshotAttachments,
            };

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${emailFunction}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
          throw new Error(error.error || error.details || 'Erreur lors de l\'envoi de l\'email au support');
        }

        setSuccessContext('direct');
      }

      setShowSuccess(true);
      setName('');
      setCategory('feature');
      setSubject('');
      setMessage('');
      setScreenshots([]);
      setTimeout(() => setShowSuccess(false), 5000);

    } catch (error: any) {
      console.error('Erreur lors de l\'envoi:', error);
      setErrorMessage(error.message || 'Une erreur est survenue lors de l\'envoi');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-coral-200 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-coral-500 to-sunset-500 rounded-xl">
          <Mail className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-cocoa-900">Support</h2>
          <p className="text-sm text-cocoa-600">Nous sommes là pour vous aider !</p>
        </div>
      </div>

      {/* Message de succès */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-start gap-3 animate-scaleIn">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-green-900">
              {successContext === 'local' ? 'Brouillon prêt dans votre application email' : 'Message envoyé avec succès !'}
            </p>
            <p className="text-sm text-green-700 mt-1">
              {successContext === 'local'
                ? "Votre application email s'est ouverte avec un nouveau message. Vérifiez le contenu puis cliquez sur Envoyer pour finaliser la demande."
                : (
                  <>
                    Notre équipe vous répondra dans les plus brefs délais à l'adresse <strong>{emailConfig?.email}</strong>
                  </>
                )}
            </p>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {showError && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3 animate-scaleIn">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-900">Erreur</p>
            <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Configuration email */}
      {isLoadingConfig ? (
        <div className="mb-6 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
          <p className="text-sm text-gray-600">Chargement de la configuration...</p>
        </div>
      ) : emailConfig && emailConfig.isConfigured ? (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex items-center gap-2">
              {emailConfig.method === 'gmail' ? (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.545l8.073-6.052C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
                </svg>
              ) : emailConfig.method === 'smtp' ? (
                <Globe className="w-6 h-6 text-blue-600" />
              ) : (
                <Mail className="w-6 h-6 text-coral-600" />
              )}
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {emailConfig.method === 'gmail'
                    ? 'Mon compte Gmail'
                    : emailConfig.method === 'smtp'
                      ? 'SMTP configuré'
                      : 'Mon application email'}
                </p>
                <p className="text-xs text-gray-600">{emailConfig.email}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>→</span>
            <span className="font-semibold">Destinataire: {SUPPORT_EMAIL}</span>
          </div>
          {emailConfig.method === 'local' && (
            <p className="mt-2 text-xs text-gray-600">
              Les captures d'écran seront envoyées sous forme de liens cliquables dans votre message.
            </p>
          )}
        </div>
      ) : (
        <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-900">Configuration email requise</p>
            <p className="text-sm text-orange-700 mt-1">
              Veuillez configurer votre méthode d'envoi d'email dans les Paramètres avant d'envoyer un message.
            </p>
          </div>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nom */}
        <div>
          <label className="block text-sm font-semibold text-cocoa-800 mb-2">
            Votre nom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jean Dupont"
            className="w-full px-4 py-3 border-2 border-coral-200 rounded-xl focus:outline-none focus:border-coral-400 focus:ring-2 focus:ring-coral-100 transition-all"
            disabled={isSending || !emailConfig?.isConfigured}
          />
        </div>

        {/* Catégorie */}
        <div>
          <label className="block text-sm font-semibold text-cocoa-800 mb-3">
            Catégorie du problème <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                disabled={isSending || !emailConfig?.isConfigured}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  category === cat.id
                    ? 'border-coral-500 bg-coral-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-coral-300'
                } ${(!emailConfig?.isConfigured) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-sm font-medium text-cocoa-800">{cat.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sujet */}
        <div>
          <label className="block text-sm font-semibold text-cocoa-800 mb-2">
            Sujet <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ex: Problème lors de la transcription d'un enregistrement"
            className="w-full px-4 py-3 border-2 border-coral-200 rounded-xl focus:outline-none focus:border-coral-400 focus:ring-2 focus:ring-coral-100 transition-all"
            disabled={isSending || !emailConfig?.isConfigured}
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-semibold text-cocoa-800 mb-2">
            Décrivez votre problème <span className="text-red-500">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Décrivez en détail le problème rencontré, les étapes pour le reproduire, etc."
            rows={6}
            className="w-full px-4 py-3 border-2 border-coral-200 rounded-xl focus:outline-none focus:border-coral-400 focus:ring-2 focus:ring-coral-100 transition-all resize-none"
            disabled={isSending || !emailConfig?.isConfigured}
          />
        </div>

        {/* Upload de captures d'écran */}
        <div>
          <label className="block text-sm font-semibold text-cocoa-800 mb-2">
            Captures d'écran (optionnel, max 3)
          </label>
          
          <div className="space-y-3">
            {/* Preview des images */}
            {screenshots.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {screenshots.map((file, index) => (
                  <div key={index} className="relative group bg-white rounded-xl border-2 border-coral-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                    {/* Image */}
                    <div className="aspect-video w-full bg-gray-100 flex items-center justify-center">
                      {previewUrls[index] ? (
                        <img
                          src={previewUrls[index]}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            console.error('Erreur chargement image:', file.name);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-cocoa-400">
                          <ImageIcon className="w-12 h-12" />
                          <span className="text-sm">Chargement...</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Info bar */}
                    <div className="p-3 bg-coral-50 border-t border-coral-200">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <ImageIcon className="w-4 h-4 text-coral-600 flex-shrink-0" />
                          <span className="text-xs font-medium text-cocoa-800 truncate">
                            {file.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeScreenshot(index)}
                          className="flex-shrink-0 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="mt-1 text-xs text-cocoa-600">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bouton d'upload */}
            {screenshots.length < 3 && (
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isSending || !emailConfig?.isConfigured}
                />
                <div className="border-2 border-dashed border-coral-300 rounded-xl p-6 text-center cursor-pointer hover:border-coral-500 hover:bg-coral-50 transition-all">
                  <Upload className="w-8 h-8 text-coral-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-cocoa-800">
                    Cliquez pour ajouter des captures d'écran
                  </p>
                  <p className="text-xs text-cocoa-600 mt-1">
                    PNG, JPG, GIF (max 3 fichiers)
                  </p>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <ImageIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold">💡 Conseil</p>
              <p className="mt-1">
                Les captures d'écran nous aident à mieux comprendre votre problème et à le résoudre plus rapidement.
              </p>
            </div>
          </div>
        </div>

        {/* Bouton d'envoi */}
        <button
          type="submit"
          disabled={isSending || !emailConfig?.isConfigured}
          className="w-full py-4 bg-gradient-to-r from-coral-500 to-sunset-500 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {isSending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Envoyer le message
            </>
          )}
        </button>
      </form>
    </div>
  );
};

