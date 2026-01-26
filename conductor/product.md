# Initial Concept
A minimalist, login-free online billiards lobby system where players can find opponents for live games, spectate ongoing matches, view game results, and experience a lively, engaging lobby atmosphere.

# Product Definition

## Target Audience
- **Casual Players:** Individuals looking for quick, anonymous pick-up games with zero barriers to entry.
- **Competitive Players:** Users interested in rankings, high scores, and tracking their performance over time.
- **Spectators:** Enthusiasts who enjoy watching high-level billiards matches and engaging with the community as observers.

## Primary Goals
- **Zero Friction:** Deliver a completely anonymous, "instant-play" experience where users can start playing or spectating in seconds.
- **Lively Atmosphere:** Create a "busy" and social environment through real-time updates of active games, spectator counts, and match results.
- **Stability and Performance:** Ensure low-latency updates and high scalability using modern real-time technologies like Nchan and Vercel KV.

## Key Features
- **Real-Time Table Management:** A robust system for creating, joining, and spectating tables with instant status updates across all clients.
- **Match History:** A rolling history of recent game results displayed in real-time, contributing to the "lively" lobby atmosphere.
- **Seamless Identity Migration:** 
    - **Anonymous-First:** Users start with a unique `session_id` stored in an HTTP-only cookie, linked to their data in Vercel KV.
    - **Optional Registration:** Frequent users can later register with an email/username.
    - **Automatic Migration:** Upon registration, all existing records linked to the `session_id` are seamlessly transferred to the new `user_id`, ensuring no loss of history or ranking.

## Success Metrics
- **Time to First Game:** The primary metric is minimizing the time it takes for a user to transition from landing on the site to participating in or spectating a live game.
