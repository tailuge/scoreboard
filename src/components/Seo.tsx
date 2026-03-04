import Head from "next/head"
import React from "react"

interface SeoProps {
  title: string
  description: string
  canonical?: string
  ogTitle?: string
  ogDescription?: string
  ogType?: string
  ogUrl?: string
  ogImage?: string
  twitterCard?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  refresh?: string
}

export const Seo: React.FC<SeoProps> = ({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogType = "website",
  ogUrl,
  ogImage = "https://scoreboard-tailuge.vercel.app/golden-cup.png",
  twitterCard = "summary",
  twitterTitle,
  twitterDescription,
  twitterImage = "https://scoreboard-tailuge.vercel.app/golden-cup.png",
  refresh,
}) => {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {refresh && <meta httpEquiv="refresh" content={refresh} />}
      {canonical && <link rel="canonical" href={canonical} />}

      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:type" content={ogType} />
      {ogUrl && <meta property="og:url" content={ogUrl} />}
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={twitterTitle || title} />
      <meta
        name="twitter:description"
        content={twitterDescription || description}
      />
      <meta name="twitter:image" content={twitterImage} />
    </Head>
  )
}
