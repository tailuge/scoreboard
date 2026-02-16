# Design Specification: New Game Screen

## Vision & Aesthetic: "Free and Easy"
Targeting a relaxed, open feel that is effortless to use on both mobile and desktop.
- **Core Vibe**: Light, airy, unencumbered. "Free and easy".
- **Typography**:
    - **Primary**: `Turret Road` (ExtraLight weight) for all elements. This gives a distinct, modern but light character.
- **Palette**:
    - **Background**: Keep the existing dark theme but ensure it feels spacious, not oppressive.
    - **Accents**: Maintain existing functional colors but styled to feel lightweight (thin borders, soft glows).
- **Mobile First**:
    - **Portrait Mode**: All 3 game cards and the "Recent Games" list must be easily visible.
    - **Scaling**: Cards should stack naturally.

## Layout Strategy
- **Flow**: Vertical stack on mobile, potential grid on desktop but prioritizing vertical rhythm.
- **Components**:
    - **Game Cards**: Compact, distinct.
    - **Recent Games List**: A single, consolidated list replacing separate "Live" and "History" panels.
        - **differentiation**: Use existing "Live" vs "Replay" pills to distinguish active vs finished games.

## Component Specifications

### Game Cards
Three distinct card layouts, kept compact for mobile visibility.
**Crucial Detail**: Icons MUST overhang the edge of the card (negative margin) to break the boxiness.

#### 1. Nine Ball (Top)
- **Layout**: Icon Left (Overhanging).
- **Options**: `Standard`, `Any`.
- **Actions**: Play / Practice.

#### 2. Snooker (Middle)
- **Layout**: Icon Right (Overhanging).
- **Options**: `3`, `6`, `15` reds.

#### 3. Three Cushion (Bottom)
- **Layout**: Icon Left (Overhanging).
- **Options**: `Race to 3`, `5`, `7`.

### Recent Games List
- **Concept**: A single unification of live and technical results.
- **Items**:
    - **Live Games**: Show "LIVE" pill.
    - **Past Games**: Show "REPLAY" pill (or just result).
- **Appearance**: Minimalist list, `Turret Road ExtraLight` font. efficient use of vertical space.

## ASCII Reference Layout (Overhanging Icons)
```
  (Desktop / Wide Mobile)

     /--\
    |ICON|   Nine Ball
     \--/│   [O] Standard  [ ] Any
      │  │
      │  │   [ PLAY ]  [ PRACTICE ]
      └──┘

                  Snooker             /--\
             [ ] 3  [O] 6  [ ] 15    |ICON|
                                      \--/
             [ PLAY ]  [ PRACTICE ]    │
                                       │
                                   ────┘

     /--\
    |ICON|   Three Cushion
     \--/│   [O] Race to 3
      │  │   [ ] Race to 5
      │  │   [ ] Race to 7
      └──┘   [ PLAY ]  [ PRACTICE ]
```

## Implementation Requirements for `new.tsx`

1.  **Structure Refactor**:
    -   Implement the logic to fetch **both** live and past games and merge them into a single chronological list (Live on top, then most recent history).
    -   Replace `LiveMatchesPanel` and `MatchHistoryList` with `RecentGamesList`.

2.  **Styling**:
    -   Import `Turret Road` (ExtraLight) from Google Fonts.
    -   Apply `font-family: 'Turret Road', sans-serif; font-weight: 200;` globally or to the container.
    -   Ensure the layout is responsive:
        -   **Mobile**: Single column (Cards -> Recent List).
        -   **Desktop**: Two columns (Cards | Recent List) or a centered stack depending on "free and easy" interpretation (likely centered stack to keep focus).
    -   **Icon Overhang**: Use negative positioning (e.g., `-ml-4` or `absolute left-[-20px]`) to ensure icons break the card boundary.

3.  **Typography Override**:
    -   Remove references to `Outfit` / `Space Mono` if they conflict with the "all elements Turret Road" directive.


original layout:

```
┌────────┐                                                                                          
│        ┼───────────────────────────┐                                                              
│  icon  │                           │                                                              
│        │   @ radio option1         │    Aim to keep vertical and horizontal size tight            
└─┬──────┘   X radio option2         │    for easy layout on mobile and desktop                     
  │          X radio option3         │    Nineball has 2 options 'standard','any'                   
  │                                  │                                                              
  │┌───────────────┐┌───────────────┐│                                                              
  ││  play online  ││   practice    ││                                                              
  │└───────────────┘└───────────────┘│                                                              
  └──────────────────────────────────┘                                                              
                                                                                                    
                                      ┌────────┐                                                    
          ┌───────────────────────────┼        │                                                    
          │                           │  icon  │    Incorporate asymetrical layout for non slop look
          │          @ radio option1  │        │    Icons are over the div edge                     
          │          X radio option2  └──────┬─┘    Icon can be left or right adds differentiation  
          │          X radio option3         │                                                      
          │                                  │      Snooker has 3 options 3 reds, 6 reds, 15 reds   
          │┌───────────────┐┌───────────────┐│                                                      
          ││  play online  ││   practice    ││                                                      
          │└───────────────┘└───────────────┘│                                                      
          └──────────────────────────────────┘                                                      
                                                                                                    
┌────────┐                                                                                          
│        ┼───────────────────────────┐                                                              
│  icon  │                           │                                                              
│        │     @ radio option1       │                                                              
└─┬──────┘     X radio option2       │     Three cushion billiards has 3 options, race to 3,5,7     
  │            X radio option3       │                                                              
  │                                  │                                                              
  │┌───────────────┐┌───────────────┐│                                                              
  ││  play online  ││   practice    ││                                                              
  │└───────────────┘└───────────────┘│                                                              
  └──────────────────────────────────┘                                                              
```