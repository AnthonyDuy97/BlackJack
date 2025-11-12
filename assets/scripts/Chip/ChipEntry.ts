import { _decorator, SpriteFrame, CCFloat } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ChipEntry')
export class ChipEntry {
    @property({ type: SpriteFrame })
    sprite: SpriteFrame = null!;

    @property({ type: CCFloat })
    value: number = 0;

    @property
    text: string = '';
}