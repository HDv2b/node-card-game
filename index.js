/**
 * Created by elgoo on 06/04/2016.
 */

'use strict';

// Actual constants

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

// Arbitrary values

const MAXPLAYERS = 2;


//var rules = require('./lib/classes/Game');

var Player = require('./lib/classes/Player');
var Card = require('./lib/classes/Card');
var Deck = require('./lib/classes/Deck');
var Cabo = require('./games/cabo');

var deck = new Deck(2);
var game = new Cabo(deck);

var express = require('express');

var app = express();
app.set('port', process.env.PORT || 3000);
var expressServer  = require('http').createServer(app).listen(app.get('port'),
    function(){
        console.log("Express server listening on port " + app.get('port'));
    }
);
var io = require('socket.io').listen(expressServer);
var http = require('http').Server(app);

app.use(express.static('public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function(socket){
    console.log('Browser connection');

    socket.on('check-in', function(data){
        game.addPlayer(socket.id,new Player(data.name,socket));
        socket.broadcast.emit('player-joined',data);
        console.log(game.playerCount + " out of " + MAXPLAYERS);
        if (game.playerCount == MAXPLAYERS) {
            console.log("Game is full. Game starting....");
            let publicPlayerInfo = [];
            for(var p = 0, l = game.players.length; p < l; p++){
                let player = game.players[p];
                publicPlayerInfo[p] = {
                    name: player.name
                };
                player.socket.emit('your-id',p);
            }
            io.emit('players-info',publicPlayerInfo);
            io.emit('game-starting');
            game.commence(io);
        }
    });

    socket.on('disconnect', function(){
        console.log('user disconnected');
        // if(game.isPlayer(socketId)) {
        //     game.removePlayer(socket.id);
        // }
    });
});