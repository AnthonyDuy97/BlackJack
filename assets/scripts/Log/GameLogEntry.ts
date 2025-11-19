export class GameLogEntry {
    timestamp: Date;
    content: string;

    constructor(timestamp: Date = new Date()) {
        this.timestamp = timestamp;
    }

    public getTimeStamp(): string {
        return this.timestamp.toLocaleDateString() + " " +this.timestamp.toLocaleTimeString();
    }

    public getContent(): string {
        return this.content;
    }
}