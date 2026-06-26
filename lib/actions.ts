"use server"

import {
  paints,
  suppliers,
  users,
  transactions,
  alerts,
  generateId,
  getPaintById,
  getSupplierById,
} from "./data"
import type { FinishType, UserRole } from "./types"

// --- PAINT ACTIONS ---

export async function addPaint(formData: FormData) {
  const paint = {
    id: generateId("p"),
    name: formData.get("name") as string,
    colorHex: formData.get("colorHex") as string,
    finishType: formData.get("finishType") as FinishType,
    brand: formData.get("brand") as string,
    stock: parseInt(formData.get("stock") as string) || 0,
    threshold: parseInt(formData.get("threshold") as string) || 10,
    supplierId: formData.get("supplierId") as string,
    createdAt: new Date().toISOString(),
  }

  paints.push(paint)
  return { success: true }
}

export async function updatePaint(paintId: string, formData: FormData) {
  const paint = paints.find((p) => p.id === paintId)
  if (!paint) return { error: "Paint not found" }

  paint.name = (formData.get("name") as string) || paint.name
  paint.colorHex = (formData.get("colorHex") as string) || paint.colorHex
  paint.finishType = (formData.get("finishType") as FinishType) || paint.finishType
  paint.brand = (formData.get("brand") as string) || paint.brand
  paint.threshold = parseInt(formData.get("threshold") as string) || paint.threshold
  paint.supplierId = (formData.get("supplierId") as string) || paint.supplierId

  return { success: true }
}

export async function deletePaint(paintId: string) {
  const index = paints.findIndex((p) => p.id === paintId)
  if (index === -1) return { error: "Paint not found" }

  paints.splice(index, 1)
  return { success: true }
}

export async function adjustStock(paintId: string, type: "ADD" | "REMOVE", quantity: number, userId: string, note?: string) {
  const paint = getPaintById(paintId)
  if (!paint) return { error: "Paint not found" }

  if (type === "REMOVE" && paint.stock < quantity) {
    return { error: "Insufficient stock" }
  }

  if (type === "ADD") {
    paint.stock += quantity
  } else {
    paint.stock -= quantity
  }

  transactions.push({
    id: generateId("t"),
    paintId,
    type,
    quantity,
    performedBy: userId,
    date: new Date().toISOString(),
    note,
  })

  // Check if stock is below threshold after removal
  if (type === "REMOVE" && paint.stock <= paint.threshold) {
    const supplier = getSupplierById(paint.supplierId)
    alerts.push({
      id: generateId("a"),
      paintId,
      message: `${paint.name} stock is low (${paint.stock} units, threshold: ${paint.threshold})${supplier ? `. Contact ${supplier.name} at ${supplier.phone}` : ""}`,
      resolved: false,
      createdAt: new Date().toISOString(),
    })
    return { success: true, lowStock: true, paintName: paint.name, stock: paint.stock, threshold: paint.threshold }
  }

  return { success: true }
}

// --- SUPPLIER ACTIONS ---

export async function addSupplier(formData: FormData) {
  suppliers.push({
    id: generateId("s"),
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    address: formData.get("address") as string,
    leadTimeDays: parseInt(formData.get("leadTimeDays") as string) || 3,
  })

  return { success: true }
}

export async function updateSupplier(supplierId: string, formData: FormData) {
  const supplier = suppliers.find((s) => s.id === supplierId)
  if (!supplier) return { error: "Supplier not found" }

  supplier.name = (formData.get("name") as string) || supplier.name
  supplier.email = (formData.get("email") as string) || supplier.email
  supplier.phone = (formData.get("phone") as string) || supplier.phone
  supplier.address = (formData.get("address") as string) || supplier.address
  supplier.leadTimeDays = parseInt(formData.get("leadTimeDays") as string) || supplier.leadTimeDays

  return { success: true }
}

export async function deleteSupplier(supplierId: string) {
  const index = suppliers.findIndex((s) => s.id === supplierId)
  if (index === -1) return { error: "Supplier not found" }

  suppliers.splice(index, 1)
  return { success: true }
}

// --- USER ACTIONS ---

export async function addUser(formData: FormData) {
  users.push({
    id: generateId("u"),
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: formData.get("role") as UserRole,
    createdAt: new Date().toISOString(),
  })

  return { success: true }
}

export async function updateUser(userId: string, formData: FormData) {
  const user = users.find((u) => u.id === userId)
  if (!user) return { error: "User not found" }

  user.name = (formData.get("name") as string) || user.name
  user.email = (formData.get("email") as string) || user.email
  user.role = (formData.get("role") as UserRole) || user.role
  const password = formData.get("password") as string
  if (password) user.password = password

  return { success: true }
}

export async function deleteUser(userId: string) {
  const index = users.findIndex((u) => u.id === userId)
  if (index === -1) return { error: "User not found" }

  users.splice(index, 1)
  return { success: true }
}

// --- ALERT ACTIONS ---

export async function resolveAlert(alertId: string) {
  const alert = alerts.find((a) => a.id === alertId)
  if (!alert) return { error: "Alert not found" }

  alert.resolved = true
  return { success: true }
}
