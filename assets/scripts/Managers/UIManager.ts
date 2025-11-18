import { _decorator, Button, Component, Node, Sprite, Label } from 'cc';
import { EventManager } from './EventManager';
import { GameEvent } from '../enums/GameEvent';

import { Player } from '../Player';

import { GameState } from '../enums/GameState';
import { GameStateEntry } from '../GameStateEntry';

import { SFXID } from '../AudioSystem/SFXEnums';

import { GenericPopup } from '../Popup/GenericPopup';
import { PopupButtonData } from '../Popup/PopupButtonData';
import { PopupPage } from '../Popup/PopupPage';

import { AnimationType } from '../enums/AnimationType';

const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
    @property(Sprite)
    private stateSprite: Sprite = null!;

    @property({ type: GameStateEntry})
    private gameStateEntries: GameStateEntry[] = []!;

    @property(Button)
    private dealButton: Button = null!;

    @property(Button)
    private hitButton: Button = null!;

    @property(Button)
    private standButton: Button = null!;

    @property(Button)
    private doubleButton: Button = null!;

    @property(Button)
    private resetButton: Button = null!;

    @property(Button)
    private splitButton: Button = null!;

    @property(GenericPopup)
    private popup: GenericPopup = null!;

    private playerHandCount = 0;

    start() {
        EventManager.instance.gameEvents.on(GameEvent.ADD_CHIP_UI, this.onChipAdd, this);
        EventManager.instance.gameEvents.on(GameEvent.GAME_STARTED, this.onGameStarted, this);
        EventManager.instance.gameEvents.on(GameEvent.OFFER_INSURANCE, this.showInsurancePopup, this);
        EventManager.instance.gameEvents.on(GameEvent.SPLIT_HAND, this.disableSplitButton, this);
        EventManager.instance.gameEvents.on(GameEvent.GAME_ENDED, this.displayResult, this);
        EventManager.instance.gameEvents.on(GameEvent.GAMESTATE_CHANGED, this.displayGameState, this);
        EventManager.instance.gameEvents.on(GameEvent.GAME_RESET, this.resetUI, this);
        EventManager.instance.gameEvents.on(GameEvent.LOCK_INPUT, this.lockInput, this);
        EventManager.instance.gameEvents.on(GameEvent.UNLOCK_INPUT, this.unlockInput, this);

        this.attachPlaySFXToButton(this.node.parent);
        this.resetUI();
    }

    private resetUI() {
        console.log('Resetting UI...');
        this.dealButton.interactable = false;
        this.dealButton.node.active = true;
        this.hitButton.node.active = false;
        this.standButton.node.active = false;
        this.doubleButton.node.active = false;
        this.stateSprite.node.active = false;
        this.resetButton.node.active = false;
        this.splitButton.node.active = false;
        this.playerHandCount = 0;
    }

    protected onDestroy(): void {
        EventManager.instance.gameEvents.off(GameEvent.ADD_CHIP_UI, this.onChipAdd, this);
        EventManager.instance.gameEvents.off(GameEvent.SPLIT_HAND, this.disableSplitButton, this);
        EventManager.instance.gameEvents.off(GameEvent.GAME_STARTED, this.onGameStarted, this);
        EventManager.instance.gameEvents.off(GameEvent.OFFER_INSURANCE, this.showInsurancePopup, this);
        EventManager.instance.gameEvents.off(GameEvent.GAME_ENDED, this.displayResult, this);
        EventManager.instance.gameEvents.off(GameEvent.GAME_RESET, this.resetUI, this);
        EventManager.instance.gameEvents.off(GameEvent.GAMESTATE_CHANGED, this.displayGameState, this);
        EventManager.instance.gameEvents.off(GameEvent.LOCK_INPUT, this.lockInput, this);
        EventManager.instance.gameEvents.off(GameEvent.UNLOCK_INPUT, this.unlockInput, this);
    }

    private onChipAdd() {
        this.dealButton.interactable = true;
    }

    private async onGameStarted(player: Player) {
        this.dealButton.node.active = false;
        this.hitButton.node.active = true;
        this.standButton.node.active = true;
        this.doubleButton.node.active = true;
        this.splitButton.node.active = true;

        if (player.canSplit()) {
            this.splitButton.interactable = true;
        } else {
            this.splitButton.interactable = false;
            const original = this.splitButton.transition;
            this.splitButton.transition = Button.Transition.COLOR;
            this.splitButton.transition = original;
        }
        this.playerHandCount++;
    }

    private displayResult() {
        this.hitButton.node.active = false;
        this.standButton.node.active = false;
        this.resetButton.node.active = true;
        this.doubleButton.node.active = false;
        this.splitButton.node.active = false;
    }

    private displayGameState(state: GameState) {
        const entry = this.gameStateEntries.find(e => e.gameState === state);
        if (entry) {
            this.stateSprite.node.active = true;
            this.stateSprite.spriteFrame = entry.spriteFrame;
        } else {
            this.stateSprite.node.active = false;
        }
    }

    private attachPlaySFXToButton(root: Node) {
        const buttons = root.getComponentsInChildren(Button);
        for (const button of buttons) {
            button.node.on(Button.EventType.CLICK, this.playButtonSFX, this);
        }
    }

    private playButtonSFX() {
        EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.ButtonClick);
    }

    public disableSplitButton() {
        // Only for disabling the splitButton after clicking it once
        this.splitButton.interactable = false;
    }

    private showInsurancePopup() {
        let insurancePopupBtns = [];
        insurancePopupBtns.push(new PopupButtonData('Yes', this.useInsurance));
        insurancePopupBtns.push(new PopupButtonData('No'));
        this.popup.show('Insurance', 'Do you want to use Insurance?', insurancePopupBtns);
    }

    private useInsurance() {
        //Emit insurance event here
    }

    private lockInput() {
        this.dealButton.interactable = false;
        this.hitButton.interactable = false;
        this.standButton.interactable = false;
        this.doubleButton.interactable = false;
        this.resetButton.interactable = false;
        this.splitButton.interactable = false;
    }

    private unlockInput() {
        this.dealButton.interactable = true;
        this.hitButton.interactable = true;
        this.standButton.interactable = true;
        this.doubleButton.interactable = true;
        this.resetButton.interactable = true;
    }

    public displayRule() {
        let rulePopupBtns = [];
        rulePopupBtns.push(new PopupButtonData('Close'));

        let popupPages = [];
        popupPages.push(new PopupPage(0, 'Popup Page 1 Testing testing testing testing.  testinv v v.  testintestingvtesting'));
        popupPages.push(new PopupPage(1, 'Popup Page 2 testing testing testing testing testing testing'));
        popupPages.push(new PopupPage(2, 'Popup Page 3.  testintesting. testing testing testing.  testintesting testing testing testing \n testing v testing testing testing'));
        // Fade for the popup mask, FlyTop for the popup
        let entryAnims = [AnimationType.Fade, AnimationType.FlyTop];
        let exitAnims = [AnimationType.Fade, AnimationType.FlyTop];
        this.popup.show('Rules', popupPages, rulePopupBtns, entryAnims, exitAnims);
    }

    public toggleSFX() {
        EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.ButtonClick);
    }
}

