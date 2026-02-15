# New Game Page Design - /new.tsx

## Overview

Redesign of the game selection page with a "1-click to play, more clicks to tune" philosophy. Three game types (Snooker, Nine Ball, Three Cushion) each get their own GroupBox with clear visual hierarchy and mobile-first responsive layout.

---

## Layout Structure

### Desktop (lg: 1024px+)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ SNOKER                                                │ │
│  │                                                       │ │
│  │  ┌────────┐   ┌────────────────────────────────────┐  │ │
│  │  │        │   │  ○ 3 reds   ● 6 reds   ○ 15 reds   │  │ │
│  │  │  icon  │   └────────────────────────────────────┘  │ │
│  │  │        │                                           │ │
│  │  └────────┘                                           │ │
│  │                                                       │ │
│  │  ┌─────────────────────┐  ┌─────────────────────┐    │ │
│  │  │    Play Online      │  │      Practice       │    │ │
│  │  └─────────────────────┘  └─────────────────────┘    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ NINE BALL                                             │ │
│  │                                                       │ │
│  │  ┌────────┐                                           │ │
│  │  │        │                                           │ │
│  │  │  icon  │                                           │ │
│  │  │        │                                           │ │
│  │  └────────┘                                           │ │
│  │                                                       │ │
│  │  ┌─────────────────────┐  ┌─────────────────────┐    │ │
│  │  │    Play Online      │  │      Practice       │    │ │
│  │  └─────────────────────┘  └─────────────────────┘    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ THREE CUSHION                                         │ │
│  │                                                       │ │
│  │  ┌────────┐   ┌────────────────────────────────────┐  │ │
│  │  │        │   │  ● Race to 3   ○ Race to 5         │  │ │
│  │  │  icon  │   └────────────────────────────────────┘  │ │
│  │  │        │                                           │ │
│  │  └────────┘                                           │ │
│  │                                                       │ │
│  │  ┌─────────────────────┐  ┌─────────────────────┐    │ │
│  │  │    Play Online      │  │      Practice       │    │ │
│  │  └─────────────────────┘  └─────────────────────┘    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)

```
┌──────────────────────┐
│ SNOKER               │
│ ┌────┐               │
│ │    │  ○3 ●6 ○15    │
│ │icon│               │
│ │    │               │
│ └────┘               │
│ ┌──────────────────┐ │
│ │   Play Online    │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │    Practice      │ │
│ └──────────────────┘ │
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│ NINE BALL            │
│ ┌────┐               │
│ │    │               │
│ │icon│               │
│ │    │               │
│ └────┘               │
│ ┌──────────────────┐ │
│ │   Play Online    │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │    Practice      │ │
│ └──────────────────┘ │
└──────────────────────┘
```

---

## Game-Specific Options

| Game          | Options             | Default | Parameter  |
| ------------- | ------------------- | ------- | ---------- |
| Snooker       | Red balls: 3, 6, 15 | 6       | `&reds=`   |
| Three Cushion | Race to: 3, 5       | 3       | `&raceTo=` |
| Nine Ball     | None                | —       | —          |

---

## URL Patterns

### Play Online (internal link)

```
/lobby?action=join&ruletype=${ruleType}&reds=${reds}&raceTo=${raceTo}
```

### Practice (external, new tab)

```
https://tailuge.github.io/billiards/dist/?ruletype=${ruleType}&playername=${userName}&reds=${reds}&raceTo=${raceTo}
```

---

## Component Architecture

```
src/pages/new.tsx
│
├── GAMES array (config)
│   └── { name, icon, alt, ruleType, options }
│
├── GameCard component
│   ├── Props: game config, userName
│   ├── State: selectedOption (useState)
│   │
│   ├── Layout:
│   │   ├── Top row: Icon + Options (flex row, mobile: stack)
│   │   └── Bottom row: Action buttons (stacked on mobile)
│   │
│   └── Sub-components:
│       ├── GameIcon (image with hover glow)
│       ├── OptionSelector (radio pills)
│       └── ActionButtons (Play Online | Practice)
│
└── Main page
    ├── Head (SEO)
    └── Vertical stack of 3 GameCards wrapped in GroupBox
```

---

## Styling Guidelines (from REVIEW.md)

### Typography

- **Display/Headings**: Outfit or Lexend (modern, sharp sans-serif)
- **Data/Badges**: JetBrains Mono or Space Mono (precision feel)

### Colors

- **Dominant Background**: Midnight Emerald (`#022c22`)
- **Live/Active Accent**: Neon Cyan (`#06b6d4`)
- **Action/Primary**: Electric Violet (`#8b5cf6`)
- **Gradients**: 135deg diagonal flows

### Motion

- **Hover States**: Scale 1.02x, increase border-glow intensity
- **Option Selection**: Smooth transition between selected states
- **Button Hover**: Glow pulse effect

### Mobile Considerations

- **Touch Targets**: Minimum 44px height for buttons
- **Button Stacking**: Full-width buttons stacked vertically on mobile
- **Icon Size**: Sufficiently large for mobile (min 80px)
- **Spacing**: Generous padding between GroupBoxes (gap-4 or gap-6)
- **Options Row**: Compact pills, horizontally scrollable if needed

---

## State Management

### Local Component State (useState)

Each `GameCard` maintains its own option selection state:

```typescript
// Snooker
const [reds, setReds] = useState(6)

// Three Cushion
const [raceTo, setRaceTo] = useState(3)

// Nine Ball - no state needed
```

State is ephemeral (not persisted). Default values provide immediate 1-click play.

---

## Accessibility

- **Radio Groups**: Use `role="radiogroup"` with `aria-label`
- **Option Pills**: `role="radio"`, `aria-checked` state
- **Action Buttons**: Clear `aria-label` describing action and game
- **Focus States**: Visible focus rings on all interactive elements
- **Keyboard Navigation**: Tab through options, Enter/Space to select

---

## Breaking Changes

**None.** This is a new page (`/new`) that:

- Does not modify `game.tsx` or `lobby.tsx`
- Reuses existing components (`GroupBox`, `LiveMatchesPanel`, `MatchHistoryList`)
- Introduces new self-contained `GameCard` component in `new.tsx`

---

## Implementation Checklist

- [ ] Create `new.tsx` with basic structure
- [ ] Define `GAMES` config array with options
- [ ] Implement `GameCard` component
  - [ ] Icon display with hover effects
  - [ ] Option selector (conditional render)
  - [ ] Action buttons (Play Online / Practice)
- [ ] Wire up URL generation with selected options
- [ ] Add mobile-responsive styles
- [ ] Add accessibility attributes
- [ ] Test on multiple screen sizes
- [ ] Run `yarn lint` and `yarn test`
