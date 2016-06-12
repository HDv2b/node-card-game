/**
 * Created by elgoo on 07/04/2016.
 */

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

var socket = io();

var ownId,
    allPlayers;

var topDiscard = null;

// elements

var $table = $(".table"),
    $hand = $(".hand"),
    $cardSlot = $hand.find(".card"),
    $myArea = $(".my-area"),
    $opponentArea = $(".opponent-area"),
    $myHand = $myArea.find(".hand"),
    $opponentHand = $opponentArea.find(".hand"),
    $myCards = $myHand.find(".cards"),
    $opponentCards = $opponentHand.find(".cards"),
    $discardPile = $('.discard-pile'),
    $deck = $('.deck'),
    $discardButton = $('.discard-button'),
    $deckHoldingCard = $table.find(".drawn-card"),
    $tipsBox = $("#tips-box");

// templates

var template = {
    ownCardSlot : $("#own-card-slot-template").html(),
    theirCardSlot : $("#their-card-slot-template").html()
};

function addCardSlotToHand(player,slot,data){
    let $playerHand = $("[data-player-id='"+player+"']");
    let $thisSlot = $playerHand.find("[data-slot-number='"+slot+"']");
    let thisTemplate = player == ownId ? template.ownCardSlot : template.theirCardSlot;
    switch($thisSlot.length){
        case 0:
            console.log("Creating slot "+slot+" in hand to accommodate new card...");
            let thisNewCardSlot = thisTemplate
                .replace(/SLOT_NUMBER/g,slot)
                .replace(/SLOT_STATUS/g,data.slotStatus);
            $playerHand.append(thisNewCardSlot);
            if(topDiscard) {
                $(".discard-card-string").html(cardToString(topDiscard));
            }
            break;
        case 1:
            console.log("Slot "+slot+" already exists, filling...");
            $thisSlot.attr("data-slot-status",data.slotStatus);
            break;
        default:
            console.log("ERROR: MULTIPLE SLOTS ASSIGNED ID "+slot+" IN OWN HAND");
            break;
    }
}

// states

$table.attr("data-slam-available","false");
$table.attr("data-your-turn","false");
$table.attr("data-special-move","none");


var name = prompt("What is your name?");
//$(".player.name-tag").text(name);
socket.emit('check-in',{name: name});

socket.on("error",function(data){
    console.log(data.msg);
});

socket.on('game-event', function(data){
    console.log(data);
});

socket.on('player-joined', function(data){
    console.log(data.name + " has joined the game.");
    //$(".opponent.name-tag").text(data.name);
});

socket.on('players-info',function(players) {
    console.log("Player info:", players);
    allPlayers = players;
});

socket.on('your-id',function(id){
    console.log("player id is "+id);
    ownId = id;
});

socket.on('game-starting', function(){
    $myArea.find(".name-tag").text(allPlayers[ownId].name);
    $myHand.attr("data-player-id",ownId);
    $opponentArea.find(".name-tag").text(allPlayers[1-ownId].name);
    $opponentHand.attr("data-player-id",1-ownId);
    console.log("Game is full. Starting...");
});

socket.on('cards-dealt', function(totalCards){
    console.log(totalCards+" cards dealt each");
    $cardSlot.attr("data-slot-status","card-back");
    $deck.attr("data-slot-status","card-back");
    $discardPile.attr("data-slot-status","slot-empty");
    let data = {
        slotStatus : "card-back"
    };
    for(let p = 0; p < allPlayers.length; p++) {
        for (let t = 0; t < totalCards; t++) {
            addCardSlotToHand(p, t, data);
        }
    }
});

socket.on('opening-reveal', function(cards){
    console.log("Cards revealed: "+cardsToString([cards[0].card,cards[1].card]));
    $(cards).each(function(i,card){
        $myHand
            .find(".card-slot[data-slot-number='"+card.slot+"']")
            .attr({
                "data-slot-status":"card-front"
            })
            .find(".card")
            .attr({
                "card-front":cardToAttr(card.card)
            })
    });
    window.setTimeout(function(){
        alert("Memorise these cards and click when done.");
        socket.emit("opening-reveal-seen");
        $(cards).each(function(i,card){
            $myHand
                .find(".card-slot[data-slot-number='"+card.slot+"']")
                .attr({
                    "data-slot-status":"card-back"
                })
                .find(".card")
                .attr({
                    "card-front":""
                })
        });
    },0);
});

socket.on('turned-first', function(card){
    console.log("First card turned...");
});

socket.on('new-turn', function(data){
    if(data.player == ownId) {
        console.log("Your Turn...");
        $table.attr("data-your-turn", "true");
    }else {
        console.log("Player "+data.player+"'s turn.");
        $table.attr("data-your-turn", "false");
        $table.attr("data-special-move", "false");
    }
});

socket.on('discarded', function(card){
    console.log("Top card in discard pile: "+cardToString(card));
    topDiscard = card;

    $discardPile.attr({
        "card-front":cardToAttr(card),
        "data-slot-status":"card-front"
    });

    $(".discard-card-string").text(cardToString(card));

    $deckHoldingCard.attr({
        "data-slot-status":"empty"
    });

    $table.attr("data-slam-available","true");
});

socket.on('card-drawn', function(data){
    var cardAsString = cardToString(data.card);
    topDiscard = data.card;
    $myHand.find(".deck-card-string").text(cardToString(topDiscard));
    $table.attr("data-picked-from-deck","true");
    $deckHoldingCard.attr({
        "card-front":cardToAttr(topDiscard),
        "data-slot-status":"card-front"
    });
    console.log('Drew a '+cardToString(topDiscard)+'. keep(slot) or discard()..');
});

socket.on('opponent-card-drawn',function(data){
    $deckHoldingCard.attr({
        "data-slot-status":"card-back"
    });
    console.log('Opponent '+data.player+' is drawing from deck...');
});

socket.on('you-kept', function(slot){
    $table.attr("data-picked-from-deck","false");
    $deckHoldingCard.attr({
        "card-front":"",
        "data-slot-status":"slot-empty"
    });
    console.log('You kept and placed in slot '+slot);
});

socket.on('slam-success', function(data){
    console.log("Player"+data.slammer+" successfully slammed a "+cardToString(data.card)+" from Player "+data.handOwner+"'s slot "+data.slot);
    let $hand = $table.find(".hand[data-player-id='"+data.handOwner+"']");
    $hand.find("[data-slot-number='"+data.slot+"']").attr("data-slot-status","empty");
    $discardPile.attr("card-front",cardToAttr(data.card));
    $(".discard-card-string").text(cardToString(data.card));
    $table.attr("data-slam-available","false");
});

socket.on('slam-fail', function(data){
    console.log("Player "+data.slammer+" unsuccessfully slammed a "+cardToString(data.card)+" from Player "+data.handOwner+"'s slot "+data.slot+", and now has a new card in slot "+data.newCardSlot);
    addCardSlotToHand(data.slammer,data.newCardSlot,{
        slotStatus : "card-back"
    });
});

socket.on('blind-swapped', function(data){
    console.log("Your card in slot "+data.ownSlot+" has been swapped with opponents card in slot "+data.theirSlot+".");
});

socket.on('seen-own', function(data){
    console.log("Your card in slot "+data.slot+" is "+cardToString(data.card)+".");
    alert("Your card is "+cardToString(data.card)+".");
});

socket.on('seen-theirs', function(data){
    console.log("Opponent's card in slot "+data.slot+" is "+cardToString(data.card)+".");
    alert("The card is "+cardToString(data.card)+".");
});

socket.on('king-seen', function(data){
    console.log("Your card in slot "+data.ownSlot+" is "+cardToString(data.ownCard)+", and their card in slot "+data.theirSlot+" is "+cardToString(data.theirCard)+".");
    alert("Your card: "+cardToString(data.ownCard)+"\nTheir card: "+cardToString(data.theirCard));
    $table.attr("data-special-move","king-swap");
});

socket.on("special-move",function(move){
    $table.attr("data-special-move",move);
});

socket.on("cabo",function(player){
    alert("Player "+player+" has called Cabo");
    let $caboHand = $table.find("[data-player-id='"+player+"']");
    $caboHand.attr("data-cabo","called");
    $table.attr("data-cabo","called");
    setTipsBoxCopy("cabo");
});

socket.on("result",function(players){
    console.log("Results are in...");
    $table.attr("data-cabo","results");
    console.log(players);
    for(let p = 0; p < players.length; p++){
        let thisPlayer = players[p],
            $thisHand = $("[data-player-id='"+p+"']");

        for(let c = 0;c < thisPlayer.hand.length; c++){
            let thisCard = thisPlayer.hand[c];
            $thisHand.find("[data-slot-number='"+c+"']")
                .attr({
                "data-slot-status":"card-front-public"
            })
                .find(".card")
                .attr({
                    "card-front":cardToAttr(thisCard)
                })
        }
    }
    var resultCopy;
    if(players[ownId].score < players[1-ownId].score) {
        resultCopy = "You Win!"
    }else if(players[ownId].score == players[1-ownId].score) {
        if (players[ownId].hand.length < players[1-ownId].hand.length){
            resultCopy = "You Win!"
        }else if (players[ownId].hand.length == players[1-ownId].hand.length) {
            resultCopy = "Draw!"
        } else {
            resultCopy = "You Lose :("
        }
    }else {
        resultCopy = "You Lose :("
    }
    alert(resultCopy+"\nYour Score: "+players[ownId].score+"\nOpponent Score: "+players[1-ownId].score);
});

// controls

$myHand.on("click",".slam-button",function(){
    let $this = $(this);
    let slotClicked = $this.closest(".card-slot").attr("data-slot-number");
    slamOwn(slotClicked);
});

$opponentHand.on("click",".slam-button",function(){
    let $this = $(this);
    let slotClicked = $this.closest(".card-slot").attr("data-slot-number");
    let handOwner = $this.closest(".hand").attr("data-player-id");
    slam(handOwner,slotClicked);
});

$myHand.on("click",".swap-discard-button",function(){
    let $this = $(this);
    let slotClicked = $this.closest(".card-slot").attr("data-slot-number");
    takeFromDiscards(slotClicked);
});

$deck.on("click",".take-deck-button",function(){
    let $this = $(this);
    let slotClicked = $this.closest(".card-slot").attr("data-slot-number");
    takeFromDeck();
});

$myHand.on("click",".swap-deck-button",function(){
    let $this = $(this);
    let slotClicked = $this.closest(".card-slot").attr("data-slot-number");
    keep(slotClicked);
});

$myHand.on("click",".see-own-button",function(){
    let $this = $(this);
    let slotClicked = $this.closest(".card-slot").attr("data-slot-number");
    seeOwn(slotClicked);
});

$opponentHand.on("click",".see-theirs-button",function(){
    let $this = $(this);
    let slotClicked = $this.closest(".card-slot").attr("data-slot-number");
    console.log("looking at slot "+slotClicked+" in opponent's hand...");
    seeTheirs(slotClicked);
});

$discardButton.click(function(){
    $table.attr("data-picked-from-deck","false");
    $deckHoldingCard.attr({
        "card-front":"",
        "data-slot-status":"slot-empty"
    });
    discard();
});

function initBlindSwap(){
    let ownSlot = parseInt($("[name='blind-swap-own']:checked").val());
    let $checked = $("[name='blind-swap-theirs']:checked");
    let theirSlot = parseInt($checked.val());
    let handOwner = $checked.closest(".hand").attr("data-player-id");

    if (Number.isInteger(ownSlot) && Number.isInteger(theirSlot)) {
        blindSwap(ownSlot,handOwner,theirSlot);
        $("[name='blind-swap-own']").prop('checked',false);
        $("[name='blind-swap-theirs']").prop('checked',false);
    }
}

function initKingSee(){
    let ownSlot = parseInt($("[name='king-see-own']:checked").val());
    let theirSlot = parseInt($("[name='king-see-theirs']:checked").val());

    if (Number.isInteger(ownSlot) && Number.isInteger(theirSlot)) {
        kingSee(ownSlot,theirSlot);
        $("[name='king-see-own']").prop('checked',false);
        $("[name='king-see-theirs']").prop('checked',false);
    }
}

$opponentHand.on("click",".blind-swap-radio",function(){
    initBlindSwap()
});

$myHand.on("click",".blind-swap-radio",function(){
    initBlindSwap()
});

$opponentHand.on("click",".king-see-theirs-radio",function(){
    initKingSee()
});

$myHand.on("click",".king-see-own-radio",function(){
    initKingSee()
});

$table.on("click",".cabo-button",function(){
    cabo()
});

// Game functions

function takeFromDeck(){
    socket.emit("turn-action",{action:"take-from-deck"});
}

function takeFromDiscards(n){
    socket.emit("turn-action",{action: "take-from-discards", slot: n});
}

function seeOwn(n){
    socket.emit("turn-action",{action: "see-own", slot: n});
}

function seeTheirs(n){
    socket.emit("turn-action",{action: "see-theirs", slot: n})
}

function keep(slot){
    socket.emit("turn-action",{action:"keep",slot:slot});
}

function discard(){
    socket.emit("turn-action",{action:"discard"});
}

function slamOwn(slot){
    slam(ownId,slot);
}

function slam(player,slot){
    socket.emit("turn-action",{action:"slam",slot:slot,handOwner:player});
}

function blindSwap(mine,handOwner,theirs){
    socket.emit("turn-action",{
        action:"blind-swap",
        ownSlot:mine,
        handOwner:handOwner,
        theirSlot:theirs
    });
}

function kingSee(mine,theirs){
    socket.emit("turn-action",{action:"king-see",ownSlot:mine,theirSlot:theirs});
}

function skipSpecial(){
    socket.emit("turn-action",{action:"skip-special"});
}

function cabo(){
    socket.emit("turn-action",{action:"cabo"});
}

// Helper Functions

function cardsToString(cards){
    return cards.map(cardToString);
}

function cardToString(card){
    var valueString,
        suitString;
    if(card.value != JOKER) {
        switch (card.value) {
            case 1:
                valueString = "A";
                break;
            case 11:
                valueString = "J";
                break;
            case 12:
                valueString = "Q";
                break;
            case 13:
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
        }
        return valueString+""+suitString;
    } else {
        switch(card.suit){
            case RED:
                return "Joker";
                break;
            case BLACK:
                return "Joker";
                break;
        }
    }
}

function cardToCssClass(card){
    var cssClass = "sprite sprite-card";
    if(card.value != JOKER) {
        switch (card.suit) {
            case CLUBS:
                cssClass += "Clubs";
                break;
            case DIAMONDS:
                cssClass += "Diamonds";
                break;
            case HEARTS:
                cssClass += "Hearts";
                break;
            case SPADES:
                cssClass += "Spades";
                break;
        }
        switch (card.value) {
            case ACE:
                cssClass += "A";
                break;
            case JACK:
                cssClass += "J";
                break;
            case QUEEN:
                cssClass += "Q";
                break;
            case KING:
                cssClass += "K";
                break;
            default:
                cssClass += card.value;
                break;
        }
    } else {
        cssClass += "Joker";
    }
    return cssClass;
}

function cardToAttr(card){
    var cssAttr = "";
    if(card.value != JOKER) {
        switch (card.suit) {
            case CLUBS:
                cssAttr += "Clubs";
                break;
            case DIAMONDS:
                cssAttr += "Diamonds";
                break;
            case HEARTS:
                cssAttr += "Hearts";
                break;
            case SPADES:
                cssAttr += "Spades";
                break;
        }
        switch (card.value) {
            case ACE:
                cssAttr += "A";
                break;
            case JACK:
                cssAttr += "J";
                break;
            case QUEEN:
                cssAttr += "Q";
                break;
            case KING:
                cssAttr += "K";
                break;
            default:
                cssAttr += card.value;
                break;
        }
    } else {
        cssAttr += "Joker";
    }
    return cssAttr;
}

function setTipsBoxCopy(copy){
    let copy = {
        newGame : "A new game is starting.",
        openingReveal: "Memorise these two cards; you might never see them again.",
        firstDraw: "If any any time you think the top card in the throw-away pile matches yours or an opponent's card, you can slam it.",
        yourTurn : "You can either pick up from the deck, or the discard pile",
        playOrKeep: "You can either swap this card for one of your own, or throw it away.",
        lookAtOwn: "Discarding a 7 or 8 directly from the deck means you can look at one of your own cards.",
        lookAtTheirs: "Discarding a 9 or 10 directly from the deck means you can look at one of your opponents' cards.",
        blindSwap: "Discarding a J or Q directly from the deck means you can blind-swap one of your cards for one of your opponents'.",
        kingSwap: "Discarding a Black King directly from the deck means you can look at one of your cards, and one opponent card, before making a blind-swap.",
        cabo: "Cabo has been called! Players (except the caller) get a final turn before cards are turned. Caller's cards are locked."
    };

    $tipsBox.text(copy.copy);
}