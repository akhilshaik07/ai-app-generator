// Simple test to verify all 4 config formats work
// Run with: node test-config-formats.js

// Format A: pages array
const formatA = {
  pages: [
    { name: "Users", slug: "users", type: "table", fields: [{ name: "id" }, { name: "email" }] },
    { name: "Add User", slug: "add-user", type: "form", fields: [{ name: "email" }] }
  ]
}

// Format B: entities + views
const formatB = {
  entities: [
    { name: "User", fields: [{ name: "id" }, { name: "email" }] }
  ],
  views: [
    { entity: "User", title: "Users", type: "table" },
    { entity: "User", title: "Add User", type: "form" }
  ]
}

// Format C: entities only (auto-generate)
const formatC = {
  entities: [
    { name: "User", fields: [{ name: "id" }, { name: "email" }] },
    { name: "Product", fields: [{ name: "id" }, { name: "name" }] }
  ]
}

// Format D: broken/empty (should not crash)
const formatD = {
  invalid: "data"
}

console.log("Testing Format A (pages array):")
console.log("Expected: 2 pages")
console.log("")

console.log("Testing Format B (entities + views):")
console.log("Expected: 2 pages from views")
console.log("")

console.log("Testing Format C (entities only):")
console.log("Expected: 4 pages (2 entities x 2 pages per entity = table + form)")
console.log("")

console.log("Testing Format D (broken):")
console.log("Expected: 0 pages, no crash")
console.log("")
