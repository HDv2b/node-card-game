/**
 * Created by elgoo on 07/04/2016.
 */

'use strict';

const CLUBS = 1;
const DIAMONDS = 2;
const HEARTS = 3;
const SPADES = 4;
const BLACK = 0;
const RED = 1;
const ACE = 1;
const JACK = 11;
const QUEEN = 12;
const KING = 13;
const JOKER = 14;

const TOTAL_STARTING_CARDS = 4;
const TOTAL_PLAYERS = 2;

var Game = require('../lib/classes/Game');

module.exports = class Cabo extends Game {
    commence(io) {

        // simply variables
        var players = this.players;
        var deck = this.deck;

        // shuffle cards
        deck.shuffle();

        // deal 4 cards each
        for (let player = 0, l = players.length; player < l; player++) {
            let cardsDealt = [];
            while (cardsDealt.length < TOTAL_STARTING_CARDS) {
                let dealtCard = deck.drawCard();
                cardsDealt.push(dealtCard);
            }
            console.log("Player " + player + " has been dealt the following: " + cardsToString(cardsDealt));
            players[player].createHand('table', cardsDealt);
        }

        io.emit("cards-dealt",TOTAL_STARTING_CARDS);

        // Reveal two close cards for each player
        var playersReady = 0;
        var playerTurn = 0;
        var discardPile;
        var caboCalled = false;
        var slamAvailable = false;

        function endTurn() {
            slamAvailable = true;
            if(++playerTurn == TOTAL_PLAYERS){
                playerTurn = 0;
            }

            if(!players[playerTurn].caboCalled) {
                io.emit("new-turn", {
                    player: playerTurn
                });
                console.log("__________________________________");
            } else {
                /*
                 game is now over. count up cards
                 */
                var result = [];

                for (let player = 0, l = players.length; player < l; player++) {
                    let thisPlayer = players[player];
                    console.log("Player " + player + " has: " + cardsToString(thisPlayer.hands["table"].cards));
                    thisPlayer.score = thisPlayer.hands["table"].cards.reduce(function (total, card) {
                        return total + card.points;
                    }, 0);
                    console.log("Total: " + thisPlayer.score);

                    result[player] = {
                        hand: thisPlayer.hands["table"].cards,
                        score: thisPlayer.score
                    };
                }
                io.emit('result',result);
            }
        }

        for (let player = 0, l = players.length; player < l; player++) {
            let thisPlayer = players[player];
            let opponentPlayer = players[1-player];
            let revealedCards = [];

            for(let c = 0; c < TOTAL_STARTING_CARDS; c += 2){
                revealedCards.push({
                    slot:c,
                    card:thisPlayer.hands['table'].cards[c]
                })
            }

            console.log("Showing player " + player + " following cards: " + cardsToString(revealedCards.map(function(slotInfo){
                    return slotInfo.card;
                })));

            thisPlayer.socket.emit("opening-reveal", revealedCards);

            thisPlayer.socket.on("opening-reveal-seen", function () {
                //todo: refctore to ensure this doesn't trigger prematurely as a result of someone sending this message twice.
                playersReady++;
                console.log("Player " + player + " has acknowledged his revealed cards and is ready to go.");
                if (playersReady == TOTAL_PLAYERS) {
                    console.log("Both players ready...");
                    var turnedCard = deck.drawCard();
                    console.log(turnedCard.toString(), " turned from deck");
                    io.emit('turned-first');
                    io.emit('discarded', turnedCard);
                    endTurn();
                    discardPile = [turnedCard];
                }
            });
            thisPlayer.lookingAtCard = false;
            thisPlayer.specialMove = false;
            thisPlayer.socket.on("turn-action", function (data) {
                /*
                 Players can slam out of turn, as long as a slam hasn't already been done since the last pick-up.
                 */
                switch(data.action){
                    case "slam":
                        if (slamAvailable) {
                            console.log("==================================");
                            console.log("=           SLAM EVENT           =");
                            console.log("==================================");
                            let slamCard = players[data.handOwner].hands["table"].cards[data.slot];
                            console.log("Player " + player + " has slammed a " + slamCard.toString());
                            console.log("Card to match is a " + discardPile[discardPile.length - 1]);
                            if (slamCard.value == discardPile[discardPile.length - 1].value) {
                                console.log("Match!");
                                /*
                                 take card from slot to discard pile
                                 */
                                discardPile.push(slamCard);
                                delete players[data.handOwner].hands["table"].cards[data.slot];
                                io.emit("slam-success", {
                                    slammer: player,
                                    handOwner: data.handOwner,
                                    slot: data.slot,
                                    card: slamCard
                                });
                                slamAvailable = false;
                            } else {
                                console.log("Denied!");
                                /*
                                 If cards don't match, punishment is player gets a card drawn and placed in their hand in an available slot, making a new one if no slot is empty.
                                 */

                                // first, find an available slot
                                var emptySlot = 0;
                                while (typeof (thisPlayer.hands["table"].cards[emptySlot]) !== "undefined") {
                                    emptySlot++;
                                }

                                thisPlayer.hands["table"].cards[emptySlot] = deck.drawCard();

                                io.emit("slam-fail", {
                                    slammer: player,
                                    handOwner: data.handOwner,
                                    slot: data.slot,
                                    card: slamCard,
                                    newCardSlot: emptySlot
                                });
                            }
                            console.log("Player " + player + "'s hand is now: " + cardsToString(thisPlayer.hands["table"].cards));
                        } else {
                            console.log("Slam unavailable");
                        }
                        break;
                    case "slam-gift":
                        break;

                    default:
                        if (playerTurn == player) {
                        console.log("==================================");
                        console.log("=           Turn Taken           =");
                        console.log("==================================");
                        switch (data.action) {
                            case "take-from-discards":
                                /*
                                 Player takes card from discard pile, swapping it for one of their own
                                 */
                                let swappedOut = thisPlayer.hands["table"].cards[data.slot];
                                let pickedUp = discardPile.splice(-1, 1, swappedOut)[0];

                                thisPlayer.hands["table"].cards[data.slot] = pickedUp;

                                console.log("Player picked up " + pickedUp.toString() + ", placing in slot " + data.slot + ", discarding " + swappedOut.toString() + ")");
                                console.log("Player " + player + "'s hand is now: " + thisPlayer.hands["table"].cards);

                                io.emit('discarded', swappedOut);

                                endTurn();
                                break;


                            case "take-from-deck":
                                /*
                                 Player takes card from deck, and looks at it
                                 */

                                thisPlayer.lookingAtCard = deck.drawCard();
                                console.log("Player " + player + " is taking from the deck: ", thisPlayer.lookingAtCard.toString());
                                thisPlayer.socket.emit("card-drawn", {
                                    card: thisPlayer.lookingAtCard,
                                    from: "deck"
                                });
                                for (var p = 0; p < players.length; p++)
                                {
                                    if(p != player) {
                                        players[p].socket.emit("opponent-card-drawn", {
                                            player: player
                                        });
                                    }
                                }
                                break;
                            case "keep":
                                /*
                                 If player keeps a card, they must swap with with an existing card, and then the turn ends.
                                 */

                                if (thisPlayer.lookingAtCard) {
                                    // replace card in slot with one currently being looked at
                                    let oldCard = thisPlayer.hands["table"].cards.splice(data.slot, 1, thisPlayer.lookingAtCard)[0];

                                    // discard old card onto top of discard pile
                                    discardPile.push(thisPlayer.lookingAtCard);

                                    // player is no longer looking at a card.
                                    thisPlayer.lookingAtCard = false;

                                    console.log("Player " + player + " kept the card and placed it into slot " + data.slot + ".");
                                    console.log("Top discarded card is now " + oldCard);

                                    thisPlayer.socket.emit("you-kept", data.slot);
                                    opponentPlayer.socket.emit("they-kept", data.slot);
                                    io.emit("discarded", oldCard);

                                    console.log("Player " + player + "'s hand is now: " + cardsToString(thisPlayer.hands["table"].cards));

                                    endTurn();
                                } else {
                                    console.log("ERROR: player trying to keep non-existant card");
                                    thisPlayer.socket.emit("error", {msg: "Trying to keep non-existant card"});
                                }
                                break;
                            case "discard":
                                /*
                                 If player discards straight form pick-up, player may get to perform a special action, depending on the card value.
                                 If the card doesn't have a special value, end turn as usual.
                                 */

                                if (thisPlayer.lookingAtCard) {

                                    // throw card down
                                    discardPile.push(thisPlayer.lookingAtCard);

                                    console.log("Player " + player + " discarded his picked up card");
                                    console.log("Top discarded card is now ", discardPile[discardPile.length - 1]);

                                    io.emit("discarded", thisPlayer.lookingAtCard);

                                    // player is no longer looking at a card
                                    thisPlayer.lookingAtCard = false;

                                    // special actions depending on card value
                                    switch (discardPile[discardPile.length - 1].value) {
                                        case 7:
                                        case 8:
                                            console.log("7/8: look at own.");
                                            thisPlayer.specialMove = "see own";
                                            thisPlayer.socket.emit("special-move", "see-own");
                                            break;
                                        case 9:
                                        case 10:
                                            console.log("9/10: look at theirs.");
                                            thisPlayer.specialMove = "see theirs";
                                            thisPlayer.socket.emit("special-move", "see-theirs");
                                            break;
                                        case JACK:
                                        case QUEEN:
                                            console.log("J/Q: blind swap.");
                                            thisPlayer.specialMove = "blind swap";
                                            thisPlayer.socket.emit("special-move", "blind-swap");
                                            break;
                                        case KING:
                                            if (discardPile[discardPile.length - 1].color == BLACK) {
                                                console.log("Black King: look and swap.");
                                                thisPlayer.socket.emit("special-move", "king-see");
                                                thisPlayer.specialMove = "king see";
                                            } else {
                                                endTurn();
                                            }
                                            break;
                                        default:
                                            endTurn();
                                            break;
                                    }
                                } else {
                                    console.log("ERROR: player trying to discard non-existant card");
                                    thisPlayer.socket.emit("error", {msg: "Tried to discard a non-existant card"});
                                }
                                break;
                            // Special Moves
                            case "see-own":
                                if (thisPlayer.specialMove == "see own") {
                                    let card = thisPlayer.hands["table"].cards[data.slot];
                                    console.log("Player " + player + " has revealed " + card + " in own slot " + data.slot);
                                    thisPlayer.socket.emit("seen-own", {card: card, slot: data.slot});

                                    thisPlayer.specialMove = false;
                                    endTurn();
                                }
                                break;
                            case "see-theirs":
                                if (thisPlayer.specialMove == "see theirs") {
                                    let card = opponentPlayer.hands["table"].cards[data.slot];
                                    console.log("Player " + player + " has revealed " + card + " in opponent's slot " + data.slot);
                                    thisPlayer.socket.emit("seen-theirs", {card: card, slot: data.slot});
                                    thisPlayer.specialMove = false;
                                    endTurn();
                                }
                                break;
                            case "blind-swap":
                                if (thisPlayer.specialMove == "blind swap" || thisPlayer.specialMove == "king swap") {
                                    let ownCard = thisPlayer.hands["table"].cards[data.ownSlot];
                                    let opponentPlayer = players[data.handOwner];
                                    let theirCard = opponentPlayer.hands["table"].cards[data.theirSlot];

                                    thisPlayer.hands["table"].cards[data.ownSlot] = theirCard;
                                    opponentPlayer.hands["table"].cards[data.ownSlot] = ownCard;

                                    console.log("Player " + player + " has swapped their " + ownCard + " in slot " + data.ownSlot + " for Player " + data.handOwner + "'s " + theirCard + " in slot " + data.theirSlot + ".");

                                    console.log("Player " + player + "'s hand is now: " + cardsToString(thisPlayer.hands["table"].cards));
                                    console.log("Player " + data.handOwner + "'s hand is now: " + cardsToString(opponentPlayer.hands["table"].cards));

                                    io.emit("blind-swapped", {
                                        ownSlot: data.ownSlot,
                                        theirSlot: data.theirSlot,
                                        handOwner: data.handOwner
                                    });
                                    thisPlayer.specialMove = false;

                                    endTurn();
                                }
                                break;
                            case "king-see":
                                if (thisPlayer.specialMove == "king see") {
                                    let ownCard = thisPlayer.hands["table"].cards[data.ownSlot];
                                    let theirCard = opponentPlayer.hands["table"].cards[data.theirSlot];

                                    console.log("Player " + player + " has seen their " + ownCard + " in slot " + data.ownSlot + " and opponent's " + theirCard + " in slot " + data.theirSlot + ".");

                                    thisPlayer.socket.emit("king-seen", {
                                        ownSlot: data.ownSlot,
                                        theirSlot: data.theirSlot,
                                        ownCard: ownCard,
                                        theirCard: theirCard
                                    });

                                    thisPlayer.specialMove = "king swap";
                                }
                                break;
                            case "skip-special":
                                if (thisPlayer.specialMove) {
                                    thisPlayer.specialMove = false;
                                    endTurn();
                                }
                                break;
                            case "cabo":
                                if (!caboCalled) {
                                    caboCalled = true;
                                    players[playerTurn].caboCalled = true;
                                    console.log("Player " + playerTurn + " has called cabo.");
                                    io.emit("cabo", playerTurn);
                                    endTurn();
                                }
                                break;
                        }
                    } else {
                        thisPlayer.socket.emit("denied", {msg: "Not your turn!"});
                        break;
                }
            }
            });
        }
    }
};


// Helper Functions

function cardsToString(cards) {
    return cards.map(cardToString);
}

function cardToString(card) {
    var valueString,
        suitString;
    if (card.value != JOKER) {
        switch (card.value) {
            case ACE:
                valueString = "A";
                break;
            case JACK:
                valueString = "J";
                break;
            case QUEEN:
                valueString = "Q";
                break;
            case KING:
                valueString = "K";
                break;
            default:
                valueString = card.value;
                break;
        }
        switch (card.suit) {
            case CLUBS:
                suitString = "♣";
                break;
            case DIAMONDS:
                suitString = "♦";
                break;
            case HEARTS:
                suitString = "♥";
                break;
            case SPADES:
                suitString = "♠";
                break;
            default:
                console.log("error with card: ", card);
        }
        return valueString + "" + suitString;
    } else {
        switch (card.color) {
            case RED:
                return "Red Joker";
                break;
            case BLACK:
                return "Black Joker";
                break;
            default:
                console.log("error with card: ", card);
        }
    }
}