import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Creating admin user...");

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const email = "neto@drivefinance.com.br";
    const password = "123456";
    const fullName = "Neto Admin";

    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      throw listError;
    }

    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    let userId: string;

    if (existingUser) {
      console.log("User already exists:", existingUser.id);
      userId = existingUser.id;
    } else {
      // Create user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

      if (createError) {
        console.error("Error creating user:", createError);
        throw createError;
      }

      console.log("User created:", newUser.user?.id);
      userId = newUser.user!.id;
    }

    // Update user_roles to add admin role
    const { data: existingRole, error: roleCheckError } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleCheckError) {
      console.error("Error checking role:", roleCheckError);
    }

    if (!existingRole) {
      // Add admin role
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });

      if (roleError) {
        console.error("Error adding admin role:", roleError);
        // Try upsert approach
        const { error: upsertError } = await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
        
        if (upsertError) {
          console.error("Error upserting admin role:", upsertError);
        }
      } else {
        console.log("Admin role added");
      }
    } else {
      console.log("Admin role already exists");
    }

    // Update subscription to premium
    const { error: subError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "premium",
        plan_name: "Premium Admin",
        price: 0,
      })
      .eq("user_id", userId);

    if (subError) {
      console.error("Error updating subscription:", subError);
    } else {
      console.log("Subscription updated to premium");
    }

    // Update profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: fullName,
      })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin user created/updated successfully",
        email,
        password,
        userId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
