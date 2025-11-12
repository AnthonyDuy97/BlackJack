import { CardData } from './CardData';

export class Participant {
    protected hand: CardData[] = [];

    public revealAll: boolean = false;

    public getHand(): CardData[] {
        return this.hand;
    }

    public isBusted(): boolean {
        return this.getHandValue() > 21;
    }

    public hasBlackjack(): boolean {
        return this.getHandValue() === 21 && this.hand.length === 2;
    }

    public addCard(card: CardData) {
        this.hand.push(card);
    }

    public resetHand() {
        this.hand = [];
    }

    public getHandValue(): number {
        // Basic hand value logic (handle Aces as 1 or 11)
        let total = 0;
        let aces = 0;

        for (const card of this.hand) {
            if (card.values.length === 2) aces++;
            total += card.values[0]; // assume lowest value first
        }

        // Upgrade Aces if possible
        while (aces > 0 && total + 10 <= 21) {
            total += 10;
            aces--;
        }

        return total;
    }
}