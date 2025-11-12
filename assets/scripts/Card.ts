import { _decorator, Component, Sprite, Label, SpriteFrame, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
import { CardData } from './CardData';
import { CardAsset } from './CardAsset';

import { EventManager } from './Managers/EventManager';
import { GameEvent } from './enums/GameEvent';
import { SFXID } from './AudioSystem/SFXEnums';

@ccclass('Card')
export class Card extends Component {
    cardSprite: Sprite = null;

    rankLabel: Label = null;

    suitLabel: Label = null;

    // Optional: store card data for reference
    private suit: string = '';
    private rank: string = '';
    private values: number[] = [];

    public isFaceDown = true;

    private cardData: CardData | null = null;

    protected onLoad(): void {
        this.cardSprite = this.node.getComponent(Sprite);
    }

    public init(cardData: CardData) {
        this.suit = cardData.suit;
        this.rank = cardData.rank;
        this.values = cardData.values;

        if (!this.cardSprite) {
            this.cardSprite = this.node.getComponent(Sprite);
        }
        this.cardSprite.spriteFrame = CardAsset.backSpriteFrame;

        this.node.name = `${cardData.rank}_of_${cardData.suit}`;
        this.cardData = cardData;
    }

    public getValues(): number[] {
        return this.values;
    }

    public getName(): string {
        return `${this.rank} of ${this.suit}`;
    }

    public async flipCard() {
        // Flip from front to back
        const cardScale = this.node.scale.clone();
        console.log('Flipping card:', this.getName(), 'Is face down:', this.cardData.isFaceDown);
        EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.CardFlip, this);
        await new Promise<void>((resolve) => {
            tween(this.node)
                .to(0.2, { scale: new Vec3(0, cardScale.y, cardScale.z) }) // Shrink to edge
                .call(() => {
                    // Swap sprite/frame here
                    if (this.isFaceDown) {
                        this.cardSprite.spriteFrame = this.cardData.spriteFrame;
                    } else {
                        this.cardSprite.spriteFrame = CardAsset.backSpriteFrame;
                    }
                })
                .to(0.2, { scale: cardScale}) // Expand back out
                .call(() => {
                    this.isFaceDown = !this.isFaceDown;
                    console.log('Card flipped:', this.getName(), 'Is face down now:', this.isFaceDown);
                })
                .call(resolve)
                .start();
        });
    }
}