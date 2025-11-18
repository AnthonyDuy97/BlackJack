import { _decorator, Button, Component, Node, Prefab, instantiate, Label, Vec2 } from 'cc';
import { EventManager } from './EventManager';
import { GameEvent } from '../enums/GameEvent';

import { ChipEntry } from '../Chip/ChipEntry';
import { ChipButton } from '../Chip/ChipButton';

import { SFXID } from '../AudioSystem/SFXEnums';

import { GenericAnimation } from '../Animation/GenericAnimation';

const { ccclass, property } = _decorator;

const MAX_STACK_COUNT = 5;
const MAX_STACK_PER_TYPE = 4;

@ccclass('BetUIManager')
export class BetUIManager extends Component {
    @property(Button)
    private potResetButton: Button = null!;

    @property(Button)
    private rebetButton: Button = null!;

    @property(Node)
    private bettingArea: Node = null!;

    @property(Node)
    private potArea: Node = null!;

    @property(Prefab)
    private chipButtonPrefab: Prefab = null!;

    @property(Label)
    private totalBet: Label = null!;

    @property(Label)
    private maxBet: Label = null!;

    private chipButtons: ChipButton[] = [];
    private chipStacks: Map<number, number> = new Map(); // key: chip value, value: count
    private chipStackPositions: Map<number, Vec2> = new Map(); // value ¨ position

    start() {
        EventManager.instance.gameEvents.on(GameEvent.CHIP_ENTRY_READY, this.setupChipButtons, this);
        EventManager.instance.gameEvents.on(GameEvent.ADD_CHIP_UI, this.addChip, this);
        EventManager.instance.gameEvents.on(GameEvent.UPDATE_BET_VALUE, this.updateBetValue, this);
        EventManager.instance.gameEvents.on(GameEvent.GAME_STARTED, this.onGameStarted, this);
        EventManager.instance.gameEvents.on(GameEvent.GAME_RESET, this.resetUI, this);

        
        this.resetUI();

        this.rebetButton.interactable = false;
        const original = this.rebetButton.transition;
        this.rebetButton.transition = Button.Transition.COLOR;
        this.rebetButton.transition = original;
    }

    private resetUI() {
        console.log('Resetting ChipUI...');
        this.chipButtons.forEach(chipButton => {
            chipButton.setInteractable(true);
        });
        this.rebetButton.interactable = true;

        this.potArea.removeAllChildren();
        this.resetPot();

        const anim = this.bettingArea.parent.getComponent(GenericAnimation);
        anim.setTargetAsOriginalPos();
        anim.animateEntry();
    }

    protected onDestroy(): void {
        EventManager.instance.gameEvents.off(GameEvent.CHIP_ENTRY_READY, this.setupChipButtons, this);
        EventManager.instance.gameEvents.off(GameEvent.ADD_CHIP_UI, this.addChip, this);
        EventManager.instance.gameEvents.off(GameEvent.UPDATE_BET_VALUE, this.updateBetValue, this);
        EventManager.instance.gameEvents.off(GameEvent.GAME_STARTED, this.onGameStarted, this);
        EventManager.instance.gameEvents.off(GameEvent.GAME_RESET, this.resetUI, this);
    }

    private setupChipButtons(chipEntries: ChipEntry[], maxBet: number) {        
        for (let i = 0; i < chipEntries.length; i++) {
            const entry = chipEntries[i];
            const chipNode = instantiate(this.chipButtonPrefab);
            chipNode.setParent(this.bettingArea);
            
            const chipButton = chipNode.getComponent(ChipButton);
            this.chipButtons.push(chipButton);
            chipButton.setup(entry);
            chipNode.setPosition(0, 0);
        }

        this.maxBet.string = "(Max bet $" + maxBet + ")";
    }

    private addChip(chipEntry: ChipEntry) {
        const baseX = 0;
        const baseY = 0;    
        const offsetX = 60;
        const offsetY = 10;

        // Get current stack count and position
        let stackPositionY = 0;
        if (!this.chipStackPositions.has(chipEntry.value)) {
            this.chipStacks.set(chipEntry.value, 0);
            this.chipStackPositions.set(chipEntry.value, new Vec2(this.chipStackPositions.size, 0));
        }
        
        let stackCount = this.chipStacks.get(chipEntry.value);
        let stackPositionX = this.chipStackPositions.get(chipEntry.value).x;
        stackPositionY = this.chipStackPositions.get(chipEntry.value).y + 1;
        if (stackCount >= MAX_STACK_PER_TYPE * MAX_STACK_COUNT) {
            console.log('Too many chips for one type, stop displaying new chip');
            return;
        }
        if (stackCount % MAX_STACK_COUNT == 0) {
            stackPositionY = stackPositionY - MAX_STACK_COUNT - 4;
        }
            
        const chipNode = instantiate(this.chipButtonPrefab);
        chipNode.setParent(this.potArea);
        const chipButton = chipNode.getComponent(ChipButton);
        chipButton.setup(chipEntry);
        chipButton.setInteractable(false);
        
        chipNode.setPosition(baseX + stackPositionX * offsetX, baseY + stackPositionY * offsetY);
        this.chipStacks.set(chipEntry.value, stackCount + 1);
        this.chipStackPositions.set(chipEntry.value, new Vec2(stackPositionX, stackPositionY));
    }

    private updateBetValue(betValue: number) {
        this.totalBet.string = "Bet: $" + betValue;
        if (betValue <= 0) {
            this.resetPot();
        } else {
            this.potResetButton.interactable = true;
        }
    }

    private resetPot() {
        this.potArea.removeAllChildren();
        this.chipStacks.clear();
        this.chipStackPositions.clear();
        this.potResetButton.interactable = false;

        EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.Chip, this);
    }

    private onGameStarted() {
        const anim = this.bettingArea.parent.getComponent(GenericAnimation);
        anim.animateExit();
    }
}

