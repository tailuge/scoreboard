import "@/styles/globals.css"
import { Turret_Road } from "next/font/google"
import type { AppProps } from "next/app"
import Head from "next/head"

const turretRoad = Turret_Road({
  subsets: ["latin"],
  weight: ["200", "400", "500", "700", "800"],
  variable: "--font-turret",
})
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
        <main className={`${turretRoad.variable} ${turretRoad.className} font-sans`}>
          <Component {...pageProps} />
        </main>
        <SpeedInsights />
        <Analytics />
      </LobbyProvider>
    </UserProvider>
  )
}
