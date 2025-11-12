import { _decorator, Component, AudioSource, AudioClip, instantiate } from 'cc';
const { ccclass, property } = _decorator;

import { BGMID } from "./BGMID";
import { BGMEntry } from "./BGMEntry";

@ccclass('BGMManager')
export class BGMManager extends Component {
    @property(AudioSource)
    private bgmSource;

    @property({ type: [BGMEntry] })
    bgmEntries: BGMEntry[] = [];

    private bgmMap: Map<BGMID, AudioClip> = new Map();

    onLoad() {
        for (const entry of this.bgmEntries) {
            this.bgmMap.set(entry.id, entry.clip);
        }
    }
    
    public playBGM(id: BGMID, loop = true) {
        const clip = this.bgmMap.get(id);
        if (!clip) return;

        this.bgmSource.stop();
        this.bgmSource.clip = clip;
        this.bgmSource.loop = loop;
        this.bgmSource.play();
    }
}
