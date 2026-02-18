import Link from "next/link"
import Image from "next/image"
import React from "react"

export type GameButtonProps = {
    readonly icon: string
    readonly alt: string
    readonly href?: string
    readonly onClick?: () => void
    readonly ariaLabel: string
}

export function GameButton({ icon, alt, href, onClick, ariaLabel }: GameButtonProps) {
    const content = (
        <div className="relative w-full h-full p-4 transition-transform duration-300 group-hover:scale-110">
            <Image
                src={icon}
                alt={alt}
                fill
                className="object-contain p-2"
                sizes="(max-width: 768px) 33vw, 20vw"
                priority
            />
        </div>
    )

    const commonClasses = `group relative flex flex-col items-center justify-center bg-gunmetal/30 backdrop-blur-sm rounded-xl border border-gunmetal hover:border-blue-500 hover:bg-gunmetal/50 transition-all duration-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:shadow-lg active:shadow-inner active:translate-y-0.5 aspect-square block w-32 h-32`

    if (href) {
        const isInternal = href.startsWith("/")
        if (isInternal) {
            return (
                <Link href={href} className={commonClasses} aria-label={ariaLabel}>
                    {content}
                </Link>
            )
        }

        return (
            <a
                href={href}
                className={commonClasses}
                aria-label={ariaLabel}
                target={href.startsWith("http") ? "_blank" : "_self"}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            >
                {content}
            </a>
        )
    }

    return (
        <button onClick={onClick} className={commonClasses} aria-label={ariaLabel}>
            {content}
        </button>
    )
}

export type ActionButtonProps = {
    readonly href: string
    readonly children: React.ReactNode
    readonly hoverBorderColor: string
    readonly hoverTextColor: string
}

export function ActionButton({
    href,
    children,
    hoverBorderColor,
    hoverTextColor,
}: ActionButtonProps) {
    const isInternal = href.startsWith("/")

    const commonClasses = `w-32 h-8 flex items-center justify-center bg-gunmetal/30 backdrop-blur-sm rounded border border-gunmetal ${hoverBorderColor} ${hoverTextColor} text-sm transition-colors`

    if (isInternal) {
        return (
            <Link href={href} className={commonClasses}>
                {children}
            </Link>
        )
    }

    return (
        <a
            href={href}
            className={commonClasses}
            target="_blank"
            rel="noopener noreferrer"
        >
            {children}
        </a>
    )
}
