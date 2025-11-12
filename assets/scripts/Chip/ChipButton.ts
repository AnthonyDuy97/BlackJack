import { _decorator, Component, Button, Sprite, Label } from 'cc';
const { ccclass, property } = _decorator;
import { ChipEntry } from './ChipEntry';
import { EventManager } from '../Managers/EventManager';
import { GameEvent } from '../enums/GameEvent';

@ccclass('ChipButton')
export class ChipButton extends Component {
    private chipEntry: ChipEntry;

    private isInteractable: boolean = true;

    public setup(entry: ChipEntry) {
        this.chipEntry = entry;
        this.node.getComponent(Sprite).spriteFrame = this.chipEntry.sprite;
        this.node.getComponentInChildren(Label).string = this.chipEntry.text;
        this.node.on(Button.EventType.CLICK,    () => {
            if (this.isInteractable == true) {
                EventManager.instance.gameEvents.emit(GameEvent.CHIP_SELECTED, this.chipEntry);
            }
        }, this);
    }

    public setInteractable(flag: boolean) {
        this.isInteractable = flag;
    }
}