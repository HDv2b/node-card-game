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

// states
$table.attr("data-slam-available","false");
$table.attr("data-your-turn","false");
$table.attr("data-special-move","none");

// templates

var template = {
  ownCardSlot : $("#own-card-slot-template").html(),
  theirCardSlot : $("#their-card-slot-template").html()
};

function renderGameStart() {
  $myArea.find(".name-tag").text(allPlayers[ownId].name);
  $myHand.attr("data-player-id",ownId);
  $opponentArea.find(".name-tag").text(allPlayers[1-ownId].name);
  $opponentHand.attr("data-player-id",1-ownId);
}

function renderCardsDealt(totalCards) {
  $cardSlot.attr("data-slot-status","card-back");
  $deck.attr("data-slot-status","card-back");
  $discardPile.attr("data-slot-status","slot-empty");
}

function renderAddCardSlotToHand(player, slot, data) {
  let $playerHand = $("[data-player-id='"+player+"']");
  let $thisSlot = $playerHand.find("[data-slot-number='"+slot+"']");
  let thisTemplate = player === ownId ? template.ownCardSlot : template.theirCardSlot;

  switch($thisSlot.length){
    case 0:
      console.log("Creating slot "+slot+" in hand "+player+" to accommodate new card...");
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

$table.on("click",".seen-button",function(){
  acknowledgeRevealedCards();
});

$opponentHand.on("click",".blind-swap-radio",function(){
  initBlindSwap();
});

$myHand.on("click",".blind-swap-radio",function(){
  initBlindSwap();
});

$opponentHand.on("click",".king-see-theirs-radio",function(){
  initKingSee();
});

$myHand.on("click",".king-see-own-radio",function(){
  initKingSee();
});

$table.on("click",".cabo-button",function(){
  cabo();
});
