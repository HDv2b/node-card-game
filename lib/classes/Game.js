/**
 * Created by elgoo on 07/04/2016.
 */

'use strict';

module.exports = class Game {
    constructor(deck) {
        console.log("New Game");
        this.players = [];
        this.deck = deck;
    }

    addPlayer(socketId,player){
        console.log("Player added: "+player.name);
        this.players.push(player);
    }

    removePlayer(socketId){
        console.log("Player dropped: "+players[socketId].name);
        this.players[socketId] = null;
    }

    get playerCount(){
        return this.players.length;
    }
};