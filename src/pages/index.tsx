// src/pages/index.tsx
import { useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push("/game")
  }, [router])

  return (
    <>
      <Head>
        <title>Play Billiards Online | Free Snooker, Pool & Carom Games</title>
        <meta
          name="description"
          content="Play free online billiards games including Snooker, 9-Ball, and Three Cushion. Join multiplayer matches or challenge high scores. No download required."
        />
        <meta httpEquiv="refresh" content="0;url=/game" />
        <link
          rel="canonical"
          href="https://scoreboard-tailuge.vercel.app/game"
        />
        <meta
          property="og:title"
          content="Play Billiards Online | Free Snooker, Pool & Carom Games"
        />
        <meta
          property="og:description"
          content="Play free online billiards games including Snooker, 9-Ball, and Three Cushion. Join multiplayer matches or challenge high scores. No download required."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://scoreboard-tailuge.vercel.app/"
        />
        <meta
          property="og:image"
          content="https://scoreboard-tailuge.vercel.app/golden-cup.png"
        />
        <meta name="twitter:card" content="summary" />
        <meta
          name="twitter:title"
          content="Play Billiards Online | Free Snooker, Pool & Carom Games"
        />
        <meta
          name="twitter:description"
          content="Play free online billiards games including Snooker, 9-Ball, and Three Cushion. Join multiplayer matches or challenge high scores. No download required."
        />
        <meta
          name="twitter:image"
          content="https://scoreboard-tailuge.vercel.app/golden-cup.png"
        />
      </Head>
    </>
  )
}
