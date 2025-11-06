import { _decorator, Component, Node, Prefab, instantiate, Enum, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
import { PoolExhaustedBehavior } from './PoolExhaustedBehavior';
import { Poolable } from './Poolable';
import { SpecialQueue } from './SpecialQueue';

@ccclass('ObjectPool')
export class ObjectPool extends Component {
    @property(Prefab)
    objectToPool: Prefab = null!;

    @property
    amountToPool: number = 10;

    @property({ type: Enum(PoolExhaustedBehavior) })
    exhaustBehavior: PoolExhaustedBehavior = PoolExhaustedBehavior.CreateNew;

    @property({
        visible() {
            return this.exhaustBehavior === PoolExhaustedBehavior.ExpandWithLimit;
        }
    })
    maxPoolSize: number = 50;

    private availableNodes: Node[] = [];
    private spawnedNodes = new SpecialQueue<Node>();

    onLoad() {
        for (let i = 0; i < this.amountToPool; i++) {
            const obj = instantiate(this.objectToPool);
            let poolable = obj.getComponent(Poolable) || obj.addComponent(Poolable);
            poolable.init(this);

            obj.active = false;
            obj.setParent(this.node);
            this.availableNodes.push(obj);
        }
    }

    public pop(): Node | null {
        if (this.availableNodes.length > 0) {
            let node = this.availableNodes.pop();
            this.spawnedNodes.enqueue(node);
            return node;
        }

        // Can't find an available Node (Pool Exhausted)
        switch (this.exhaustBehavior) {
            case PoolExhaustedBehavior.CreateNew:
                const obj = instantiate(this.objectToPool);
                let poolable = obj.getComponent(Poolable) || obj.addComponent(Poolable);
                poolable.init(this);

                obj.active = false;
                obj.setParent(this.node);
                this.spawnedNodes.enqueue(obj);
                return obj;
        
            case PoolExhaustedBehavior.Recycle:
                if (this.spawnedNodes.count > 0) {
                    const oldest = this.spawnedNodes.dequeue()!;
                    this.spawnedNodes.enqueue(oldest);
                    return oldest;
                }
                break;

            case PoolExhaustedBehavior.ExpandWithLimit:
                if (this.spawnedNodes.count < this.maxPoolSize) {
                    const obj = instantiate(this.objectToPool);
                    let poolable = obj.getComponent(Poolable) || obj.addComponent(Poolable);
                    poolable.init(this);

                    obj.active = false;
                    obj.setParent(this.node);
                    this.spawnedNodes.enqueue(obj);
                    return obj;
                }
                break;

            case PoolExhaustedBehavior.FailSilently:
                break;
        }

        return null;
    }

    public push(node: Node) {
        node.active = false;
        node.setPosition(Vec3.ZERO);
        if (this.availableNodes.findIndex(n => n === node) === -1) {
            this.availableNodes.push(node);
        }        
        this.spawnedNodes.remove(node);
    }
}