import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;
import { Deck } from '../Deck';
import { DeckManager } from './DeckManager';
import { EventManager } from './EventManager';
import { GameEvent } from '../enums/GameEvent';
import { GameState } from '../enums/GameState';
import { GameResult } from '../enums/GameResult';
import { PlayerData } from '../PlayerData';
import { Player } from '../Player';
import { Dealer } from '../Dealer';
import { SFXID } from '../AudioSystem/SFXEnums';

@ccclass('GameManager')
export class GameManager extends Component {

    @property(DeckManager)
    private deckManager: DeckManager = null!;

    private playerDatas: PlayerData[] = [];

    private myPlayerID = 2;

    private players: Map<number, Player[]> = new Map<number, Player[]>();

    private playersThisTurn: Map<number, Player[]>;
    private currentPlayerID: number;
    private currentPlayerHands: Player[] = [];
    private dealer = new Dealer();

    private gameState: GameState = GameState.BetPhase;

    private currentHandIndex = 0;

    private phaseTimer: number = 10;

    start() {
        EventManager.instance.gameEvents.on(GameEvent.DECK_LOADED, this.onDeckLoaded, this);
        EventManager.instance.gameEvents.on(GameEvent.ANIMATION_FINISHED, this.onAnimationFinished, this);
        EventManager.instance.gameEvents.emit(GameEvent.GAMESTATE_CHANGED, this.gameState);

        this.playerDatas.push(new PlayerData(1, 1000));
        this.playerDatas.push(new PlayerData(this.myPlayerID, 1000));
        this.playerDatas.push(new PlayerData(3, 1000));
        this.playerDatas.forEach(playerData => {
            const player = [new Player(0, playerData.getID())]; 
            this.players.set(playerData.getID(), player);
        });
        this.playersThisTurn = new Map(this.players);
    }

    protected onDestroy(): void {
        EventManager.instance.gameEvents.off(GameEvent.DECK_LOADED, this.onDeckLoaded, this);
        EventManager.instance.gameEvents.off(GameEvent.ANIMATION_FINISHED, this.onAnimationFinished, this);
    }

    private onDeckLoaded(deck: Deck) {
        // Start the game logic here, e.g., deal initial cards
        console.log('Game started with deck:', deck);
    }

    private getNextPlayerHands(): Player[] {
        for (const [playerID, player] of this.playersThisTurn) {
            if (player.length > 0) {
                this.currentHandIndex = 0;
                console.log("Current player is: " + playerID);
                this.currentPlayerID = playerID;
                EventManager.instance.gameEvents.emit(GameEvent.PLAYER_TURN_CHANGED, playerID, this);
                if (this.currentPlayerID !== this.myPlayerID) {
                    this.startPhaseTimer();
                    EventManager.instance.gameEvents.emit(GameEvent.LOCK_INPUT);
                } else {
                    this.startMyTurn();
                }
                return player;
            }
        }
        // All players have played
        this.changeGameState(GameState.PlayerTurnEnd);
    }

    public initialDeal() {
        this.changeGameState(GameState.InitialDeal);
        EventManager.instance.gameEvents.emit(GameEvent.LOCK_INPUT);
        for (let i = 0; i < 2; i++) {
            this.playerDatas.forEach(playerData => {
                EventManager.instance.gameEvents.emit(GameEvent.PLAYER_TURN_CHANGED, playerData.getID(), this);
                const playerCardData = this.deckManager.dealCard();
                if (playerCardData) {
                    this.playersThisTurn.get(playerData.getID())[this.currentHandIndex].addCard(playerCardData);
                }
                EventManager.instance.gameEvents.emit(GameEvent.DEAL_CARD, this.playersThisTurn.get(playerData.getID())[this.currentHandIndex]);
            });
            
            const dealerCardData = this.deckManager.dealCard();
            
            if (dealerCardData) {
                this.dealer.addCard(dealerCardData);
            }
            EventManager.instance.gameEvents.emit(GameEvent.PLAYER_TURN_CHANGED, this.myPlayerID, this);
            EventManager.instance.gameEvents.emit(GameEvent.DEAL_CARD, this.dealer);
        }
    }
    
    private checkForInsurance() {
        if (this.dealer.hasAceFaceUp()) {
            this.changeGameState(GameState.InsuranceOffer);
            EventManager.instance.gameEvents.emit(GameEvent.OFFER_INSURANCE, (accept: boolean) => {
                this.insuranceResponse(accept);
            });
            this.startPhaseTimer();
        } else {
            this.startGame();
        }
    }

    private insuranceResponse(accept: boolean) {
        // Sending response to insurance offer to server
        
        // For now just wait until the phase timer run out
        // or use the main player's decision
        this.startGame();
    }

    private startGame() {
        this.changeGameState(GameState.PlayerTurn);
        this.currentPlayerHands = this.getNextPlayerHands();
    }

    private startMyTurn() {
        EventManager.instance.gameEvents.emit(GameEvent.GAME_STARTED, this.currentPlayerHands[this.currentHandIndex]);
        // Check for immediate blackjack
        if (this.currentPlayerHands[this.currentHandIndex].hasBlackjack() || this.dealer.hasBlackjack()) {
            this.dealer.revealAll = true;
            this.playerTurnEnd();
        }
    }
    
    private onAnimationFinished() {
        if (this.gameState === GameState.InitialDeal) {
            this.checkForInsurance();
        }

        if (this.gameState === GameState.PlayerTurn) {
            if (this.currentPlayerID == this.myPlayerID) {
                EventManager.instance.gameEvents.emit(GameEvent.UNLOCK_INPUT);
                if (this.currentPlayerHands[this.currentHandIndex].isBusted()) {
                    if ((this.currentHandIndex + 1) == this.currentPlayerHands.length) {
                        this.playerTurnEnd();
                        EventManager.instance.gameEvents.emit(GameEvent.LOCK_INPUT);
                    } else {
                        this.currentHandIndex++;
                        EventManager.instance.gameEvents.emit(GameEvent.CHANGE_HAND, this.currentHandIndex);
                    }
                }
            }
        }

        if (this.gameState === GameState.PlayerTurnEnd) {
            if (this.playersThisTurn.size <= 0) {
                this.dealer.revealAll = true;
                this.dealerPlay();
            }
        }

        if (this.gameState === GameState.DealerTurn) {
            this.endGame();
        }

        if (this.gameState === GameState.DealerTurnEnd) {
            this.determineWinner();
        }

    }

    public playerHit() {
        this.startPhaseTimer();
        EventManager.instance.gameEvents.emit(GameEvent.LOCK_INPUT);
        const cardData = this.deckManager.dealCard();
        if (cardData) {
            this.currentPlayerHands[this.currentHandIndex].addCard(cardData);
            // console.log('Hand ' + this.currentHandIndex + ' count: ' + this.currentPlayerHands[this.currentHandIndex].getHand().length);
            EventManager.instance.gameEvents.emit(GameEvent.DEAL_CARD, this.currentPlayerHands[this.currentHandIndex]);
        }
    }

    public playerStand() {
        EventManager.instance.gameEvents.emit(GameEvent.LOCK_INPUT);
        console.log('Player stands with hand:', this.currentPlayerHands[this.currentHandIndex].getHand());
        if ((this.currentHandIndex + 1) == this.currentPlayerHands.length) {
            this.playerTurnEnd();
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
            this.currentPlayerHands[this.currentHandIndex].addCard(cardData);
            EventManager.instance.gameEvents.emit(GameEvent.DEAL_CARD, this.currentPlayerHands[this.currentHandIndex]);
        }
        this.currentPlayerHands[this.currentHandIndex].doublingDown();

        if ((this.currentHandIndex + 1) == this.currentPlayerHands.length) {
            this.playerTurnEnd();
        } else {
            this.currentHandIndex++;
            EventManager.instance.gameEvents.emit(GameEvent.CHANGE_HAND, this.currentHandIndex);
        }
    }

    public playerSplit() {
        if (!this.currentPlayerHands[this.currentHandIndex].canSplit()) {
            return;
        }
        let currentHand = this.currentPlayerHands[this.currentHandIndex];
        const splitCard = currentHand.splitHand();

        let newHand = new Player(this.currentHandIndex + 1, currentHand.getPlayerID());
        newHand.addCard(splitCard);
        this.currentPlayerHands.push(newHand);
        let playerCardData = this.deckManager.dealCard();
        if (playerCardData) {
            currentHand.addCard(playerCardData);
        }

        playerCardData = this.deckManager.dealCard();
        if (playerCardData) {
            newHand.addCard(playerCardData);
        }
        EventManager.instance.gameEvents.emit(GameEvent.SPLIT_HAND, this.currentPlayerHands);
    }

    public dealerPlay() {
        EventManager.instance.gameEvents.emit(GameEvent.LOCK_INPUT);
        this.changeGameState(GameState.DealerTurn);
        EventManager.instance.gameEvents.emit(GameEvent.PLAYER_TURN_CHANGED, this.myPlayerID, this);
        if (this.areAllPlayersBusted()) {
            console.log('All players\' hands are busted');
            this.determineWinner();
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
        this.changeGameState(GameState.GameEnd);
        const results = [];
        const currentPlayer = this.players.get(this.myPlayerID);
        currentPlayer.forEach(player => {
            const playerValue = player.getHandValue();
            const dealerValue = this.dealer.getHandValue();
        
            let result = GameResult.Draw;
            if (player.hasBlackjack() && this.dealer.hasBlackjack()) {
                // result = 'It\'s a tie with both having Blackjack!';
                result = GameResult.Draw;
            } else if (player.hasBlackjack()) {
                // result = 'Player wins with Blackjack!';
                result = GameResult.WinBlackJack;
                EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.Win, this);
            } else if (this.dealer.hasBlackjack()) {
                // result = 'Dealer wins with Blackjack!';
                result = GameResult.Lose;
                EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.Lose, this);
            } else if (player.isBusted()) {
                // result = 'Dealer wins! Player busted.';
                result = GameResult.Lose;
                EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.Lose, this);
            } else if (this.dealer.isBusted()) {
                // result = 'Player wins! Dealer busted.';
                result = GameResult.Win;
                EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.Win, this);
            } else if (playerValue > dealerValue) {
                // result = 'Player wins!';
                result = GameResult.Win;
                EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.Win, this);
            } else if (dealerValue > playerValue) {
                // result = 'Dealer wins!';
                result = GameResult.Lose;
                EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.Lose, this);
            }
            results.push(result);
        });
        EventManager.instance.gameEvents.emit(GameEvent.UNLOCK_INPUT);
        EventManager.instance.gameEvents.emit(GameEvent.GAME_ENDED, results, currentPlayer, this.dealer);
    }

    private areAllPlayersBusted(): boolean {
        for (const [playerID, hands] of this.players) {
            for (const hand of hands) {
                if (!hand.isBusted()) {
                    return false;
                }
            }
        }
        return true;
    }
    
    private endGame() {
        EventManager.instance.gameEvents.emit(GameEvent.DEALER_TURN_END);
        this.changeGameState(GameState.DealerTurnEnd);
    }

    private resetGame() {
        for (const [playerID, player] of this.players) {
            player.forEach(playerHand => {
                playerHand.resetHand();   
            });
            if (player.length > 1) {
                player.pop();
            }
        }
        this.playersThisTurn = new Map(this.players);

        this.dealer.resetHand();
        this.dealer.revealAll = false;
        EventManager.instance.gameEvents.emit(GameEvent.GAME_RESET);
        this.changeGameState(GameState.BetPhase);
        this.currentHandIndex = 0;
    }
    
    private changeGameState(gameState: GameState) {
        this.gameState = gameState;
        EventManager.instance.gameEvents.emit(GameEvent.GAMESTATE_CHANGED, this.gameState);
        console.log('Current gamestate: ' + this.gameState);
    }

    private startPhaseTimer() {
        this.unscheduleAllCallbacks();
        this.scheduleOnce(() => {
            this.phaseTimeUp();
        }, this.phaseTimer);
        EventManager.instance.gameEvents.emit(GameEvent.START_TIMER, this.phaseTimer);
    }

    private phaseTimeUp() {
        switch (this.gameState) {
            case GameState.BetPhase:
                break;

            case GameState.InitialDeal:    
                break;

            case GameState.InsuranceOffer:
                this.insuranceResponse(false);
                break;

            case GameState.PlayerTurn:
                this.playerTurnEnd();
                break;

            case GameState.GameEnd:
                this.resetGame();
                break;
        }
        EventManager.instance.gameEvents.emit(GameEvent.TIME_UP, this.phaseTimer);
    }

    private playerTurnEnd() {
        EventManager.instance.gameEvents.emit(GameEvent.PLAYER_TURN_ENDED, this.currentPlayerHands);
        if (this.currentPlayerID == this.myPlayerID) {
            EventManager.instance.gameEvents.emit(GameEvent.LOCK_INPUT);
        }
        this.playersThisTurn.delete(this.currentPlayerID);
        this.currentPlayerHands = this.getNextPlayerHands();
        if (this.currentPlayerID == this.myPlayerID) {
            EventManager.instance.gameEvents.emit(GameEvent.UNLOCK_INPUT);
        }
        if (this.playersThisTurn.size <= 0) {
            console.log('All players turn ended');
            this.dealer.revealAll = true;
            this.dealerPlay();
        }
    }
}