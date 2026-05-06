# AI App Generator - Quick Reference Guide

## 🎯 What is This Project?

A **JSON-to-App Generator** that creates full-stack applications from configuration files.

**You write JSON → System generates UI, API, Database Schema**

---

## ⚡ Quick Facts

| Aspect | Details |
|--------|---------|
| **Name** | AI App Generator (ai-studio-applet) |
| **Type** | SaaS/Productivity Tool |
| **Primary Use** | No-code app generation |
| **Tech Stack** | Next.js + Express + React + Supabase |
| **Status** | Beta/In Development (v0.1.0) |
| **Language** | TypeScript (100% type-safe) |

---

## 🏃 How It Works (60-Second Version)

1. **User writes JSON config** describing app structure
2. **Monaco editor validates** and highlights errors in real-time
3. **Live preview renders** the app instantly as they type
4. **Backend generates** API endpoints and database schema
5. **User can export** complete project to GitHub
6. **Exports include** package.json, routes, schema, ready to deploy

---

## 🎨 Main Features

### For Users
✅ Write JSON config once, get full-stack app  
✅ Live preview of forms, tables, dashboards  
✅ Built-in templates (CRM, Tasks, Employees)  
✅ Multi-language support  
✅ CSV data import with column mapping  
✅ GitHub export (deploy ready)  
✅ User authentication (email/OAuth)  
✅ Session persistence (auto-save & restore)  

### For Developers
✅ Full TypeScript support  
✅ Extensible component registry  
✅ Pluggable database backends  
✅ Middleware-based architecture  
✅ RESTful API design  
✅ Comprehensive error handling  

---

## 📐 Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                    JSON CONFIG                              │
│           (describes app structure)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
    ┌────────────┐            ┌──────────────┐
    │  Frontend  │            │   Backend    │
    │ (Next.js)  │            │  (Express)   │
    ├────────────┤            ├──────────────┤
    │• Editor    │            │• Parser      │
    │• Preview   │            │• Validator   │
    │• Auth UI   │            │• Generator   │
    │• Forms     │            │• Routes      │
    │• Tables    │            │• CSV Import  │
    └────────────┘            └──────────────┘
        │                             │
        └──────────────┬──────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   Supabase (PostgreSQL)      │
        │   + Authentication           │
        │   + Real-time sync           │
        └──────────────────────────────┘
```

---

## 📁 Key Directories

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js pages (builder, deploy, schema) |
| `backend/src/` | Express server, routes, business logic |
| `components/` | React UI components |
| `hooks/` | Custom React hooks |
| `lib/` | Utilities, API client, services |
| `store/` | Zustand state management |
| `types/` | TypeScript interfaces |

---

## 🚀 Quick Start

### 1. Install
```bash
npm install
```

### 2. Configure
```bash
cp .env.example .env
# Edit .env with Supabase credentials
```

### 3. Run
```bash
npm run dev
# Frontend: http://localhost:3000
# Backend: http://localhost:4000
```

### 4. Build
```bash
npm run build
npm start
```

---

## 💾 Data Storage Layers

### Production (Preferred)
- **Supabase PostgreSQL** - Primary database
- **Supabase Auth** - User authentication
- **Real-time sync** - Live updates

### Development (Fallback)
- **Local JSON files** in `.data/` directory
- **In-memory session** storage for temp data
- **Browser localStorage** for activity tracking

---

## 🔌 API Overview

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/config/{id}` | GET/POST/DELETE | App config CRUD |
| `/api/v1/dynamic/{app}/{entity}` | GET/POST/PUT/DELETE | Record operations |
| `/api/v1/forms/{app}/{slug}` | POST | Form submissions |
| `/api/v1/csv/upload` | POST | CSV upload & preview |
| `/api/v1/csv/import` | POST | CSV bulk import |
| `/api/v1/export/github` | POST | Export to GitHub |
| `/api/v1/auth/*` | POST | Authentication |
| `/api/v1/activity/*` | GET/POST | Activity tracking |

---

## 🎮 User Workflow

### Creating an App

```
1. Visit homepage
   ↓
2. Load template or blank config
   ↓
3. Edit JSON in Monaco editor
   ↓
4. Watch live preview update (real-time)
   ↓
5. Click "Save" to persist
   ↓
6. Click "Export to GitHub"
   ↓
7. Create GitHub repo
   ↓
8. Clone & deploy!
```

### Data Flow for CSV Import

```
1. User navigates to table view
   ↓
2. Clicks "Import CSV"
   ↓
3. Selects CSV file
   ↓
4. System shows preview (first 5 rows)
   ↓
5. User maps columns to fields
   ↓
6. System validates & shows errors
   ↓
7. User confirms & imports
   ↓
8. Bulk records inserted to database
```

---

## 🔑 Configuration Schema

```json
{
  "app": {
    "id": "unique-id",
    "name": "My App",
    "description": "Optional description",
    "version": "1.0.0"
  },
  "auth": {
    "enabled": true,
    "provider": "oauth_github",
    "protect": ["page-slug-1"]
  },
  "entities": [
    {
      "name": "contacts",
      "label": "Contacts",
      "fields": [
        {
          "name": "email",
          "type": "email",
          "required": true,
          "unique": true
        }
      ]
    }
  ],
  "pages": [
    {
      "type": "table",
      "title": "Contacts",
      "entity": "contacts"
    }
  ]
}
```

---

## 🛠️ Development Tasks

### Add New Field Type
1. Update `shared/types.ts` → FieldType enum
2. Update schema generator → SQL mapping
3. Add form input component
4. Add table cell renderer

### Add New Page Type
1. Create component in `components/runtime/`
2. Register in `COMPONENT_REGISTRY`
3. Add type to ViewType enum
4. Add rendering logic in Renderer.tsx

### Add Backend Route
1. Create file in `backend/src/routes/`
2. Define Express handlers
3. Mount in `backend/src/index.ts`
4. Document in API reference

---

## 🔐 Authentication Flow

```
1. User clicks "Sign In" → OAuth Dialog
   ↓
2. Redirects to GitHub OAuth
   ↓
3. User grants permissions
   ↓
4. GitHub redirects to /auth/callback
   ↓
5. Backend exchanges code for token
   ↓
6. Token stored in localStorage
   ↓
7. User logged in, activity auto-restored
```

---

## 📊 Database Schema

### Main Tables (Supabase)

#### app_registry
```sql
- id (UUID)
- app_id (String)
- config (JSON)
- user_id (UUID) -- owner
- created_at
- updated_at
```

#### app_snapshots
```sql
- id (String)
- app_id (String)
- name (String)
- description (String)
- config (JSON)
- created_at
```

#### Dynamic Tables
```
app_{appId}_{entityName}
- id (UUID)
- [field1] (type from config)
- [field2] (type from config)
- created_at
- updated_at
```

---

## 🎯 Field Types Supported

| Type | SQL | Input UI | Example |
|------|-----|----------|---------|
| text | TEXT | Text input | "John" |
| email | TEXT | Email input | "john@example.com" |
| number | NUMERIC | Number input | 42 |
| boolean | BOOLEAN | Checkbox | true/false |
| date | DATE | Date picker | 2024-05-05 |
| select | TEXT | Dropdown | "option1" |
| textarea | TEXT | Multi-line | Long text |
| json | JSONB | JSON editor | {} |

---

## 🚄 Performance Tips

- **Pagination**: Table shows 20 rows by default (configurable)
- **Debouncing**: Config changes debounced 600ms before parsing
- **Caching**: Table data cached per entity
- **Code splitting**: Next.js auto-code-splits at route level
- **Lazy loading**: Monaco editor loaded on builder page only

---

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Port 4000 in use | Change `BACKEND_PORT` in .env or kill process |
| Supabase connection fails | Check `.env` credentials, verify firewall |
| CSV import error | Verify UTF-8 encoding, column headers match fields |
| Activity not saving | Check user is logged in, token in localStorage |
| Preview not updating | Clear `.next` folder: `npm run clean` |

---

## 🔄 Activity Auto-Save System

```
Event: User logs in
  ↓
System loads last saved activity
  ↓
Restore: App ID, page, config, layout
  ↓
User continues work where they left off

Every 30 seconds:
  ↓
Auto-save: Current state to backend/localStorage
  ↓
On logout:
  ↓
Final save happens, then session cleared
```

---

## 📈 Scalability

### Current Limits
- Config size: 10MB (JSON)
- CSV file size: 10MB
- Records per table: Unlimited (Supabase limits apply)
- Concurrent users: Depends on Supabase plan
- API rate limits: Supabase defaults

### For Production Scale
- Use Supabase Pro tier
- Enable Row Level Security (RLS)
- Add database indexing on sort/filter fields
- Implement caching layer (Redis)
- Add APM (Application Performance Monitoring)

---

## 🤝 Extending the System

### Plugin System (Future)
```typescript
// Register custom field type
registerFieldType('mycustom', {
  sqlType: 'TEXT',
  formComponent: MyCustomInput,
  tableComponent: MyCustomCell
});

// Register custom page type
registerPageType('mypage', MyCustomPage);
```

### Webhook Support (Future)
```
On record create/update/delete → trigger webhook
→ POST to user's endpoint with data
→ Enable external integrations
```

---

## 📞 Support & Resources

- **Issues**: Check GitHub issues
- **Documentation**: See PROJECT_DOCUMENTATION.md
- **Activity Tracking**: See ACTIVITY_TRACKING.md
- **Debugging**: Enable verbose logging in browser console
- **Performance**: Use Chrome DevTools Profiler

---

## 🎓 Learning Path

1. **Understand JSON Config** → Read shared/types.ts
2. **Explore UI** → Run `npm run dev` and navigate
3. **Study Routes** → Browse backend/src/routes/
4. **Read Components** → components/runtime/Renderer.tsx
5. **Extend System** → Add custom field type
6. **Deploy** → Export to GitHub and deploy

---

## 📝 Version History

- **v0.1.0** - Initial release (current)
  - Config-driven app generation
  - Monaco editor with validation
  - Live preview
  - GitHub export
  - CSV import
  - Multi-language support
  - User authentication
  - Activity tracking

---

**Last Updated:** May 5, 2026

For detailed documentation, see [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)
