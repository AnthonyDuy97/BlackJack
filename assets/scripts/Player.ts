import { Participant } from './Participant';
import { CardData } from './CardData';

export class Player extends Participant {
    private name: string;
    private index: number;

    constructor(name: string, index: number) {
        super();
        this.name = name;
        this.index = index;
    }

    public getName(): string {
        return this.name;
    }

    public getIndex(): number {
        return this.index;
    }

    public canSplit(): boolean {
        return true;
        if (this.hand.length === 2 && this.hand[0].rank === this.hand[1].rank) {
            return true;
        }
        return false;
    }

    public splitHand(): CardData {
        const splitCard = this.hand.splice(1, 1)[0];;
        return splitCard;
    }
}