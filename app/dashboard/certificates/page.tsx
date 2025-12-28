"use client"

import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Award, Download, Lock, CheckCircle2, Calendar, Church } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CertificatesPage() {
  const { user } = useAuth()
  const { teams, trainingVideos, trainingProgress } = useData()
  const router = useRouter()

  if (user?.role !== "volunteer") {
    router.push("/dashboard")
    return null
  }

  const myTeam = teams.find((t) => t.id === user.teamId)
  const relevantVideos = trainingVideos.filter((v) => !v.teamId || v.teamId === user.teamId)
  const myProgress = trainingProgress.filter((p) => p.oderId === user.id)
  const completedVideos = myProgress.filter((p) => p.completed)
  const approvedVideos = completedVideos.filter((p) => p.approvedBy)

  // Define certificates
  const certificates = [
    {
      id: "general",
      title: "Production Ministry Foundation",
      description: "Completed general safety and introduction training",
      requiredVideos: relevantVideos.filter((v) => !v.teamId && v.order <= 2).map((v) => v.id),
      color: "#d4a843",
    },
    {
      id: "team",
      title: `${myTeam?.name || "Team"} Specialist`,
      description: `Completed all ${myTeam?.name || "team"}-specific training`,
      requiredVideos: relevantVideos.filter((v) => v.teamId === user.teamId).map((v) => v.id),
      color: myTeam?.color || "#3b82f6",
    },
    {
      id: "complete",
      title: "Production Ministry Expert",
      description: "Completed all available training modules",
      requiredVideos: relevantVideos.map((v) => v.id),
      color: "#10b981",
    },
  ]

  const getCertificateStatus = (cert: (typeof certificates)[0]) => {
    const completedRequired = cert.requiredVideos.filter((videoId) => approvedVideos.some((p) => p.videoId === videoId))

    return {
      completed: completedRequired.length,
      total: cert.requiredVideos.length,
      earned: completedRequired.length === cert.requiredVideos.length && cert.requiredVideos.length > 0,
      percentage:
        cert.requiredVideos.length > 0 ? Math.round((completedRequired.length / cert.requiredVideos.length) * 100) : 0,
    }
  }

  return (
    <div className="min-h-screen">
      <Header title="My Certificates" subtitle="Track your achievements" />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Overview */}
        <Card className="border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Your Achievements</h3>
                <p className="text-muted-foreground">
                  {certificates.filter((c) => getCertificateStatus(c).earned).length} of {certificates.length}{" "}
                  certificates earned
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certificates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => {
            const status = getCertificateStatus(cert)

            return (
              <Card key={cert.id} className={`border-border/50 overflow-hidden ${!status.earned ? "opacity-75" : ""}`}>
                {/* Certificate Header */}
                <div
                  className="h-32 flex items-center justify-center relative"
                  style={{ backgroundColor: `${cert.color}15` }}
                >
                  {status.earned ? (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className="w-24 h-24 rounded-full border-4 flex items-center justify-center"
                          style={{ borderColor: cert.color }}
                        >
                          <Church className="w-10 h-10" style={{ color: cert.color }} />
                        </div>
                      </div>
                      <Badge className="absolute top-3 right-3" style={{ backgroundColor: cert.color, color: "white" }}>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Earned
                      </Badge>
                    </>
                  ) : (
                    <div className="text-center">
                      <Lock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">{status.percentage}% complete</p>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold">{cert.title}</h3>
                    <p className="text-sm text-muted-foreground">{cert.description}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {status.completed}/{status.total} videos
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${status.percentage}%`,
                          backgroundColor: cert.color,
                        }}
                      />
                    </div>
                  </div>

                  {status.earned && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Earned on {new Date().toLocaleDateString()}
                    </div>
                  )}

                  <Button
                    variant={status.earned ? "default" : "outline"}
                    className="w-full"
                    disabled={!status.earned}
                    style={status.earned ? { backgroundColor: cert.color } : {}}
                  >
                    {status.earned ? (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download Certificate
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Complete Training to Unlock
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Certificate Preview */}
        {certificates.some((c) => getCertificateStatus(c).earned) && (
          <Card className="border-border/50">
            <CardContent className="p-8">
              <div className="max-w-2xl mx-auto text-center border-4 border-primary/20 rounded-lg p-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Church className="w-10 h-10 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">CERTIFICATE OF COMPLETION</p>
                <h2 className="text-3xl font-bold mb-2">Citichurch</h2>
                <p className="text-lg text-muted-foreground mb-6">Production Ministry</p>
                <p className="text-muted-foreground mb-4">This is to certify that</p>
                <h3 className="text-2xl font-semibold text-primary mb-4">{user.name}</h3>
                <p className="text-muted-foreground mb-6">
                  has successfully completed the Production Ministry Foundation training program
                </p>
                <div className="flex justify-center gap-8 pt-6 border-t border-border">
                  <div className="text-center">
                    <div className="w-24 h-0.5 bg-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Date</p>
                  </div>
                  <div className="text-center">
                    <div className="w-24 h-0.5 bg-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Team Leader</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
