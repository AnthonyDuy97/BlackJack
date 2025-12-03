import { _decorator, Component, Node } from 'cc';
import { EventTarget } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('EventManager')
export class EventManager extends Component {

    private static _instance: EventManager;

    // Central event bus
    public readonly gameEvents: EventTarget;
    public readonly networkEvents: EventTarget;
    // public readonly sfxEvents: EventTarget;

    private constructor() {
        super();
        this.gameEvents = new EventTarget();
        this.networkEvents = new EventTarget();
    }

    public static get instance(): EventManager {
        if (!this._instance) {
            this._instance = new EventManager();
        }
        return this._instance;
    }
    
    
}