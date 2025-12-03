
import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

import { NetworkEvent } from '../enums/NetworkEvent';
import { EventManager } from '../Managers/EventManager';

export class Code {
    static LOGIN = 1;
    static JOIN_ROOM = 3;
    static ROOM_PLUGIN = 5;
    static ZONE_PLUGIN = 6;
}

export enum WSState {
    DISCONNECTED,
    CONNECTING,
    CONNECTED
}

@ccclass('NetworkManager')
export class NetworkManager extends Component {

    @property
    public serverURL: string = "ws://192.168.1.19:8892/websocket";

    private _socket: WebSocket | null = null;
    private _state: WSState = WSState.DISCONNECTED;

    // private _listeners: Map<string, Function[]> = new Map();

    private _zone = "Slot1Zone";
    private _plugin = "BNRPlugin";
    private _username = "gamer01";
    private _password = "gamer01";

    private _roomId = 0;
    private _roomPassword = "";

    onLoad() {
        this.connect();
        this.initialize();
    }

    private connect() {
        console.log("Connect");
        this._socket = new WebSocket(this.serverURL);

        this._socket.onopen = () => {
            console.log("✅ WS Connected");
            this._state = WSState.CONNECTED;
            this.emit("open");
        };

        this._socket.onclose = () => {
            console.warn("❌ WS Closed");
            this._state = WSState.DISCONNECTED;
            this.emit("close");
        };

        this._socket.onerror = (e) => {
            console.error("❌ WS Error", e);
            this.emit("error", e);
        };

        this._socket.onmessage = (msg) => {
            this.handleMessage(msg.data);
        };
    }

    private handleMessage(raw: string) {
        let data: any;
        try { data = JSON.parse(raw); } catch { return; }

        console.log("⬇ Server:", data);

        const opcode = data[0];

        switch (opcode) {
            case Code.LOGIN:
                this.emit("login", {
                    success: data[1],
                    errorCode: data[2],
                    username: data[3],
                    zone: data[4],
                    balance: data[5]
                });
                break;

            case Code.ROOM_PLUGIN:
                const payload = data[1];

                if (payload?.action === "rooms") {
                    this.emit("rooms", payload.rooms);
                }

                if (payload?.action === "spin") {
                    this.emit("spin", payload);
                }
                break;

            case Code.JOIN_ROOM:
                this.emit("joinRoom", {
                    success: data[1],
                    errorCode: data[2],
                    roomId: data[3]
                });
                break;
        }
    }

    private send(arr: any[]) {
        if (!this._socket || this._state !== WSState.CONNECTED) return;
        const packet = JSON.stringify(arr);
        console.log("⬆ Client:", arr);
        this._socket.send(packet);
    }

    public login() {
        this.send([
            Code.LOGIN,
            this._zone,
            this._username,
            this._password,
            { action: "hello" }
        ]);
    }

    public getRooms() {
        this.send([
            Code.ZONE_PLUGIN,
            this._zone,
            this._plugin,
            { action: "rooms" }
        ]);
    }

    public joinRoom(roomId: number, password: string) {
        this._roomId = roomId;
        this._roomPassword = password;

        this.send([
            Code.JOIN_ROOM,
            this._zone,
            roomId,
            password
        ]);
    }

    public spin(bet: number) {
        if (!this._roomId) {
            console.warn("❌ No room joined yet");
            return;
        }

        this.send([
            Code.ROOM_PLUGIN,
            this._zone,
            this._roomId,
            {
                action: "spin",
                bet: bet
            }
        ]);
    }

    public on(event: string, cb: Function) {
        // if (!this._listeners.has(event)) {
        //     this._listeners.set(event, []);
        // }
        // this._listeners.get(event)!.push(cb);
        if (!Object.keys(NetworkEvent).some(k => (NetworkEvent as any)[k] === event)) return;
        EventManager.instance.networkEvents.on(event, cb(), this);
    }

    private emit(event: string, data?: any) {
        // if (!this._listeners.has(event)) return;
        EventManager.instance.networkEvents.emit(event, data);
        // this._listeners.get(event)!.forEach(cb => cb(data));
    }

    private initialize() {

        this.on("open", () => {
            console.log("🧪 Step 1: LOGIN");
            this.login();
        });

        this.on("login", () => {
            console.log("🧪 Step 2: GET ROOMS");
            this.getRooms();
        });

        this.on("rooms", (rooms: any[]) => {
            console.log("🧪 Rooms:", rooms);

            if (!rooms || rooms.length === 0) return;

            const room = rooms[0];
            console.log("🧪 Step 3: JOIN ROOM", room.id);
            this.joinRoom(room.id, room.password);
        });

        this.on("joinRoom", (data) => {
            if (!data.success) {
                console.warn("❌ Join failed");
                return;
            }

            // console.log("🧪 Step 4: SPIN");
            // this.spin(100);
        });

        // this.on("spin", (data) => {
        //     console.log("✅ SPIN RESULT:");
        //     console.log("Grid:", data.result?.grid);
        //     console.log("WinLines:", data.result?.winLines);
        //     console.log("WinAmount:", data.winAmount);
        //     console.log("Balance:", data.balance);
        // });
    }
}
