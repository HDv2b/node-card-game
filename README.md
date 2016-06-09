# node-card-game
Multiplayer card game library with node and sockets.

I'm still getting to grips with layout out node dependencies, so the project may be messy initially with many refactors until I get it right.

## Gist of it...
The aim is to have a standard library which handles transactions between abstract collections of cards with a layer for broadcasting updates to relevant players, and a client-side counterpart of receiving those updates and making requests for the player.

It is then up to the developer to program the rules of the game based on this library, and also the layout for the client.

## Cabo
The demo is a popular card game amongst backpackers around South East Asia. Over time, variations have slipped in, so the rules used in this example demo won't follow the original guide. I've chosen it for sentimental value rather than anything technical, though it's still a good candidate as it's very dynamic with a fair amount of rules with sub-conditions.

This [Google Doc](https://goo.gl/WvefUO) explains the rules for which this game is programmed to play.

# Prototype Roadmap in approximate chronological order.
* Playable demo with 2 players playing Cabo, dealt a fixed amount of cards
* Client to display game using standard DOM. Maybe persuaded to switch to canvas later but for now I feel like it's overkill. Layout to work across screen sizes.
* Tidy up and refactor, ensure complete separation of library and game rules on server and layout from communication layer on client side.
* Allow players to reset game and start again.
-- Launch publicly available showcase
* Multiple players
* Allow for variations to be determined by game host (ie number of cards to be initially dealt.
* Support for multiple simultaneous games with a lobbying system.