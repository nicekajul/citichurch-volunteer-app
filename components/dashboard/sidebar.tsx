"use client"

import type React from "react"

import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "@/lib/theme-context"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Video,
  Calendar,
  Settings,
  LogOut,
  Moon,
  Sun,
  UserCircle,
  BookOpen,
  Award,
  Bell,
  ChevronLeft,
  Menu,
  ClipboardList,
  UserPlus,
  CalendarDays,
} from "lucide-react"
import { useState } from "react"
import { useData } from "@/lib/data-context"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles: ("admin" | "leader" | "volunteer")[]
}

const navItems: NavItem[] = [
  { label: "Dashboard",        href: "/dashboard",               icon: LayoutDashboard, roles: ["admin", "leader", "volunteer"] },
  { label: "Team Management",  href: "/dashboard/teams",         icon: Users,           roles: ["admin"] },
  { label: "My Team",          href: "/dashboard/my-team",       icon: Users,           roles: ["leader"] },
  { label: "Training Modules", href: "/dashboard/training",      icon: BookOpen,        roles: ["admin", "leader"] },
  { label: "My Training",      href: "/dashboard/my-training",   icon: BookOpen,        roles: ["volunteer"] },
  { label: "Volunteers",       href: "/dashboard/volunteers",    icon: UserCircle,      roles: ["admin", "leader"] },
  { label: "Schedule",         href: "/dashboard/schedule",      icon: Calendar,        roles: ["admin", "leader", "volunteer"] },
  { label: "My Availability",  href: "/dashboard/availability",  icon: CalendarDays,    roles: ["leader", "volunteer"] },
  { label: "Announcements",    href: "/dashboard/announcements", icon: Bell,            roles: ["admin", "leader", "volunteer"] },
  { label: "Certificates",     href: "/dashboard/certificates",  icon: Award,           roles: ["volunteer"] },
  { label: "Apply for Ministry", href: "/apply",                 icon: UserPlus,        roles: ["volunteer"] },
  { label: "Applications",     href: "/dashboard/applications",  icon: ClipboardList,   roles: ["admin"] },
  { label: "Profile",          href: "/dashboard/profile",       icon: UserCircle,      roles: ["admin", "leader", "volunteer"] },
  { label: "Settings",         href: "/dashboard/settings",      icon: Settings,        roles: ["admin"] },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { ministryApplications } = useData()
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const pendingApplicationsCount = ministryApplications.filter((a) => a.status === "pending").length

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false
    if (!item.roles.includes(user.role)) return false
    if (item.href === "/apply" && user.team_id) return false
    return true
  })

  const getDashboardHref = () => {
    if (!user) return "/dashboard"
    switch (user.role) {
      case "admin":     return "/dashboard/admin"
      case "leader":    return "/dashboard/leader"
      case "volunteer": return "/dashboard/volunteer"
      default:          return "/dashboard"
    }
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === getDashboardHref()
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border shadow-sm"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen flex flex-col",
          "bg-sidebar text-sidebar-foreground",
          "border-r border-sidebar-border",
          "transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo / Brand */}
        <div
          className={cn(
            "flex items-center h-16 px-4 border-b border-sidebar-border shrink-0",
            "bg-gradient-to-r from-sidebar to-sidebar-accent/20",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {!collapsed && (
            <img
              src="/logo-citichurch.png"
              alt="Citichurch"
              className="h-7 w-auto object-contain brightness-0 invert"
            />
          )}
          {collapsed && (
            <img
              src="/citichurch.ico"
              alt="Citichurch"
              className="w-7 h-7 object-contain"
            />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "hidden lg:flex p-1.5 rounded-lg transition-colors",
              "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            )}
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform duration-300", collapsed && "rotate-180")} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30 select-none">
              Navigation
            </p>
          )}
          {filteredNavItems.map((item) => {
            const href = item.label === "Dashboard" ? getDashboardHref() : item.href
            const active = isActive(item.href)

            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(href)
                  setMobileOpen(false)
                }}
                className={cn(
                  "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm",
                  active
                    ? "bg-sidebar-primary/15 text-sidebar-primary font-medium shadow-[inset_2px_0_0_var(--sidebar-primary)]"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  collapsed && "justify-center px-2",
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon
                  className={cn(
                    "w-[18px] h-[18px] flex-shrink-0 transition-colors",
                    active ? "text-sidebar-primary" : "text-sidebar-foreground/50",
                  )}
                />
                {!collapsed && (
                  <span className="flex-1 flex items-center justify-between gap-2 truncate">
                    {item.label}
                    {item.href === "/dashboard/applications" && pendingApplicationsCount > 0 && (
                      <span className="ml-auto text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                        {pendingApplicationsCount}
                      </span>
                    )}
                  </span>
                )}
                {collapsed && item.href === "/dashboard/applications" && pendingApplicationsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 px-2 py-3 border-t border-sidebar-border space-y-0.5">
          <button
            onClick={toggleTheme}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm",
              "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              collapsed && "justify-center px-2",
            )}
            title={collapsed ? (theme === "light" ? "Dark Mode" : "Light Mode") : undefined}
          >
            {theme === "light"
              ? <Moon className="w-[18px] h-[18px] text-sidebar-foreground/50" />
              : <Sun  className="w-[18px] h-[18px] text-sidebar-foreground/50" />
            }
            {!collapsed && (
              <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
            )}
          </button>

          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm",
              "text-red-400/70 hover:bg-red-500/10 hover:text-red-400",
              collapsed && "justify-center px-2",
            )}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="w-[18px] h-[18px]" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
