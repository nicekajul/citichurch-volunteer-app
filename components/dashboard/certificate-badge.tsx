import { Award } from "lucide-react"
import type { Certificate } from "@/lib/data"

interface CertificateBadgeProps {
  certificate: Certificate
  size?: "sm" | "md"
}

export function CertificateBadge({ certificate, size = "sm" }: CertificateBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1"}`}
      style={{
        backgroundColor: `${certificate.color}18`,
        color: certificate.color,
        borderColor: `${certificate.color}40`,
      }}
    >
      <Award className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {certificate.name}
    </span>
  )
}
