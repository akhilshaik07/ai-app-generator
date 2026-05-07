import { supabase } from "./supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserActivityRow {
  id?: string;
  user_id: string;
  last_app_id: string | null;
  last_page: string | null;
  editor_state: Record<string, any>;
  updated_at: string;
}

// ─── Save / Upsert ──────────────────────────────────────────────────────────

/**
 * Upsert the user's latest activity.
 * Only one row per user_id is kept (upsert on user_id).
 */
export async function saveUserActivity(
  userId: string,
  data: {
    lastAppId?: string | null;
    lastPage?: string | null;
    editorState?: Record<string, any>;
  }
): Promise<UserActivityRow | null> {
  const payload: Record<string, any> = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  if (data.lastAppId !== undefined) payload.last_app_id = data.lastAppId;
  if (data.lastPage !== undefined) payload.last_page = data.lastPage;
  if (data.editorState !== undefined) payload.editor_state = data.editorState;

  const { data: row, error } = await supabase
    .from("user_activity")
    .upsert(payload, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    console.error("[user-activity] saveUserActivity error:", error);
    throw error;
  }

  return row as UserActivityRow;
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

/**
 * Get the latest activity row for a user.
 */
export async function getUserActivity(
  userId: string
): Promise<UserActivityRow | null> {
  const { data, error } = await supabase
    .from("user_activity")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    // PGRST116 = no rows found — not an error, user just has no saved activity
    if (error.code === "PGRST116") return null;
    console.error("[user-activity] getUserActivity error:", error);
    throw error;
  }

  return data as UserActivityRow;
}

// ─── Clear ───────────────────────────────────────────────────────────────────

/**
 * Delete the user's activity row (e.g. on logout if desired).
 */
export async function clearUserActivity(userId: string): Promise<void> {
  const { error } = await supabase
    .from("user_activity")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("[user-activity] clearUserActivity error:", error);
    throw error;
  }
}
