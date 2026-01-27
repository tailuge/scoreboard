import "@/styles/globals.css"
import type { AppProps } from "next/app"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import { UserProvider } from "@/contexts/UserContext"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <Component {...pageProps} />
      <SpeedInsights />
      <Analytics />
    </UserProvider>
  )
}
