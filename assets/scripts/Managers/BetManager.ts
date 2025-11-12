import { _decorator, Component, CCInteger } from 'cc';
const { ccclass, property } = _decorator;
import { ChipEntry } from '../Chip/ChipEntry';
import { EventManager } from './EventManager';
import { GameEvent } from '../enums/GameEvent';

import { SFXID } from '../AudioSystem/SFXEnums';

@ccclass('BetManager')
export class BetManager extends Component {
    @property({ type: [ChipEntry] })
    private chips: ChipEntry[] = [];

    @property({type: CCInteger})
    private maxBet: number = 500;

    private selectedChips: ChipEntry[] = [];
    private currentBet: number = 0;

    start() {
        EventManager.instance.gameEvents.on(GameEvent.CHIP_SELECTED, this.addChip, this);
        EventManager.instance.gameEvents.on(GameEvent.GAME_RESET, this.clearBet, this);
        EventManager.instance.gameEvents.emit(GameEvent.CHIP_ENTRY_READY, this.chips, this);
    }

    onDestroy() {
        EventManager.instance.gameEvents.off(GameEvent.CHIP_SELECTED, this.addChip, this);
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

    public getTotalBet(): number {
        return this.currentBet;
    }

    public getSelectedChips(): ChipEntry[] {
        return [...this.selectedChips];
    }

}

