// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PIXEL_DATA = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

const headers = {
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Content-Type": "image/png",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function getClientIp(req: Request) {
  const headers = req.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("cf-connecting-ip")?.trim() ||
    null
  );
}

Deno.serve(async (req) => {
  if (req.method === "HEAD") {
    return new Response(null, { status: 200, headers });
  }

  if (req.method !== "GET") {
    return new Response("", { status: 405, headers });
  }

  const url = new URL(req.url);
  const trackingId = url.searchParams.get("id");
  const recipient = url.searchParams.get("recipient");
  const normalizedRecipient = recipient ? recipient.trim().toLowerCase() : null;

  if (!trackingId) {
    return new Response(PIXEL_DATA, { status: 200, headers });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const { data: history, error } = await supabase
      .from("email_history")
      .select("id, first_opened_at")
      .eq("tracking_id", trackingId)
      .maybeSingle();

    if (error || !history) {
      console.error("Tracking id not found", trackingId, error);
      return new Response(PIXEL_DATA, { status: 200, headers });
    }

    const ipAddress = getClientIp(req);
    const userAgent = req.headers.get("user-agent") ?? null;

    if (!history.first_opened_at) {
      await supabase
        .from("email_history")
        .update({
          first_opened_at: new Date().toISOString(),
          first_opened_recipient: recipient,
        })
        .eq("id", history.id);
    }

    if (normalizedRecipient) {
      const { data: existingRecipient } = await supabase
        .from("email_open_events")
        .select("id")
        .eq("email_history_id", history.id)
        .eq("recipient_email", normalizedRecipient)
        .maybeSingle();

      if (!existingRecipient) {
        await supabase.from("email_open_events").insert({
          email_history_id: history.id,
          recipient_email: normalizedRecipient,
          ip_address: ipAddress,
          user_agent: userAgent,
        });
      }
    } else {
      await supabase.from("email_open_events").insert({
        email_history_id: history.id,
        recipient_email: null,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    }
  } catch (err) {
    console.error("Error tracking email open", err);
  }

  return new Response(PIXEL_DATA, { status: 200, headers });
});

