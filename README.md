<img width="1065" src="https://user-images.githubusercontent.com/85364179/180317472-0bb6c88f-10d0-4245-bbcc-f31d5c982b67.png">

Recently I've been playing [Last Call BBS](https://www.zachtronics.com/last-call-bbs/), a collection of interesting puzzle games and ode to the 1990s era of computing and dial-up BBS culture by Zachtronics. In July 2022 the developers released a sort of in-game devkit, [Axiom QuickServe](https://www.zachtronics.com/quickserve/), which allows the community to write and share applications that will then show up as dial-up servers within the game world (with limited greyscale text and ANSI-art-style interfaces).

This caught my imagination so I spent a little time writing a poker solitaire game-- basically a port of [a simple game I wrote for PICO-8](https://www.lexaloffle.com/bbs/?pid=83439).

# "Empty Saloon" poker solitaire 

<img width="1047" src="https://user-images.githubusercontent.com/85364179/180317461-073fe383-57bc-4797-bdeb-d73ad143db30.png">

## Installation
Within Last Call BBS, open "Netronics Connect!" and go to "Add New Servers...". That should give you a window that lets you "Open Folder" to open the local servers folder on your computer. Download [emptysaloon.js](emptysaloon.js) from this github repo and move it to that folder. Restart Netronics Connect! and you should see the option to 'Dial Empty Saloon'.

## Gameplay 
It may be easiest to learn by playing. Place cards in a 5x5 grid to create 12 poker hands (horizontal, vertical, and the two main diagonals). Score points depending on the hands. Score a large bonus if you have a valid poker hand (pairs or better) in all twelve directions, which is not easy. 

## Dev Log

**July 21** Got a playable game working, let's call it "v0.7", uploaded to github
**July 26** Swap in newly available card characters ♣ ♦ ♠

ToDo:
- Get feedback from people who play it
- Add 'Top 10 high scores' (and persist)?
- Add a 'hard mode' (must score hands in all 12 directions)


## Disclaimers

- I have almost zero Javascript experience, so I'm sure I'm missing standard engineering patterns or existing library functions-- this was just a fast and fun project banged out in several hours.
- The typical caveat about running scripts downloaded from strangers on the internet... I don't know what sort of sandboxing Last Call BBS includes, but fortunately you can just look at this source and see it is just a local game, nothing that talks to local files or the network.

