# AI App Generator - Complete Project Documentation

**Version:** 0.1.0  
**Status:** In Development  
**Technology Stack:** Next.js + Express + React + Supabase + TypeScript

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Key Features](#key-features)
5. [Project Structure](#project-structure)
6. [Frontend Architecture](#frontend-architecture)
7. [Backend Architecture](#backend-architecture)
8. [Data Flow](#data-flow)
9. [Core Concepts](#core-concepts)
10. [API Endpoints](#api-endpoints)
11. [Setup & Deployment](#setup--deployment)
12. [Development Workflow](#development-workflow)

---

## 🎯 Project Overview

**AI App Generator** is an opinionated, config-driven SaaS engine that transforms **JSON specifications** into fully working full-stack applications. The system generates:

- ✅ **Dynamic UI** (Forms, Tables, Dashboards, Auth pages)
- ✅ **Backend API Routes** (CRUD operations via Express)
- ✅ **Database Schema** (PostgreSQL DDL via Supabase)
- ✅ **GitHub Export** (Complete project repository)
- ✅ **CSV Import** (Bulk data operations)
- ✅ **Multi-language Support** (i18n)
- ✅ **Authentication** (Email, OAuth, Magic Link)
- ✅ **User Activity Tracking** (Auto-save and session restoration)

### Problem It Solves

- Eliminates repetitive CRUD development
- Bridges the gap between design and code
- Enables rapid prototyping and iteration
- No-code/low-code app generation from JSON specs
- Real-time live preview while configuring

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI APP GENERATOR                             │
├──────────────────────────┬─────────────────────────────────────┤
│                          │                                     │
│    FRONTEND (Next.js)    │    BACKEND (Express + Node.js)     │
│                          │                                     │
│  • Browser-side renderer │  • Config validation & parsing     │
│  • Monaco JSON Editor    │  • Dynamic CRUD route generation   │
│  • Live glass preview    │  • Schema generator (SQL)          │
│  • Zustand state mgmt    │  • CSV import/export engine        │
│  • Dynamic form/table    │  • GitHub Octokit integration      │
│  • Authentication UI     │  • User activity persistence       │
│  • Activity auto-save    │  • JWT token validation            │
│                          │                                     │
└──────────────────────────┴──────────────┬──────────────────────┘
                                          │
                      ┌───────────────────┼───────────────────┐
                      ▼                   ▼                   ▼
                 ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
                 │  Supabase   │  │ Local DB     │  │   GitHub     │
                 │ (PostgreSQL)│  │ (JSON Files) │  │   (OAuth)    │
                 │ + Auth      │  │ (.data/...)  │  │   (API)      │
                 └─────────────┘  └──────────────┘  └──────────────┘
```

---

## 💻 Technology Stack

### Frontend
- **Next.js 15** - React framework with server-side rendering
- **React 19** - UI library
- **Zustand** - State management (lightweight alternative to Redux)
- **Monaco Editor** - Advanced JSON editor with syntax highlighting
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Supabase JS Client** - Authentication & real-time DB
- **Shadcn UI** - Pre-built component library
- **Lucide React** - Icon library
- **React Query (TanStack)** - Data fetching & caching
- **Zod** - Schema validation

### Backend
- **Express.js** - Web framework for Node.js
- **TypeScript** - Type-safe JavaScript
- **Multer** - File upload handling (CSV)
- **Papa Parse** - CSV parsing library
- **Octokit** - GitHub API client
- **Helmet** - Security headers middleware
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger
- **dotenv** - Environment variable management

### Database
- **Supabase** (PostgreSQL) - Primary database
- **Local JSON** - Fallback storage (development)

### DevOps & Tooling
- **tsx** - TypeScript executor
- **Concurrently** - Run multiple npm scripts
- **ESLint** - Code linting
- **PostCSS** - CSS transformation
- **TypeScript** - Type checking

---

## 🎨 Key Features

### 1. **Config-Driven Architecture**
```json
{
  "app": { "name": "My CRM", "id": "app-123" },
  "auth": { "enabled": true, "provider": "oauth_github" },
  "entities": [
    {
      "name": "contacts",
      "fields": [
        { "name": "email", "type": "email", "required": true },
        { "name": "status", "type": "select", "options": ["lead", "customer"] }
      ]
    }
  ],
  "pages": [
    { "type": "table", "entity": "contacts", "title": "Contacts" },
    { "type": "form", "entity": "contacts", "title": "Add Contact" }
  ]
}
```

### 2. **Monaco JSON Editor**
- Real-time syntax validation
- Auto-formatting (Ctrl+Shift+F)
- Comment stripping and repair
- Trailing comma removal
- Light/Dark theme support
- Line numbers & minimap

### 3. **Live Preview (Glass Canvas)**
- Real-time rendering as you type
- Zero-lag updates via debouncing
- Multiple view types: Form, Table, Dashboard, Kanban, Auth
- Responsive design preview
- Grid background + spotlight effects

### 4. **Dynamic Components**

#### DynamicForm
- Auto-generates forms from entity schema
- Field types: text, email, number, select, date, file, etc.
- Validation (required, unique, min/max)
- Auto-submit with loading state
- Error message display
- i18n label support

#### DynamicTable
- Paginated data display
- Search across text fields
- Sortable columns (click header)
- Configurable columns (show/hide)
- CSV import with column mapping
- Bulk delete operations
- Create/Edit actions
- Table caching for performance

#### DynamicAuth
- Email/password authentication
- OAuth integration (GitHub)
- Magic link authentication
- Protected page routes
- Session persistence

### 5. **CSV Import Engine**
```
User Upload → Papa Parse → Column Mapping UI → Validation → Bulk Insert
```
- File upload with preview (first 5 rows)
- Auto-column mapping detection
- Manual mapping editor
- Type coercion & validation
- Error reporting (per row)
- Session-based (10min expiry)

### 6. **GitHub Export**
- Generate complete Next.js project
- Includes package.json, tsconfig, tailwind config
- Creates GitHub repository
- Handles naming conflicts
- SSH key optional
- Private/Public repo toggle

### 7. **Multi-Language Support (i18n)**
```json
{
  "i18n": {
    "defaultLocale": "en",
    "supportedLocales": ["en", "hi", "es"],
    "translations": {
      "en": { "submit": "Submit" },
      "hi": { "submit": "जमा करें" }
    }
  }
}
```

### 8. **User Activity Tracking**
- Auto-save every 30 seconds
- Restore on next login
- Captures: app ID, current page, config, layout state
- localStorage fallback if backend down
- Supabase persistent storage (production)
- Activity cleared on logout

---

## 📁 Project Structure

```
real_gen/
├── app/                              # Next.js app directory
│   ├── globals.css                   # Global styles
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page (templates)
│   ├── builder/
│   │   └── page.tsx                  # Main builder interface
│   ├── deploy/
│   │   └── page.tsx                  # GitHub export page
│   ├── schema/
│   │   └── page.tsx                  # Schema viewer page
│   └── auth/
│       └── callback/
│           └── route.ts              # OAuth callback handler
│
├── backend/                          # Express backend server
│   └── src/
│       ├── index.ts                  # Express app entry point
│       ├── core/
│       │   ├── app-registry.ts       # App config management
│       │   ├── config-parser.ts      # JSON validation & repair
│       │   └── schema-generator.ts   # SQL DDL generation
│       ├── middleware/
│       │   ├── auth.ts               # JWT validation
│       │   └── error-handler.ts      # Global error handling
│       ├── routes/
│       │   ├── activity.ts           # User activity endpoints
│       │   ├── apps.ts               # App CRUD
│       │   ├── auth.ts               # Authentication routes
│       │   ├── config.ts             # Config management
│       │   ├── csv.ts                # CSV upload/import
│       │   ├── dynamic.ts            # Dynamic CRUD routes
│       │   ├── export.ts             # GitHub export
│       │   └── forms.ts              # Form submission
│       └── services/
│           ├── db.ts                 # Local DB & Supabase
│           ├── codegen.ts            # Project file generation
│           ├── github.ts             # GitHub API integration
│           └── supabase.ts           # Supabase client
│
├── components/                       # React components
│   ├── generator/                    # Builder UI components
│   │   ├── Editor.tsx                # Monaco editor wrapper
│   │   ├── Preview.tsx               # Live preview pane
│   │   ├── Toolbar.tsx               # Top toolbar
│   │   ├── Validation.tsx            # Error display
│   │   ├── AuthMenu.tsx              # Login/Logout UI
│   │   ├── GitHubExport.tsx          # Export dialog
│   │   └── VersionControl.tsx        # Snapshots/History
│   ├── runtime/                      # Dynamic renderers
│   │   ├── Renderer.tsx              # Component registry
│   │   ├── DynamicForm.tsx           # Form generator
│   │   ├── DynamicTable.tsx          # Table generator
│   │   ├── DynamicAuth.tsx           # Auth UI
│   │   └── DynamicDashboard.tsx      # Placeholder dashboard
│   ├── shell/                        # App shell
│   │   ├── AppShell.tsx              # Main layout
│   │   ├── Sidebar.tsx               # Left navigation
│   │   ├── Topbar.tsx                # Top navigation
│   │   └── CommandPalette.tsx        # Quick command search
│   └── ui/                           # Shadcn components
│       ├── button.tsx
│       ├── input.tsx
│       ├── dialog.tsx
│       ├── tabs.tsx
│       └── [more UI components]
│
├── hooks/                            # Custom React hooks
│   ├── use-config-sync.ts            # Config persistence
│   ├── use-dynamic-api.ts            # API data fetching
│   ├── use-mobile.ts                 # Mobile detection
│   └── use-activity-autosave.ts      # Activity auto-save
│
├── lib/                              # Utility functions
│   ├── api-client.ts                 # Axios instance with auth
│   ├── supabase-client.ts            # Supabase JS client
│   ├── templates.ts                  # Built-in app templates
│   ├── utils.ts                      # Helper functions
│   ├── auth/
│   │   └── github-auth.ts            # GitHub OAuth logic
│   └── services/
│       └── activity.ts               # Activity tracking service
│
├── store/                            # Zustand store
│   └── use-app-store.ts              # Global app state
│
├── types/                            # TypeScript types
│   └── index.ts                      # Re-export shared types
│
├── shared/                           # Shared code
│   └── types.ts                      # All interface definitions
│
├── public/                           # Static assets
│
├── .env                              # Environment variables
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript config
├── next.config.ts                    # Next.js config
├── tailwind.config.js                # TailwindCSS config
└── README.md                         # Project overview
```

---

## 🎭 Frontend Architecture

### State Management (Zustand)
```typescript
export interface AppStore {
  // Config state
  rawConfig: string
  parsedConfig: AppConfig | null
  validationResult: ConfigValidationResult | null
  
  // UI state
  activeAppId: string | null
  currentPageSlug: string | null
  editorPanelWidth: number          // 20-80% (resizable)
  sidebarCollapsed: boolean
  commandPaletteOpen: boolean
  
  // Auth state
  user: any
  isAuthMenuOpen: boolean
  
  // Actions
  setRawConfig(raw: string): void
  setParsedConfig(config: AppConfig | null): void
  applyConfigLocally(jsonString: string): void
  restoreUserActivity(): Promise<void>
  // ... more actions
}
```

### Page Structure
- **Home (`/`)** - Template gallery with CRM, Tasks, Employees, Inventory templates
- **Builder (`/builder`)** - Main editor with split-pane layout (Editor + Preview)
- **Schema (`/schema`)** - Database schema viewer (DDL SQL)
- **Deploy (`/deploy`)** - GitHub export & repository creation

### Component Hierarchy
```
AppShell
├── Sidebar (Navigation)
├── Topbar (Logo, Auth menu, Settings)
├── CommandPalette (Global search/actions)
└── Page Content
    ├── Builder Page
    │   ├── Toolbar (Template load, Export, Save)
    │   ├── Editor (Monaco, Left pane, 40% width)
    │   ├── Divider (Resizable)
    │   └── Preview (Right pane, 60% width)
    │       └── Renderer
    │           ├── DynamicForm
    │           ├── DynamicTable
    │           └── DynamicAuth
```

---

## 🖥️ Backend Architecture

### Route Structure
```
/api/v1/
├── /config
│   ├── POST /validate          # Validate JSON config
│   ├── GET /:appId             # Get app config
│   ├── POST /:appId            # Save app config
│   └── DELETE /:appId          # Delete app
│
├── /dynamic/:appId/:entity
│   ├── GET                      # List records (paginated, filterable)
│   ├── POST                     # Create record
│   ├── PUT /:id                 # Update record
│   └── DELETE /:id              # Delete record
│
├── /forms/:appId/:formSlug
│   └── POST                     # Submit form data
│
├── /csv
│   ├── POST /upload/:appId/:entity      # Upload CSV
│   └── POST /import/:appId/:entity      # Import mapped data
│
├── /export
│   └── POST /github            # Export to GitHub
│
├── /auth
│   ├── POST /register          # User registration
│   ├── POST /login             # User login
│   └── POST /logout            # User logout
│
├── /activity
│   ├── POST /save              # Save user activity
│   ├── GET /last-activity      # Load last activity
│   ├── GET /history            # Activity history
│   └── POST /clear             # Clear activity
│
└── /apps
    ├── GET                      # List user's apps
    ├── POST                     # Create app
    ├── GET /:appId              # Get app details
    └── DELETE /:appId           # Delete app
```

### Middleware Stack
1. **Helmet** - Security headers
2. **CORS** - Cross-origin requests
3. **Morgan** - Request logging
4. **Express.json** - JSON parsing (10MB limit)
5. **Express.urlencoded** - Form parsing
6. **requireAuth** / **optionalAuth** - JWT validation
7. **Error Handler** - Global exception handling

---

## 🔄 Data Flow

### Creating an App from Config

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER TYPES JSON IN EDITOR                                │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. DEBOUNCE (600ms)                                         │
│    Apply config locally to Zustand store                    │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. CONFIG PARSER                                            │
│    • Attempt JSON.parse()                                   │
│    • If fails: attempt repairJSON()                         │
│    • Strip comments, remove trailing commas, quote keys     │
│    • Return validation result (errors/warnings)             │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. NORMALIZE CONFIG                                         │
│    • Ensure app metadata present                            │
│    • Merge pages/views                                      │
│    • Validate entity references                             │
│    • Extract i18n translations                              │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. UPDATE STORE                                             │
│    • parsedConfig set to normalized version                 │
│    • validationResult set with errors/warnings              │
│    • currentPageSlug set to first page (if valid)           │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. RENDER PREVIEW                                           │
│    Renderer component consumes parsedConfig:                │
│    • Creates view components from pages                     │
│    • Maps field types to UI inputs                          │
│    • Renders with responsive layout                         │
└─────────────────────────────────────────────────────────────┘
```

### Submitting Form Data

```
DynamicForm (React)
    │
    ├─ Validate fields (required, unique, etc.)
    │
    ├─ POST /api/v1/dynamic/{appId}/{entityName}
    │
    └─ Backend Dynamic Route Handler (Express)
         │
         ├─ Load app config from AppRegistry
         │
         ├─ Get entity config from app
         │
         ├─ Validate field types (number coercion, etc.)
         │
         ├─ Check required fields
         │
         ├─ Generate UUID for id
         │
         ├─ Add timestamps (created_at, updated_at)
         │
         ├─ Store in localDb (or Supabase if available)
         │
         └─ Return 201 with record data
```

### CSV Import Flow

```
User selects CSV file
    │
    ▼
Upload to /csv/upload endpoint
    │
    ├─ Store file in memory
    ├─ Parse with Papa Parse (header mode)
    ├─ Extract columns
    ├─ Return preview (first 5 rows)
    │
    ▼
User maps columns to entity fields
    │
    ▼
POST to /csv/import with mapping
    │
    ├─ Load session rows
    ├─ Apply column mapping
    ├─ Validate each row
    ├─ Type coerce values
    ├─ Generate UUIDs & timestamps
    ├─ Bulk insert to database
    │
    └─ Return { imported: 45, skipped: 3, errors: [...] }
```

---

## 💡 Core Concepts

### AppConfig Structure

```typescript
interface AppConfig {
  app: AppMeta                      // Metadata
  auth?: AuthConfig                 // Authentication setup
  theme?: ThemeOverride             // UI customization
  i18n?: I18nConfig                 // Multi-language
  notifications?: NotificationsConfig // Events
  pages?: PageConfig[]              // UI pages
  entities: EntityConfig[]          // Data schemas
  views: ViewConfig[]               // View definitions
}
```

### Entity vs Page vs View

| Concept | Purpose | Example |
|---------|---------|---------|
| **Entity** | Database schema | `contacts` (name, email, phone fields) |
| **Page** | Navigation item | "Contacts" page |
| **View** | Renderable component | Table view for contacts |

### Field Types Supported

- **Text Types**: text, textarea, email, url, richtext, html
- **Numbers**: number
- **Dates**: date, datetime
- **Selections**: select, multiselect
- **Special**: boolean, file, upload, json, relation, calendar

### Page Types

- **table** - Data grid with search, sort, pagination
- **form** - Input form with validation
- **dashboard** - Placeholder for widgets
- **kanban** - Placeholder for columns
- **auth** - Login/signup UI

---

## 🔌 API Endpoints

### Config Management

```bash
# Validate JSON config
POST /api/v1/config/validate
Content-Type: application/json
{ "raw": "{...}" }

# Save app config
POST /api/v1/config/{appId}
Authorization: Bearer {token}
{ "config": {...} }

# Get app config
GET /api/v1/config/{appId}

# Delete app
DELETE /api/v1/config/{appId}
Authorization: Bearer {token}
```

### Dynamic CRUD

```bash
# List records (with pagination, search, sort)
GET /api/v1/dynamic/{appId}/{entity}?page=1&limit=20&search=john&sort=name&order=asc

# Create record
POST /api/v1/dynamic/{appId}/{entity}
{ "name": "John", "email": "john@example.com" }

# Update record
PUT /api/v1/dynamic/{appId}/{entity}/{id}
{ "name": "Jane" }

# Delete record
DELETE /api/v1/dynamic/{appId}/{entity}/{id}
```

### CSV Operations

```bash
# Upload CSV for preview
POST /api/v1/csv/upload/{appId}/{entity}
Content-Type: multipart/form-data
[file]

# Import CSV data
POST /api/v1/csv/import/{appId}/{entity}
{
  "sessionId": "uuid",
  "columnMapping": [
    { "csvColumn": "Full Name", "entityField": "name" }
  ]
}
```

### Activity Tracking

```bash
# Save user activity
POST /api/v1/activity/save
Authorization: Bearer {token}
{
  "appId": "app-123",
  "currentPageSlug": "home",
  "rawConfig": "{...}",
  "editorPanelWidth": 40,
  "sidebarCollapsed": false
}

# Load last activity
GET /api/v1/activity/last-activity
Authorization: Bearer {token}

# Get activity history
GET /api/v1/activity/history?limit=10
Authorization: Bearer {token}

# Clear activity
POST /api/v1/activity/clear
Authorization: Bearer {token}
```

---

## 🚀 Setup & Deployment

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier available)
- GitHub Personal Access Token (for export feature)

### Environment Variables (.env)

```bash
# Server
PORT=4000
BACKEND_PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_URL=https://xxx.supabase.co

# GitHub
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...

# JWT
JWT_SECRET=your-secret-key-here
```

### Installation

```bash
# 1. Clone repository
git clone Not deployed yet
cd real_gen

# 2. Install dependencies
npm install

# 3. Copy .env template
cp .env.example .env

# 4. Update .env with your credentials

# 5. Run development server
npm run dev

# Frontend runs on http://localhost:3000
# Backend runs on http://localhost:4000
```

### Development Commands

```bash
# Start both frontend and backend
npm run dev

# Build for production
npm build

# Start production server
npm start

# Backend dev only
npm run server:dev

# Lint code
npm run lint

# Clean build artifacts
npm run clean
```

---

## 🔨 Development Workflow

### Adding a New Field Type

1. **Update types** in `shared/types.ts`:
```typescript
export type FieldType = "text" | "number" | "mynewtype";
```

2. **Update schema generator** in `backend/src/core/schema-generator.ts`:
```typescript
case 'mynewtype': sql = 'JSONB'; break;
```

3. **Add form input** in `components/runtime/DynamicForm.tsx`:
```typescript
case 'mynewtype':
  return <MyNewTypeInput value={value} onChange={onChange} />;
```

4. **Add table cell renderer** in `components/runtime/DynamicTable.tsx`:
```typescript
case 'mynewtype':
  return <span>{JSON.stringify(cell)}</span>;
```

### Adding a New Component Type

1. **Create component** in `components/runtime/`:
```typescript
export function DynamicMyComponent({ view, config }: Props) {
  return <div>My Component</div>;
}
```

2. **Register in Renderer** in `components/runtime/Renderer.tsx`:
```typescript
const COMPONENT_REGISTRY = {
  mytype: DynamicMyComponent,
  // ...
};
```

### Creating a New Backend Route

1. **Create route file** in `backend/src/routes/myfeature.ts`:
```typescript
import { Router } from "express";

const router = Router();

router.get("/endpoint", (req, res) => {
  res.json({ message: "Hello" });
});

export default router;
```

2. **Mount in index.ts**:
```typescript
import myFeatureRouter from "./routes/myfeature";
app.use("/api/v1/myfeature", myFeatureRouter);
```

---

## 🎓 Key Patterns & Best Practices

### 1. Error Handling
- All API errors follow `{ error: "error_code", message: "...", details?: "..." }` format
- Global error handler in Express catches all exceptions
- Client shows toast notifications via `sonner` library

### 2. Authentication
- JWT tokens stored in `localStorage` as `jwt_token`
- Automatic header injection via `apiClient` interceptor
- Supabase handles token lifecycle
- Protected routes check `requireAuth` middleware

### 3. Debouncing
- Config updates debounced 600ms before parsing
- Search input debounced 300ms before API call
- Prevents excessive re-renders and API calls

### 4. Caching
- Table data cached per `{appId}_{entity}` in memory
- Cache invalidated on create/update/delete
- Cache expires after 5 minutes

### 5. File Storage Layers
1. **Primary**: Supabase PostgreSQL
2. **Secondary**: Express in-memory (session)
3. **Tertiary**: localStorage (browser client)

### 6. Type Safety
- Full TypeScript coverage
- Shared types between frontend & backend
- Zod for runtime validation

---

## 🐛 Troubleshooting

### Port 4000 Already in Use
```bash
# Find and kill process
lsof -i :4000
kill -9 <PID>

# Or change BACKEND_PORT in .env
```

### Supabase Connection Issues
1. Verify credentials in `.env`
2. Check if SUPABASE_URL is reachable
3. Ensure firewall allows connections
4. Check Supabase project status

### CSV Import Fails
- Check file encoding (UTF-8 required)
- Verify column names match entity field names
- Check file size < 10MB
- Ensure CSV has header row

### Activity Not Saving
- Verify user is authenticated (token in localStorage)
- Check backend /activity/save endpoint is working
- Review browser console for errors
- Check fallback localStorage for data

---

## 📊 Performance Considerations

- **Monaco Editor**: ~3MB bundle (lazy loaded)
- **Table Rendering**: Paginated (max 20 rows per page default)
- **Debouncing**: Prevents excessive re-renders
- **Caching**: Reduces API calls
- **Code Splitting**: Next.js auto-code-splits pages
- **Image Optimization**: Supabase storage for large assets

---

## 🔐 Security

- JWT tokens never exposed in URL (POST requests)
- Service role keys kept server-side only
- CORS configured per environment
- Helmet security headers enabled
- SQL injection prevented via prepared statements
- XSS prevented via React escaping
- CSRF tokens optional (can be added)

---

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Express Docs](https://expressjs.com/)
- [React Docs](https://react.dev)
- [TailwindCSS Docs](https://tailwindcss.com)
- [Zustand Docs](https://github.com/pmndrs/zustand)

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/myfeature`
2. Make your changes
3. Test locally: `npm run dev`
4. Lint code: `npm run lint`
5. Commit with clear message: `git commit -m "Add myfeature"`
6. Push and create PR

---

## 📄 License

MIT License

---

**Last Updated:** May 5, 2026  
**Maintained By:** Shaik akhil
