import { createClient } from "@/lib/supabase/server"
import type { User, Paint, Supplier, StockTransaction, Alert } from "./types"

// Server-only data access layer backed by Supabase Postgres.
// Only import this from Server Components / Server Actions / Route Handlers.

function mapUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  }
}

function mapSupplier(row: any): Supplier {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    address: row.address ?? "",
    leadTimeDays: row.lead_time_days,
  }
}

function mapPaint(row: any): Paint {
  return {
    id: row.id,
    name: row.name,
    colorHex: row.color_hex ?? "",
    finishType: row.finish_type,
    brand: row.brand ?? "",
    stock: row.stock,
    threshold: row.threshold,
    supplierId: row.supplier_id,
    createdAt: row.created_at,
  }
}

function mapTransaction(row: any): StockTransaction {
  return {
    id: row.id,
    paintId: row.paint_id,
    type: row.type,
    quantity: row.quantity,
    performedBy: row.performed_by,
    date: row.date,
    note: row.note ?? undefined,
  }
}

function mapAlert(row: any): Alert {
  return {
    id: row.id,
    paintId: row.paint_id,
    message: row.message,
    resolved: row.resolved,
    createdAt: row.created_at,
  }
}

// --- USERS (profiles) ---

export async function getUsers(): Promise<User[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: true })
  return (data ?? []).map(mapUser)
}

export async function getUserById(id: string): Promise<User | undefined> {
  const supabase = await createClient()
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle()
  return data ? mapUser(data) : undefined
}

// --- SUPPLIERS ---

export async function getSuppliers(): Promise<Supplier[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("suppliers").select("*").order("name", { ascending: true })
  return (data ?? []).map(mapSupplier)
}

export async function getSupplierById(id: string): Promise<Supplier | undefined> {
  const supabase = await createClient()
  const { data } = await supabase.from("suppliers").select("*").eq("id", id).maybeSingle()
  return data ? mapSupplier(data) : undefined
}

// --- PAINTS ---

export async function getPaints(): Promise<Paint[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("paints").select("*").order("created_at", { ascending: true })
  return (data ?? []).map(mapPaint)
}

export async function getPaintById(id: string): Promise<Paint | undefined> {
  const supabase = await createClient()
  const { data } = await supabase.from("paints").select("*").eq("id", id).maybeSingle()
  return data ? mapPaint(data) : undefined
}

export async function getLowStockPaints(): Promise<Paint[]> {
  const paints = await getPaints()
  return paints.filter((p) => p.stock <= p.threshold)
}

// --- TRANSACTIONS ---

export async function getTransactions(): Promise<StockTransaction[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("stock_transactions").select("*").order("date", { ascending: false })
  return (data ?? []).map(mapTransaction)
}

export async function getTransactionsForPaint(paintId: string): Promise<StockTransaction[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("stock_transactions")
    .select("*")
    .eq("paint_id", paintId)
    .order("date", { ascending: false })
  return (data ?? []).map(mapTransaction)
}

export async function getRecentTransactions(limit = 10): Promise<StockTransaction[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("stock_transactions")
    .select("*")
    .order("date", { ascending: false })
    .limit(limit)
  return (data ?? []).map(mapTransaction)
}

// --- ALERTS ---

export async function getAlerts(): Promise<Alert[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("alerts").select("*").order("created_at", { ascending: false })
  return (data ?? []).map(mapAlert)
}

export async function getUnresolvedAlerts(): Promise<Alert[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("alerts")
    .select("*")
    .eq("resolved", false)
    .order("created_at", { ascending: false })
  return (data ?? []).map(mapAlert)
}
