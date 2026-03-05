import React from "react"

export function LogoSection() {
  return (
    <div className="fixed inset-x-0 top-10 z-0 flex justify-center">
      <h1
        className="cursor-pointer font-bitcount text-yellow-400 text-5xl uppercase tracking-widest drop-shadow-lg"
        style={{
          fontFamily: "var(--font-bitcount), monospace",
          fontSize: "16px",
          color: "#fceb7a",
          textShadow: "1.5px 1.5px 0 #00000080",
          letterSpacing: "1px",
          transformOrigin: "center",
          scale: 3,
        }}
        tabIndex={0}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
        role="button"
        onClick={() =>
          window.open(
            "https://github.com/tailuge/billiards",
            "_blank",
            "noopener,noreferrer"
          )
        }
        onKeyDown={(e: React.KeyboardEvent<HTMLHeadingElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            window.open(
              "https://github.com/tailuge/billiards",
              "_blank",
              "noopener,noreferrer"
            )
          }
        }}
      >
        Billiards
      </h1>
    </div>
  )
}
