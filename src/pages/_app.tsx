import "@/styles/globals.css"
import type { AppProps } from "next/app"
import Head from "next/head"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import { UserProvider } from "@/contexts/UserContext"
import { LobbyProvider } from "@/contexts/LobbyContext"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <LobbyProvider>
        <Head>
          <link rel="icon" type="image/png" href="/golden-cup.png" />
        </Head>
        <Component {...pageProps} />
        <SpeedInsights />
        <Analytics />
      </LobbyProvider>
    </UserProvider>
  )
}
