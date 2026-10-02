import { supabaseAdmin } from "../supabase/server";
import { AdminActionType } from "../types/enums";

export async function logAdminAction(params: {
  admin_id: string;
  admin_username: string;
  action_type: AdminActionType;
  target_entity: string;
  target_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}) {
  try {
    const { error } = await supabaseAdmin.from("audit_logs").insert([
      {
        admin_id: params.admin_id,
        admin_username: params.admin_username,
        action_type: params.action_type,
        target_entity: params.target_entity,
        target_id: params.target_id || null,
        details: params.details || {},
        ip_address: params.ip_address || null,
        user_agent: params.user_agent || null,
      },
    ]);

    if (error) {
      console.error("Failed to write audit log:", error);
    }
  } catch (err) {
    console.error("Unexpected error writing audit log:", err);
  }
}
