"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Music,
  PenTool,
  Theater,
  Baby,
  Globe,
  Send,
  ArrowRight,
} from "lucide-react"

// ─── Constants ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Radio, Lightbulb, Monitor, Volume2, Palette, Camera, Mic, Video, Music, PenTool, Theater, Baby, Globe, Users,
}

const AVAILABILITY_OPTIONS = [
  { id: "sun-am",    label: "Sunday Morning",     sublabel: "6:00 AM – 12:00 PM" },
  { id: "sun-pm",    label: "Sunday Afternoon",   sublabel: "12:00 PM – 6:00 PM" },
  { id: "sun-eve",   label: "Sunday Evening",     sublabel: "6:00 PM – 9:00 PM" },
  { id: "wed-eve",   label: "Wednesday Evening",  sublabel: "6:00 PM – 9:00 PM" },
  { id: "fri-eve",   label: "Friday Evening",     sublabel: "6:00 PM – 9:00 PM" },
  { id: "rehearsal", label: "Rehearsals / Weekday", sublabel: "Flexible scheduling" },
]

const STEPS = [
  { number: 1, label: "Ministry" },
  { number: 2, label: "About You" },
  { number: 3, label: "Application" },
  { number: 4, label: "Review" },
]

interface Team {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PublicApplyPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [teamsLoading, setTeamsLoading] = useState(true)

  const [step, setStep] = useState(1)
  const [selectedTeamId, setSelectedTeamId] = useState("")

  // Step 2 — Personal info
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  // Step 3 — Application details
  const [motivation, setMotivation] = useState("")
  const [experience, setExperience] = useState("")
  const [availability, setAvailability] = useState<string[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/public/teams")
      .then((r) => r.json())
      .then((d) => setTeams(d.teams || []))
      .finally(() => setTeamsLoading(false))
  }, [])

  const selectedTeam = teams.find((t) => t.id === selectedTeamId)

  const toggleAvailability = (id: string) =>
    setAvailability((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id])

  const canProceed: Record<number, boolean> = {
    1: selectedTeamId !== "",
    2: fullName.trim().length >= 2 && /\S+@\S+\.\S+/.test(email),
    3: motivation.trim().length >= 20 && availability.length > 0,
    4: true,
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/public/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selectedTeamId,
          motivation,
          experience,
          availability,
          applicantName: fullName,
          applicantEmail: email,
          applicantPhone: phone,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Submission failed")
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="dark min-h-screen bg-background flex flex-col">
        <PublicHeader />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">Application Submitted!</h1>
              <p className="text-muted-foreground leading-relaxed">
                Thank you, <span className="font-medium text-foreground">{fullName}</span>! Your application to join the{" "}
                <span className="font-medium text-foreground">{selectedTeam?.name}</span> ministry has been received.
                Our team will review it and reach out to you at{" "}
                <span className="font-medium text-foreground">{email}</span>.
              </p>
            </div>
            <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground text-left space-y-1">
              <p className="font-medium text-foreground">What happens next?</p>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>An admin will review your application</li>
                <li>You will be contacted for an interview or orientation</li>
                <li>Once approved, you will be added to the ministry team</li>
                <li>The team supervisor will be notified of your onboarding</li>
              </ol>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login">
                <Button variant="outline" className="w-full sm:w-auto">Sign in to portal</Button>
              </Link>
              <Button className="w-full sm:w-auto" onClick={() => {
                setSubmitted(false); setStep(1); setSelectedTeamId("")
                setFullName(""); setEmail(""); setPhone("")
                setMotivation(""); setExperience(""); setAvailability([])
              }}>
                Submit another application
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="dark min-h-screen bg-background flex flex-col">
      <PublicHeader />

      {/* Hero band */}
      <div className="bg-primary/5 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Production Ministries</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-balance mb-3">
            Apply to Serve
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xl mx-auto">
            Join one of our production ministry teams and use your gifts to serve the community.
            Open to new volunteers and those not yet part of a ministry.
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="border-b border-border bg-background/80 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            {STEPS.map((s, i) => (
              <div key={s.number} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all",
                  step > s.number
                    ? "bg-primary text-primary-foreground"
                    : step === s.number
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                )}>
                  {step > s.number ? <CheckCircle2 className="w-4 h-4" /> : s.number}
                </div>
                <span className={cn(
                  "text-xs font-medium hidden sm:block",
                  step === s.number ? "text-foreground" : "text-muted-foreground"
                )}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={cn("flex-1 h-px mx-2", step > s.number ? "bg-primary" : "bg-border")} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">

        {/* ── Step 1: Choose Ministry ─────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Choose a Ministry</h2>
              <p className="text-sm text-muted-foreground">Select the production team you would like to join.</p>
            </div>
            {teamsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {teams.map((team) => {
                  const Icon = ICON_MAP[team.icon || ""] || Users
                  const isSelected = selectedTeamId === team.id
                  return (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      className={cn(
                        "w-full text-left rounded-xl border-2 p-4 transition-all hover:border-primary/60 hover:bg-primary/5",
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border bg-card"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground">{team.name}</p>
                          {team.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{team.description}</p>
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 ml-auto" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Personal Info ───────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Your Information</h2>
              <p className="text-sm text-muted-foreground">Tell us how to reach you after your application is reviewed.</p>
            </div>
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
                <Input
                  id="fullName"
                  placeholder="e.g. Maria Santos"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. maria@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g. +63 912 345 6789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="rounded-lg bg-muted/60 border border-border p-3 text-xs text-muted-foreground">
              Already a member?{" "}
              <Link href="/login" className="text-primary underline underline-offset-2 font-medium">
                Sign in to your account
              </Link>{" "}
              to apply with your existing profile.
            </div>
          </div>
        )}

        {/* ── Step 3: Application Details ─────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Your Application</h2>
              <p className="text-sm text-muted-foreground">Help us get to know you and why you want to serve.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivation">
                Why do you want to join the <span className="text-foreground font-medium">{selectedTeam?.name}</span> ministry?{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="motivation"
                placeholder="Share your heart for serving in this ministry..."
                rows={5}
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                className="resize-none"
              />
              <p className={cn("text-xs", motivation.trim().length >= 20 ? "text-muted-foreground" : "text-destructive")}>
                {motivation.trim().length} / 20 characters minimum
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">
                Relevant experience or skills{" "}
                <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Textarea
                id="experience"
                placeholder="Any prior experience, training, or skills related to this ministry..."
                rows={3}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="resize-none"
              />
            </div>

            <div className="space-y-3">
              <Label>
                Availability <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABILITY_OPTIONS.map((opt) => {
                  const checked = availability.includes(opt.id)
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleAvailability(opt.id)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:border-primary/60",
                        checked ? "border-primary bg-primary/5" : "border-border bg-card"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                        checked ? "bg-primary border-primary" : "border-muted-foreground"
                      )}>
                        {checked && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.sublabel}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Review & Submit ──────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Review & Submit</h2>
              <p className="text-sm text-muted-foreground">Please review your application before submitting.</p>
            </div>

            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
              <ReviewRow label="Ministry" value={selectedTeam?.name} />
              <ReviewRow label="Full Name" value={fullName} />
              <ReviewRow label="Email" value={email} />
              {phone && <ReviewRow label="Phone" value={phone} />}
              <ReviewRow label="Motivation" value={motivation} multiline />
              {experience && <ReviewRow label="Experience" value={experience} multiline />}
              <ReviewRow
                label="Availability"
                value={availability
                  .map((id) => AVAILABILITY_OPTIONS.find((o) => o.id === id)?.label)
                  .filter(Boolean)
                  .join(", ")}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              By submitting, you agree that the information provided is accurate and that the church may contact you regarding your application.
            </p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-8 mt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed[step]}
              className="gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2 min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application <Send className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>Citichurch Volunteer Portal &mdash; Production Ministries</p>
      </footer>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function PublicHeader() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <img
            src="/logo-citichurch.png"
            alt="Citichurch"
            className="h-7 w-auto object-contain"
          />
        </Link>
        <Link href="/login">
          <Button variant="ghost" size="sm" className="gap-2 text-sm text-foreground hover:text-foreground">
            Member login <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </header>
  )
}

function ReviewRow({
  label,
  value,
  multiline = false,
}: {
  label: string
  value?: string
  multiline?: boolean
}) {
  return (
    <div className="flex gap-4 px-4 py-3">
      <span className="text-xs font-medium text-muted-foreground w-28 shrink-0 pt-0.5">{label}</span>
      <span className={cn("text-sm text-foreground", multiline ? "whitespace-pre-wrap" : "")}>
        {value || <span className="text-muted-foreground italic">Not provided</span>}
      </span>
    </div>
  )
}
