import { _decorator, Component, AudioSource, AudioClip, Node, Prefab, instantiate } from 'cc';
const { ccclass, property } = _decorator;

import { SFXID, SFXGroup } from "./SFXEnums";
import { SFXEntry } from "./SFXEntry";

@ccclass('SFXManager')
export class SFXManager extends Component {
    @property({ type: Prefab })
    sfxAudioSourcePrefab: Prefab = null!;

    @property({ type: [SFXEntry] })
    sfxEntries: SFXEntry[] = [];

    private sfxMap: Map<SFXID, AudioSource> = new Map();
    private groupMap: Map<SFXGroup, AudioSource[]> = new Map();
    private groupVolumes: Map<SFXGroup, number> = new Map();

    onLoad() {
        for (const entry of this.sfxEntries) {
            const node = instantiate(this.sfxAudioSourcePrefab);
            node.setParent(this.node);
            node.active = false;
    
            const audio = node.getComponent(AudioSource)!;
            audio.clip = entry.clip;
    
            this.sfxMap.set(entry.id, audio);
    
            if (!this.groupMap.has(entry.group)) {
              this.groupMap.set(entry.group, []);
            }
            this.groupMap.get(entry.group)!.push(audio);

            if (!this.groupVolumes.has(entry.group)) {
              this.groupVolumes.set(entry.group, 1.0);
            }
        }
    }

    public playSFXByID(id: SFXID) {
        const audio = this.sfxMap.get(id);
        const entry = this.sfxEntries.find(e => e.id === id);
        if (!audio || !entry) return;

        const volume = this.groupVolumes.get(entry.group) ?? 1.0;
        if (audio) {
            audio.playOneShot(audio.clip, volume);
        } else {
            console.warn(`[SFXManager] Clip not found: ${id}`);
        }
    }

    public setGroupVolume(group: SFXGroup, volume: number) {
        this.groupVolumes.set(group, volume);
    }

    public muteGroup(group: SFXGroup) {
        this.setGroupVolume(group, 0);
    }
}