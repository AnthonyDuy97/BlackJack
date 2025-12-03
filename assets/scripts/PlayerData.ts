import { _decorator, SpriteFrame } from 'cc';

import { EventManager } from './Managers/EventManager';
import { GameEvent } from './enums/GameEvent';

export class PlayerData {
    private ID: number;
    private money: number;
    private avatar: SpriteFrame;
    private name: string;


    constructor(ID: number, money: number, avatar: SpriteFrame, name: string) {
        this.ID = ID;
        this.money = 0;
        this.avatar = avatar;
        this.name = name;
        this.adjustMoney(money);

        EventManager.instance.gameEvents.on(GameEvent.PAYOUT, this.adjustMoney, this);
        EventManager.instance.gameEvents.on(GameEvent.BET_PLACED, this.adjustMoney, this);
    }
    
    public getID(): number {
        return this.ID;
    }
    
    public getMoney(): number {
        return this.money;
    }

    public getAvatar(): SpriteFrame {
        return this.avatar;
    }

    public getName(): string {
        return this.name;
    }
    
    public adjustMoney(amount: number) {
        this.money += amount;
        EventManager.instance.gameEvents.emit(GameEvent.PLAYER_MONEY_CHANGED, this.getMoney());
    }

    public dispose() {
        EventManager.instance.gameEvents.off(GameEvent.PAYOUT, this.adjustMoney, this);
        EventManager.instance.gameEvents.off(GameEvent.BET_PLACED, this.adjustMoney, this);
    }
}