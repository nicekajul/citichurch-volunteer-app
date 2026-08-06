"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Bell, Search, Calendar, Megaphone, Award, Info, CheckCheck, X,
} from "lucide-react"
import type { AppNotification } from "@/lib/data-context"

interface HeaderProps {
  title: string
  subtitle?: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

const typeIcon: Record<AppNotification["type"], React.ElementType> = {
  schedule:     Calendar,
  announcement: Megaphone,
  application:  Award,
  training:     Award,
  info:         Info,
}

const typeColor: Record<AppNotification["type"], string> = {
  schedule:     "bg-blue-500/10 text-blue-500",
  announcement: "bg-amber-500/10 text-amber-500",
  application:  "bg-green-500/10 text-green-500",
  training:     "bg-purple-500/10 text-purple-500",
  info:         "bg-muted text-muted-foreground",
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth()
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useData()
  const router = useRouter()

  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLButtonElement>(null)

  // Close panel when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        bellRef.current && !bellRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleNotificationClick = async (n: AppNotification) => {
    if (!n.read) await markNotificationRead(n.id)
    setIsOpen(false)
    if (n.link) router.push(n.link)
  }

  const getRoleBadge = () => {
    if (!user) return null
    const roleLabels = { admin: "Administrator", leader: "Team Leader", volunteer: "Volunteer" }
    return roleLabels[user.role]
  }

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border shadow-[0_1px_0_0_var(--border),0_4px_16px_oklch(0_0_0/0.06)]">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left — Title */}
        <div className="pl-12 lg:pl-0">
          <h1 className="text-base font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="w-64 pl-9 h-9 bg-muted/50 border-transparent focus:border-border"
            />
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              ref={bellRef}
              onClick={() => setIsOpen((v) => !v)}
              className="relative p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
              <div
                ref={panelRef}
                className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
              >
                {/* Panel Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">Notifications</p>
                    {unreadCount > 0 && (
                      <Badge className="h-5 px-1.5 text-xs bg-red-500/10 text-red-500 border-red-500/20">
                        {unreadCount} new
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground"
                        onClick={markAllNotificationsRead}
                      >
                        <CheckCheck className="w-3.5 h-3.5 mr-1" />
                        Mark all read
                      </Button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notification List */}
                <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Bell className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const Icon = typeIcon[n.type] || Info
                      return (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${
                            !n.read ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${typeColor[n.type]}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm leading-tight ${!n.read ? "font-semibold" : "font-medium"}`}>
                                {n.title}
                              </p>
                              <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                                {timeAgo(n.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>
                          </div>
                          {!n.read && (
                            <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-border">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold leading-tight">{user?.name?.split(" ")[0]}</p>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{getRoleBadge()}</p>
            </div>
            <Avatar className="w-8 h-8 ring-2 ring-primary/20">
              <AvatarImage src={user?.avatar_url || undefined} alt={user?.name} />
              <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
                {user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  )
}
