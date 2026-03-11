"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// The ministry application form has moved to the public /apply page.
export default function ApplyRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/apply")
  }, [router])
  return null
}
