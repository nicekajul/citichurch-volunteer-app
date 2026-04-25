"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "@/lib/theme-context"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Moon, Sun, Bell, Shield, Globe, Palette, Save, Eye, EyeOff, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [showPassword, setShowPassword] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    announcements: true,
    training: true,
    schedule: false,
  })
  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  })

  const handleSavePassword = () => {
    // Simulated password save
    setSaved(true)
    setPassword({ current: "", new: "", confirm: "" })
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="min-h-screen">
      <Header title="Settings" subtitle="Manage your account preferences" />

      <div className="p-4 lg:p-6 space-y-6">
        <Tabs defaultValue="appearance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Prefs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appearance">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how the app looks on your device</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Theme</Label>
                    <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
                    <Moon className="h-4 w-4" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base">Theme Preview</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => theme === "dark" && toggleTheme()}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        theme === "light" ? "border-primary" : "border-border"
                      }`}
                    >
                      <div className="h-20 rounded bg-white border mb-2" />
                      <p className="text-sm font-medium">Light</p>
                    </button>
                    <button
                      onClick={() => theme === "light" && toggleTheme()}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        theme === "dark" ? "border-primary" : "border-border"
                      }`}
                    >
                      <div className="h-20 rounded bg-zinc-900 border border-zinc-800 mb-2" />
                      <p className="text-sm font-medium">Dark</p>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose what notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base">Notification Types</Label>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Announcements</Label>
                      <p className="text-sm text-muted-foreground">Ministry updates and news</p>
                    </div>
                    <Switch
                      checked={notifications.announcements}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, announcements: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Training Updates</Label>
                      <p className="text-sm text-muted-foreground">New training content available</p>
                    </div>
                    <Switch
                      checked={notifications.training}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, training: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Schedule Reminders</Label>
                      <p className="text-sm text-muted-foreground">Upcoming service assignments</p>
                    </div>
                    <Switch
                      checked={notifications.schedule}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, schedule: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your password and account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {saved && (
                  <Alert className="bg-green-500/10 border-green-500/20">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription>Password updated successfully!</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <Label className="text-base">Change Password</Label>

                  <div className="space-y-2">
                    <Label htmlFor="current">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current"
                        type={showPassword ? "text" : "password"}
                        value={password.current}
                        onChange={(e) => setPassword({ ...password, current: e.target.value })}
                        placeholder="Enter current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new">New Password</Label>
                    <Input
                      id="new"
                      type={showPassword ? "text" : "password"}
                      value={password.new}
                      onChange={(e) => setPassword({ ...password, new: e.target.value })}
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm New Password</Label>
                    <Input
                      id="confirm"
                      type={showPassword ? "text" : "password"}
                      value={password.confirm}
                      onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <Button
                    onClick={handleSavePassword}
                    disabled={!password.current || !password.new || password.new !== password.confirm}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Update Password
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base">Account Information</Label>
                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Username</span>
                      <span className="text-sm font-medium">{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Role</span>
                      <span className="text-sm font-medium capitalize">
                        {user?.role === "leader" ? "Team Leader" : user?.role}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Last Login</span>
                      <span className="text-sm font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="tl">Tagalog</SelectItem>
                      <SelectItem value="ceb">Cebuano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select defaultValue="asia-manila">
                    <SelectTrigger className="w-full sm:w-[300px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asia-manila">Asia/Manila (GMT+8)</SelectItem>
                      <SelectItem value="asia-hong-kong">Asia/Hong Kong (GMT+8)</SelectItem>
                      <SelectItem value="asia-singapore">Asia/Singapore (GMT+8)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select defaultValue="mdy">
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="ymd">YYYY/MM/DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
