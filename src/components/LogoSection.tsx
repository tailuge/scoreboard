import React from "react"
import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"

export function LogoSection() {
  const { scrollY } = useScroll()

  // Fade out quickly as scroll increases.
  // At 0px scroll, opacity is 1. At 50px scroll, opacity is 0.
  const opacity = useTransform(scrollY, [0, 150], [1, 0])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-12 z-0 flex justify-center">
      <motion.h1
        className="font-bitcount text-yellow-400 text-5xl uppercase tracking-widest drop-shadow-lg"
        style={{
          opacity,
          fontFamily: "var(--font-bitcount), monospace",
          fontSize: "16px",
          color: "#fceb7a",
          textShadow: "1.5px 1.5px 0 #00000080",
          letterSpacing: "1px",
          transformOrigin: "center",
          scale: 3,
        }}
      >
        Billiards
      </motion.h1>
    </div>
  )
}
