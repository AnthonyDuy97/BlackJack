export class SpecialQueue<T> {
    private list: T[] = [];

    enqueue(item: T) {
        this.list.push(item);
    }

    dequeue(): T | undefined {
        return this.list.shift();
    }

    peek(): T | undefined {
        return this.list[0];
    }

    remove(item: T): boolean {
        const index = this.list.indexOf(item);
        if (index >= 0) {
            this.list.splice(index, 1);
            return true;
        }
        return false;
    }

    contains(item: T): boolean {
        return this.list.some(i => i === item);
    }

    get count(): number {
        return this.list.length;
    }
}