import { supabase } from "@/lib/supabase-client";
import { apiClient } from "@/lib/api-client";

export interface UserActivity {
  id?: string;
  userId: string;
  appId: string | null;
  currentPageSlug: string | null;
  rawConfig: string;
  parsedConfig: any;
  editorPanelWidth: number;
  sidebarCollapsed: boolean;
  timestamp: string;
  active: boolean;
}

/**
 * Save user activity via backend API
 */
export async function saveUserActivity(activity: Omit<UserActivity, 'id' | 'timestamp' | 'userId' | 'active'>): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("No user logged in, activity not saved");
      return;
    }

    const activityData = {
      ...activity,
      userId: user.id,
      rawConfig: activity.rawConfig || "",
      parsedConfig: activity.parsedConfig || {},
      editorPanelWidth: typeof activity.editorPanelWidth === "number" ? activity.editorPanelWidth : 40,
      sidebarCollapsed: typeof activity.sidebarCollapsed === "boolean" ? activity.sidebarCollapsed : false,
      timestamp: new Date().toISOString(),
      active: true,
    };

    // Try to save to backend
    try {
      await apiClient.post("/activity/save", activityData);
    } catch (apiError) {
      // Fallback: Save to localStorage if API fails
      console.warn("Failed to save activity to server, using localStorage", apiError);
      const activities = JSON.parse(localStorage.getItem("user_activities") || "[]");
      activities.push(activityData);
      // Keep only last 20 activities in localStorage
      if (activities.length > 20) {
        activities.shift();
      }
      localStorage.setItem("user_activities", JSON.stringify(activities));
    }
  } catch (error) {
    console.error("Error saving user activity:", error);
  }
}

/**
 * Load user's last activity
 */
export async function loadUserActivity(): Promise<UserActivity | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("No user logged in");
      return null;
    }

    try {
      const response = await apiClient.get('/activity/last-activity');
      const data = response.data;
      
      // Backend returns null when no activity exists
      if (!data) return null;
      
      // Normalize the response to ensure all fields have safe values
      return {
        id: data.id,
        userId: data.userId || user.id,
        appId: data.appId || null,
        currentPageSlug: data.currentPageSlug || null,
        rawConfig: typeof data.rawConfig === "string" ? data.rawConfig : "",
        parsedConfig: data.parsedConfig || {},
        editorPanelWidth: typeof data.editorPanelWidth === "number" ? data.editorPanelWidth : 40,
        sidebarCollapsed: typeof data.sidebarCollapsed === "boolean" ? data.sidebarCollapsed : false,
        timestamp: data.timestamp || new Date().toISOString(),
        active: data.active !== false,
      };
    } catch (e: any) {
      if (e?.response?.status === 404 || e?.response?.status === 401) {
        return null;  // Not authenticated or route not found, silent fail
      }
      console.warn("Failed to load activity from server:", e);
      return null;
    }
  } catch (error) {
    console.error("Error loading user activity:", error);
    return null;
  }
}

/**
 * Clear user activity (on logout)
 */
export async function clearUserActivity(): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_activities");
    }
    // Backend cleanup can be optional
    try {
      await apiClient.post("/activity/clear");
    } catch (error) {
      // Silently fail, localStorage cleanup was successful
    }
  } catch (error) {
    console.error("Error clearing user activity:", error);
  }
}

/**
 * Get activity history for current user
 */
export async function getUserActivityHistory(limit: number = 10): Promise<UserActivity[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    try {
      const response = await apiClient.get(`/activity/history?limit=${limit}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (apiError) {
      // Fallback to localStorage
      if (typeof window !== "undefined") {
        const activities = JSON.parse(localStorage.getItem("user_activities") || "[]");
        return activities.slice(-limit);
      }
      return [];
    }
  } catch (error) {
    console.error("Error fetching activity history:", error);
    return [];
  }
}
