# Specification: Game Results Display & History

## Overview
Implement a system to capture, store, and display recent match results in the billiards lobby. This feature enhances the "lively atmosphere" by showing real-time outcomes.

## Requirements
- **Storage:** Use Vercel KV to store a rolling history of the last 20-50 matches.
- **Data Model:** Store winner, loser (or opponent), score, game type (snooker, nineball, etc.), and timestamp.
- **Backend:** Create an API endpoint `POST /api/match-results` to record a finished game and `GET /api/match-results` to fetch history.
- **Frontend:** 
    - Create a `MatchHistoryCard` component following the Bento aesthetic.
    - Integrate the history display into the existing lobby/index pages without radical layout changes.
    - Ensure real-time updates (poll or Nchan integration) when a new result is recorded.

## Success Criteria
- Match results are persisted correctly in Vercel KV.
- The UI displays the last 10 matches in a clean, non-obtrusive list/grid.
- Mobile responsiveness is maintained.
