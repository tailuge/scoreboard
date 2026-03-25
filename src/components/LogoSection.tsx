import React from "react"

export function LogoSection() {
  return (
    <div className="fixed inset-x-0 top-6 z-0 flex justify-center">
      <button
        type="button"
        className="cursor-pointer font-bitcount text-yellow-400 text-5xl uppercase tracking-widest drop-shadow-lg bg-transparent border-none p-0 m-0"
        style={{
          fontFamily: "var(--font-bitcount), monospace",
          fontSize: "16px",
          color: "#fceb7a",
          textShadow: "1.5px 1.5px 0 #00000080",
          letterSpacing: "1px",
          transformOrigin: "center",
          scale: 3,
        }}
        onClick={() =>
          window.open(
            "https://github.com/tailuge/billiards",
            "_blank",
            "noopener,noreferrer"
          )
        }
      >
        Billiards
      </button>
    </div>
  )
}
