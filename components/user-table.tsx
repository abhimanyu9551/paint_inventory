"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { addUser, updateUser, deleteUser } from "@/lib/actions"
import { toast } from "sonner"
import type { User, UserRole, SessionUser } from "@/lib/types"
import { Plus, MoreHorizontal, Pencil, Trash2, Search } from "lucide-react"

const roleBadgeStyles: Record<UserRole, string> = {
  admin: "bg-red-500/10 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-800",
  supervisor: "bg-amber-500/10 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-800",
  user: "bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-800",
}

export function UserTable({ users, currentUser }: { users: User[]; currentUser: SessionUser }) {
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null })
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  function handleDelete(id: string, name: string) {
    if (id === currentUser.id) {
      toast.error("You cannot delete your own account")
      return
    }
    if (!confirm(`Delete user "${name}"?`)) return
    startTransition(async () => {
      const result = await deleteUser(id)
      if (result.error) toast.error(result.error)
      else {
        toast.success(`Deleted ${name}`)
        router.refresh()
      }
    })
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = modal.user
        ? await updateUser(modal.user.id, formData)
        : await addUser(formData)
      if (result.error) toast.error(result.error)
      else {
        toast.success(modal.user ? "User updated" : "User added")
        setModal({ open: false, user: null })
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => setModal({ open: true, user: null })}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="w-[60px]"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No users found</TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-foreground">
                    {u.name}
                    {u.id === currentUser.id && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleBadgeStyles[u.role]}>
                      {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setModal({ open: true, user: u })}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          disabled={u.id === currentUser.id}
                          onClick={() => handleDelete(u.id, u.name)}
                        >
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

      <Dialog open={modal.open} onOpenChange={(open) => setModal({ open, user: open ? modal.user : null })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">{modal.user ? "Edit" : "Add"} User</DialogTitle>
            <DialogDescription>
              {modal.user ? "Update user information" : "Create a new user account"}
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit}>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="uname">Name *</Label>
                  <Input id="uname" name="name" defaultValue={modal.user?.name || ""} required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="uemail">Email *</Label>
                  <Input id="uemail" name="email" type="email" defaultValue={modal.user?.email || ""} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="upassword">Password {modal.user ? "(leave blank to keep)" : "*"}</Label>
                  <Input id="upassword" name="password" type="password" required={!modal.user} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Role *</Label>
                  <Select name="role" defaultValue={modal.user?.role || "user"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setModal({ open: false, user: null })} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : modal.user ? "Save" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
