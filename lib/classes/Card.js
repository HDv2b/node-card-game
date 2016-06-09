/**
 * Created by elgoo on 06/04/2016.
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

module.exports = class Card {
    constructor(value,suit) {

        /*
         In case of jokers:
         value = 14
         suit = 1 for black, 2 for red
          */

        this.value = value;
        this.suit = suit;
    }

    get color() {
        if(this.value != JOKER) {
            switch (this.suit) {
                case CLUBS:
                case SPADES:
                    return BLACK;
                    break;
                case DIAMONDS:
                case HEARTS:
                    return RED;
                    break;
                default:
                    //todo: error
            }
        } else {
            return this.suit;
        }
    }

    toString() {
        return cardToString(this);
    }

    get points(){
        return cardPoints(this);
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
        switch (card.suit) {
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

function cardPoints(card) {
    switch (card.value) {
        case KING:
            switch(card.color){
                case RED:
                    return 0;
                break;
                case BLACK:
                    return 13;
                break;
            }
            break;
        case JOKER:
            return -1;
            break;
        default:
            return card.value;
            break;
    }
}