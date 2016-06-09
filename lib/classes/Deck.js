/**
 * Created by elgoo on 06/04/2016.
 */

'use strict';

var Card = require('./Card');

module.exports = class Deck {
    constructor(jokerCount) {
        this.cards = [];

        for(var suit = 1; suit <= 4; suit++) {
            for(var value = 1; value <= 13; value++) {
                let card = new Card(value,suit);
                this.cards.push(card)
            }
        }

        for(var joker = 1; joker <= jokerCount; joker++) {
            this.cards.push(new Card(14,joker % 2))
        }

        console.log("Created deck with "+this.cardsLeft+" cards.");
        console.log("Top card is: ",this.cards[0].toString());
    }

    shuffle() {
        var currentIndex = this.cards.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = this.cards[currentIndex];
            this.cards[currentIndex] = this.cards[randomIndex];
            this.cards[randomIndex] = temporaryValue;
        }

        console.log("Deck shuffled. Top card now: ",this.cards[0].toString());
    }

    get cardsLeft() {
        return this.cards.length;
    }

    drawCard() {
        if(this.cardsLeft > 0) {
            let cardDrawn = this.cards.splice(0,1);
            console.log("Card drawn from deck: ",cardDrawn.toString());
            return cardDrawn[0];
        } else {
            // todo: error
        }
    }
}