"use server";

import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { comparePassword } from "@/lib/auth/password";
import { setAdminSession } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/audit/logger";
import { AdminActionType } from "@/lib/types/enums";
import { redirect } from "next/navigation";

export async function loginAdmin(formData: FormData) {
  const password = formData.get("password") as string;
  
  if (!password) {
    return { error: "Password is required" };
  }

  // Fallback for local development if Supabase isn't configured yet
  if (!isSupabaseConfigured()) {
    if (password === "admin") {
      await setAdminSession({ sub: "mock-admin-id", username: "Local Admin", is_primary: true });
      redirect("/admin/dashboard");
    }
    return { error: "Invalid password (use 'admin' for local preview)" };
  }

  // Find the admin that matches this password.
  // Since we only ask for a password, we have to iterate through admins or 
  // ideally, prompt for a username as well. The requirement was "password only".
  // Note: comparing passwords against all admins is not scalable, but fine for a few internal admins.
  
  const { data: admins, error: fetchError } = await supabaseAdmin
    .from("admins")
    .select("id, username, password_hash, is_primary_admin");
    
  if (fetchError || !admins) {
    return { error: "Failed to query admin accounts" };
  }
  
  let matchedAdmin = null;
  for (const admin of admins) {
    const isMatch = await comparePassword(password, admin.password_hash);
    if (isMatch) {
      matchedAdmin = admin;
      break;
    }
  }
  
  if (!matchedAdmin) {
    return { error: "Invalid password" };
  }
  
  await setAdminSession({
    sub: matchedAdmin.id,
    username: matchedAdmin.username,
    is_primary: matchedAdmin.is_primary_admin,
  });
  
  // Need headers() for IP/userAgent if we want to log it
  await logAdminAction({
    admin_id: matchedAdmin.id,
    admin_username: matchedAdmin.username,
    action_type: AdminActionType.AUTH_LOGIN,
    target_entity: "system",
  });
  
  redirect("/admin/dashboard");
}
