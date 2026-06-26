"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Shield, Eye, User, Lock, Mail } from "lucide-react"
import Image from "next/image"

const demoCredentials = [
  {
    role: "Admin",
    email: "admin@alnoor.com",
    password: "Alnoor#Adm!n2026",
    description: "Full access to all features including user management, suppliers, and reports",
    icon: Shield,
    badgeClass: "bg-red-500/10 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-800",
    cardHoverClass: "hover:border-red-300 dark:hover:border-red-700",
  },
  {
    role: "Supervisor",
    email: "supervisor@alnoor.com",
    password: "Alnoor#Sup3r2026",
    description: "Manage paint inventory, stock levels, transactions, and alerts",
    icon: Eye,
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-800",
    cardHoverClass: "hover:border-amber-300 dark:hover:border-amber-700",
  },
  {
    role: "User",
    email: "user@alnoor.com",
    password: "Alnoor#Us3r2026",
    description: "View available paints and consume stock for assigned tasks",
    icon: User,
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-800",
    cardHoverClass: "hover:border-blue-300 dark:hover:border-blue-700",
  },
]

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await login(email, password)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push("/dashboard")
  }

  function handleDemoClick(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setError("")
  }

  return (
    <div className="flex w-full max-w-[460px] flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <Image src="/logo.png" alt="Alnoor Logo" width={200} height={80} className="h-16 w-auto" />
        <p className="text-sm text-muted-foreground text-balance">
          Alnoor Paint Inventory Management System
        </p>
      </div>

      <Card className="border-border/60 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-card-foreground">Sign in</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-card-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-card-foreground">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pl-9"
                />
              </div>
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Demo Accounts</span>
          <Separator className="flex-1" />
        </div>
        <div className="flex flex-col gap-2.5">
          {demoCredentials.map((cred) => {
            const Icon = cred.icon
            return (
              <button
                key={cred.role}
                type="button"
                onClick={() => handleDemoClick(cred.email, cred.password)}
                className={`group flex w-full items-start gap-3 rounded-lg border border-border/60 bg-card p-3.5 text-left transition-all ${cred.cardHoverClass} hover:shadow-md`}
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-card-foreground">{cred.role}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-medium ${cred.badgeClass}`}>
                      {cred.role.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{cred.description}</p>
                  <code className="mt-0.5 text-[11px] font-mono text-muted-foreground/70">
                    {cred.email} / {cred.password}
                  </code>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
