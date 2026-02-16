import "@/styles/globals.css"
import { Exo } from "next/font/google"
import type { AppProps } from "next/app"
import Head from "next/head"

const exo = Exo({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-exo",
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
        <main className={`${exo.variable} ${exo.className} font-sans`}>
          <Component {...pageProps} />
        </main>
        <SpeedInsights />
        <Analytics />
      </LobbyProvider>
    </UserProvider>
  )
}
