/**
 * Created by elgoo on 07/04/2016.
 */

'use strict';

// note to self: see js class mix-ins

module.exports = class Collection {
    constructor(cards) {
        this.cards = cards || [];
    }

    toString() {
        return cards.map(cardToString);
    }
};