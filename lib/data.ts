import type { User, Paint, Supplier, StockTransaction, Alert } from "./types"

// --- SEED DATA ---

export const users: User[] = [
  {
    id: "u1",
    name: "John Admin",
    email: "admin@alnoor.com",
    password: "Alnoor#Adm!n2026",
    role: "admin",
    createdAt: "2025-01-15T08:00:00Z",
  },
  {
    id: "u2",
    name: "Sarah Supervisor",
    email: "supervisor@alnoor.com",
    password: "Alnoor#Sup3r2026",
    role: "supervisor",
    createdAt: "2025-02-01T08:00:00Z",
  },
  {
    id: "u3",
    name: "Mike User",
    email: "user@alnoor.com",
    password: "Alnoor#Us3r2026",
    role: "user",
    createdAt: "2025-03-10T08:00:00Z",
  },
]

export const suppliers: Supplier[] = [
  {
    id: "s1",
    name: "ColorMax Industries",
    email: "orders@colormax.com",
    phone: "+1-555-0101",
    address: "123 Paint Ave, Chicago, IL 60601",
    leadTimeDays: 5,
  },
  {
    id: "s2",
    name: "PaintPro Supplies",
    email: "supply@paintpro.com",
    phone: "+1-555-0202",
    address: "456 Color St, Houston, TX 77001",
    leadTimeDays: 3,
  },
  {
    id: "s3",
    name: "BrightCoat Ltd",
    email: "info@brightcoat.com",
    phone: "+1-555-0303",
    address: "789 Finish Blvd, Phoenix, AZ 85001",
    leadTimeDays: 7,
  },
  {
    id: "s4",
    name: "Premium Paints Co",
    email: "sales@premiumpaint.com",
    phone: "+1-555-0404",
    address: "321 Brush Ln, Denver, CO 80201",
    leadTimeDays: 4,
  },
]

export const paints: Paint[] = [
  {
    id: "p1",
    name: "Arctic White",
    colorHex: "#F5F5F5",
    finishType: "Matte",
    brand: "ColorMax",
    stock: 150,
    threshold: 30,
    supplierId: "s1",
    createdAt: "2025-01-20T10:00:00Z",
  },
  {
    id: "p2",
    name: "Ocean Blue",
    colorHex: "#0077B6",
    finishType: "Gloss",
    brand: "PaintPro",
    stock: 8,
    threshold: 20,
    supplierId: "s2",
    createdAt: "2025-01-22T10:00:00Z",
  },
  {
    id: "p3",
    name: "Forest Green",
    colorHex: "#2D6A4F",
    finishType: "Satin",
    brand: "BrightCoat",
    stock: 95,
    threshold: 25,
    supplierId: "s3",
    createdAt: "2025-01-25T10:00:00Z",
  },
  {
    id: "p4",
    name: "Sunset Orange",
    colorHex: "#E76F51",
    finishType: "Matte",
    brand: "Premium",
    stock: 12,
    threshold: 15,
    supplierId: "s4",
    createdAt: "2025-02-01T10:00:00Z",
  },
  {
    id: "p5",
    name: "Midnight Black",
    colorHex: "#1A1A2E",
    finishType: "Gloss",
    brand: "ColorMax",
    stock: 200,
    threshold: 40,
    supplierId: "s1",
    createdAt: "2025-02-05T10:00:00Z",
  },
  {
    id: "p6",
    name: "Ruby Red",
    colorHex: "#C1121F",
    finishType: "Satin",
    brand: "PaintPro",
    stock: 5,
    threshold: 10,
    supplierId: "s2",
    createdAt: "2025-02-10T10:00:00Z",
  },
  {
    id: "p7",
    name: "Golden Yellow",
    colorHex: "#F4A261",
    finishType: "Matte",
    brand: "BrightCoat",
    stock: 180,
    threshold: 35,
    supplierId: "s3",
    createdAt: "2025-02-15T10:00:00Z",
  },
  {
    id: "p8",
    name: "Silver Gray",
    colorHex: "#ADB5BD",
    finishType: "Gloss",
    brand: "Premium",
    stock: 110,
    threshold: 20,
    supplierId: "s4",
    createdAt: "2025-02-20T10:00:00Z",
  },
  {
    id: "p9",
    name: "Lavender Dream",
    colorHex: "#B5838D",
    finishType: "Satin",
    brand: "ColorMax",
    stock: 60,
    threshold: 15,
    supplierId: "s1",
    createdAt: "2025-03-01T10:00:00Z",
  },
  {
    id: "p10",
    name: "Coral Pink",
    colorHex: "#F08080",
    finishType: "Matte",
    brand: "PaintPro",
    stock: 45,
    threshold: 10,
    supplierId: "s2",
    createdAt: "2025-03-05T10:00:00Z",
  },
  {
    id: "p11",
    name: "Sky Blue",
    colorHex: "#90E0EF",
    finishType: "Eggshell",
    brand: "BrightCoat",
    stock: 75,
    threshold: 20,
    supplierId: "s3",
    createdAt: "2025-03-10T10:00:00Z",
  },
  {
    id: "p12",
    name: "Terracotta",
    colorHex: "#C4876B",
    finishType: "Matte",
    brand: "Premium",
    stock: 30,
    threshold: 12,
    supplierId: "s4",
    createdAt: "2025-03-15T10:00:00Z",
  },
]

function generateTransactionDates() {
  const dates: string[] = []
  const now = new Date()
  for (let i = 0; i < 25; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - Math.floor(Math.random() * 30))
    d.setHours(Math.floor(Math.random() * 12) + 7)
    dates.push(d.toISOString())
  }
  return dates.sort()
}

const txDates = generateTransactionDates()

export const transactions: StockTransaction[] = [
  { id: "t1", paintId: "p1", type: "ADD", quantity: 50, performedBy: "u1", date: txDates[0], note: "Bulk restock" },
  { id: "t2", paintId: "p2", type: "REMOVE", quantity: 12, performedBy: "u3", date: txDates[1], note: "Floor 3 painting" },
  { id: "t3", paintId: "p3", type: "ADD", quantity: 30, performedBy: "u2", date: txDates[2], note: "Supplier delivery" },
  { id: "t4", paintId: "p5", type: "REMOVE", quantity: 20, performedBy: "u3", date: txDates[3], note: "Exterior wall project" },
  { id: "t5", paintId: "p6", type: "REMOVE", quantity: 5, performedBy: "u3", date: txDates[4], note: "Accent wall painting" },
  { id: "t6", paintId: "p4", type: "ADD", quantity: 25, performedBy: "u1", date: txDates[5], note: "Emergency restock" },
  { id: "t7", paintId: "p7", type: "REMOVE", quantity: 15, performedBy: "u2", date: txDates[6], note: "Lobby renovation" },
  { id: "t8", paintId: "p8", type: "ADD", quantity: 40, performedBy: "u1", date: txDates[7], note: "Monthly restock" },
  { id: "t9", paintId: "p1", type: "REMOVE", quantity: 10, performedBy: "u3", date: txDates[8], note: "Conference room" },
  { id: "t10", paintId: "p9", type: "ADD", quantity: 20, performedBy: "u2", date: txDates[9], note: "New color arrival" },
  { id: "t11", paintId: "p2", type: "REMOVE", quantity: 8, performedBy: "u3", date: txDates[10], note: "Bathroom tiles" },
  { id: "t12", paintId: "p10", type: "ADD", quantity: 35, performedBy: "u1", date: txDates[11], note: "Bulk order" },
  { id: "t13", paintId: "p5", type: "REMOVE", quantity: 30, performedBy: "u2", date: txDates[12], note: "Parking deck" },
  { id: "t14", paintId: "p3", type: "REMOVE", quantity: 10, performedBy: "u3", date: txDates[13], note: "Fence painting" },
  { id: "t15", paintId: "p11", type: "ADD", quantity: 25, performedBy: "u1", date: txDates[14], note: "New product line" },
  { id: "t16", paintId: "p4", type: "REMOVE", quantity: 18, performedBy: "u3", date: txDates[15], note: "Kitchen remodel" },
  { id: "t17", paintId: "p6", type: "ADD", quantity: 15, performedBy: "u2", date: txDates[16], note: "Supplier shipment" },
  { id: "t18", paintId: "p12", type: "ADD", quantity: 30, performedBy: "u1", date: txDates[17], note: "Initial stock" },
  { id: "t19", paintId: "p7", type: "REMOVE", quantity: 10, performedBy: "u3", date: txDates[18], note: "Stairwell painting" },
  { id: "t20", paintId: "p8", type: "REMOVE", quantity: 15, performedBy: "u2", date: txDates[19], note: "Garage floor" },
  { id: "t21", paintId: "p1", type: "ADD", quantity: 60, performedBy: "u1", date: txDates[20], note: "Quarterly restock" },
  { id: "t22", paintId: "p9", type: "REMOVE", quantity: 8, performedBy: "u3", date: txDates[21], note: "Bedroom accent" },
  { id: "t23", paintId: "p2", type: "ADD", quantity: 20, performedBy: "u2", date: txDates[22], note: "Urgent reorder" },
  { id: "t24", paintId: "p10", type: "REMOVE", quantity: 5, performedBy: "u3", date: txDates[23], note: "Touch up work" },
  { id: "t25", paintId: "p12", type: "REMOVE", quantity: 7, performedBy: "u2", date: txDates[24], note: "Sample swatches" },
]

export const alerts: Alert[] = [
  {
    id: "a1",
    paintId: "p2",
    message: "Ocean Blue stock is critically low (8 units, threshold: 20)",
    resolved: false,
    createdAt: "2026-02-18T09:00:00Z",
  },
  {
    id: "a2",
    paintId: "p4",
    message: "Sunset Orange stock is below threshold (12 units, threshold: 15)",
    resolved: false,
    createdAt: "2026-02-19T14:00:00Z",
  },
  {
    id: "a3",
    paintId: "p6",
    message: "Ruby Red stock is critically low (5 units, threshold: 10)",
    resolved: false,
    createdAt: "2026-02-20T11:00:00Z",
  },
]

// --- HELPER FUNCTIONS ---

let nextId = 100

export function generateId(prefix: string): string {
  nextId++
  return `${prefix}${nextId}`
}

export function getUserByEmail(email: string): User | undefined {
  return users.find((u) => u.email === email)
}

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id)
}

export function getSupplierById(id: string): Supplier | undefined {
  return suppliers.find((s) => s.id === id)
}

export function getPaintById(id: string): Paint | undefined {
  return paints.find((p) => p.id === id)
}

export function getLowStockPaints(): Paint[] {
  return paints.filter((p) => p.stock <= p.threshold)
}

export function getTransactionsForPaint(paintId: string): StockTransaction[] {
  return transactions.filter((t) => t.paintId === paintId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getRecentTransactions(limit: number = 10): StockTransaction[] {
  return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit)
}

export function getUnresolvedAlerts(): Alert[] {
  return alerts.filter((a) => !a.resolved)
}
