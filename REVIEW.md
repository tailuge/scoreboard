# UI/UX Design Review: Scoreboard & Lobby

## Design Thinking Analysis

### Purpose
The interface serves as a portal for an online billiards ecosystem. It needs to facilitate quick matchmaking, provide a clear overview of live activity, and celebrate high-performance rankings. The current implementation is functional and clean, but leans into "safe" utility rather than immersive "game-feel."

### Tone: The "Retro-Futuristic Billiard Lounge"
To move away from the current generic dark-mode aesthetic, I propose an **Industrial-Refined** direction. It should feel like a high-end, underground billiards lounge from 2077.
- **Core vibe**: Precision, dark-room atmosphere, neon-lit cues, and data-heavy telemetry.
- **Atmosphere**: Moody, high-contrast, tactile.

### Constraints
- **Framework**: Next.js (Pages Router).
- **Styling**: Tailwind CSS v4.
- **Accessibility**: Must maintain WCAG AA (4.5:1 contrast).
- **Performance**: High-speed real-time updates from Nchan must not cause layout thrashing.

### Differentiation: What makes it UNFORGETTABLE?
The "Signature Detail" should be **Telemetric Immersivity**. Instead of standard tables, the leaderboard and match lists should feel like a live dashboard of an elite sporting event, using monospaced typography and "active scanning" animations.

---

## Aesthetic Critique & Recommendations

### 1. Typography: From Generic to Precise
- **Current**: `Arial, Helvetica, sans-serif`. This is the definition of "AI Slop" aesthetics—safe, uninspired, and default.
- **Recommendation**:
    - **Display/Headings**: Use a sharp, modern sans-serif like **Outfit** or **Lexend**.
    - **Data/Badges/Scores**: Use a high-character monospaced font like **JetBrains Mono** or **Space Mono**. This reinforces the feeling of "precision sports" and "real-time telemetry."
    - **Implementation**:
      ```css
      --font-display: 'Outfit', sans-serif;
      --font-mono: 'Space Mono', monospace;
      ```

### 2. Color & Theme: Depth over Flatness
- **Current**: `gray-900` / `gray-800` palette. Functional but lacks brand identity.
- **Recommendation**:
    - **Dominant**: Deep "Midnight Emerald" (`#022c22`) instead of flat gray. This subtly references the billiard table cloth without being literal.
    - **Accents**:
        - **Live Status**: Neon Cyan (`#06b6d4`) with a soft glow filter.
        - **Action/Primary**: Electric Violet (`#8b5cf6`) for "Play" and "Join."
    - **Gradients**: Move from 180deg vertical gradients to more dynamic 135deg diagonal flows to create a sense of movement.

### 3. Motion: Micro-Interactions that Delight
- **Current**: Basic Tailwind transitions and `animate-spin`.
- **Recommendation**:
    - **Staggered Entry**: Animate the `MatchResultCard` and `LeaderboardTable` rows with a `stagger` effect on mount.
    - **Glow Pulse**: Instead of a simple `animate-spin`, use a soft `pulse` with a `filter: drop-shadow` for the "Finding opponent" state to create a "searching radar" effect.
    - **Hover States**: Interactive pills (`user-pill`) should scale slightly (1.02x) and increase their border-glow intensity on hover.

### 4. Spatial Composition: Breaking the Grid
- **Current**: Perfectly aligned symmetric columns.
- **Recommendation**:
    - **Asymmetry**: Offset the `LiveMatchesPanel` slightly or use a "floating" sidebar effect.
    - **Layering**: The `GroupBox` border-mask is a great technical detail. Lean further into this by adding "corner brackets" or "technical markings" (e.g., small coordinate numbers in corners) to give it a "HUD" (Heads-Up Display) feel.

### 5. Backgrounds & Texture
- **Current**: Solid dark background.
- **Recommendation**:
    - **Grain Overlay**: Add a global `::before` element with a very low opacity noise texture (2-3%). This breaks the digital perfection and adds a premium "filmic" quality.
    - **Geometric Subtle Pattern**: A very faint grid or "diamond" pattern (referencing table markers) in the background of the main container.

---

## Summary of Changes to Move Away from "AI Slop"
1. **Kill Arial**: Replace with a Display/Mono pairing.
2. **Elevate the Palette**: Swap "Default Gray" for a curated, themed palette (Emerald/Cyan/Violet).
3. **Add Texture**: Introduce noise and geometric patterns.
4. **Refine Motion**: Move from "functional transitions" to "cinematic reveals."
