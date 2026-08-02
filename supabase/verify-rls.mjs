// One-off verification script (not part of the app): signs in as each demo
// role and attempts direct Supabase REST operations, bypassing the Next.js
// app entirely - simulating exactly the attack the RLS hardening should stop.

import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function client() {
  return createClient(url, anonKey, { auth: { persistSession: false } })
}

async function signIn(email, password) {
  const supabase = client()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Sign in failed for ${email}: ${error.message}`)
  return supabase
}

let pass = 0
let fail = 0

async function expect(label, promise, shouldSucceed) {
  const { data, error } = await promise
  const succeeded = !error
  const ok = succeeded === shouldSucceed
  console.log(`${ok ? "PASS" : "FAIL"} - ${label} - ${succeeded ? "succeeded" : `blocked (${error.message})`}`)
  if (ok) pass++
  else fail++
  return data
}

// UPDATE under RLS silently affects 0 rows (no error!) when the USING clause
// filters the target out - so for updates we must check the returned row
// count via .select(), not just whether an error came back.
async function expectUpdate(label, promise, shouldSucceed) {
  const { data, error } = await promise
  const rowsAffected = Array.isArray(data) ? data.length : 0
  const succeeded = !error && rowsAffected > 0
  const ok = succeeded === shouldSucceed
  console.log(
    `${ok ? "PASS" : "FAIL"} - ${label} - ${error ? `errored (${error.message})` : succeeded ? "succeeded" : "silently affected 0 rows (RLS blocked)"}`
  )
  if (ok) pass++
  else fail++
  return data
}

// --- "user" role: should be blocked from all admin-only writes ---
const asUser = await signIn("user@alnoor.com", "Alnoor#Us3r2026")
await expect(
  "user inserts a supplier (should be BLOCKED)",
  asUser.from("suppliers").insert({ name: "Rogue Supplier", lead_time_days: 1 }),
  false
)
await expect(
  "user inserts a paint (should be BLOCKED)",
  asUser.from("paints").insert({ name: "Rogue Paint", stock: 0, threshold: 0 }),
  false
)
const { data: anyPaint } = await asUser.from("paints").select("id, stock").limit(1).single()
await expectUpdate(
  "user updates paint stock (should be ALLOWED - consume/restock)",
  asUser.from("paints").update({ stock: anyPaint.stock }).eq("id", anyPaint.id).select(),
  true
)
const { data: anyAlert } = await asUser.from("alerts").select("id").eq("resolved", false).limit(1).maybeSingle()
if (anyAlert) {
  await expectUpdate(
    "user resolves an alert (should be BLOCKED)",
    asUser.from("alerts").update({ resolved: true }).eq("id", anyAlert.id).select(),
    false
  )
}

// --- Privilege escalation check: a user must NOT be able to change their own
// role via a direct profiles update, even though "id = auth.uid()" alone
// would let them touch the row (RLS is row-level, not column-level).
const {
  data: { user: userAuthUser },
} = await asUser.auth.getUser()
await expectUpdate(
  "user sets their own role to admin (should be BLOCKED - privilege escalation)",
  asUser.from("profiles").update({ role: "admin" }).eq("id", userAuthUser.id).select(),
  false
)
const { data: userProfileAfter } = await asUser.from("profiles").select("role").eq("id", userAuthUser.id).single()
const stillUser = userProfileAfter?.role === "user"
console.log(`${stillUser ? "PASS" : "FAIL"} - user's role in the database is still "user" after the attempt`)
if (stillUser) pass++
else fail++

// --- "supervisor" role: can resolve alerts, still can't touch suppliers ---
const asSupervisor = await signIn("supervisor@alnoor.com", "Alnoor#Sup3r2026")
await expect(
  "supervisor inserts a supplier (should be BLOCKED)",
  asSupervisor.from("suppliers").insert({ name: "Rogue Supplier 2", lead_time_days: 1 }),
  false
)
if (anyAlert) {
  await expectUpdate(
    "supervisor resolves an alert (should be ALLOWED)",
    asSupervisor.from("alerts").update({ resolved: true }).eq("id", anyAlert.id).select(),
    true
  )
  // put it back for the demo data
  await asSupervisor.from("alerts").update({ resolved: false }).eq("id", anyAlert.id)
}

// --- "admin" role: full access, including the operations above ---
const asAdmin = await signIn("admin@alnoor.com", "Alnoor#Adm!n2026")
const inserted = await expect(
  "admin inserts a supplier (should be ALLOWED)",
  asAdmin.from("suppliers").insert({ name: "Test Supplier (delete me)", lead_time_days: 1 }).select().single(),
  true
)
if (inserted) {
  await expect(
    "admin deletes the test supplier (should be ALLOWED, cleanup)",
    asAdmin.from("suppliers").delete().eq("id", inserted.id),
    true
  )
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
