"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. You can try again, or head back to your dashboard.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
            Go to dashboard
          </Button>
          <Button onClick={() => reset()}>Try again</Button>
        </div>
      </div>
    </div>
  )
}
