import { _decorator, Enum, AudioClip } from 'cc';
const { ccclass, property } = _decorator;

import { BGMID } from "./BGMID";

@ccclass('BGMEntry')
export class BGMEntry {
    @property({ type: Enum(BGMID) })
    id: BGMID = BGMID.MainMenu;

    @property({ type: AudioClip })
    clip: AudioClip = null!;
}