import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.9.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SupportReplyPayload {
  to: string;
  name?: string;
  ticketId?: string;
}

const SUBJECT = "HALL-IA Support - Votre ticket est en cours de traitement";

const buildHtmlBody = (name?: string) => {
  const firstLine = name ? `Bonjour ${name},` : "Bonjour,";
  return `
    <div style="font-family: 'Inter', Arial, sans-serif; background-color:#fff7f2; padding:32px 24px; color:#1f2937;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:0 auto; background:white; border-radius:16px; padding:32px; box-shadow:0 20px 35px rgba(244,113,113,0.18); line-height:1.6;">
        <tr><td style="font-size:24px; font-weight:700; color:#F97316; padding-bottom:20px;">HALL-IA Support</td></tr>
        <tr><td style="font-size:15px; padding-bottom:12px;">${firstLine}</td></tr>
        <tr><td style="font-size:15px; padding-bottom:12px;">Nous vous remercions d’avoir contacté HALL-IA.</td></tr>
        <tr><td style="font-size:15px; padding-bottom:12px;">Votre demande a bien été reçue et transmise à notre équipe technique.</td></tr>
        <tr><td style="font-size:15px; padding-bottom:12px;">Nous reviendrons vers vous dans les meilleurs délais afin d’apporter une solution ou d’effectuer l’action demandée (hors week-ends et jours fériés).</td></tr>
        <tr><td style="font-size:15px; padding-bottom:20px;">En attendant, vous pouvez consulter notre site pour plus d’informations : <a href="https://www.hallia.ai" style="color:#F97316; font-weight:600;">www.hallia.ai</a></td></tr>
        <tr><td style="font-size:15px; padding-bottom:4px;">Cordialement,</td></tr>
        <tr><td style="font-size:15px; font-weight:600;">L’équipe Hall IA</td></tr>
        <tr><td style="font-size:14px; color:#6b7280;">Support technique & service client</td></tr>
        <tr><td style="font-size:14px; color:#6b7280; padding-bottom:24px;">www.hallia.ai</td></tr>
      </table>
      <p style="font-size:12px; color:#9ca3af; text-align:center; margin-top:24px;">Ce message a été envoyé automatiquement. Merci de ne pas y répondre directement.</p>
    </div>
  `;
};

const buildTextBody = (name?: string) => {
  const greeting = name ? `Bonjour ${name},` : "Bonjour,";
  return `${greeting}

Nous vous remercions d’avoir contacté HALL-IA.
Votre demande a bien été reçue et transmise à notre équipe technique.
Nous reviendrons vers vous dans les meilleurs délais afin d’apporter une solution ou d’effectuer l’action demandée (hors week-ends et jours fériés).

En attendant, vous pouvez consulter notre site pour plus d’informations : www.hallia.ai

Cordialement,
L’équipe Hall IA
Support technique & service client
www.hallia.ai

---
Ce message a été envoyé automatiquement. Merci de ne pas y répondre directement.`;
};

const smtpHost = Deno.env.get("SUPPORT_SMTP_HOST");
const smtpPort = Number(Deno.env.get("SUPPORT_SMTP_PORT") ?? "465");
const smtpUser = Deno.env.get("SUPPORT_SMTP_USER");
const smtpPassword = Deno.env.get("SUPPORT_SMTP_PASSWORD");
if (!smtpHost || !smtpUser || !smtpPassword) {
  console.warn("⚠️ Missing SMTP environment variables for support-auto-reply.");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  if (!smtpHost || !smtpUser || !smtpPassword) {
    return new Response(JSON.stringify({ success: false, error: "SMTP configuration missing" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = (await req.json()) as SupportReplyPayload;

    if (!payload?.to) {
      return new Response(JSON.stringify({ success: false, error: "Missing recipient" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    const htmlBody = buildHtmlBody(payload.name);
    const textBody = buildTextBody(payload.name);

    const info = await transporter.sendMail({
      from: smtpUser,
      to: payload.to,
      subject: SUBJECT,
      text: textBody,
      html: htmlBody,
    });

    console.log("✅ Support auto-reply sent", info.messageId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Failed to send support auto-reply", error);
    return new Response(JSON.stringify({ success: false, error: error?.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

