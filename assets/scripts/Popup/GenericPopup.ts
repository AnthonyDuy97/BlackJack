import { _decorator, Component, Node, Label, Prefab, instantiate, Vec3, Button } from 'cc';
const { ccclass, property } = _decorator;
import { EventManager } from '../Managers/EventManager';
import { GameEvent } from '../enums/GameEvent';

import { PopupButtonData } from './PopupButtonData';
import { PopupPage } from './PopupPage';
import { GenericAnimation } from '../Animation/GenericAnimation';
import { AnimationType } from '../enums/AnimationType';
import { SFXID } from '../AudioSystem/SFXEnums';

@ccclass('GenericPopup')
export class GenericPopup extends Component {
    private anims: GenericAnimation[] = []!;

    @property(Label)
    titleText: Label = null!;

    @property(Label)
    messageText: Label = null!;

    @property(Node)
    buttonContainer: Node = null!;

    @property(Prefab)
    defaultButtonPrefab: Prefab = null!;

    private isShown = false;

    private currentPageIndex = 0;
    
    @property(Button)
    private nextPageBtn: Button = null!;

    @property(Button)
    private prevPageBtn: Button = null!;

    private popupPages: string[] = [];

    onLoad(): void {
        if (this.anims.length == 0) {
            this.getGenericAnimation(this.node);
        }
    }
    
    public async show(title: string, content: PopupPage[] | string, buttons: PopupButtonData[], entryAnimations?: AnimationType[] | null, exitAnimations?: AnimationType[] | null) {
        this.node.active = true;
        if (this.anims.length == 0) {
            this.getGenericAnimation(this.node);
        }
        this.nextPageBtn.node.active = false;
        this.prevPageBtn.node.active = false;

        this.titleText.string = title;
        this.popupPages = [];
        if (typeof content === 'string') {
            this.messageText.string = content;
        } else if (Array.isArray(content) && content.every(p => p instanceof PopupPage)) {
            this.currentPageIndex = 0;
            content.forEach(page => {
                this.popupPages[page.pageNumber] = page.content;
            });

            this.messageText.string = this.popupPages[this.currentPageIndex];
            
            if (this.popupPages.length > 1) {
                this.nextPageBtn.node.active = true;
                this.prevPageBtn.node.active = true;
            
                this.nextPageBtn.interactable = true;
                this.prevPageBtn.interactable = false;
            }
        }

        if (entryAnimations.length > 0) {
            for (let i = 0; i < this.anims.length; i++) {
                this.anims[i].setEntryAnimation(entryAnimations[i]);
            }
        }

        if (exitAnimations.length > 0) {
            for (let i = 0; i < this.anims.length; i++) {
                this.anims[i].setExitAnimation(exitAnimations[i]);
            }
        }

        this.buttonContainer.removeAllChildren();

        for (const btnData of buttons) {
            this.addButton(btnData);
        }

        this.anims.forEach( anim => {
            anim.animateEntry();
        });
        this.isShown = true;
    }

    public setPopupScale(scale: Vec3) {
        this.node.scale = scale;
    }

    public close() {
        this.anims.forEach( anim => {
            anim.animateExit(() => {this.node.active = false;});
        });
        this.isShown = false;
    }

    private getGenericAnimation(root: Node) {
        const anim = root.getComponent(GenericAnimation);
        if (anim) {
            this.anims.push(anim);
        }
        
        // Recursively check deeper children
        for (const child of root.children) {
            this.getGenericAnimation(child);
        }
    }

    public shown(): boolean {
        return this.isShown;
    }

    private nextPage() {
        this.currentPageIndex++;
        this.messageText.string = this.popupPages[this.currentPageIndex];

        this.prevPageBtn.interactable = false;
        this.nextPageBtn.interactable = false;
        if ((this.currentPageIndex + 1) < this.popupPages.length) {
            this.nextPageBtn.interactable = true;
        }
        if (this.currentPageIndex > 0) {
            this.prevPageBtn.interactable = true;
        }

        EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.ButtonClick);
    }

    private prevPage() {
        this.currentPageIndex--;
        this.messageText.string = this.popupPages[this.currentPageIndex];

        this.prevPageBtn.interactable = false;
        this.nextPageBtn.interactable = false;
        if (this.currentPageIndex > 0) {
            this.prevPageBtn.interactable = true;
        }
        if (this.popupPages.length > 1 && this.currentPageIndex < this.popupPages.length) {
            this.nextPageBtn.interactable = true;
        }
        
        EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.ButtonClick);
    }

    private addButton(btnData: PopupButtonData, index?: number): Node {
        const prefab = btnData.buttonPrefabOverride || this.defaultButtonPrefab;
        const btnNode = instantiate(prefab);
        if (index !== null) {
            this.buttonContainer.insertChild(btnNode, index);
        } else {
            this.buttonContainer.addChild(btnNode);
        }

        const label = btnNode.getComponentInChildren(Label);
        if (label) label.string = btnData.label;

        btnNode.on(Node.EventType.TOUCH_END, () => {
            btnData.callback?.();
            EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.ButtonClick);
            this.anims.forEach( anim => {
                anim.animateExit();
            });
        });

        return btnNode;
    }
}