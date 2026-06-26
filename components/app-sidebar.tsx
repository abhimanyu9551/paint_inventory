"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

import { useAuth } from "@/lib/auth-context"
import type { SessionUser } from "@/lib/types"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Paintbrush,
  Truck,
  ArrowLeftRight,
  Users,
  BarChart3,
  AlertTriangle,
  Droplets,
  LogOut,
} from "lucide-react"
import Image from "next/image"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "supervisor", "user"] },
  { title: "Paints", href: "/dashboard/paints", icon: Paintbrush, roles: ["admin", "supervisor"] },
  { title: "Suppliers", href: "/dashboard/suppliers", icon: Truck, roles: ["admin"] },
  { title: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight, roles: ["admin", "supervisor"] },
  { title: "Users", href: "/dashboard/users", icon: Users, roles: ["admin"] },
  { title: "Reports", href: "/dashboard/reports", icon: BarChart3, roles: ["admin"] },
  { title: "Alerts", href: "/dashboard/alerts", icon: AlertTriangle, roles: ["admin", "supervisor"] },
  { title: "Consume Paint", href: "/dashboard/consume", icon: Droplets, roles: ["admin", "supervisor", "user"] },
]

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const roleLabelMap: Record<string, string> = {
  admin: "Administrator",
  supervisor: "Supervisor",
  user: "Staff User",
}

export function AppSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const filteredItems = navItems.filter((item) => item.roles.includes(user.role))

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <Image src="/logo.png" alt="Alnoor Logo" width={32} height={32} className="h-8 w-auto" />
                <span className="text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">Alnoor</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <div className="flex items-center gap-2 px-2 py-1">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{roleLabelMap[user.role]}</span>
          </div>
          <div className="flex items-center gap-0.5 group-data-[collapsible=icon]:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                logout()
                router.replace("/login")
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Log out</span>
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
