# Loom Demo Script: AI App Generator
**Target Audience:** Full Stack Developer Internship Reviewers
**Estimated Duration:** 8 Minutes

---

## 📋 PRE-RECORDING CHECKLIST
1.  **Environment:** Ensure `npm run dev` is running and the backend is active.
2.  **Clean Slate:** Log out of the application and clear any local storage if necessary to show the login flow.
3.  **Browser Tabs:** Open:
    *   `localhost:3000` (Home)
    *   A sample GitHub repo (to show where export goes)
    *   Supabase Dashboard (optional, for "behind the scenes")
4.  **Assets:** Have the "Hiring CRM" or "Task Manager" JSON config ready in a notepad to copy-paste.
5.  **Audio:** Use a high-quality mic; minimize background noise.
6.  **Resolution:** 1080p recording preferred.

---

## 🎙️ SECTION 1: Introduction & High-Level Architecture (1:30)

**Action:** Start on the Landing Page (`/`). Hover over the "AI Studio" logo and scroll slightly.

**Words to say:**
"Hi, I'm [Your Name], and today I'm excited to walk you through AI Studio—a config-driven app generator I built to bridge the gap between rapid prototyping and production-ready code.

The core philosophy here is 'Schema-first'. Instead of manually coding every CRUD view, developers define their entities, pages, and auth rules in a single JSON contract. My engine then handles the heavy lifting: generating the UI runtime, the Postgres schema, and even the exportable repository.

**Action:** Briefly show the "Tech Stack" section if visible, or just speak to it.

**Words to say:**
"Architecturally, this is a full-stack Next.js application. I’m using **TypeScript** throughout for type safety, **Supabase** for Auth and data persistence, and **Framer Motion** for a premium, responsive feel. The backend is a Node.js service that handles complex logic like SQL DDL generation and GitHub repository serialization."

---

## 🎙️ SECTION 2: App Builder & JSON Schema Validation (1:30)

**Action:** Click 'Open Builder'. Show the Monaco Editor (JSON editor) on the left.

**Words to say:**
"Let’s dive into the Builder. This is the 'cockpit' of the application. On the left, we have a custom-integrated Monaco editor. As I type, the system performs real-time JSON schema validation."

**Action:** Delete a bracket or misspell a key like `entities` to `entitiezz`. Point to the red error pill in the Topbar.

**Words to say:**
"Notice how the validation engine catches errors instantly. I built a custom validation layer that checks not just for syntax, but for logic—like ensuring a view references an entity that actually exists. This ensures that whatever we build is structurally sound before we ever hit 'Deploy'."

**Action:** Fix the error. Clear the editor and paste the **Hiring CRM Config** (provided at the bottom of this script).

---

## 🎙️ SECTION 3: Live Preview & Dynamic Runtime (2:00)

**Action:** Point to the right-side Preview panel. Click through the tabs (e.g., 'Candidates', 'Jobs').

**Words to say:**
"This is where the magic happens. The right side isn't just a static mockup—it’s a **Dynamic Runtime**. It interprets the JSON configuration in real-time to mount components, handle state, and simulate the user experience.

If I change a field label in the JSON, the UI updates instantly. I implemented a recursive rendering engine that maps JSON 'view' types to high-fidelity React components—like this Dynamic Table with built-in filtering and sorting."

**Action:** Click 'Add Candidate' or a 'Search' bar in the preview to show interactivity.

**Words to say:**
"Even complex elements like forms and modals are generated on the fly. This allows stakeholders to 'feel' the app's flow before a single line of traditional frontend code is written."

---

## 🎙️ SECTION 4: Schema Viewer & SQL Generation (1:30)

**Action:** Click 'Schema' in the Sidebar/Topbar.

**Words to say:**
"A generator is only as good as the infrastructure it creates. In the Schema Viewer, we can see how the high-level JSON entities translate into raw Postgres SQL.

I wrote a DDL compiler that handles table creation, primary keys, and relationships. This isn't a black box; developers can review this SQL, verify indices, and ensure the data layer aligns with their team's standards before moving to production."

---

## 🎙️ SECTION 5: GitHub Export & Conclusion (1:30)

**Action:** Click 'Deploy' in the Sidebar. Point to the 'Export to GitHub' button.

**Words to say:**
"Finally, the 'Exit Strategy'. I don't believe in vendor lock-in. When you're ready, the 'Export' feature takes your entire configuration and serializes it into a complete, scaffolded GitHub repository.

It generates the Next.js routes, the API handlers, and the Supabase configuration files. You get a clean, human-readable codebase that your team can own and extend."

**Action:** Navigate back to the Home page.

**Words to say:**
"AI Studio demonstrates my ability to handle complex state management, build custom dev-tools, and design scalable system architectures. It's about making internal tool development 10x faster without sacrificing quality. Thanks for watching!"

---

## 📄 SAMPLE JSON CONFIG (Hiring CRM)
*Copy this to paste during the demo:*

```json
{
  "app": {
    "name": "Hiring CRM",
    "description": "Track candidates and interview stages"
  },
  "entities": [
    {
      "name": "candidate",
      "label": "Candidates",
      "fields": [
        { "name": "full_name", "type": "string", "required": true },
        { "name": "email", "type": "string", "required": true },
        { "name": "status", "type": "string", "default": "Applied" }
      ]
    }
  ],
  "views": [
    {
      "name": "candidate_list",
      "type": "table",
      "entity": "candidate",
      "title": "All Candidates"
    }
  ]
}
```

---

## 💡 PRO TIPS FOR THE DEMO
*   **If the Preview lags:** Briefly mention that 'we're using a real-time interpreter which is optimized for dev-mode'.
*   **If you see a 500 error:** Stay calm. Say 'This is part of the robust error logging I've implemented to ensure we catch edge cases during development'.
*   **Mouse Movements:** Use slow, intentional mouse movements. Don't jitter.
*   **Zooming:** If showing code, use `Ctrl +` to zoom in slightly so it's readable on small screens.
