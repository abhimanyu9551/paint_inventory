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
    stock: parseInt(formData.get("stock") as string) || 0,
    threshold: parseInt(formData.get("threshold") as string) || 10,
    supplier_id: formData.get("supplierId") as string,
  })

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updatePaint(paintId: string, formData: FormData) {
  const auth = await requireRole(["admin"])
  if (auth.error) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from("paints")
    .update({
      name: formData.get("name") as string,
      color_hex: formData.get("colorHex") as string,
      finish_type: formData.get("finishType") as FinishType,
      brand: formData.get("brand") as string,
      threshold: parseInt(formData.get("threshold") as string) || undefined,
      supplier_id: formData.get("supplierId") as string,
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

  const paint = await getPaintById(paintId)
  if (!paint) return { error: "Paint not found" }

  if (type === "REMOVE" && paint.stock < quantity) {
    return { error: "Insufficient stock" }
  }

  const newStock = type === "ADD" ? paint.stock + quantity : paint.stock - quantity

  const supabase = await createClient()

  const { error: stockError } = await supabase.from("paints").update({ stock: newStock }).eq("id", paintId)
  if (stockError) return { error: stockError.message }

  const { error: txError } = await supabase.from("stock_transactions").insert({
    paint_id: paintId,
    type,
    quantity,
    performed_by: userId,
    note,
  })
  if (txError) return { error: txError.message }

  // Check if stock is below threshold after removal
  if (type === "REMOVE" && newStock <= paint.threshold) {
    const supplier = await getSupplierById(paint.supplierId)
    await supabase.from("alerts").insert({
      paint_id: paintId,
      message: `${paint.name} stock is low (${newStock} units, threshold: ${paint.threshold})${supplier ? `. Contact ${supplier.name} at ${supplier.phone}` : ""}`,
      resolved: false,
    })
    revalidatePath("/dashboard")
    return { success: true, lowStock: true, paintName: paint.name, stock: newStock, threshold: paint.threshold }
  }

  revalidatePath("/dashboard")
  return { success: true }
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
    lead_time_days: parseInt(formData.get("leadTimeDays") as string) || 3,
  })

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateSupplier(supplierId: string, formData: FormData) {
  const auth = await requireRole(["admin"])
  if (auth.error) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from("suppliers")
    .update({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      lead_time_days: parseInt(formData.get("leadTimeDays") as string) || undefined,
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
