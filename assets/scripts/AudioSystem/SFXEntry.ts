import { _decorator, Enum, AudioClip } from 'cc';
const { ccclass, property } = _decorator;

import { SFXID, SFXGroup } from "./SFXEnums";

@ccclass('SFXEntry')
export class SFXEntry {
    @property({ type: Enum(SFXID) })
    id: SFXID = SFXID.ButtonClick;

    @property({ type: AudioClip })
    clip: AudioClip = null!;

    @property({ type: Enum(SFXGroup) })
    group: SFXGroup = SFXGroup.UI;
}