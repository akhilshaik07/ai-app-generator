# User Activity Tracking & Session Restoration

## Overview

This system automatically saves user activity (configurations, page state, editor layout) and restores it when they log back in after logging out.

## How It Works

### 1. **Activity Auto-Save**
- Every 30 seconds, the app saves the user's current activity to the backend/localStorage
- Activity includes:
  - Current app ID and page slug
  - Raw config (JSON)
  - Parsed config
  - Editor panel width
  - Sidebar collapsed state

### 2. **On Logout**
- Before logging out, the app saves the final activity state
- The activity is persisted to the backend and cleared from the user's session
- User data is cleared from localStorage

### 3. **On Login**
- After successful login, the app automatically restores the user's last activity
- This includes:
  - The app they were working on
  - The page they were viewing
  - Their editor configuration
  - Panel and sidebar states

### 4. **Fallback to localStorage**
- If the backend API fails, activities are stored in localStorage
- This ensures activity is never lost even if the server is temporarily unavailable
- Activities in localStorage are retained up to the last 20 entries

## File Structure

### Frontend Files

```
lib/services/activity.ts          # Main activity service with save/load/clear functions
hooks/use-activity-autosave.ts    # React hook for periodic auto-save
components/generator/AuthMenu.tsx # Updated with save/restore on login/logout
store/use-app-store.ts            # Zustand store with restoreUserActivity method
```

### Backend Files

```
backend/src/routes/activity.ts    # API endpoints for activity management
- POST /activity/save             # Save activity
- GET /activity/last-activity     # Load last activity
- GET /activity/history?limit=10  # Get activity history
- POST /activity/clear            # Clear activity on logout
```

## API Endpoints

### Save Activity
```
POST /api/v1/activity/save
Authorization: Bearer <JWT_TOKEN>

Body:
{
  "appId": "app-123",
  "currentPageSlug": "home",
  "rawConfig": "{...}",
  "parsedConfig": {...},
  "editorPanelWidth": 40,
  "sidebarCollapsed": false
}

Response:
{
  "success": true,
  "activity": {
    "id": "activity-id",
    "userId": "user-123",
    "timestamp": "2024-05-05T10:00:00Z",
    ...
  }
}
```

### Load Last Activity
```
GET /api/v1/activity/last-activity
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "userId": "user-123",
  "appId": "app-123",
  "currentPageSlug": "home",
  "rawConfig": "{...}",
  "parsedConfig": {...},
  "editorPanelWidth": 40,
  "sidebarCollapsed": false,
  "timestamp": "2024-05-05T10:00:00Z"
}
```

### Clear Activity
```
POST /api/v1/activity/clear
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "success": true
}
```

## Usage in Components

### Using the Auto-Save Hook

```typescript
import { useActivityAutoSave } from "@/hooks/use-activity-autosave";

export function MyComponent() {
  // Auto-save every 30 seconds (default)
  useActivityAutoSave();
  
  // Or customize interval (60 seconds)
  useActivityAutoSave(60000);
  
  return <div>Component content</div>;
}
```

### Manual Activity Management

```typescript
import { 
  saveUserActivity, 
  loadUserActivity, 
  clearUserActivity 
} from "@/lib/services/activity";
import { useAppStore } from "@/store/use-app-store";

export function MyComponent() {
  const appStore = useAppStore();
  
  // Save manually
  const handleSave = async () => {
    await saveUserActivity({
      appId: appStore.activeAppId,
      currentPageSlug: appStore.currentPageSlug,
      rawConfig: appStore.rawConfig,
      parsedConfig: appStore.parsedConfig,
      editorPanelWidth: appStore.editorPanelWidth,
      sidebarCollapsed: appStore.sidebarCollapsed,
    });
  };
  
  // Load and restore
  const handleRestore = async () => {
    await appStore.restoreUserActivity();
  };
}
```

## Storage Layers

1. **Primary**: Supabase Backend (if available)
2. **Fallback**: Express Backend (in-memory during session)
3. **Fallback**: Browser localStorage (up to 20 entries)

## Security Considerations

- Activity is only saved for authenticated users
- Each user can only access their own activity data
- JWT tokens in localStorage are automatically managed by Supabase client
- Service role keys are kept server-side only

## Configuration

### Auto-Save Interval
Adjust the interval in `components/shell/AppShell.tsx`:
```typescript
// Change 30000 to desired milliseconds
useActivityAutoSave(30000); // 30 seconds
```

### localStorage Limits
Modify the limit in `lib/services/activity.ts`:
```typescript
if (activities.length > 20) { // Change this number
  activities.shift();
}
```

## Troubleshooting

### Activity Not Being Saved
1. Check if user is authenticated (logged in)
2. Check browser console for errors
3. Verify backend API is running on the correct port
4. Check localStorage for fallback data

### Activity Not Being Restored
1. Ensure user is logged in
2. Check if activity exists from previous session
3. Clear browser cache and cookies, then login again
4. Check browser console for restore errors

### localStorage Full
- Increase the limit in `lib/services/activity.ts`
- Or switch to a more permanent backend solution

## Future Enhancements

- [ ] Integration with Supabase PostgreSQL for persistent storage
- [ ] Activity history timeline view
- [ ] Multiple workspace switching
- [ ] Collaborative activity tracking
- [ ] Activity versioning/snapshots
- [ ] Automatic recovery on connection loss
