"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Users,
  Radio,
  Lightbulb,
  Monitor,
  Volume2,
  Palette,
  Camera,
  Mic,
  Video,
  Clock,
  Send,
  CircleCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

const teamIconMap: Record<string, React.ElementType> = {
  Radio,
  Lightbulb,
  Monitor,
  Volume2,
  Palette,
  Camera,
  Mic,
  Video,
  Users,
}

const AVAILABILITY_OPTIONS = [
  { id: "sun-am", label: "Sunday Morning", sublabel: "6:00 AM – 12:00 PM" },
  { id: "sun-pm", label: "Sunday Afternoon", sublabel: "12:00 PM – 6:00 PM" },
  { id: "sun-eve", label: "Sunday Evening", sublabel: "6:00 PM – 9:00 PM" },
  { id: "wed-eve", label: "Wednesday Evening", sublabel: "6:00 PM – 9:00 PM" },
  { id: "fri-eve", label: "Friday Evening", sublabel: "6:00 PM – 9:00 PM" },
  { id: "rehearsal", label: "Rehearsals / Weekday", sublabel: "Flexible scheduling" },
]

const STEPS = [
  { number: 1, label: "Choose Ministry" },
  { number: 2, label: "Your Application" },
  { number: 3, label: "Review & Submit" },
]

export default function ApplyPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { teams, ministryApplications, submitMinistryApplication } = useData()

  const [step, setStep] = useState(1)
  const [selectedTeamId, setSelectedTeamId] = useState("")
  const [motivation, setMotivation] = useState("")
  const [experience, setExperience] = useState("")
  const [availability, setAvailability] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  // Volunteers already assigned to a team cannot apply
  const alreadyInTeam = Boolean(user?.teamId)

  // Check if volunteer already has a pending/approved application
  const existingApplication = ministryApplications.find(
    (a) => a.applicantId === user?.id && a.status !== "rejected"
  )

  const selectedTeam = teams.find((t) => t.id === selectedTeamId)

  const toggleAvailability = (id: string) => {
    setAvailability((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const canProceedStep1 = selectedTeamId !== ""
  const canProceedStep2 = motivation.trim().length >= 20 && availability.length > 0

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError("")
    try {
      await submitMinistryApplication({
        teamId: selectedTeamId,
        motivation,
        experience,
        availability,
      })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Volunteer already belongs to a team — no need to apply
  if (alreadyInTeam) {
    const myTeam = teams.find((t) => t.id === user?.teamId)
    return (
      <div className="min-h-screen">
        <Header title="Apply for Ministry" subtitle="Production Ministry Registration" />
        <div className="p-4 lg:p-6 max-w-2xl mx-auto">
          <Card className="border-2 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800">
            <CardContent className="p-8 text-center space-y-4">
              <CircleCheck className="w-12 h-12 mx-auto text-green-500" />
              <div>
                <h2 className="text-xl font-semibold mb-1">You are already part of a ministry</h2>
                <p className="text-muted-foreground text-sm">
                  You are currently an active member of the{" "}
                  <span className="font-medium text-foreground">{myTeam?.name ?? "a ministry team"}</span>.
                  Only volunteers who are not yet in a ministry need to apply.
                </p>
              </div>
              <div className="pt-2">
                <Button variant="outline" onClick={() => router.push("/dashboard/volunteer")}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Already has an active application
  if (existingApplication) {
    const team = teams.find((t) => t.id === existingApplication.teamId)
    const statusStyles = {
      pending: { bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800", badge: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200", label: "Pending Review" },
      approved: { bg: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800", badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "Approved" },
      rejected: { bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800", badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "Rejected" },
    }
    const styles = statusStyles[existingApplication.status]

    return (
      <div className="min-h-screen">
        <Header title="Apply for Ministry" subtitle="Production Ministry Registration" />
        <div className="p-4 lg:p-6 max-w-2xl mx-auto">
          <Card className={cn("border-2", styles.bg)}>
            <CardContent className="p-8 text-center space-y-4">
              {existingApplication.status === "pending" ? (
                <Clock className="w-12 h-12 mx-auto text-amber-500" />
              ) : existingApplication.status === "approved" ? (
                <CircleCheck className="w-12 h-12 mx-auto text-green-500" />
              ) : null}
              <div>
                <h2 className="text-xl font-semibold mb-1">Application {styles.label}</h2>
                <p className="text-muted-foreground text-sm">
                  {existingApplication.status === "pending"
                    ? "Your application is awaiting admin review. You will be notified once a decision is made."
                    : existingApplication.status === "approved"
                    ? `Congratulations! You have been approved and added to the ${team?.name} team.`
                    : "Your application was not approved at this time."}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
                <span className="text-sm font-medium">{team?.name}</span>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", styles.badge)}>
                  {styles.label}
                </span>
              </div>
              {existingApplication.reviewNotes && (
                <div className="text-left bg-muted rounded-lg p-4 text-sm">
                  <p className="font-medium mb-1">Admin Notes:</p>
                  <p className="text-muted-foreground">{existingApplication.reviewNotes}</p>
                </div>
              )}
              <div className="pt-2">
                <Button variant="outline" onClick={() => router.push("/dashboard/volunteer")}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen">
        <Header title="Apply for Ministry" subtitle="Production Ministry Registration" />
        <div className="p-4 lg:p-6 max-w-2xl mx-auto">
          <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
            <CardContent className="p-10 text-center space-y-5">
              <CircleCheck className="w-16 h-16 mx-auto text-green-500" />
              <div>
                <h2 className="text-2xl font-semibold mb-2">Application Submitted!</h2>
                <p className="text-muted-foreground">
                  Your application for <strong>{selectedTeam?.name}</strong> has been sent to the admin team. You will
                  be notified once your application has been reviewed.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-sm text-left space-y-2">
                <p className="font-medium">What happens next?</p>
                <ul className="text-muted-foreground space-y-1">
                  <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" /> Admin reviews your application</li>
                  <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" /> You get notified of the decision</li>
                  <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" /> If approved, you are added to the team and the Team Supervisor is notified</li>
                </ul>
              </div>
              <Button onClick={() => router.push("/dashboard/volunteer")} className="w-full">
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header title="Apply for Ministry" subtitle="Join a Production Ministry Team" />

      <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                    step > s.number
                      ? "bg-primary text-primary-foreground"
                      : step === s.number
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step > s.number ? <CheckCircle2 className="w-4 h-4" /> : s.number}
                </div>
                <span className={cn("text-sm font-medium hidden sm:block", step === s.number ? "text-foreground" : "text-muted-foreground")}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("flex-1 h-px mx-3", step > s.number ? "bg-primary" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Choose Ministry */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Choose a Ministry Team</h2>
              <p className="text-sm text-muted-foreground mt-1">Select the production ministry you would like to join.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {teams.map((team) => {
                const Icon = teamIconMap[team.icon] || Users
                const isSelected = selectedTeamId === team.id
                return (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={cn(
                      "text-left p-4 rounded-xl border-2 transition-all hover:shadow-md focus:outline-none",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: team.color + "22", color: team.color }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm">{team.name}</p>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                          {team.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep(2)} disabled={!canProceedStep1} className="gap-2">
                Next: Your Application <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Application Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Tell Us About Yourself</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Share your motivation and availability for the{" "}
                <span className="font-medium text-foreground">{selectedTeam?.name}</span> team.
              </p>
            </div>

            <Card>
              <CardContent className="p-5 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="motivation" className="text-sm font-medium">
                    Why do you want to join this ministry? <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="motivation"
                    placeholder="Share your heart for this ministry, what draws you to it, and how you hope to serve..."
                    className="min-h-[120px] resize-none"
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                  />
                  <p className={cn("text-xs", motivation.length < 20 && motivation.length > 0 ? "text-red-500" : "text-muted-foreground")}>
                    {motivation.length < 20 ? `At least ${20 - motivation.length} more characters required` : `${motivation.length} characters`}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-sm font-medium">
                    Relevant experience or skills <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="experience"
                    placeholder="Any prior experience, training, or skills relevant to this ministry..."
                    className="min-h-[90px] resize-none"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">
                  Availability <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-1">Select all times you are generally available to serve.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABILITY_OPTIONS.map((option) => {
                  const isChecked = availability.includes(option.id)
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleAvailability(option.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                        isChecked
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                        isChecked ? "bg-primary border-primary" : "border-muted-foreground/40"
                      )}>
                        {isChecked && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.sublabel}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canProceedStep2} className="gap-2">
                Review Application <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold">Review Your Application</h2>
              <p className="text-sm text-muted-foreground mt-1">Please review your details before submitting.</p>
            </div>

            <Card>
              <CardContent className="p-5 divide-y divide-border">
                {/* Ministry */}
                <div className="pb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Ministry Team</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: (selectedTeam?.color || "#888") + "22", color: selectedTeam?.color }}
                    >
                      {(() => { const Icon = teamIconMap[selectedTeam?.icon || ""] || Users; return <Icon className="w-4 h-4" /> })()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{selectedTeam?.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedTeam?.description}</p>
                    </div>
                  </div>
                </div>

                {/* Motivation */}
                <div className="py-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Motivation</p>
                  <p className="text-sm leading-relaxed">{motivation}</p>
                </div>

                {/* Experience */}
                {experience && (
                  <div className="py-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Experience</p>
                    <p className="text-sm leading-relaxed">{experience}</p>
                  </div>
                )}

                {/* Availability */}
                <div className="pt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Availability</p>
                  <div className="flex flex-wrap gap-2">
                    {availability.map((id) => {
                      const option = AVAILABILITY_OPTIONS.find((o) => o.id === id)
                      return (
                        <Badge key={id} variant="secondary" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {option?.label}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 min-w-[160px]">
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Application
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
