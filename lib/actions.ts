"use server"

import { revalidatePath } from "next/cache"
import { createClient, getSessionUser } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getPaintById, getSupplierById } from "./data"
import type { FinishType, UserRole } from "./types"

// Every Server Action is a network-callable endpoint once its reference ships
// to the client, regardless of which page renders the button that calls it -
// so each mutation re-checks the caller's role here rather than trusting the
// page-level UI gating.
async function requireRole(allowedRoles: UserRole[]) {
  const user = await getSessionUser()
  if (!user) return { error: "Not authenticated" }
  if (!allowedRoles.includes(user.role)) return { error: "You don't have permission to perform this action" }
  return { error: null }
}

// `parseInt(...) || fallback` treats an explicitly entered 0 the same as an
// empty/invalid field, silently discarding it - this parses to a real number
// and only falls back when the input is genuinely missing or not a number.
function parseIntOrDefault(value: FormDataEntryValue | null, fallback: number): number {
  if (value === null || value === "") return fallback
  const parsed = parseInt(value as string, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

// --- PAINT ACTIONS ---

export async function addPaint(formData: FormData) {
  const auth = await requireRole(["admin"])
  if (auth.error) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from("paints").insert({
    name: formData.get("name") as string,
    color_hex: formData.get("colorHex") as string,
    finish_type: formData.get("finishType") as FinishType,
    brand: formData.get("brand") as string,
    stock: parseIntOrDefault(formData.get("stock"), 0),
    threshold: parseIntOrDefault(formData.get("threshold"), 10),
    supplier_id: formData.get("supplierId") as string,
  })

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updatePaint(paintId: string, formData: FormData) {
  const auth = await requireRole(["admin"])
  if (auth.error) return { error: auth.error }

  const existing = await getPaintById(paintId)
  if (!existing) return { error: "Paint not found" }

  const supabase = await createClient()
  const { error } = await supabase
    .from("paints")
    .update({
      name: (formData.get("name") as string) || existing.name,
      color_hex: (formData.get("colorHex") as string) || existing.colorHex,
      finish_type: (formData.get("finishType") as FinishType) || existing.finishType,
      brand: (formData.get("brand") as string) || existing.brand,
      threshold: parseIntOrDefault(formData.get("threshold"), existing.threshold),
      supplier_id: (formData.get("supplierId") as string) || existing.supplierId,
    })
    .eq("id", paintId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deletePaint(paintId: string) {
  const auth = await requireRole(["admin"])
  if (auth.error) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from("paints").delete().eq("id", paintId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  return { success: true }
}

export async function adjustStock(
  paintId: string,
  type: "ADD" | "REMOVE",
  quantity: number,
  userId: string,
  note?: string
) {
  const auth = await requireRole(["admin", "supervisor", "user"])
  if (auth.error) return { error: auth.error }

  const supabase = await createClient()

  // adjust_stock runs the read, stock update, transaction insert, and
  // dedup'd alert insert as one atomic transaction with the paint row
  // locked for its duration - see supabase/adjust-stock-rpc.sql.
  const { data, error } = await supabase.rpc("adjust_stock", {
    p_paint_id: paintId,
    p_type: type,
    p_quantity: quantity,
    p_user_id: userId,
    p_note: note ?? null,
  })

  if (error) {
    if (error.message.includes("Insufficient stock")) return { error: "Insufficient stock" }
    if (error.message.includes("Paint not found")) return { error: "Paint not found" }
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return {
    success: true,
    lowStock: data.lowStock,
    paintName: data.paintName,
    stock: data.newStock,
    threshold: data.threshold,
  }
}

// --- SUPPLIER ACTIONS ---

export async function addSupplier(formData: FormData) {
  const auth = await requireRole(["admin"])
  if (auth.error) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from("suppliers").insert({
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    address: formData.get("address") as string,
    lead_time_days: parseIntOrDefault(formData.get("leadTimeDays"), 3),
  })

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateSupplier(supplierId: string, formData: FormData) {
  const auth = await requireRole(["admin"])
  if (auth.error) return { error: auth.error }

  const existing = await getSupplierById(supplierId)
  if (!existing) return { error: "Supplier not found" }

  const supabase = await createClient()
  const { error } = await supabase
    .from("suppliers")
    .update({
      name: (formData.get("name") as string) || existing.name,
      email: (formData.get("email") as string) || existing.email,
      phone: (formData.get("phone") as string) || existing.phone,
      address: (formData.get("address") as string) || existing.address,
      lead_time_days: parseIntOrDefault(formData.get("leadTimeDays"), existing.leadTimeDays),
    })
    .eq("id", supplierId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteSupplier(supplierId: string) {
  const auth = await requireRole(["admin"])
  if (auth.error) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from("suppliers").delete().eq("id", supplierId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  return { success: true }
}

// --- USER ACTIONS (real Supabase Auth accounts) ---

export async function addUser(formData: FormData) {
  const auth = await requireRole(["admin"])
  if (auth.error) return { error: auth.error }

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as UserRole

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  })

  if (error) return { error: error.message }
  revalidatePath("/dashboard/users")
  return { success: true }
}

export async function updateUser(userId: string, formData: FormData) {
  const auth = await requireRole(["admin"])
  if (auth.error) return { error: auth.error }

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const role = formData.get("role") as UserRole
  const password = formData.get("password") as string

  const admin = createAdminClient()

  const authUpdate: { email?: string; password?: string } = {}
  if (email) authUpdate.email = email
  if (password) authUpdate.password = password
  if (Object.keys(authUpdate).length > 0) {
    const { error } = await admin.auth.admin.updateUserById(userId, authUpdate)
    if (error) return { error: error.message }
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ name, email, role })
    .eq("id", userId)

  if (profileError) return { error: profileError.message }
  revalidatePath("/dashboard/users")
  return { success: true }
}

export async function deleteUser(userId: string) {
  const auth = await requireRole(["admin"])
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/users")
  return { success: true }
}

// --- ALERT ACTIONS ---

export async function resolveAlert(alertId: string) {
  const auth = await requireRole(["admin", "supervisor"])
  if (auth.error) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from("alerts").update({ resolved: true }).eq("id", alertId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  return { success: true }
}
