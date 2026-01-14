import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SendOTPRequest {
  phoneNumber: string;
  method: 'sms' | 'whatsapp';
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { phoneNumber, method }: SendOTPRequest = await req.json();

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: "Le numéro de téléphone est requis" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await supabase
      .from("phone_verifications")
      .update({ verified: true })
      .eq("phone_number", phoneNumber)
      .eq("verified", false);

    const { data: verification, error: dbError } = await supabase
      .from("phone_verifications")
      .insert({
        phone_number: phoneNumber,
        verification_code: verificationCode,
        expires_at: expiresAt.toISOString(),
        send_method: method,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création de la vérification" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const africasTalkingApiKey = Deno.env.get("AFRICAS_TALKING_API_KEY");
    const africasTalkingUsername = Deno.env.get("AFRICAS_TALKING_USERNAME");

    if (!africasTalkingApiKey || !africasTalkingUsername) {
      console.error("Africa's Talking credentials not configured");
      return new Response(
        JSON.stringify({ error: "Service SMS non configuré" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const message = `Votre code de vérification Floorence est: ${verificationCode}. Il expire dans 10 minutes.`;

    try {
      const africasTalkingUrl = "https://api.africastalking.com/version1/messaging";

      const smsResponse = await fetch(africasTalkingUrl, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "apiKey": africasTalkingApiKey,
        },
        body: new URLSearchParams({
          username: africasTalkingUsername,
          to: phoneNumber,
          message: message,
        }),
      });

      const smsResult = await smsResponse.json();

      if (!smsResponse.ok || smsResult.SMSMessageData?.Recipients?.[0]?.status !== "Success") {
        console.error("Africa's Talking error:", smsResult);
        return new Response(
          JSON.stringify({ error: "Erreur lors de l'envoi du SMS" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log(`SMS envoyé avec succès à ${phoneNumber}`);
    } catch (smsError) {
      console.error("SMS sending error:", smsError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'envoi du SMS" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Code de vérification envoyé",
        verificationId: verification.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});