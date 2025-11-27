import { _decorator, Component, Node, Prefab, instantiate, Label, CCInteger, tween, Sprite, Layout, UIOpacity } from 'cc';
import { EventManager } from '../EventManager';
import { GameEvent } from '../../enums/GameEvent';
import { Card } from '../../Card';

import { Participant } from '../../Participant';
import { Player } from '../../Player';
import { Dealer } from '../../Dealer';

import { SFXID } from '../../AudioSystem/SFXEnums';

import { GameResult } from '../../enums/GameResult';
import { GameResultEntry } from '../../GameResultEntry';

const { ccclass, property } = _decorator;

@ccclass('HandUIManager')
export class HandUIManager extends Component {
    private isActive: boolean = false;

    @property(CCInteger)
    private playerID: number;

    @property({ type: GameResultEntry})
    private resultEntries: GameResultEntry[] = []!;

    @property(Prefab)
    private cardPrefab: Prefab = null!;

    @property(Node)
    private deckPosition: Node = null!;

    @property(Node)
    private playerCardContainers: Node[] = []!;

    @property(Label)
    private playerScoreLabels: Label[] = []!;

    @property(Node)
    private handIndicators: Node[] = []!;

    @property(Sprite)
    private resultSprites: Sprite[] = []!;

    @property(Label)
    private dealerScoreLabel: Label = null!;

    @property(Node)
    private dealerCardContainer: Node = null!;

    private playerHandCount = 0;
    private isAnimating: boolean = false;

    // Array of functions that return Promise<void>
    private pendingAnimations: Array<() => Promise<void>> = [];

    start() {
        EventManager.instance.gameEvents.on(GameEvent.PLAYER_TURN_CHANGED, this.onPlayerTurnChange, this);
        EventManager.instance.gameEvents.on(GameEvent.GAME_STARTED, this.onGameStarted, this);
        EventManager.instance.gameEvents.on(GameEvent.DEAL_CARD, this.addCardToParticipant, this);
        EventManager.instance.gameEvents.on(GameEvent.SPLIT_HAND, this.animateSplitHand, this);
        EventManager.instance.gameEvents.on(GameEvent.CHANGE_HAND, this.changeHand, this);
        EventManager.instance.gameEvents.on(GameEvent.GAME_ENDED, this.displayResult, this);
        EventManager.instance.gameEvents.on(GameEvent.GAME_RESET, this.resetUI, this);
        EventManager.instance.gameEvents.on(GameEvent.DEALER_TURN_END, this.flipDealerCards, this);

        this.resetUI();
    }

    private resetUI() {
        console.log('Resetting UI...');
        this.playerScoreLabels.forEach(playerScoreLabel => {
            playerScoreLabel.node.active = false;
        });
        this.dealerScoreLabel.node.active = false;

        this.playerCardContainers.forEach(playerCardContainer => {
            playerCardContainer.removeAllChildren();   
        });
        this.dealerCardContainer.removeAllChildren();

        this.handIndicators.forEach(handIndicator => {
            handIndicator.active = false;
        });

        this.resultSprites.forEach(resultSprite => {
            resultSprite.node.active = false;
        });

        this.playerCardContainers[1].parent.active = false;

        this.playerHandCount = 0;
    }

    protected onDestroy(): void {
        EventManager.instance.gameEvents.off(GameEvent.PLAYER_TURN_CHANGED, this.onPlayerTurnChange, this);
        EventManager.instance.gameEvents.off(GameEvent.GAME_STARTED, this.onGameStarted, this);
        EventManager.instance.gameEvents.off(GameEvent.DEAL_CARD, this.addCardToParticipant, this);
        EventManager.instance.gameEvents.off(GameEvent.GAME_ENDED, this.displayResult, this);
        EventManager.instance.gameEvents.off(GameEvent.GAME_RESET, this.resetUI, this);
        EventManager.instance.gameEvents.off(GameEvent.CHANGE_HAND, this.changeHand, this);
        EventManager.instance.gameEvents.off(GameEvent.DEALER_TURN_END, this.flipDealerCards, this);
    }    
    
    private setupPlayer(playerID: number) {
        this.playerID = playerID;
    }

    private onPlayerTurnChange(playerID: number) {
        if (this.playerID === playerID) {
            this.isActive = true;
            console.log(this.node.name + ' is active');
        } else {
            this.isActive = false;
            this.handIndicators.forEach(handIndicator => {
                handIndicator.active = false;
            });
        }
    }

    private onGameStarted() {
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
            handArea = this.dealerCardContainer;
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
            latestCardData.isFaceDown = false;
            const handIndex = participant.getIndex();
            scoreLabel = this.playerScoreLabels[handIndex];
        } else if (participant instanceof Dealer) {
            latestCardData.isFaceDown = (displayedCardCount === 0 && !participant.revealAll);
            scoreLabel = this.dealerScoreLabel;
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

    async flipDealerCards() {
        const dealerCardNodes = this.dealerCardContainer.children;
        const cardNode = dealerCardNodes[0];
        const card = cardNode.getComponent(Card);
        if (card.isFaceDown) {
            await card.flipCard();
        }
        EventManager.instance.gameEvents.emit(GameEvent.ANIMATION_FINISHED);
    }

    async animateSplitHand(playerHands: Player[]) {
        EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.CardDeal);
        const originHandArea = this.playerCardContainers[0];
        const targetHandArea = this.playerCardContainers[1];
        targetHandArea.parent.active = true;
        
        const targetCard = originHandArea.children[1];
        targetCard.removeFromParent();
        targetHandArea.addChild(targetCard);

        this.handIndicators[0].active = true;
        this.playerHandCount++;

        playerHands.forEach(playerHand => {
            this.addCardToParticipant(playerHand);
        });
    }

    private changeHand(handIndex: number) {
        if (!this.isActive) return;

        if (this.playerHandCount == 1) return;
        this.handIndicators.forEach(handIndicator => {
            handIndicator.active = false;
        });
        this.handIndicators[handIndex].active = true;
    }

    private displayResult(results: GameResult[]) {
        for (let i = 0; i < results.length; i++) {
            this.playerScoreLabels[i].node.active = true;
            this.handIndicators[i].active = false;
            const entry = this.resultEntries.find(e => e.result === results[i]);
            this.resultSprites[i].spriteFrame = entry.spriteFrame;
            this.resultSprites[i].node.active = true;
        }
        
        this.dealerScoreLabel.node.active = true;
    }
}

