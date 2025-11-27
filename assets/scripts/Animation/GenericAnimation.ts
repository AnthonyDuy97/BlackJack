import { _decorator, Component, Vec3, tween, Enum , view, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

import { AnimationType } from '../enums/AnimationType';

@ccclass('GenericAnimation')
export class GenericAnimation extends Component {
    private screenSize = view.getVisibleSize();

    @property
    animationDuration: number = 1.25;

    @property({ type: Enum(AnimationType) })
    entryAnimationType: AnimationType = AnimationType.FlyTop;

    @property({ type: Enum(AnimationType) })
    exitAnimationType: AnimationType = AnimationType.FlyTop;

    @property(Vec3)
    onscreenTarget: Vec3 = new Vec3(0, 0, 0);

    @property({
        visible() { return (this.entryAnimationType === AnimationType.Fade || this.exitAnimationType === AnimationType.Fade) }
    })
    initialOpacity: number = 255;

    private originalPos: Vec3 = null!;

    private looping = false;

    private isShown = false;

    protected onLoad(): void {
        this.originalPos = this.node.position.clone();

        if (!this.node.getComponent(UIOpacity)) {
           this.node.addComponent(UIOpacity);
        }
    }

    public animateEntry(onComplete?: () => void) {
        this.node.active = true;
        switch(this.entryAnimationType) {
            case AnimationType.FlyBottom:
                this.node.setPosition(new Vec3(0, -this.screenSize.height, 0));
                tween(this.node)
                    .to(this.animationDuration, { position: this.onscreenTarget }, { easing: 'backOut' })
                    .call(() => onComplete?.())
                    .start();
                
                break;
                
            case AnimationType.FlyTop:
                this.node.setPosition(new Vec3(0, this.screenSize.height, 0));
                tween(this.node)
                    .to(this.animationDuration, { position: this.onscreenTarget }, { easing: 'backOut' })
                    .call(() => onComplete?.())
                    .start();
                
                break;
                    
            case AnimationType.FlyLeft:
                this.node.setPosition(new Vec3(-this.screenSize.width, 0, 0));
                tween(this.node)
                    .to(this.animationDuration, { position: this.onscreenTarget }, { easing: 'backOut' })
                    .call(() => onComplete?.())
                    .start();

                break;
                        
            case AnimationType.FlyRight:
                this.node.setPosition(new Vec3(this.screenSize.width, 0, 0));
                tween(this.node)
                    .to(this.animationDuration, { position: this.onscreenTarget }, { easing: 'backOut' })
                    .call(() => onComplete?.())
                    .start();

                break;
                            
            case AnimationType.Scale:
                this.node.setScale(new Vec3(0, 0, 1));
                tween(this.node)
                    .to(this.animationDuration, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                    .call(() => onComplete?.())
                    .start();
                    
                break;

            case AnimationType.Fade:
                const uiOpacity = this.node.getComponent(UIOpacity);
                uiOpacity.opacity = 0;
                tween(uiOpacity)
                    .to(this.animationDuration, { opacity: this.initialOpacity }, { easing: 'backOut' })
                    .call(() => onComplete?.())
                    .start();

                break;
        }
        this.isShown = true;
    }

    public animateExit(onComplete?: () => void) {
        switch(this.exitAnimationType) {
            case AnimationType.FlyBottom:
                this.node.setPosition(this.onscreenTarget);
                tween(this.node)
                    .to(this.animationDuration, { position: new Vec3(0, -this.screenSize.height, 0) }, { easing: 'backIn' })
                    .call(() => {
                        onComplete?.();
                        if (!this.looping) {
                            this.node.active = false;
                        }
                    })
                    .start();

                break;

            case AnimationType.FlyTop:
                this.node.setPosition(this.onscreenTarget);
                tween(this.node)
                    .to(this.animationDuration, { position: new Vec3(0, this.screenSize.height, 0) }, { easing: 'backIn' })
                    .call(() => {
                        onComplete?.();
                        if (!this.looping) {
                            this.node.active = false;
                        }
                    })
                    .start();

                break;

            case AnimationType.FlyLeft:
                this.node.setPosition(this.onscreenTarget);
                tween(this.node)
                    .to(this.animationDuration, { position: new Vec3(-this.screenSize.width, 0, 0) }, { easing: 'backIn' })
                    .call(() => {
                        onComplete?.();
                        if (!this.looping) {
                            this.node.active = false;
                        }
                    })
                    .start();

                break;

            case AnimationType.FlyRight:
                this.node.setPosition(this.onscreenTarget);
                tween(this.node)
                    .to(this.animationDuration, { position: new Vec3(this.screenSize.width, 0, 0) }, { easing: 'backIn' })
                    .call(() => {
                        onComplete?.();
                        if (!this.looping) {
                            this.node.active = false;
                        }
                    })
                    .start();

                break;

            case AnimationType.Scale:
                this.node.setScale(new Vec3(1, 1, 1));
                tween(this.node)
                    .to(this.animationDuration, { scale: new Vec3(0, 0, 1) }, { easing: 'backIn' })
                    .call(() => {
                        onComplete?.();
                        if (!this.looping) {
                            this.node.active = false;
                        }
                    })
                    .start();

                break;

            case AnimationType.Fade:
                const uiOpacity = this.node.getComponent(UIOpacity);
                uiOpacity.opacity = this.initialOpacity;
                tween(uiOpacity)
                    .to(this.animationDuration, { opacity: 0 }, { easing: 'backIn' })
                    .call(() => {
                        onComplete?.();
                        if (!this.looping) {
                            this.node.active = false;
                        }
                    })
                    .start();
        }
        this.isShown = false;
    }

    public loopAnimation() {
        this.looping = true;
        const runCycle = () => {
            if (!this.looping) return;
            this.animateEntry(() => {
                this.animateExit(() => {
                    runCycle(); // restart cycle
                });
            });
        };
        runCycle();
    }

    public stopLoop() {
        this.looping = false;
        this.node.active = false;
    }

    public setEntryAnimation(animationType: AnimationType) {
        this.entryAnimationType = animationType;
    }

    public setExitAnimation(animationType: AnimationType) {
        this.exitAnimationType = animationType;
    }

    public setOnscreenTarget(target: Vec3) {
        this.onscreenTarget = target.clone();
    }

    public setTargetAsOriginalPos() {
        this.onscreenTarget = this.originalPos.clone();
    }

    public setInitialOpacity(opacity: number) {
        this.initialOpacity = opacity;
    }
}