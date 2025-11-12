import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;
import { Deck } from '../Deck';
import { DeckManager } from './DeckManager';
import { EventManager } from './EventManager';
import { GameEvent } from '../enums/GameEvent';
import { GameState } from '../enums/GameState';
import { Player } from '../Player';
import { Dealer } from '../Dealer';

@ccclass('GameManager')
export class GameManager extends Component {

    @property(DeckManager)
    private deckManager: DeckManager = null!;

    private players: Player[] = [];
    private dealer = new Dealer();

    private gameState: GameState = GameState.InitialDeal;

    private currentHandIndex = 0;

    start() {
        EventManager.instance.gameEvents.on(GameEvent.DECK_LOADED, this.onDeckLoaded, this);
        EventManager.instance.gameEvents.on(GameEvent.ANIMATION_FINISHED, this.onAnimationFinished, this);

        this.players.push(new Player('Player 1', 0));
    }

    protected onDestroy(): void {
        EventManager.instance.gameEvents.off(GameEvent.DECK_LOADED, this.onDeckLoaded, this);
        EventManager.instance.gameEvents.off(GameEvent.ANIMATION_FINISHED, this.onAnimationFinished, this);
    }

    private onDeckLoaded(deck: Deck) {
        // Start the game logic here, e.g., deal initial cards
        console.log('Game started with deck:', deck);
    }

    public initialDeal() {
        EventManager.instance.gameEvents.emit(GameEvent.LOCK_INPUT);
        for (let i = 0; i < 2; i++) {
            const playerCardData = this.deckManager.dealCard();
            const dealerCardData = this.deckManager.dealCard();

            if (playerCardData) {
                this.players[this.currentHandIndex].addCard(playerCardData);
            }
            if (dealerCardData) {
                this.dealer.addCard(dealerCardData);
            }
        }

        EventManager.instance.gameEvents.emit(GameEvent.DEAL_CARD, this.players[this.currentHandIndex]);
        EventManager.instance.gameEvents.emit(GameEvent.DEAL_CARD, this.dealer);
    }

    public onAnimationFinished(participant: Player | Dealer) {
        console.log('Animation finished for:', participant instanceof Player ? 'Player' : 'Dealer');
        if (this.gameState === GameState.InitialDeal && participant instanceof Player) {
            this.gameState = GameState.PlayerTurn;
            EventManager.instance.gameEvents.emit(GameEvent.GAME_STARTED, this.players[this.currentHandIndex]);

            // Check for immediate blackjack
            if (this.players[this.currentHandIndex].hasBlackjack() || this.dealer.hasBlackjack()) {
                this.dealer.revealAll = true;
                this.endGame();
            }
        }

        if (this.gameState === GameState.PlayerTurn && participant instanceof Player) {
            if (this.players[this.currentHandIndex].isBusted()) {
                if ((this.currentHandIndex + 1) == this.players.length) {
                    this.dealerPlay();
                } else {
                    this.currentHandIndex++;
                    EventManager.instance.gameEvents.emit(GameEvent.CHANGE_HAND, this.currentHandIndex);
                }
            }
        }

        if (this.gameState === GameState.PlayerTurnEnd && participant instanceof Player) {
            this.dealer.revealAll = true;
            this.dealerPlay();
        }

        if (this.gameState === GameState.DealerTurnEnd && participant instanceof Dealer) {
            this.gameState = GameState.GameEnd;
            const result = this.determineWinner();
            EventManager.instance.gameEvents.emit(GameEvent.GAME_ENDED, result);
        }

        EventManager.instance.gameEvents.emit(GameEvent.UNLOCK_INPUT);
    }

    public playerHit() {
        EventManager.instance.gameEvents.emit(GameEvent.LOCK_INPUT);
        const cardData = this.deckManager.dealCard();
        if (cardData) {
            this.players[this.currentHandIndex].addCard(cardData);
            console.log('Hand ' + this.currentHandIndex + ' count: ' + this.players[this.currentHandIndex].getHand().length);
            EventManager.instance.gameEvents.emit(GameEvent.DEAL_CARD, this.players[this.currentHandIndex]);
        }
    }

    public playerStand() {
        EventManager.instance.gameEvents.emit(GameEvent.LOCK_INPUT);
        console.log('Player stands with hand:', this.players[this.currentHandIndex].getHand());
        if ((this.currentHandIndex + 1) == this.players.length) {
            this.dealerPlay();
        } else {
            this.currentHandIndex++;
            EventManager.instance.gameEvents.emit(GameEvent.CHANGE_HAND, this.currentHandIndex);
            EventManager.instance.gameEvents.emit(GameEvent.UNLOCK_INPUT);
        }
    }

    public playerDouble() {
        EventManager.instance.gameEvents.emit(GameEvent.LOCK_INPUT);
        const cardData = this.deckManager.dealCard();
        if (cardData) {
            this.players[this.currentHandIndex].addCard(cardData);
            EventManager.instance.gameEvents.emit(GameEvent.DEAL_CARD, this.players[this.currentHandIndex]);
        }
        if ((this.currentHandIndex + 1) == this.players.length) {
            this.gameState = GameState.PlayerTurnEnd;
        } else {
            this.currentHandIndex++;
            EventManager.instance.gameEvents.emit(GameEvent.CHANGE_HAND, this.currentHandIndex);
        }
    }

    public playerSplit() {
        console.log('player split');
        if (!this.players[this.currentHandIndex].canSplit()) {
            return;
        }
        let currentHand = this.players[this.currentHandIndex];
        const splitCard = currentHand.splitHand();

        let newHand = new Player('Player 1', this.currentHandIndex + 1);
        newHand.addCard(splitCard);
        this.players.push(newHand);
        EventManager.instance.gameEvents.emit(GameEvent.SPLIT_HAND);
    }

    public dealerPlay() {
        EventManager.instance.gameEvents.emit(GameEvent.LOCK_INPUT);
        this.gameState = GameState.DealerTurn;
        if (this.players.every(player => player.isBusted())) {
            console.log('All player\'s hands are busted');
            this.endGame();
        };
        while (this.dealer.shouldHit()) {
            const cardData = this.deckManager.dealCard();
            if (cardData) {
                this.dealer.addCard(cardData);
                console.log('Dealer hits and receives:', cardData);
                EventManager.instance.gameEvents.emit(GameEvent.DEAL_CARD, this.dealer);
            }
        }
        console.log('Dealer Hand now:', this.dealer.getHand());
        this.endGame();
    }

    private determineWinner() {
        console.log('Determining winner...');
        const playerValue = this.players[this.currentHandIndex].getHandValue();
        const dealerValue = this.dealer.getHandValue();

        let result = '';
        if (this.players[this.currentHandIndex].hasBlackjack() && this.dealer.hasBlackjack()) {
            result = 'It\'s a tie with both having Blackjack!';
        } else if (this.players[this.currentHandIndex].hasBlackjack()) {
            result = 'Player wins with Blackjack!';
        } else if (this.dealer.hasBlackjack()) {
            result = 'Dealer wins with Blackjack!';
        } else if (this.players[this.currentHandIndex].isBusted()) {
            result = 'Dealer wins! Player busted.';
        } else if (this.dealer.isBusted()) {
            result = 'Player wins! Dealer busted.';
        } else if (playerValue > dealerValue) {
            result = 'Player wins!';
        } else if (dealerValue > playerValue) {
            result = 'Dealer wins!';
        } else {
            result = 'It\'s a tie!';
        }
        
        return result;
    }
    
    private endGame() {
        EventManager.instance.gameEvents.emit(GameEvent.DEALER_TURN_END);
        this.gameState = GameState.DealerTurnEnd;
    }

    private resetGame() {
        this.players.forEach(player => {
            player.resetHand();   
        });
        this.players = [];
        this.players.push(new Player('Player 1', 0));
        
        this.dealer.resetHand();
        this.dealer.revealAll = false;
        EventManager.instance.gameEvents.emit(GameEvent.GAME_RESET);
        this.gameState = GameState.InitialDeal;
        this.currentHandIndex = 0;
    }
}