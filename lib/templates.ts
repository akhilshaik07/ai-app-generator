// Template 1: CRM Dashboard
export const crmTemplate = {
  "app": { "id": "tpl-crm", "name": "CRM Dashboard", "version": "1.0.0" },
  "auth": { "enabled": true, "provider": "email", "protect": ["v1", "v3"] },
  "i18n": { "defaultLocale": "en", "supportedLocales": ["en", "hi"],
    "translations": {
      "en": { "submit": "Submit", "Add Contact": "Add Contact", "Add Deal": "Add Deal", "sign_in": "Sign In" },
      "hi": { "submit": "जमा करें", "Add Contact": "संपर्क जोड़ें", "Add Deal": "डील जोड़ें", "sign_in": "साइन इन करें" }
    }
  },
  "entities": [
    { "name": "contacts", "label": "Contacts", "fields": [
      { "name": "full_name", "label": "Full Name", "type": "text", "required": true },
      { "name": "email", "label": "Email", "type": "email", "required": true, "unique": true },
      { "name": "phone", "label": "Phone", "type": "text" },
      { "name": "status", "label": "Status", "type": "select", "options": ["lead", "prospect", "customer", "churned"] },
      { "name": "company", "label": "Company", "type": "text" },
      { "name": "notes", "label": "Notes", "type": "textarea" }
    ]},
    { "name": "deals", "label": "Deals", "fields": [
      { "name": "title", "label": "Title", "type": "text", "required": true },
      { "name": "value", "label": "Value", "type": "number" },
      { "name": "stage", "label": "Stage", "type": "select", "options": ["discovery", "proposal", "negotiation", "closed_won", "closed_lost"] },
      { "name": "close_date", "label": "Date", "type": "date" }
    ]}
  ],
  "views": [
    { "id": "v1", "title": "Contacts", "type": "table", "entity": "contacts",
      "actions": [{ "label": "Add Contact", "type": "create" }, { "label": "Import CSV", "type": "import_csv" }],
      "layout": { "showSearch": true, "pageSize": 20 }
    },
    { "id": "v2", "title": "Add Contact", "type": "form", "entity": "contacts" },
    { "id": "v3", "title": "Deals Pipeline", "type": "table", "entity": "deals",
      "actions": [{ "label": "Add Deal", "type": "create" }] },
    { "id": "v5", "title": "Add Deal", "type": "form", "entity": "deals" },
    { "id": "v4", "title": "Sign In", "type": "auth" }
  ]
};

// Template 2: Task Tracker
export const taskTemplate = {
  "app": { "id": "tpl-task", "name": "Task Tracker", "version": "1.0.0" },
  "auth": { "enabled": false },
  "i18n": { "defaultLocale": "en", "supportedLocales": ["en"] },
  "entities": [
    { "name": "tasks", "label": "Tasks", "fields": [
      { "name": "title", "label": "Task Title", "type": "text", "required": true },
      { "name": "priority", "label": "Priority", "type": "select", "options": ["low", "medium", "high", "urgent"] },
      { "name": "completed", "label": "Completed", "type": "boolean" },
      { "name": "description", "label": "Description", "type": "textarea" }
    ]}
  ],
  "views": [
    { "id": "t1", "title": "All Tasks", "type": "table", "entity": "tasks",
      "actions": [{ "label": "Add Task", "type": "create" }] },
    { "id": "t2", "title": "Add Task", "type": "form", "entity": "tasks" }
  ]
};

// Template 3: Employee Directory
export const employeeTemplate = {
  "app": { "id": "tpl-emp", "name": "Employee Directory", "version": "1.0.0" },
  "auth": { "enabled": true, "provider": "email" },
  "i18n": { "defaultLocale": "en", "supportedLocales": ["en"] },
  "entities": [
    { "name": "employees", "label": "Employees", "fields": [
      { "name": "name", "label": "Full Name", "type": "text", "required": true },
      { "name": "department", "label": "Department", "type": "select", "options": ["Engineering", "Sales", "Marketing", "HR", "Finance"] },
      { "name": "title", "label": "Job Title", "type": "text" },
      { "name": "join_date", "label": "Join Date", "type": "date" },
      { "name": "active", "label": "Active", "type": "boolean" }
    ]}
  ],
  "views": [
    { "id": "e1", "title": "Directory", "type": "table", "entity": "employees", "actions": [{ "label": "Add Employee", "type": "create" }] },
    { "id": "e2", "title": "Add Employee", "type": "form", "entity": "employees" }
  ]
};

// Template 4: Inventory Management
export const inventoryTemplate = {
  "app": { "id": "tpl-inv", "name": "Inventory App", "version": "1.0.0" },
  "auth": { "enabled": true, "provider": "email" },
  "i18n": { "defaultLocale": "en", "supportedLocales": ["en"] },
  "entities": [
    { "name": "products", "label": "Products", "fields": [
      { "name": "sku", "label": "SKU", "type": "text", "required": true },
      { "name": "name", "label": "Product Name", "type": "text", "required": true },
      { "name": "category", "label": "Category", "type": "select", "options": ["Electronics", "Clothing", "Home", "Toys", "Other"] },
      { "name": "price", "label": "Price", "type": "number" },
      { "name": "stock", "label": "In Stock", "type": "number" }
    ]}
  ],
  "views": [
    { "id": "i1", "title": "Products Inventory", "type": "table", "entity": "products", "actions": [{ "label": "Add Product", "type": "create" }] },
    { "id": "i2", "title": "Add Product", "type": "form", "entity": "products" }
  ]
};

// Template 5: Support Tickets
export const ticketsTemplate = {
  "app": { "id": "tpl-tickets", "name": "Support Desk", "version": "1.0.0" },
  "auth": { "enabled": true, "provider": "email" },
  "notifications": { "enabled": true, "events": ["create_record"] },
  "i18n": { "defaultLocale": "en", "supportedLocales": ["en"] },
  "entities": [
    { "name": "tickets", "label": "Tickets", "fields": [
      { "name": "subject", "label": "Subject", "type": "text", "required": true },
      { "name": "customer_email", "label": "Customer Email", "type": "email", "required": true },
      { "name": "status", "label": "Status", "type": "select", "options": ["Open", "Pending", "Resolved", "Closed"] },
      { "name": "priority", "label": "Priority", "type": "select", "options": ["Low", "Normal", "High", "Critical"] },
      { "name": "description", "label": "Issue Description", "type": "textarea" }
    ]}
  ],
  "views": [
    { "id": "tk1", "title": "All Tickets", "type": "table", "entity": "tickets", "actions": [{ "label": "New Ticket", "type": "create" }] },
    { "id": "tk2", "title": "New Ticket", "type": "form", "entity": "tickets" }
  ]
};

// Template 6: Event Planner
export const eventTemplate = {
  "app": { "id": "tpl-events", "name": "Event Manager", "version": "1.0.0" },
  "auth": { "enabled": false },
  "i18n": { "defaultLocale": "en", "supportedLocales": ["en"] },
  "entities": [
    { "name": "events", "label": "Events", "fields": [
      { "name": "event_name", "label": "Event Name", "type": "text", "required": true },
      { "name": "date", "label": "Date", "type": "calendar", "required": true },
      { "name": "location", "label": "Location", "type": "text" },
      { "name": "attendees", "label": "Max Attendees", "type": "number" },
      { "name": "flyer", "label": "Event Flyer", "type": "upload" },
      { "name": "public", "label": "Is Public", "type": "boolean" }
    ]}
  ],
  "views": [
    { "id": "ev1", "title": "Events List", "type": "table", "entity": "events", "actions": [{ "label": "Create Event", "type": "create" }] },
    { "id": "ev2", "title": "Create Event", "type": "form", "entity": "events" }
  ]
};

// Template 7: Real Estate CRM
export const realEstateTemplate = {
  "app": { "id": "tpl-realestate", "name": "Real Estate CRM", "version": "1.0.0" },
  "auth": { "enabled": true, "provider": "email" },
  "i18n": { "defaultLocale": "en", "supportedLocales": ["en"] },
  "entities": [
    { "name": "properties", "label": "Properties", "fields": [
      { "name": "address", "label": "Address", "type": "text", "required": true },
      { "name": "price", "label": "Price", "type": "number", "required": true },
      { "name": "status", "label": "Status", "type": "select", "options": ["Available", "Under Contract", "Sold"] },
      { "name": "bedrooms", "label": "Bedrooms", "type": "number" },
      { "name": "bathrooms", "label": "Bathrooms", "type": "number" },
      { "name": "contract", "label": "Contract Document", "type": "file" }
    ]}
  ],
  "views": [
    { "id": "re1", "title": "Dashboard", "type": "table", "entity": "properties", "actions": [{ "label": "Add Property", "type": "create" }] },
    { "id": "re2", "title": "Add Property", "type": "form", "entity": "properties" }
  ]
};

// Template 8: Recipe Manager
export const recipeTemplate = {
  "app": { "id": "tpl-recipes", "name": "Recipe Manager", "version": "1.0.0" },
  "auth": { "enabled": false },
  "i18n": { "defaultLocale": "en", "supportedLocales": ["en"] },
  "entities": [
    { "name": "recipes", "label": "Recipes", "fields": [
      { "name": "title", "label": "Recipe Title", "type": "text", "required": true },
      { "name": "category", "label": "Category", "type": "select", "options": ["Breakfast", "Lunch", "Dinner", "Dessert", "Snack"] },
      { "name": "photo", "label": "Photo", "type": "upload" },
      { "name": "prep_time", "label": "Prep Time (mins)", "type": "number" },
      { "name": "ingredients", "label": "Ingredients", "type": "textarea" },
      { "name": "instructions", "label": "Instructions", "type": "richtext" }
    ]}
  ],
  "views": [
    { "id": "rec1", "title": "My Recipes", "type": "table", "entity": "recipes", "actions": [{ "label": "New Recipe", "type": "create" }] },
    { "id": "rec2", "title": "New Recipe", "type": "form", "entity": "recipes" }
  ]
};

export const templates = [crmTemplate, taskTemplate, employeeTemplate, inventoryTemplate, ticketsTemplate, eventTemplate, realEstateTemplate, recipeTemplate];
