import type { Metadata } from "next"
import { ThemeProvider } from "next-themes"
import localFont from "next/font/local"
import { ToastContextProvider } from "@/components/ToastContext"
import "./globals.css"
import { siteConfig } from "./siteConfig"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

const API_BASE = process.env.API_INTERNAL_URL ?? "http://localhost:3001"
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY

async function getInstanceName(): Promise<string | null> {
  try {
    const headers: HeadersInit = {}
    if (INTERNAL_API_KEY) {
      headers["x-internal-api-key"] = INTERNAL_API_KEY
    }
    const response = await fetch(`${API_BASE}/v1/settings`, {
      headers,
      cache: "no-store",
    })
    if (response.ok) {
      const data = (await response.json()) as { instanceName?: string | null }
      return data.instanceName ?? null
    }
  } catch {
    // ignore
  }
  return null
}

export async function generateMetadata(): Promise<Metadata> {
  const instanceName = await getInstanceName()
  const appName = instanceName || siteConfig.name

  return {
    metadataBase: new URL("https://yoururl.com"),
    title: appName,
    description: siteConfig.description,
    keywords: ["Dashboard", "Data Visualization", "Software"],
    authors: [
      {
        name: "yourname",
        url: "",
      },
    ],
    creator: "yourname",
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteConfig.url,
      title: appName,
      description: siteConfig.description,
      siteName: appName,
    },
    twitter: {
      card: "summary_large_image",
      title: appName,
      description: siteConfig.description,
      creator: "@yourname",
    },
    icons: {
      icon: "/favicon.ico",
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-white-50 h-full antialiased dark:bg-gray-950`}
      >
        <ThemeProvider
          defaultTheme="system"
          disableTransitionOnChange
          attribute="class"
        >
          <ToastContextProvider>{children}</ToastContextProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
