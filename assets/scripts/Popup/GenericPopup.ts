import { _decorator, Component, Node, Label, Prefab, instantiate, Vec3, tween, Enum , view } from 'cc';
const { ccclass, property } = _decorator;

import { PopupButtonData } from './PopupButtonData';
import { PopupAnimationType } from '../enums/PopupAnimationType';

@ccclass('GenericPopup')
export class GenericPopup extends Component {
    private screenSize = view.getVisibleSize();

    private popupPanel: Node;

    @property
    animationDuration: number = 0.75;

    @property({ type: Enum(PopupAnimationType) })
    entryAnimationType: PopupAnimationType = PopupAnimationType.FlyTop;

    @property({ type: Enum(PopupAnimationType) })
    exitAnimationType: PopupAnimationType = PopupAnimationType.FlyTop;

    @property(Vec3)
    onscreenTarget: Vec3 = new Vec3(0, 0, 0);

    @property(Label)
    titleText: Label = null!;

    @property(Label)
    messageText: Label = null!;

    @property(Node)
    buttonContainer: Node = null!;

    @property(Prefab)
    defaultButtonPrefab: Prefab = null!;

    private isShown = false;

    protected start(): void {
        this.popupPanel = this.node;
        this.animateEntry();
    }

    public show(title: string, message: string, buttons: PopupButtonData[]) {
        this.titleText.string = title;
        this.messageText.string = message;

        this.buttonContainer.removeAllChildren();

        for (const btnData of buttons) {
            const prefab = btnData.buttonPrefabOverride || this.defaultButtonPrefab;
            const btnNode = instantiate(prefab);
            this.buttonContainer.addChild(btnNode);

            const label = btnNode.getComponentInChildren(Label);
            if (label) label.string = btnData.label;

            btnNode.on(Node.EventType.TOUCH_END, () => {
                btnData.callback?.();
                this.close();
            });
        }

        this.node.active = true;
        this.animateEntry();
        this.isShown = true;
    }

    public close() {
        this.animateExit(() => {
            this.node.active = false;
        });
        this.isShown = false;
    }

    public shown(): boolean {
        return this.isShown;
    }

    private animateEntry(onComplete?: () => void) {
        switch(this.entryAnimationType) {
            case PopupAnimationType.FlyBottom:
                this.popupPanel.setPosition(new Vec3(0, -this.screenSize.height, 0));
                tween(this.popupPanel)
                    .to(this.animationDuration, { position: this.onscreenTarget })
                    .call(() => onComplete?.())
                    .start();
                
                break;
                
            case PopupAnimationType.FlyTop:
                this.popupPanel.setPosition(new Vec3(0, this.screenSize.height, 0));
                tween(this.popupPanel)
                    .to(this.animationDuration, { position: this.onscreenTarget })
                    .call(() => onComplete?.())
                    .start();
                
                break;
                    
            case PopupAnimationType.FlyLeft:
                this.popupPanel.setPosition(new Vec3(-this.screenSize.width, 0, 0));
                tween(this.popupPanel)
                    .to(this.animationDuration, { position: this.onscreenTarget })
                    .call(() => onComplete?.())
                    .start();

                break;
                        
            case PopupAnimationType.FlyRight:
                this.popupPanel.setPosition(new Vec3(this.screenSize.width, 0, 0));
                tween(this.popupPanel)
                    .to(this.animationDuration, { position: this.onscreenTarget })
                    .call(() => onComplete?.())
                    .start();

                break;
                            
            case PopupAnimationType.Scale:
                this.popupPanel.setScale(new Vec3(0, 0, 1));
                tween(this.popupPanel)
                    .to(this.animationDuration, { scale: new Vec3(1, 1, 1) })
                    .call(() => onComplete?.())
                    .start();
                    
                break;
        }
    }

    private animateExit(onComplete?: () => void) {
        switch(this.exitAnimationType) {
            case PopupAnimationType.FlyBottom:
                this.popupPanel.setPosition(this.onscreenTarget);
                tween(this.popupPanel)
                    .to(this.animationDuration, { position: new Vec3(0, -this.screenSize.height, 0) })
                    .call(() => onComplete?.())
                    .start();

                break;

            case PopupAnimationType.FlyTop:
                this.popupPanel.setPosition(this.onscreenTarget);
                tween(this.popupPanel)
                    .to(this.animationDuration, { position: new Vec3(0, this.screenSize.height, 0) })
                    .call(() => onComplete?.())
                    .start();

                break;

            case PopupAnimationType.FlyLeft:
                this.popupPanel.setPosition(this.onscreenTarget);
                tween(this.popupPanel)
                    .to(this.animationDuration, { position: new Vec3(-this.screenSize.width, 0, 0) })
                    .call(() => onComplete?.())
                    .start();

                break;

            case PopupAnimationType.FlyRight:
                this.popupPanel.setPosition(this.onscreenTarget);
                tween(this.popupPanel)
                    .to(this.animationDuration, { position: new Vec3(this.screenSize.width, 0, 0) })
                    .call(() => onComplete?.())
                    .start();

                break;

            case PopupAnimationType.Scale:
                this.popupPanel.setScale(new Vec3(1, 1, 1));
                tween(this.popupPanel)
                    .to(this.animationDuration, { scale: new Vec3(0, 0, 1) })
                    .call(() => onComplete?.())
                    .start();

                break;
        }
    }
}