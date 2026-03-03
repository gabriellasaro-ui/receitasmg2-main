import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const admins = [
    { email: "aline.lisboa@v4company.com", full_name: "Aline Lisboa" },
    { email: "yuri.kolya@v4company.com", full_name: "Yuri Kolya" },
    { email: "gabriel.soares@v4company.com", full_name: "Gabriel Soares" },
    { email: "carolinehansen@v4company.com", full_name: "Caroline Hansen" },
  ];

  const results = [];

  for (const admin of admins) {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === admin.email.toLowerCase()
    );

    if (existing) {
      results.push({ email: admin.email, status: "already_exists" });
      continue;
    }

    // Create user
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: admin.email,
      password: "V41234",
      email_confirm: true,
      user_metadata: { full_name: admin.full_name, role: "admin" },
    });

    if (createError) {
      results.push({ email: admin.email, status: "error", error: createError.message });
      continue;
    }

    if (userData?.user) {
      // Update profile to approved
      await supabase
        .from("profiles")
        .update({ status: "approved" })
        .eq("user_id", userData.user.id);

      results.push({ email: admin.email, status: "created" });
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
