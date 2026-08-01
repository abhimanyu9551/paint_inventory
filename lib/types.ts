export type UserRole = "admin" | "supervisor" | "user"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

export interface Supplier {
  id: string
  name: string
  email: string
  phone: string
  address: string
  leadTimeDays: number
}

export type FinishType = "Matte" | "Gloss" | "Satin" | "Eggshell"

export interface Paint {
  id: string
  name: string
  colorHex: string
  finishType: FinishType
  brand: string
  stock: number
  threshold: number
  supplierId: string
  createdAt: string
}

export type TransactionType = "ADD" | "REMOVE"

export interface StockTransaction {
  id: string
  paintId: string
  type: TransactionType
  quantity: number
  performedBy: string
  date: string
  note?: string
}

export interface Alert {
  id: string
  paintId: string
  message: string
  resolved: boolean
  createdAt: string
}

export interface SessionUser {
  id: string
  name: string
  email: string
  role: UserRole
}
