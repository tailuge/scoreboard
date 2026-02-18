import React from "react"
import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"

export function LogoSection() {
    const { scrollY } = useScroll()

    // Fade out quickly as scroll increases.
    // At 0px scroll, opacity is 1. At 50px scroll, opacity is 0.
    const opacity = useTransform(scrollY, [0, 150], [1, 0])

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-x-0 top-2 z-0 flex justify-center"
        >
            <div
                className="relative flex justify-center items-center"
                style={{ width: "80%" }}
            >
                <Image
                    src="/assets/logo_res.png"
                    alt=""
                    width={352}
                    height={75}
                    className="h-auto w-[232px] opacity-40"
                    priority
                />
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0px, rgba(0, 0, 0, 0.4) 1px, transparent 1px, transparent 2px)",
                    }}
                />
                <motion.span
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{
                        top: "28px",
                        fontFamily: '"Bitcount Prop Double", monospace',
                        fontSize: "16px",
                        color: "#fceb7a",
                        textShadow: "1.5px 1.5px 0 #00000080",
                        letterSpacing: "1px",
                        transformOrigin: "center",
                        opacity,
                        scale: 3,
                    }}
                >
                    Billiards
                </motion.span>
            </div>
        </div>
    )
}
