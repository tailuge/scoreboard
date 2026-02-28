import Link from "next/link";
import Image from "next/image";
import React from "react";

export type GameButtonProps = {
  readonly icon: string;
  readonly alt: string;
  readonly href?: string;
  readonly onClick?: () => void;
  readonly ariaLabel: string;
  readonly children?: React.ReactNode;
};

export function GameButton({
  icon,
  alt,
  href,
  onClick,
  ariaLabel,
  children,
}: GameButtonProps) {
  const content = (
    <>
      <div className="relative w-full flex-1 p-2 transition-transform duration-300 group-hover:scale-110">
        <Image
          src={icon}
          alt={alt}
          fill
          className="object-contain p-2"
          sizes="(max-width: 768px) 33vw, 20vw"
          priority
        />
      </div>
      {children && <div className="pb-1">{children}</div>}
    </>
  );

  const commonClasses = `group relative flex flex-col items-center justify-center bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.1)] active:scale-95 aspect-square block w-32 h-32 overflow-hidden after:absolute after:inset-0 after:bg-linear-to-tr after:from-white/5 after:via-white/10 after:to-transparent after:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent)]`;

  if (href) {
    const isInternal = href.startsWith("/");
    if (isInternal) {
      return (
        <Link href={href} className={commonClasses} aria-label={ariaLabel}>
          {content}
        </Link>
      );
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
    );
  }

  return (
    <button onClick={onClick} className={commonClasses} aria-label={ariaLabel}>
      {content}
    </button>
  );
}

export type ActionButtonProps = {
  readonly href: string;
  readonly children: React.ReactNode;
  readonly hoverBorderColor: string;
  readonly hoverTextColor: string;
};

export function ActionButton({
  href,
  children,
  hoverBorderColor,
  hoverTextColor,
}: ActionButtonProps) {
  const isInternal = href.startsWith("/");

  const commonClasses = `w-32 h-10 flex items-center justify-center bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 ${hoverBorderColor} ${hoverTextColor} text-xs transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.1)] active:scale-95 overflow-hidden after:absolute after:inset-0 after:bg-linear-to-tr after:from-white/5 after:via-white/10 after:to-transparent after:pointer-events-none`;

  if (isInternal) {
    return (
      <Link href={href} className={commonClasses}>
        {children}
      </Link>
    );
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
  );
}
