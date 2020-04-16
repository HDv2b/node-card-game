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

const socketsMap = [
    { command: "error", fn: handleError },
    { command: "game-event", fn: handleGameEvent },
    { command: "player-joined", fn: handlePlayerJoined },
    { command: "players-info", fn: handlePlayersInfo },
    { command: "your-id", fn: handleId },
    { command: "game-starting", fn: handleGameStart },
    { command: "cards-dealt", fn: handleCardsDealt },
    { command: "update-table", fn: handleUpdateTable },
    { command: "opening-reveal", fn: handleOpeningReveal },
    { command: "turned-first", fn: handleFirstCardTurning },
    { command: "new-turn", fn: handleNewTurn },
    { command: "discarded", fn: handleDiscard },
    { command: "card-drawn", fn: handleCardDrawn },
    { command: "opponent-card-drawn", fn: handleOpponentCardDrawn },
    { command: "you-kept", fn: handlePlayerKept },
    { command: "slam-success", fn: handleSlamSuccess },
    { command: "slam-fail", fn: handleSlamFail },
    { command: "blind-swapped", fn: handleBlindSwap },
    { command: "seen-own", fn: handleSeenOwn },
    { command: "seen-theirs", fn: handleSeenTheirs },
    { command: "king-seen", fn: handleKingSeen },
    { command: "opponent-peeking", fn: handleOpponentPeeking },
    { command: "opponent-king-peeking", fn: handleOpponentKingPeeking },
    { command: "special-move", fn: handleSpecialMove },
    { command: "cabo", fn: handleCabo },
    { command: "result", fn: handleResults },
    { command: "player-acknowledged", fn: handlePlayerReady },
];

socketsMap.forEach(function (messageType){
    socket.on(messageType.command, messageType.fn)
});

let ownId;
let name;
let allPlayers = [];
let gameStatus = 'lobby';

var topDiscard = null;

function addCardSlotToHand(player, slot, data){
    renderAddCardSlotToHand(player, slot, data);
}

while (!name || name === "") {
    name = prompt("What is your name?");
}

socket.emit('check-in',{name: name});

function handleError(data) {
    renderError(data.msg);
}

function handleGameEvent(data) {
    renderGameEvent(data);
}

function handlePlayerJoined(player) {
    renderPlayerJoined(player);
    //$(".opponent.name-tag").text(data.name);
}

function handlePlayersInfo(players) {
    allPlayers = players;
    renderAllPlayersInfo(allPlayers);
}

function handleId(id) {
    ownId = id;
    // renderOwnId(ownId);
}

function handleGameStart() {
    gameStatus = 'in progress';
    renderGameStart();
}

function handleCardsDealt(totalCards) {
    let data = {
        slotStatus : "card-back"
    };
    for(let p = 0; p < allPlayers.length; p++) {
        for (let t = 0; t < totalCards; t++) {
            addCardSlotToHand(p, t, data);
        }
    }
    renderCardsDealt(totalCards);
}

function handleUpdateTable(table) {
    renderTable(table);
}

function handleOpeningReveal(cards) {
    console.log("Cards revealed: " + cardsToString(cards));
    $(cards).each(function (i, card) {
        $myHand
            .find(".card-slot[data-slot-number='" + card.slot + "']")
            .attr({
                "data-slot-status": "card-front"
            })
            .find(".card")
            .attr({
                "card-front": cardToAttr(card.card)
            })
    });
    window.setTimeout(function () {
        alert("Memorise these cards and click when done.");
        socket.emit("opening-reveal-seen");
        $(cards).each(function (i, card) {
            $myHand
                .find(".card-slot[data-slot-number='" + card.slot + "']")
                .attr({
                    "data-slot-status": "card-back"
                })
                .find(".card")
                .attr({
                    "card-front": ""
                })
        });
    }, 0);
}

function handleFirstCardTurning() {
    console.log("First card turned...");
}

function handleNewTurn(data) {
    if(data.player === ownId) {
        console.log("Your Turn...");
        console.log("You can:");
        console.log("takeFromDeck() - take the top card from the deck");
        console.log("takeFromDiscards(<slotNumber>) - take the last discarded card");
        console.log("slamOwn(<slotNumber>) - slam one of your own cards");
        console.log("slam(<playerNumber>,<slotNumber>) - slam one of your opponent's cards");
        $table.attr("data-your-turn", "true");
    }else {
        console.log("Player "+data.player+"'s turn.");
        $table.attr("data-your-turn", "false");
        $table.attr("data-special-move", "false");
    }

    //$('[data-slot-status="opponent-peeking"]').removeAttr("opponent-peeking");
}

function handleDiscard(card) {
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
}

function handleCardDrawn(data) {
    var cardAsString = cardToString(data.card);
    topDiscard = data.card;
    $myHand.find(".deck-card-string").text(cardToString(topDiscard));
    $table.attr("data-picked-from-deck","true");
    $deckHoldingCard.attr({
        "card-front":cardToAttr(topDiscard),
        "data-slot-status":"card-front"
    });
    console.log('Drew a '+cardToString(topDiscard)+'. keep(slot) or discard()..');
}

function handleOpponentCardDrawn(data) {
    $deckHoldingCard.attr({
        "data-slot-status":"card-back"
    });
    console.log('Opponent '+data.player+' is drawing from deck...');
}

function handlePlayerKept(slot) {
    $table.attr("data-picked-from-deck","false");
    $deckHoldingCard.attr({
        "card-front":"",
        "data-slot-status":"slot-empty"
    });
    console.log('You kept and placed in slot '+slot);
}

function handleSlamSuccess(data) {
    console.log("Player"+data.slammer+" successfully slammed a "+cardToString(data.card)+" from Player "+data.handOwner+"'s slot "+data.slot);
    let $hand = $table.find(".hand[data-player-id='"+data.handOwner+"']");
    $hand.find("[data-slot-number='"+data.slot+"']").attr("data-slot-status","empty");
    $discardPile.attr("card-front",cardToAttr(data.card));
    $(".discard-card-string").text(cardToString(data.card));
    $table.attr("data-slam-available","false");
}

function handleSlamFail(data) {
    console.log("Player "+data.slammer+" unsuccessfully slammed a "+cardToString(data.card)+" from Player "+data.handOwner+"'s slot "+data.slot+", and now has a new card in slot "+data.newCardSlot);
    addCardSlotToHand(data.slammer,data.newCardSlot,{
        slotStatus : "card-back"
    });
}

function handleBlindSwap(data) {
    console.log("Your card in slot "+data.ownSlot+" has been swapped with opponents card in slot "+data.theirSlot+".");

    animateBlindSwap(
        {
            hand: ownId,
            slot: data.ownSlot
        },
        {
            hand: 1-ownId,
            slot:data.theirSlot
        });
}

function handleSeenOwn(data) {
    console.log("Your card in slot "+data.slot+" is "+cardToString(data.card)+".");
    //alert("Your card is "+cardToString(data.card)+".");
    animateOwnPeek(data);
}

function handleSeenTheirs(data) {
    console.log("Opponent's card in slot "+data.slot+" is "+cardToString(data.card)+".");
    animateOwnPeek(data);
}

function handleOpponentPeeking(data) {
    console.log("Player "+data.peekingPlayer+" is looking at card "+data.slot+" in Player "+data.hand+"'s hand");
    animateOpponentPeek(data);
}


function handleOpponentKingPeeking(data) {
    console.log("Player "+data.peekingPlayer+" is looking at his own card in slot "+data.ownSlot+" and card "+data.theirSlot+" in Player "+data.opponentHand+"'s hand.");
    animateOpponentPeek({
        hand: data.peekingPlayer,
        slot: data.ownSlot
    });
    animateOpponentPeek({
        hand: data.opponentHand,
        slot: data.opponentSlot
    });
}

function handleKingSeen(data) {
    console.log("Your card in slot "+data.ownSlot+" is "+cardToString(data.ownCard)+", and their card in slot "+data.theirSlot+" is "+cardToString(data.theirCard)+".");
    $table.attr("data-special-move","king-swap");

    animateOwnPeek({
        hand: data.opponentHand,
        slot: data.opponentSlot,
        card: data.theirCard
    });
    animateOwnPeek({
        hand: ownId,
        slot: data.ownSlot,
        card: data.ownCard
    });
}

function handleSpecialMove(move) {
    $table.attr("data-special-move",move);
}

function handleCabo(player) {
    alert("Player "+player+" has called Cabo");
    let $caboHand = $table.find("[data-player-id='"+player+"']");
    $caboHand.attr("data-cabo","called");
    $table.attr("data-cabo","called");
    setTipsBoxCopy("cabo");
}

function handleResults(players) {
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
}

function handlePlayerReady(data) {
    let $revealedSlots = $(".hand .card-slot[data-slot-status$='peeking']");

    $revealedSlots.attr("data-slot-status","card-back");
    $revealedSlots.find(".card").removeAttr("card-front");
}

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

function acknowledgeRevealedCards() {
    socket.emit("turn-action",{action:"acknowledged-revealed-cards"});
}

// Helper Functions

function cardsToString(cards){
    console.log(cards);
    return [cards[0].card, cards[1].card].map(cardToString);
}

function cardToString(card){
    var valueString,
        suitString;
    if(card.value !== JOKER) {
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

function setTipsBoxCopy(){
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

    $tipsBox.text(copy);
}

function animateBlindSwap(cardA,cardB){
    let slotA = cardA.slot,
        handA = cardA.hand,
        slotB = cardB.slot,
        handB = cardB.hand;

    let $slotA =  $(".hand[data-player-id='"+handA+"'] .card-slot[data-slot-number='"+slotA+"']");

    let $slotB =  $(".hand[data-player-id='"+handB+"'] .card-slot[data-slot-number='"+slotB+"']");

    let $cardA = $slotA.find(".card");
    let $cardB = $slotB.find(".card");

    $cardA.animate({
            "top": $cardB.offset().top - $cardA.offset().top,
            "left": $cardB.offset().left - $cardA.offset().left
        },
        1000,
         "linear",
         function(){
             $cardA.css({
                 "top": 0,
                 "left": 0
             })
         }
    );

    $cardB.animate({
            "top": $cardA.offset().top - $cardB.offset().top,
            "left": $cardA.offset().left - $cardB.offset().left
        },
        1000,
         "linear",
         function(){
             $cardB.css({
                 "top": 0,
                 "left": 0
             })
         }
    )
}

//peeks being done by an opponent, regardless of which hand they are peeking
function animateOpponentPeek(data){
    let $slot = $(".hand[data-player-id='"+data.hand+"'] .card-slot[data-slot-number='"+data.slot+"']");
    let $card = $slot.find(".card");

    //todo: player-specific peeking for variable number of players (eg which way to rotate the card for players "sat" at the sides of the screen)
    //$slot.attr("data-peeking",data.player);
    $slot.attr("data-slot-status","opponent-peeking");
}

//peeks being done by you, regardless of which hand you are peeking
function animateOwnPeek(data){
    let $slot = $(".hand[data-player-id='"+data.hand+"'] .card-slot[data-slot-number='"+data.slot+"']");
    let $card = $slot.find(".card");

    //todo: player-specific peeking for variable number of players
    //$slot.attr("data-peeking",data.player);
    $slot.attr("data-slot-status","own-peeking");
    $card.attr("card-front",cardToAttr(data.card));
}
