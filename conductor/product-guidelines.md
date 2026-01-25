# Product Guidelines

## Visual Aesthetic: Modern Bento-Minimalist
The application follows a "Modern Bento-Minimalist" aesthetic, blending clean functional design with the existing grid-based layout found in the game selection screen.

- **Theme:** High-contrast Dark Mode (`bg-gray-900`) with a dark gray color palette (`gray-800` for cards, `gray-700` for borders).
- **Layout:** A grid of interactive "cards" (Bento style) that serve as the primary interface for game selection, lobby status, and social indicators.
- **UI Elements:**
    - Rounded corners (`rounded-xl`) for cards and buttons.
    - Subtle shadow effects and scale transitions (`group-hover:scale-110`) to provide tactile feedback.
    - Distinctive hover states using color-coded borders (e.g., blue for Highscore, green for Online).
- **Responsiveness:** A fluid grid system where cards stack vertically on mobile devices, maintaining large, touch-friendly interactive areas.

## Tone and Communication
The system communicates with users in a **Functional and Direct** manner.

- **Instructions:** Clear, brief, and actionable. No conversational "fluff."
- **Feedback:** Immediate visual confirmation of actions (joining a table, creating a game).
- **Errors:** Descriptive but concise messages that guide the user to a resolution.

## Real-Time Presence and Activity
To create a "lively" feel without clutter, the UI utilizes subtle, reactive elements:

- **Pulsing Indicators:** Subtle animations on active table cards or "Waiting for Opponent" states to indicate live activity.
- **Live Counters:** Prominent use of components like `OnlineCount` to provide real-time global and local population data.
- **Dynamic State:** UI elements update instantly via Nchan/KV to reflect the current state of the lobby without manual refreshes.

## Interaction Design
- **Single-Page Experience:** Most interactions occur within the Bento grid or through minimalist overlays/modals to maintain context and speed.
- **Zero-barrier Flow:** Minimal steps from landing on the page to being in a game or spectating.
