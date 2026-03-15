import "@/styles/globals.css"
import { Exo } from "next/font/google"
import type { AppProps } from "next/app"

const exo = Exo({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-exo",
})

import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import { UserProvider } from "@/contexts/UserContext"
import { ClientErrorReporter } from "@/errors/ClientErrorReporter"
import { MessagingProvider } from "@/contexts/MessagingContext"

if (globalThis.window !== undefined) {
  new ClientErrorReporter("/api/client-error").start()
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <MessagingProvider>
        <main className={`${exo.variable} ${exo.className} font-sans`}>
          <Component {...pageProps} />
        </main>
        <SpeedInsights />
        <Analytics />
      </MessagingProvider>
    </UserProvider>
  )
}
