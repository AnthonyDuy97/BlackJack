import { Participant } from './Participant';
import { CardData } from './CardData';

export class Player extends Participant {
    private index: number;

    private playerID: number;

    private isDoubling: boolean = false;

    constructor(index: number, playerID: number) {
        super();
        this.index = index;
        this.playerID = playerID;
    }

    public getIndex(): number {
        return this.index;
    }

    public getPlayerID(): number {
        return this.playerID;
    }

    public doublingDown() {
        this.isDoubling = true;
    }

    public isDoublingDown(): boolean {
        return this.isDoubling;
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