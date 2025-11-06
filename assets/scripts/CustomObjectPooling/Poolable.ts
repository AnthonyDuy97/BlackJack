import { _decorator, Component, Node } from 'cc';
import { ObjectPool } from './ObjectPool'; // your pool class
const { ccclass, property } = _decorator;

@ccclass('Poolable')
export class Poolable extends Component {
    private pool: ObjectPool | null = null;

    public init(pool: ObjectPool) {
        this.pool = pool;
    }

    onDisable() {
        if (this.pool) {
            this.pool.push(this.node);
        }
    }
}