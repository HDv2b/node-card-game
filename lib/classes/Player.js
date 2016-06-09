/**
 * Created by elgoo on 07/04/2016.
 */

'use strict';

var Collection = require('./Collection');

module.exports = class Player {
    constructor(name,socket) {
        this.name = name;
        this.hands = [];
        this.socket = socket;
    }

    createHand(id,cards) {
        let collection = new Collection(cards);
        this.hands[id] = collection;
    }

    receiveCard(id,card) {
        this.hands[id].push(card);
    }
}