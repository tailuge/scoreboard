import "@/styles/globals.css"
import { Exo } from "next/font/google"
import type { AppProps } from "next/app"

const exo = Exo({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-exo",
})

import { ClientErrorReporter } from "@/errors/ClientErrorReporter"

if (globalThis.window !== undefined) {
  new ClientErrorReporter("/api/client-error").start()
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={`${exo.variable} ${exo.className} font-sans`}>
      <Component {...pageProps} />
    </main>
  )
}
