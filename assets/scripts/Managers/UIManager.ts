import { _decorator, Button, Component, Node, Prefab, instantiate, Vec3, Label, tween, UITransform, Vec2, Game } from 'cc';
import { EventManager } from './EventManager';
import { GameEvent } from '../enums/GameEvent';
import { Card } from '../Card';

import { Participant } from '../Participant';
import { Player } from '../Player';
import { Dealer } from '../Dealer';

import { ChipEntry } from '../Chip/ChipEntry';
import { ChipButton } from '../Chip/ChipButton';

import { SFXID } from '../AudioSystem/SFXEnums';

const { ccclass, property } = _decorator;

const MAX_STACK_COUNT = 5;
const MAX_STACK_PER_TYPE = 4;

@ccclass('UIManager')
export class UIManager extends Component {

    @property(Prefab)
    private cardPrefab: Prefab = null!;

    @property(Label)
    private resultLabel: Label = null!;

    @property(Button)
    private dealButton: Button = null!;

    @property(Button)
    private hitButton: Button = null!;

    @property(Button)
    private standButton: Button = null!;

    @property(Button)
    private doubleButton: Button = null!;

    @property(Button)
    private resetButton: Button = null!;

    @property(Button)
    private splitButton: Button = null!;

    @property(Node)
    private deckPosition: Node = null!;

    @property(Node)
    private playerCardContainers: Node[] = []!;

    @property(Label)
    private playerScoreLabels: Label[] = []!;

    @property(Node)
    private handIndicators: Node[] = []!;

    @property(Label)
    private dealerScoreLabel: Label = null!;

    @property(Node)
    private dealerCardContainer: Node = null!;

    @property(Button)
    private potResetButton: Button = null!;

    @property(Node)
    private bettingArea: Node = null!;

    @property(Node)
    private potArea: Node = null!;

    @property(Prefab)
    private chipButtonPrefab: Prefab = null!;

    @property(Label)
    private totalBet: Label = null!;

    private chipButtons: ChipButton[] = [];
    private chipStacks: Map<number, number> = new Map(); // key: chip value, value: count
    private chipStackPositions: Map<number, Vec2> = new Map(); // value ¨ position

    private playerAnimationInProgress: number = 0;
    private dealerAnimationInProgress: number = 0;

    private playerHandCount = 0;

    start() {
        EventManager.instance.gameEvents.on(GameEvent.CHIP_ENTRY_READY, this.setupChipButtons, this);
        EventManager.instance.gameEvents.on(GameEvent.ADD_CHIP_UI, this.addChip, this);
        EventManager.instance.gameEvents.on(GameEvent.UPDATE_BET_VALUE, this.updateBetValue, this);
        EventManager.instance.gameEvents.on(GameEvent.GAME_STARTED, this.onGameStarted, this);
        EventManager.instance.gameEvents.on(GameEvent.DEAL_CARD, this.addCardToParticipant, this);
        EventManager.instance.gameEvents.on(GameEvent.SPLIT_HAND, this.animateSplitHand, this);
        EventManager.instance.gameEvents.on(GameEvent.CHANGE_HAND, this.changeHand, this);
        EventManager.instance.gameEvents.on(GameEvent.GAME_ENDED, this.displayResult, this);
        EventManager.instance.gameEvents.on(GameEvent.GAME_RESET, this.resetUI, this);
        EventManager.instance.gameEvents.on(GameEvent.DEALER_TURN_END, this.flipDealerCards, this);
        EventManager.instance.gameEvents.on(GameEvent.LOCK_INPUT, this.lockInput, this);
        EventManager.instance.gameEvents.on(GameEvent.UNLOCK_INPUT, this.unlockInput, this);

        this.attachPlaySFXToButton(this.node.parent);
        this.resetUI();
    }

    private resetUI() {
        console.log('Resetting UI...');
        this.dealButton.interactable = false;
        this.dealButton.node.active = true;
        this.hitButton.node.active = false;
        this.standButton.node.active = false;
        this.doubleButton.node.active = false;
        this.resultLabel.node.active = false;
        this.resetButton.node.active = false;
        this.splitButton.node.active = false;
        this.playerScoreLabels.forEach(playerScoreLabel => {
            playerScoreLabel.node.active = false;
        });
        this.dealerScoreLabel.node.active = false;

        this.playerCardContainers.forEach(playerCardContainer => {
            playerCardContainer.removeAllChildren();   
        });
        this.dealerCardContainer.removeAllChildren();

        this.chipButtons.forEach(chipButton => {
            chipButton.setInteractable(true);
        });

        this.handIndicators.forEach(handIndicator => {
            handIndicator.active = false;
        });
        this.potArea.removeAllChildren();
        this.resetPot();
        this.playerHandCount = 0;
    }

    protected onDestroy(): void {
        EventManager.instance.gameEvents.off(GameEvent.CHIP_ENTRY_READY, this.setupChipButtons, this);
        EventManager.instance.gameEvents.off(GameEvent.ADD_CHIP_UI, this.addChip, this);
        EventManager.instance.gameEvents.off(GameEvent.UPDATE_BET_VALUE, this.updateBetValue, this);
        EventManager.instance.gameEvents.off(GameEvent.GAME_STARTED, this.onGameStarted, this);
        EventManager.instance.gameEvents.off(GameEvent.DEAL_CARD, this.addCardToParticipant, this);
        EventManager.instance.gameEvents.off(GameEvent.GAME_ENDED, this.displayResult, this);
        EventManager.instance.gameEvents.off(GameEvent.GAME_RESET, this.resetUI, this);
        EventManager.instance.gameEvents.off(GameEvent.DEALER_TURN_END, this.flipDealerCards, this);
    }

    private setupChipButtons(chipEntries: ChipEntry[]) {        
        for (let i = 0; i < chipEntries.length; i++) {
            const entry = chipEntries[i];
            const chipNode = instantiate(this.chipButtonPrefab);
            chipNode.setParent(this.bettingArea);
            
            const chipButton = chipNode.getComponent(ChipButton);
            this.chipButtons.push(chipButton);
            chipButton.setup(entry);
            chipNode.setPosition(0, 0);
        }
    }

    private addChip(chipEntry: ChipEntry) {
        const baseX = 0;
        const baseY = 0;    
        const offsetX = 60;
        const offsetY = 10;

        // Get current stack count and position
        let stackPositionY = 0;
        if (!this.chipStackPositions.has(chipEntry.value)) {
            this.chipStacks.set(chipEntry.value, 0);
            this.chipStackPositions.set(chipEntry.value, new Vec2(this.chipStackPositions.size, 0));
        }
        
        let stackCount = this.chipStacks.get(chipEntry.value);
        let stackPositionX = this.chipStackPositions.get(chipEntry.value).x;
        stackPositionY = this.chipStackPositions.get(chipEntry.value).y + 1;
        if (stackCount >= MAX_STACK_PER_TYPE * MAX_STACK_COUNT) {
            console.log('Too many chips for one type, stop displaying new chip');
            return;
        }
        if (stackCount % MAX_STACK_COUNT == 0) {
            stackPositionY = stackPositionY - MAX_STACK_COUNT - 4;
        }
            
        const chipNode = instantiate(this.chipButtonPrefab);
        chipNode.setParent(this.potArea);
        const chipButton = chipNode.getComponent(ChipButton);
        chipButton.setup(chipEntry);
        chipButton.setInteractable(false);
        
        chipNode.setPosition(baseX + stackPositionX * offsetX, baseY + stackPositionY * offsetY);
        this.chipStacks.set(chipEntry.value, stackCount + 1);
        this.chipStackPositions.set(chipEntry.value, new Vec2(stackPositionX, stackPositionY));

        this.potResetButton.interactable = true;
    }

    private updateBetValue(betValue: number) {
        this.totalBet.string = "Bet: $" + betValue;
        if (betValue > 0) {
            this.dealButton.interactable = true;
        } else {
            this.dealButton.interactable = false;
            this.resetPot();
        }
    }

    private resetPot() {
        this.potArea.removeAllChildren();
        this.chipStacks.clear();
        this.chipStackPositions.clear();
        this.potResetButton.interactable = false;

        EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.Chip, this);
    }

    private onGameStarted(player: Player) {
        this.dealButton.node.active = false;
        this.hitButton.node.active = true;
        this.standButton.node.active = true;
        this.doubleButton.node.active = true;
        this.splitButton.node.active = true;
        this.chipButtons.forEach(chipButton => {
            chipButton.setInteractable(false);
        });
        if (player.canSplit()) {
            this.splitButton.interactable = true;
        } else {
            this.splitButton.interactable = false;
            const original = this.splitButton.transition;
            this.splitButton.transition = Button.Transition.COLOR;
            this.splitButton.transition = original;
        }
        this.playerHandCount++;
    }

    async addCardToParticipant(participant: Participant) {
        this.potResetButton.interactable = false;

        let handArea = null;
        if (participant instanceof Player) {
            const handIndex = participant.getIndex();
            handArea = this.playerCardContainers[handIndex];
        } else if (participant instanceof Dealer) {
            handArea = this.dealerCardContainer;
        }
        
        const hand = participant.getHand();
        for (let i = handArea.children.length; i < hand.length; i++) {
            await this.animateCardToHand(participant, handArea);
        }
        EventManager.instance.gameEvents.emit(GameEvent.ANIMATION_FINISHED, participant);
    }

    async animateCardToHand(participant: Participant, handArea: Node): Promise<void> {
        EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.CardDeal);

        const hand = participant.getHand();
        const displayedCardCount = handArea.children.length;
        if (displayedCardCount >= hand.length) {
            return;
        }
        const latestCardData = hand[displayedCardCount];

        // Get or create visual card node
        const cardNode = instantiate(this.cardPrefab);
        let card = cardNode.addComponent(Card);
        card.init(latestCardData);
        
        // Add to scene
        let scoreLabel;
        if (participant instanceof Player) {
            latestCardData.isFaceDown = false;
            this.playerAnimationInProgress++;
            const handIndex = participant.getIndex();
            scoreLabel = this.playerScoreLabels[handIndex];
        } else if (participant instanceof Dealer) {
            latestCardData.isFaceDown = (displayedCardCount === 0 && !participant.revealAll);
            this.dealerAnimationInProgress++;
            scoreLabel = this.dealerScoreLabel;
        }
        handArea.addChild(cardNode);
        
        // Position at deck first
        cardNode.setWorldPosition(this.deckPosition.getWorldPosition());
        
        // Animate to hand position
        const targetPos = this.getCardTargetPosition(displayedCardCount);
        await new Promise<void>((resolve) => {
            tween(cardNode)
            .to(0.5, { position: targetPos })
            .call(async () => {
                if (!latestCardData.isFaceDown) {
                    if (participant instanceof Player) {
                        console.log('Animating for Player');
                    }
                    await card.flipCard();
                    if (participant instanceof Player) {
                        console.log('Done animating for Player');
                    }
                    this.checkRemainingAnimation(participant);
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
            this.checkRemainingAnimation(new Dealer);
        }
    }

    async animateSplitHand() {
        EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.CardDeal);
        const originHandArea = this.playerCardContainers[0];
        const targetHandArea = this.playerCardContainers[1];

        const targetCard = originHandArea.children[1];
        const worldPos = targetCard.worldPosition.clone();
        targetCard.removeFromParent();
        targetHandArea.addChild(targetCard);
        targetCard.setWorldPosition(worldPos);

        const targetPos = this.getCardTargetPosition(0);
            await new Promise<void>((resolve) => {
                tween(targetCard)
                .to(0.5, { position: targetPos })
                .call(resolve)
                .start();
        });
        this.splitButton.interactable = false;
        this.handIndicators[0].active = true;
        this.playerHandCount++;
    }

    private changeHand(handIndex: number) {
        if (this.playerHandCount == 1) return;
        this.handIndicators.forEach(handIndicator => {
            handIndicator.active = false;
        });
        this.handIndicators[handIndex].active = true;
    }
    
    private checkRemainingAnimation(participant: Participant) {
        if (participant instanceof Player) {
            this.playerAnimationInProgress--;
        } else if (participant instanceof Dealer) {
            this.dealerAnimationInProgress--;
        }
        console.log('Player animations left:', this.playerAnimationInProgress, 'Dealer animations left:', this.dealerAnimationInProgress);
        if ((this.playerAnimationInProgress <= 0 && participant instanceof Player) ||
            (this.dealerAnimationInProgress <= 0 && participant instanceof Dealer)) {
            console.log('All animations finished.');
            EventManager.instance.gameEvents.emit(GameEvent.ANIMATION_FINISHED, participant);
        }
    }

    private getCardTargetPosition(cardIndex: number): Vec3 {
        const xOffset = 50;
        const yOffset = -40;
        const x = (cardIndex % 13) * xOffset;
        const y = Math.floor(cardIndex / 13) * yOffset;
        return new Vec3(x, y, 0);
    }

    private displayResult(result: string) {
        // Implement result display logic (e.g., show a popup or update a label)
        console.log('Game Result:', result);
        this.resultLabel.node.active = true;
        this.resultLabel.string = result;
        this.hitButton.node.active = false;
        this.standButton.node.active = false;
        this.resetButton.node.active = true;
        this.doubleButton.node.active = false;
        this.splitButton.node.active = false;

        for (let i = 0; i < this.playerHandCount; i++) {
            this.playerScoreLabels[i].node.active = true;
        }
        
        this.handIndicators.forEach(handIndicator => {
            handIndicator.active = false;
        });
        this.dealerScoreLabel.node.active = true;
    }

    private attachPlaySFXToButton(root: Node) {
        const buttons = root.getComponentsInChildren(Button);
        for (const button of buttons) {
            button.node.on(Button.EventType.CLICK, this.playButtonSFX, this);
        }
    }

    private playButtonSFX() {
        EventManager.instance.gameEvents.emit(GameEvent.PLAY_SFX, SFXID.ButtonClick);
    }

    private lockInput() {
        this.dealButton.interactable = false;
        this.hitButton.interactable = false;
        this.standButton.interactable = false;
        this.doubleButton.interactable = false;
        this.resetButton.interactable = false;
        this.splitButton.interactable = false;
    }

    private unlockInput() {
        this.dealButton.interactable = true;
        this.hitButton.interactable = true;
        this.standButton.interactable = true;
        this.doubleButton.interactable = true;
        this.resetButton.interactable = true;
    }
}

