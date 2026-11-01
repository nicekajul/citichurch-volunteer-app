import type React from "react"
import type { Metadata } from "next"
import { Montserrat, Poppins, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { DataProvider } from "@/lib/data-context"
import { ThemeProvider } from "@/lib/theme-context"
import { assertRequiredEnvVars } from "@/lib/env"
import "./globals.css"

assertRequiredEnvVars()

// Brand font stack: Century Gothic is the church's primary font, but it's a
// commercial font (Monotype) not available via Google Fonts or legally
// redistributable -- it's referenced by name in globals.css so it renders
// for anyone who already has it installed, with these two as the real,
// always-available fallbacks (Montserrat is the standard free substitute
// for Century Gothic's geometric-sans look; Poppins backs it up further).
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-montserrat" })
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "Citichurch Volunteer Portal",
  description: "Production Ministry Training & Management System",
  // generator: "",
  icons: {
    icon: "/citichurch.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${montserrat.variable} ${poppins.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <DataProvider>{children}</DataProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
