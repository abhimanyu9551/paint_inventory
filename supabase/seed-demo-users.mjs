// One-time script: creates the 3 demo login accounts as real Supabase Auth
// users (matching the credentials shown on the login page) and sets their
// role via user_metadata, which the `handle_new_user` trigger (see
// supabase/schema.sql) copies into the `profiles` table automatically.
//
// Usage (from the project root, after filling in SUPABASE_SERVICE_ROLE_KEY
// in .env.local):
//   node --env-file=.env.local supabase/seed-demo-users.mjs

import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Fill them in .env.local, then run: node --env-file=.env.local supabase/seed-demo-users.mjs"
  )
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const demoUsers = [
  { name: "John Admin", email: "admin@alnoor.com", password: "Alnoor#Adm!n2026", role: "admin" },
  { name: "Sarah Supervisor", email: "supervisor@alnoor.com", password: "Alnoor#Sup3r2026", role: "supervisor" },
  { name: "Mike User", email: "user@alnoor.com", password: "Alnoor#Us3r2026", role: "user" },
]

for (const demoUser of demoUsers) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: demoUser.email,
    password: demoUser.password,
    email_confirm: true,
    user_metadata: { name: demoUser.name, role: demoUser.role },
  })

  if (error) {
    if (error.message.toLowerCase().includes("already been registered")) {
      console.log(`Skipped ${demoUser.email} - already exists.`)
      continue
    }
    console.error(`Failed to create ${demoUser.email}:`, error.message)
    continue
  }

  console.log(`Created ${demoUser.role} account: ${demoUser.email} (id: ${data.user.id})`)
}

// --- Seed sample inventory data (suppliers, paints, transactions, alerts) ---
// Skips entirely if suppliers already exist, so it's safe to re-run.

const { count: existingSupplierCount } = await supabase
  .from("suppliers")
  .select("*", { count: "exact", head: true })

if (existingSupplierCount && existingSupplierCount > 0) {
  console.log("Suppliers already exist - skipping inventory seed.")
  process.exit(0)
}

const { data: adminProfile } = await supabase.from("profiles").select("id").eq("email", "admin@alnoor.com").single()
const { data: supervisorProfile } = await supabase
  .from("profiles")
  .select("id")
  .eq("email", "supervisor@alnoor.com")
  .single()
const { data: userProfile } = await supabase.from("profiles").select("id").eq("email", "user@alnoor.com").single()

const { data: suppliers, error: supplierError } = await supabase
  .from("suppliers")
  .insert([
    { name: "ColorMax Industries", email: "orders@colormax.com", phone: "+1-555-0101", address: "123 Paint Ave, Chicago, IL 60601", lead_time_days: 5 },
    { name: "PaintPro Supplies", email: "supply@paintpro.com", phone: "+1-555-0202", address: "456 Color St, Houston, TX 77001", lead_time_days: 3 },
    { name: "BrightCoat Ltd", email: "info@brightcoat.com", phone: "+1-555-0303", address: "789 Finish Blvd, Phoenix, AZ 85001", lead_time_days: 7 },
    { name: "Premium Paints Co", email: "sales@premiumpaint.com", phone: "+1-555-0404", address: "321 Brush Ln, Denver, CO 80201", lead_time_days: 4 },
  ])
  .select()

if (supplierError) {
  console.error("Failed to seed suppliers:", supplierError.message)
  process.exit(1)
}
const [s1, s2, s3, s4] = suppliers
console.log(`Seeded ${suppliers.length} suppliers.`)

const { data: paints, error: paintError } = await supabase
  .from("paints")
  .insert([
    { name: "Arctic White", color_hex: "#F5F5F5", finish_type: "Matte", brand: "ColorMax", stock: 150, threshold: 30, supplier_id: s1.id },
    { name: "Ocean Blue", color_hex: "#0077B6", finish_type: "Gloss", brand: "PaintPro", stock: 8, threshold: 20, supplier_id: s2.id },
    { name: "Forest Green", color_hex: "#2D6A4F", finish_type: "Satin", brand: "BrightCoat", stock: 95, threshold: 25, supplier_id: s3.id },
    { name: "Sunset Orange", color_hex: "#E76F51", finish_type: "Matte", brand: "Premium", stock: 12, threshold: 15, supplier_id: s4.id },
    { name: "Midnight Black", color_hex: "#1A1A2E", finish_type: "Gloss", brand: "ColorMax", stock: 200, threshold: 40, supplier_id: s1.id },
    { name: "Ruby Red", color_hex: "#C1121F", finish_type: "Satin", brand: "PaintPro", stock: 5, threshold: 10, supplier_id: s2.id },
    { name: "Golden Yellow", color_hex: "#F4A261", finish_type: "Matte", brand: "BrightCoat", stock: 180, threshold: 35, supplier_id: s3.id },
    { name: "Silver Gray", color_hex: "#ADB5BD", finish_type: "Gloss", brand: "Premium", stock: 110, threshold: 20, supplier_id: s4.id },
    { name: "Lavender Dream", color_hex: "#B5838D", finish_type: "Satin", brand: "ColorMax", stock: 60, threshold: 15, supplier_id: s1.id },
    { name: "Coral Pink", color_hex: "#F08080", finish_type: "Matte", brand: "PaintPro", stock: 45, threshold: 10, supplier_id: s2.id },
    { name: "Sky Blue", color_hex: "#90E0EF", finish_type: "Eggshell", brand: "BrightCoat", stock: 75, threshold: 20, supplier_id: s3.id },
    { name: "Terracotta", color_hex: "#C4876B", finish_type: "Matte", brand: "Premium", stock: 30, threshold: 12, supplier_id: s4.id },
  ])
  .select()

if (paintError) {
  console.error("Failed to seed paints:", paintError.message)
  process.exit(1)
}
console.log(`Seeded ${paints.length} paints.`)

if (adminProfile && supervisorProfile && userProfile) {
  const byName = Object.fromEntries(paints.map((p) => [p.name, p]))
  const { error: txError } = await supabase.from("stock_transactions").insert([
    { paint_id: byName["Arctic White"].id, type: "ADD", quantity: 50, performed_by: adminProfile.id, note: "Bulk restock" },
    { paint_id: byName["Ocean Blue"].id, type: "REMOVE", quantity: 12, performed_by: userProfile.id, note: "Floor 3 painting" },
    { paint_id: byName["Forest Green"].id, type: "ADD", quantity: 30, performed_by: supervisorProfile.id, note: "Supplier delivery" },
    { paint_id: byName["Midnight Black"].id, type: "REMOVE", quantity: 20, performed_by: userProfile.id, note: "Exterior wall project" },
    { paint_id: byName["Ruby Red"].id, type: "REMOVE", quantity: 5, performed_by: userProfile.id, note: "Accent wall painting" },
  ])
  if (txError) console.error("Failed to seed transactions:", txError.message)
  else console.log("Seeded 5 sample transactions.")

  const { error: alertError } = await supabase.from("alerts").insert([
    { paint_id: byName["Ocean Blue"].id, message: "Ocean Blue stock is critically low (8 units, threshold: 20)", resolved: false },
    { paint_id: byName["Sunset Orange"].id, message: "Sunset Orange stock is below threshold (12 units, threshold: 15)", resolved: false },
    { paint_id: byName["Ruby Red"].id, message: "Ruby Red stock is critically low (5 units, threshold: 10)", resolved: false },
  ])
  if (alertError) console.error("Failed to seed alerts:", alertError.message)
  else console.log("Seeded 3 sample alerts.")
}

console.log("Done.")
