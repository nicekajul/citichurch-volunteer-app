"use client"

import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Award, Lock, CheckCircle2, Church, ChevronRight, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"
import { CertificateBadge } from "@/components/dashboard/certificate-badge"
import { Progress } from "@/components/ui/progress"

export default function CertificatesPage() {
  const { user } = useAuth()
  const { certificates, trainingVideos, trainingProgress, getEarnedCertificates, isCertificateLocked } = useData()
  const router = useRouter()

  if (user?.role !== "volunteer") {
    router.push("/dashboard")
    return null
  }

  const relevantVideos = trainingVideos.filter((v) => !v.teamId || v.teamId === user.team_id)
  const myProgress = trainingProgress.filter((p) => p.userId === user.id)
  const earnedCertificates = getEarnedCertificates(user.id)
  const earnedIds = new Set(earnedCertificates.map((c) => c.id))

  // Only show certs that have modules relevant to this volunteer
  const relevantCerts = certificates
    .filter((cert) => {
      if (cert.teamId && cert.teamId !== user.team_id) return false
      return relevantVideos.some((v) => v.certificateId === cert.id)
    })
    .sort((a, b) => a.orderIndex - b.orderIndex)

  const getCertProgress = (certId: string) => {
    const modules = relevantVideos.filter((v) => v.certificateId === certId)
    const completed = modules.filter((v) => myProgress.some((p) => p.videoId === v.id && p.completed)).length
    return { modules, completed, pct: modules.length > 0 ? Math.round((completed / modules.length) * 100) : 0 }
  }

  const hasAnyCerts = relevantCerts.length > 0

  return (
    <div className="min-h-screen">
      <Header title="My Certificates" subtitle="Track your training achievements" />

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
                  {earnedCertificates.length} of {relevantCerts.length} certificates earned
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roadmap */}
        {relevantCerts.length > 1 && (
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Training Roadmap</h3>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {relevantCerts.map((cert, idx) => {
                  const isEarned = earnedIds.has(cert.id)
                  const certLocked = isCertificateLocked(cert.id, user.id)
                  return (
                    <span key={cert.id} className="flex items-center gap-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                          isEarned
                            ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400"
                            : certLocked
                            ? "border-border/40 bg-muted/50 text-muted-foreground"
                            : "border-primary/30 bg-primary/5 text-primary"
                        }`}
                      >
                        {isEarned ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : certLocked ? (
                          <Lock className="w-3 h-3" />
                        ) : (
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cert.color }} />
                        )}
                        {cert.name}
                      </span>
                      {idx < relevantCerts.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                      )}
                    </span>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certificates Grid */}
        {hasAnyCerts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relevantCerts.map((cert) => {
              const isEarned = earnedIds.has(cert.id)
              const certLocked = isCertificateLocked(cert.id, user.id)
              const prereqCert = cert.prerequisiteCertificateId
                ? certificates.find((c) => c.id === cert.prerequisiteCertificateId)
                : undefined
              const { modules, completed, pct } = getCertProgress(cert.id)

              return (
                <Card
                  key={cert.id}
                  className={`border-border/50 overflow-hidden ${certLocked ? "opacity-70" : ""}`}
                >
                  {/* Certificate Header */}
                  <div
                    className="h-32 flex items-center justify-center relative"
                    style={{ backgroundColor: `${certLocked ? "#94a3b8" : cert.color}15` }}
                  >
                    {isEarned ? (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            className="w-24 h-24 rounded-full border-4 flex items-center justify-center"
                            style={{ borderColor: cert.color }}
                          >
                            <Church className="w-10 h-10" style={{ color: cert.color }} />
                          </div>
                        </div>
                        <span
                          className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: cert.color }}
                        >
                          <CheckCircle2 className="w-3 h-3" /> Earned
                        </span>
                      </>
                    ) : certLocked ? (
                      <div className="text-center px-4">
                        <Lock className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-xs text-muted-foreground">
                          Complete <span className="font-medium">{prereqCert?.name ?? "prerequisite"}</span> first
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div
                          className="w-16 h-16 mx-auto rounded-full border-4 border-dashed flex items-center justify-center mb-1"
                          style={{ borderColor: `${cert.color}60` }}
                        >
                          <Award className="w-7 h-7" style={{ color: `${cert.color}80` }} />
                        </div>
                        <p className="text-xs text-muted-foreground">{pct}% complete</p>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold">{cert.name}</h3>
                        {isEarned && <CertificateBadge certificate={cert} size="sm" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{cert.description}</p>
                      {certLocked && prereqCert && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Requires: {prereqCert.name}
                        </p>
                      )}
                    </div>

                    {!certLocked && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span className="font-medium">{completed}/{modules.length} modules</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                    )}

                    <Button
                      variant={isEarned ? "default" : "outline"}
                      className="w-full"
                      disabled={certLocked || !isEarned}
                      style={isEarned ? { backgroundColor: cert.color, borderColor: cert.color } : {}}
                      onClick={() => isEarned && router.push("/dashboard/my-training")}
                    >
                      {isEarned ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Certificate Earned
                        </>
                      ) : certLocked ? (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Locked
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4 mr-2" />
                          {pct > 0 ? "Continue Training" : "Start Training"}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="border-border/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="font-semibold text-lg mb-1">No certificates yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Your admin hasn&apos;t set up any certificates yet. Check back soon.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
