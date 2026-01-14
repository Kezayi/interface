import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VerifyOTPRequest {
  phoneNumber: string;
  code: string;
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

    const { phoneNumber, code }: VerifyOTPRequest = await req.json();

    if (!phoneNumber || !code) {
      return new Response(
        JSON.stringify({ error: "Le numéro de téléphone et le code sont requis" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer la dernière vérification non expirée pour ce numéro
    const { data: verification, error: fetchError } = await supabase
      .from("phone_verifications")
      .select("*")
      .eq("phone_number", phoneNumber)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("Database error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la récupération de la vérification" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!verification) {
      return new Response(
        JSON.stringify({ error: "Code expiré ou invalide" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier le nombre de tentatives
    if (verification.attempts >= 5) {
      return new Response(
        JSON.stringify({ error: "Trop de tentatives. Demandez un nouveau code." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Incrémenter le nombre de tentatives
    const newAttempts = verification.attempts + 1;
    await supabase
      .from("phone_verifications")
      .update({ attempts: newAttempts })
      .eq("id", verification.id);

    // Vérifier le code
    if (verification.verification_code !== code) {
      return new Response(
        JSON.stringify({
          error: "Code incorrect",
          attemptsLeft: 5 - newAttempts,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Marquer comme vérifié
    const { error: updateError } = await supabase
      .from("phone_verifications")
      .update({ verified: true })
      .eq("id", verification.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la vérification" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Numéro de téléphone vérifié avec succès",
        phoneNumber: phoneNumber,
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