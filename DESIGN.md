I want a layout that fits easily on mobile and desktop. I want a degree of asymmetry to make it warmer.
Keep the layout tight and compact. Subtle curves, rounded corners, drop shadow. Delightful.
The objective is 1-click to play but user can change options. 
Keep code clean and simple, split out layout and logic where best suited.
These changes are intended for new.tsx, the current implementation is in new.tsx
game.tsx and lobby.tsx may be impacted, eventually they will be removed, but not yet.
I light fine lines, not heavy borders on all elements. Subtle asymmetrical gradients on lines is also nice
The two main buttons are the focus but should not shout, I like the idea that they together define the width of the card
I like natural responsive layout not forced mobile version.
Other elements on the page in new.tsx can remain.
I want the following design to be followed for card layout. Subtle animations as card appear is good.
Choose light weight fonts that are a joy and not slop
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
