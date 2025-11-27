import { _decorator, Component, Node, Prefab, instantiate, CCInteger, tween, Sprite, SpriteFrame, Layout, UIOpacity } from 'cc';
import { EventManager } from '../EventManager';
import { GameEvent } from '../../enums/GameEvent';
import { Card } from '../../Card';

import { Participant } from '../../Participant';
import { Player } from '../../Player';
import { Dealer } from '../../Dealer';

import { SFXID } from '../../AudioSystem/SFXEnums';

import { GenericAnimation } from '../../Animation/GenericAnimation';

const { ccclass, property } = _decorator;

@ccclass('OpponentHandUIManager')
export class OpponentHandUIManager extends Component {
    private isActive: boolean = false;

    @property(Node)
    private avatarBorder: Node = null!;

    @property(Sprite)
    private avatarSprite: Sprite = null!;

    @property(CCInteger)
    private playerID: number;

    @property(Prefab)
    private cardPrefab: Prefab = null!;

    @property(Node)
    private deckPosition: Node = null!;

    @property(Node)
    private playerCardContainers: Node[] = []!;

    private playerHandCount = 0;
    private isAnimating: boolean = false;

    // Array of functions that return Promise<void>
    private pendingAnimations: Array<() => Promise<void>> = [];

    start() {
        EventManager.instance.gameEvents.on(GameEvent.PLAYER_TURN_CHANGED, this.onPlayerTurnChange, this);
        EventManager.instance.gameEvents.on(GameEvent.PLAYER_TURN_ENDED, this.onPlayerTurnEnd, this);
        EventManager.instance.gameEvents.on(GameEvent.GAME_STARTED, this.onGameStarted, this);
        EventManager.instance.gameEvents.on(GameEvent.GAME_ENDED, this.onGameEnded, this);
        EventManager.instance.gameEvents.on(GameEvent.DEAL_CARD, this.addCardToParticipant, this);
        EventManager.instance.gameEvents.on(GameEvent.SPLIT_HAND, this.animateSplitHand, this);
        EventManager.instance.gameEvents.on(GameEvent.GAME_RESET, this.resetUI, this);

        this.resetUI();
    }

    private setupPlayer(playerID: number, avatar: SpriteFrame) {
        this.playerID = playerID;
        this.avatarSprite.spriteFrame = avatar;
    }

    private onPlayerTurnChange(playerID: number) {
        if (this.playerID === playerID) {
            this.isActive = true;
            this.avatarBorder.active = true;
            console.log(this.node.name + ' is active');
        } else {
            this.isActive = false;
            this.avatarBorder.active = false;
        }
    }

    private onPlayerTurnEnd(hands: Player[]) {
        if (!this.isActive) return;
        hands.forEach(hand => {
            if (hand.isBusted()) {
                this.flipPlayerCards(hand.getIndex());
            }
        });
    }

    private onGameEnded() {
        for (let i = 0; i < this.playerCardContainers.length; i++) {
            this.flipPlayerCards(i);
        }
    }

    async flipPlayerCards(handIndex: number) {
        const playerCardContainer = this.playerCardContainers[handIndex];
        for (const cardNode of playerCardContainer.children) {
            const card = cardNode.getComponent(Card);
            if (card && card.isFaceDown) {
                await card.flipCard();
            }
        }
    }

    private resetUI() {
        console.log('Resetting UI...');
        this.playerCardContainers.forEach(playerCardContainer => {
            playerCardContainer.removeAllChildren();   
        });
        
        this.playerCardContainers[1].parent.active = false;
        this.avatarBorder.active = false;

        this.playerHandCount = 0;
    }

    protected onDestroy(): void {
        EventManager.instance.gameEvents.off(GameEvent.PLAYER_TURN_CHANGED, this.onPlayerTurnChange, this);
        EventManager.instance.gameEvents.off(GameEvent.PLAYER_TURN_ENDED, this.onPlayerTurnEnd, this);
        EventManager.instance.gameEvents.off(GameEvent.GAME_STARTED, this.onGameStarted, this);
        EventManager.instance.gameEvents.off(GameEvent.GAME_ENDED, this.onGameEnded, this);
        EventManager.instance.gameEvents.off(GameEvent.DEAL_CARD, this.addCardToParticipant, this);
        EventManager.instance.gameEvents.off(GameEvent.GAME_RESET, this.resetUI, this);
    }

    private onGameStarted() {
        if (!this.isActive) return;
        this.playerHandCount++;
    }

    private onAllAnimationFinished() {
        this.isAnimating = false;
        if (this.pendingAnimations.length === 0) {
            EventManager.instance.gameEvents.emit(GameEvent.ANIMATION_FINISHED);
        }
    }

    async playAnimation() {
        this.isAnimating = true;
        while (this.pendingAnimations.length > 0) {
            const animFunc = this.pendingAnimations.shift()!;
            await animFunc();
        }
        this.scheduleOnce(this.onAllAnimationFinished, 0.2);
    }
    
    private addCardToParticipant(participant: Participant) {
        if (!this.isActive) return;
        let handArea = null;
        if (participant instanceof Player) {
            const handIndex = participant.getIndex();
            handArea = this.playerCardContainers[handIndex];
        } else if (participant instanceof Dealer) {
            return;
        }
        
        const hand = participant.getHand();
        for (let i = handArea.children.length; i < hand.length; i++) {
            this.pendingAnimations.push(() => this.animateCardToHand(participant, handArea));
            this.unschedule(this.onAllAnimationFinished);
        }
        if (!this.isAnimating) {
            this.playAnimation();
        }
    }

    async animateCardToHand(participant: Participant, handArea: Node): Promise<void> {
        EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.CardDeal);

        const hand = participant.getHand();
        const displayedCardCount = handArea.children.length;
        if (displayedCardCount >= hand.length) {
            return;
        }
        const latestCardData = {...hand[displayedCardCount]};   // Using clone to avoid unnecessary reference

        // Get or create visual card node
        const cardNode = instantiate(this.cardPrefab);
        
        let card = cardNode.addComponent(Card);
        card.init(latestCardData);
        // Hide the card until it's ready for animating to avoid flickering
        const uiOpacity = cardNode.addComponent(UIOpacity);
        uiOpacity.opacity = 0;
                
        const ghostNode = instantiate(this.cardPrefab);
        this.deckPosition.addChild(ghostNode);
        let ghostCard = ghostNode.addComponent(Card);
        ghostCard.init(latestCardData);
        
        // Add to scene
        let scoreLabel;
        if (participant instanceof Player) {
            latestCardData.isFaceDown = true;
        }
        handArea.addChild(cardNode);
        const layout = handArea.getComponent(Layout);
        if (layout) {
            layout.updateLayout();
        }
        const targetPos = cardNode.worldPosition.clone();

        // Position at deck first
        ghostNode.setWorldPosition(this.deckPosition.getWorldPosition());
        
        // Animate to hand position
        await new Promise<void>((resolve) => {
            tween(ghostNode)
            .to(0.5, { worldPosition: targetPos })
            .call(async () => {
                ghostNode.destroy();
                uiOpacity.opacity = 255;
                if (!latestCardData.isFaceDown) {
                    await card.flipCard();
                    scoreLabel.string = 'Hand Value: ' + participant.getHandValue();
                }
            })
            .call(resolve)
            .start();
        });
    }
    
    async animateSplitHand(playerHands: Player[]) {
        if (!this.isActive) return;

        EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.CardDeal);
        const originHandArea = this.playerCardContainers[0];
        const targetHandArea = this.playerCardContainers[1];
        targetHandArea.parent.active = true;
        
        const targetCard = originHandArea.children[1];
        targetCard.removeFromParent();
        targetHandArea.addChild(targetCard);

        this.playerHandCount++;

        playerHands.forEach(playerHand => {
            this.addCardToParticipant(playerHand);
        });
    }
}