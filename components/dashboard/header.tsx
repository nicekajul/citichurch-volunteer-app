"use client"

import { useAuth } from "@/lib/auth-context"
import { Bell, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth()

  const getRoleBadge = () => {
    if (!user) return null
    const roleLabels = {
      admin: "Administrator",
      leader: "Team Leader",
      volunteer: "Volunteer",
    }
    return roleLabels[user.role]
  }

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left side - Title */}
        <div className="pl-12 lg:pl-0">
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="w-64 pl-9 h-9 bg-muted/50 border-transparent focus:border-border"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </button>

          {/* User Info */}
          <div className="flex items-center gap-3 pl-3 border-l border-border">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{user?.name}</p>
              <Badge variant="secondary" className="text-xs font-normal">
                {getRoleBadge()}
              </Badge>
            </div>
            <Avatar className="w-9 h-9">
              <AvatarImage src={user?.avatar_url || undefined} alt={user?.name} />
              <AvatarFallback className="bg-primary/10 text-primary">{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  )
}
