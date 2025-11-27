import { _decorator, Button, Component, Node, Color, Label } from 'cc';
import { EventManager } from '../EventManager';
import { GameEvent } from '../../enums/GameEvent';

import { GenericAnimation } from '../../Animation/GenericAnimation';

const { ccclass, property } = _decorator;

@ccclass('MoneyUIManager')
export class MoneyUIManager extends Component {

    @property(Label)
    private playerMoney: Label = null!;

    @property(Node)
    private floatingNumber: Node = null!;

    private floatingNumLabel: Label;
    private floatingNumAnim: GenericAnimation;

    @property(Color)
    private minusNumColor: Color = null!;

    @property(Color)
    private plusNumColor: Color = null!;

    start() {
        EventManager.instance.gameEvents.on(GameEvent.PLAYER_MONEY_CHANGED, this.updatePlayerMoney, this);
        EventManager.instance.gameEvents.on(GameEvent.BET_PLACED, this.onMoneyChanged, this);
        EventManager.instance.gameEvents.on(GameEvent.PAYOUT, this.onMoneyChanged, this);

        this.floatingNumber.active = false;
        this.floatingNumLabel = this.floatingNumber.getComponent(Label);
        this.floatingNumAnim = this.floatingNumber.getComponent(GenericAnimation);
    }

    onDestroy() {
        EventManager.instance.gameEvents.off(GameEvent.PLAYER_MONEY_CHANGED, this.updatePlayerMoney, this);
        EventManager.instance.gameEvents.off(GameEvent.BET_PLACED, this.onMoneyChanged, this);
        EventManager.instance.gameEvents.off(GameEvent.PAYOUT, this.onMoneyChanged, this);
    }


    private updatePlayerMoney(currentMoney: number) {
        console.log('Update Player Money: ' + currentMoney);
        this.playerMoney.string = currentMoney.toFixed(2);
    }

    private onMoneyChanged(adjustAmount: number) {
        if (adjustAmount == 0) return;
        let updateStr = "+";
        this.floatingNumLabel.color = this.plusNumColor;
        if (adjustAmount < 0) {
            updateStr = "-";
            this.floatingNumLabel.color = this.minusNumColor;
        }
        updateStr = updateStr + "$" + Math.abs(adjustAmount).toString();
        this.floatingNumLabel.string = updateStr;

        this.floatingNumAnim.animateEntry(() => { 
            setTimeout(() => this.floatingNumAnim.animateExit(), 500);
        });
    }
}