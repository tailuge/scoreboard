# Design Specification: New Game Screen

## Vision & Aesthetic: "Compact & Wireframe-True"
Targeting a relaxed but highly efficient UI that adheres strictly to the original wireframe logic even on mobile.
-   **Core Vibe**: "Free and Easy", but structured.
-   **Typography**: `Turret Road` (ExtraLight) for everything.
-   **Mobile First**:
    - **Portrait Mode**: All 3 game cards and the "Recent Games" list must be easily visible.
    - **Scaling**: Cards should stack naturally.
    - **Width**: Cards must be tight, width defined by action buttons.
    - **Alignment**: Cards should alternate left/right/left on wider screens to avoid a rigid column feel.
    -   **Accents**: Cyan/Violet for functional elements, but kept fine/thin.
-   **Mobile Layout (CRITICAL)**:
    -   **NO WRAPPING**: Icons must stay Left/Right of the content even on narrow screens.
    -   **Compactness**: Reduce padding/margins significantly.
    -   **Width Definition**: The "Play/Practice" buttons at the bottom should define the natural width of the card.

## Component Specifications

### Game Cards (Mobile & Desktop)
Must follow the wireframe ASCII art EXACTLY.
-   **Height**: Minimized.
-   **Icon**:
    -   **Nine Ball**: Left, overhanging.
    -   **Snooker**: Right, overhanging.
    -   **Three Cushion**: Left, overhanging.
    -   **Behavior**: NEVER move above/below text. Always stay to the side.
-   **Radio Buttons**:
    -   **Style**: "Distinctly Radio Communcated" (e.g., circular selection indicators or very clear active states, not just subtle text color changes).
-   **Background**: Dark gradient container, glassmorphic edge.

### Detailed Card Layout (Wireframe Strictness)
On a narrow phone (portrait), the layout must preserve this structure:

```
[Icon Overhang Corner]
     [Title Header]
┌────────────────────────┐
│                        │
│   (o) Centered Radio   │
│                        │
│  [PLAY]    [PRACTICE]  │
└────────────────────────┘
```

```
[Icon] [Title: Nine Ball]
       (o) Standard  ( ) Any
       [P L A Y] [PRACTICE]
```

OR (Snooker):

```
[Title: Snooker]     [Icon]
( ) 3 (o) 6 ( ) 15
[P L A Y] [PRACTICE]
```

**Key Constraints**:
-   Title and Options share the vertical space next to the icon.
-   Buttons span the full available width below the options/title.
-   Margins are negative/overhanging for the icon.

### Recent Games List
-   Single consolidated list.
-   Compact rows.

## Implementation Requirements for `new.tsx`

1.  **Card Component**:
    -   Use `flex-row` (or `flex-row-reverse`) for the top section (Icon + Content).
    -   **PREVENT WRAP**: Ensure icon shrinking or text truncating if absolutely necessary, but do not drop icon to a new line.
    -   **Compact Spacing**: Use `gap-2` or `gap-1`, small paddings (`p-3` or `p-4`).
    -   **Background**: Update `bg-gunmetal/20` to a custom gradient class.
    
2.  **Radio Inputs**:
    -   Reimplement `OptionSelector` to look like actual radio choices (or highly distinct pills).
    -   "Standard", "Any" must be clearly selectable.

3.  **Responsiveness**:
    -   Maximize width usage on mobile.
    -   Ensure the buttons at the bottom stretch to fill the card width.

## Original Wireframe Reference

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
│        │     X radio option2       │     Three cushion billiards has 3 options, race to 3,5,7     
└─┬──────┘     X radio option2       │     Three cushion billiards has 3 options, race to 3,5,7     
  │            X radio option3       │                                                              
  │                                  │                                                              
  │┌───────────────┐┌───────────────┐│                                                              
  ││  play online  ││   practice    ││                                                              
  │└───────────────┘└───────────────┘│                                                              
  └──────────────────────────────────┘                                                              
```