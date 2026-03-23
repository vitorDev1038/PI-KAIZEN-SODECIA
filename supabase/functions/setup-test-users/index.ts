import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.57.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration")
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Create test employee user
    const { data: employeeAuth, error: employeeAuthError } = await supabase.auth.admin.createUser({
      email: "employee@test.com",
      password: "123456",
      email_confirm: true,
    })

    if (employeeAuthError && !employeeAuthError.message.includes("already exists")) {
      throw employeeAuthError
    }

    if (employeeAuth?.user) {
      await supabase.from("profiles").upsert({
        id: employeeAuth.user.id,
        email: "employee@test.com",
        full_name: "João Silva",
        role: "employee",
        points: 0,
        is_active: true,
      })
    }

    // Create test admin user
    const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: "admin@test.com",
      password: "123456",
      email_confirm: true,
    })

    if (adminAuthError && !adminAuthError.message.includes("already exists")) {
      throw adminAuthError
    }

    if (adminAuth?.user) {
      await supabase.from("profiles").upsert({
        id: adminAuth.user.id,
        email: "admin@test.com",
        full_name: "Maria Gerente",
        role: "admin",
        points: 0,
        is_active: true,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test users created successfully",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }
})
