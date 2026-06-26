"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { addSupplier, updateSupplier, deleteSupplier } from "@/lib/actions"
import { toast } from "sonner"
import type { Supplier } from "@/lib/types"
import { Plus, MoreHorizontal, Pencil, Trash2, Search } from "lucide-react"

interface SupplierTableProps {
  suppliers: Supplier[]
  paintCounts: Record<string, number>
}

export function SupplierTable({ suppliers, paintCounts }: SupplierTableProps) {
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState<{ open: boolean; supplier: Supplier | null }>({ open: false, supplier: null })
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  )

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete supplier "${name}"?`)) return
    startTransition(async () => {
      const result = await deleteSupplier(id)
      if (result.error) toast.error(result.error)
      else {
        toast.success(`Deleted ${name}`)
        router.refresh()
      }
    })
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = modal.supplier
        ? await updateSupplier(modal.supplier.id, formData)
        : await addSupplier(formData)
      if (result.error) toast.error(result.error)
      else {
        toast.success(modal.supplier ? "Supplier updated" : "Supplier added")
        setModal({ open: false, supplier: null })
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => setModal({ open: true, supplier: null })}>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead className="hidden lg:table-cell">Address</TableHead>
              <TableHead>Lead Time</TableHead>
              <TableHead>Paints</TableHead>
              <TableHead className="w-[60px]"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No suppliers found</TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{s.email}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{s.phone}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground max-w-[200px] truncate">{s.address}</TableCell>
                  <TableCell className="text-muted-foreground">{s.leadTimeDays} days</TableCell>
                  <TableCell className="text-muted-foreground">{paintCounts[s.id] || 0}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setModal({ open: true, supplier: s })}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(s.id, s.name)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modal.open} onOpenChange={(open) => setModal({ open, supplier: open ? modal.supplier : null })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">{modal.supplier ? "Edit" : "Add"} Supplier</DialogTitle>
            <DialogDescription>
              {modal.supplier ? "Update supplier details" : "Add a new supplier to the system"}
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit}>
            <div className="grid gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="sname">Name *</Label>
                <Input id="sname" name="name" defaultValue={modal.supplier?.name || ""} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="semail">Email *</Label>
                  <Input id="semail" name="email" type="email" defaultValue={modal.supplier?.email || ""} required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sphone">Phone *</Label>
                  <Input id="sphone" name="phone" defaultValue={modal.supplier?.phone || ""} required />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="saddress">Address</Label>
                <Input id="saddress" name="address" defaultValue={modal.supplier?.address || ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="slead">Lead Time (days)</Label>
                <Input id="slead" name="leadTimeDays" type="number" min={1} defaultValue={modal.supplier?.leadTimeDays || 3} />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setModal({ open: false, supplier: null })} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : modal.supplier ? "Save" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
