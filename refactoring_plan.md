# Tailwind Refactoring Plan

This document outlines the strategy for rationalizing styles across the project to improve consistency, reuse, and maintainability while preserving the existing visual identity.

## A) Detected Duplication Patterns

The following utility patterns have been identified as candidates for extraction into design tokens or shared components.

| Duplicated Utility Pattern | Frequency | Components | Suggested Action |
| :--- | :--- | :--- | :--- |
| `bg-white/5 backdrop-blur-sm rounded-lg border-white/10` | High (6) | `GameButton`, `ActionButton`, `GroupBox`, `OnlineUsersPopover`, `User` | Extract to `GlassCard` primitive |
| `active:scale-95 transition-all duration-300` | Medium (4) | `GameButton`, `ActionButton`, `User`, `OnlineUsersPopover` | Move to `Button` primitive |
| `shadow-[...inset_0_1px_0_rgba(255,255,255,...)]` | Medium (3) | `GameButton`, `ActionButton`, `GroupBox` | Move to design tokens |
| `after:bg-linear-to-tr before:bg-[radial-gradient(...)]` | Medium (3) | `GameButton`, `ActionButton`, `GroupBox` | Extract to `@layer components` |
| `text-[10px] text-gray-400 uppercase tracking-widest` | Low (2) | `LocationTimeBadge`, `HighscoreGrid` | Extract to `Label` primitive |

## B) Proposed Design Tokens

To ensure compatibility across both Tailwind v3 and v4 environments, these tokens are provided in both formats.

### Tailwind v4 `@theme` (src/styles/globals.css)
```css
@theme {
  --shadow-glass-sm: 0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  --shadow-glass-md: 0 20px 50px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  --shadow-glass-lg: 0 30px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05);

  --bg-glass-shine: linear-gradient(to top right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.1), transparent);
  --bg-glass-glow: radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.05), transparent);
}
```

### Tailwind v3 `tailwind.config.js`
```javascript
module.exports = {
  theme: {
    extend: {
      boxShadow: {
        'glass-sm': '0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
        'glass-md': '0 20px 50px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
        'glass-lg': '0 30px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)',
      },
      backgroundImage: {
        'glass-shine': 'linear-gradient(to top right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.1), transparent)',
        'glass-glow': 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.05), transparent)',
      }
    }
  }
}
```

## C) Proposed CSS Utilities (@layer components)

For visual effects that are purely decorative and don't require React state, we can use `@layer components` in `globals.css`:

```css
@layer components {
  .glass-decoration {
    @apply after:absolute after:inset-0 after:bg-glass-shine after:pointer-events-none;
    @apply before:absolute before:inset-0 before:bg-glass-glow before:pointer-events-none;
  }
}
```

## D) Proposed Shared UI Components

### 1. `GlassCard` (src/components/ui/GlassCard.tsx)
A base container that encapsulates the glassmorphism visual style.

```tsx
import React from "react"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  shadowSize?: 'sm' | 'md' | 'lg'
}

export function GlassCard({ children, className = "", shadowSize = "md" }: GlassCardProps) {
  const shadows = {
    sm: "shadow-glass-sm",
    md: "shadow-glass-md",
    lg: "shadow-glass-lg"
  }

  return (
    <div className={`relative bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 ${shadows[shadowSize]} ${className}`}>
      <div className="glass-decoration" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
```

### 2. `Button` (src/components/ui/Button.tsx)
A unified button component supporting both Game icons and Action text.

```tsx
import React from "react"
import Link from "next/link"

interface ButtonProps {
  href?: string
  onClick?: () => void
  children: React.ReactNode
  className?: string
  variant?: 'game' | 'action'
}

export function Button({ href, onClick, children, className = "", variant = "action" }: ButtonProps) {
  const baseClasses = "group relative transition-all duration-300 active:scale-95 overflow-hidden glass-decoration"
  const variantClasses = variant === 'game' ? "w-32 h-32 aspect-square" : "w-32 h-10 text-sm"

  const combinedClasses = `${baseClasses} ${variantClasses} ${className}`

  if (href) {
    return (
      <Link href={href} className={combinedClasses}>
        {children}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={combinedClasses}>
      {children}
    </button>
  )
}
```

## E) Implementation Steps

1.  Add design tokens to `src/styles/globals.css`.
2.  Add `@layer components` to `src/styles/globals.css`.
3.  Create primitive components in `src/components/ui/`.
4.  Refactor `GameButtons.tsx` and `GroupBox.tsx` to use the primitives.
5.  Remove legacy CSS classes that are no longer needed.
