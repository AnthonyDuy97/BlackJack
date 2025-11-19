import { _decorator, Component, CCInteger } from 'cc';
const { ccclass, property } = _decorator;
import { ChipEntry } from '../Chip/ChipEntry';
import { EventManager } from './EventManager';
import { GameEvent } from '../enums/GameEvent';
import { GameResult } from '../enums/GameResult';
import { Player } from '../Player';

import { SFXID } from '../AudioSystem/SFXEnums';

@ccclass('BetManager')
export class BetManager extends Component {
    @property({ type: [ChipEntry] })
    private chips: ChipEntry[] = [];

    @property({type: CCInteger})
    private maxBet: number = 500;

    private selectedChips: ChipEntry[] = [];
    private currentBet: number = 0;
    private previousBet: ChipEntry[] = [];

    start() {
        EventManager.instance.gameEvents.on(GameEvent.CHIP_SELECTED, this.addChip, this);
        EventManager.instance.gameEvents.on(GameEvent.GAME_STARTED, this.placeBet, this);
        EventManager.instance.gameEvents.on(GameEvent.SPLIT_HAND, this.placeBet, this);
        EventManager.instance.gameEvents.on(GameEvent.GAME_RESET, this.clearBet, this);
        EventManager.instance.gameEvents.on(GameEvent.GAME_ENDED, this.onGameEnded, this);

        EventManager.instance.gameEvents.emit(GameEvent.CHIP_ENTRY_READY, this.chips, this.maxBet, this);
    }

    onDestroy() {
        EventManager.instance.gameEvents.off(GameEvent.CHIP_SELECTED, this.addChip, this);
        EventManager.instance.gameEvents.off(GameEvent.GAME_STARTED, this.placeBet, this);
        EventManager.instance.gameEvents.off(GameEvent.SPLIT_HAND, this.placeBet, this);
        EventManager.instance.gameEvents.off(GameEvent.GAME_RESET, this.clearBet, this);
        EventManager.instance.gameEvents.off(GameEvent.GAME_ENDED, this.onGameEnded, this);
    }

    public addChip(chip: ChipEntry) {
        if (this.currentBet + chip.value > this.maxBet) {
            console.warn("Max bet reached");
            return;
        }

        this.selectedChips.push(chip);
        this.currentBet += Number(chip.value);
        this.currentBet = Math.round(this.currentBet * 100) / 100;
        console.log('Current bet: ' + this.currentBet);
        EventManager.instance.gameEvents.emit(GameEvent.ADD_CHIP_UI, chip, this);
        EventManager.instance.gameEvents.emit(GameEvent.UPDATE_BET_VALUE, this.currentBet, this);
        EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.Chip, this);
    }

    public clearBet() {
        this.selectedChips = [];
        this.currentBet = 0;
        EventManager.instance.gameEvents.emit(GameEvent.UPDATE_BET_VALUE, this.currentBet, this);
    }

    private placeBet() {
        console.log('Bet placed');
        EventManager.instance.gameEvents.emit(GameEvent.BET_PLACED, -this.currentBet, this);
    }

    private onGameEnded(gameResults: GameResult[], hands: Player[]) {
        this.previousBet = this.getSelectedChips();
        let totalPayout = 0;
        hands.forEach(hand => {
            const result = gameResults[hand.getIndex()];
            let multiplier = 1;
            switch (result) {
                case GameResult.Draw:
                    multiplier += 0;
                    break;
                
                case GameResult.WinBlackJack:
                    multiplier += 1.5;
                    break;
                                
                case GameResult.Win:
                    multiplier += 1;
                    break;

                case GameResult.Lose:
                    multiplier += -1;
                    break;
            }
            if (hand.isDoublingDown()) {
                multiplier *= 2;
            }
            totalPayout += this.currentBet * multiplier;
        });
        EventManager.instance.gameEvents.emit(GameEvent.PAYOUT, totalPayout, this);
        EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.CoinDrop, this);
    }

    public reBet() {
        this.clearBet();
        if (this.previousBet.length > 0) {
            this.previousBet.forEach(chip => {
                this.addChip(chip);
            });
        }
    }

    public getTotalBet(): number {
        return this.currentBet;
    }

    public getSelectedChips(): ChipEntry[] {
        return [...this.selectedChips];
    }

}

