export class Code {
    static LOGIN = 1;
    static LOGOUT = 2;
    static JOIN_ROOM = 3;
    static LEAVE_ROOM = 4;
    static ROOM_PLUGIN = 5;
    static ZONE_PLUGIN = 6;
    static PING = 7;
    static CHANGE_LANGUAGE = 8;
};
namespace Messages {
    class AbstractMessage {
        type: number; /* Code.* */
        zoneName: string;
        constructor(type: number) {
            this.type = type;
            this.zoneName = '';
        }
    }
    export class LoginMessage extends AbstractMessage {
        username: string;
        password: string;
        constructor() {
            super(Code.LOGIN);
            this.username = '';
            this.password = '';
        }
    }
    export class LogoutMessage extends AbstractMessage {
        constructor() {
            super(Code.LOGOUT);
        }
    }
    export class GetRoomsMessage extends AbstractMessage {
        pluginName: string;
        params: {};
        constructor() {
            super(Code.ZONE_PLUGIN);
            this.pluginName = '';
            this.params = {
                action: 'rooms'
            };
        }
    }
    export class CreateRoomMessage extends AbstractMessage {
        pluginName: string;
        params: {};
        constructor() {
            super(Code.ZONE_PLUGIN);
            this.pluginName = '';
            this.params = {
                action: 'create_room'
            };
        }
    }
    export class JoinRoomMessage extends AbstractMessage {
        roomId: number; /* 4 bytes */
        password: string;
        constructor() {
            super(Code.JOIN_ROOM);
            this.roomId = 0;
            this.password = '';
        }
    }
    export class LeaveRoomMessage extends AbstractMessage {
        roomId: number; /* 4 bytes */
        constructor() {
            super(Code.JOIN_ROOM);
            this.roomId = 0;
        }
    }
    export class SpinGameMessage extends AbstractMessage {
        roomId: number; /* 4 bytes */
        params: {
            action: string,
            bet: number
        };
        constructor() {
            super(Code.ROOM_PLUGIN);
            this.roomId = 0;
            this.params = {
                action: 'spin | freespin | gamble',
                bet: 100
            };
        }
    }
    
    export class BetMessage extends AbstractMessage {
        roomId: number; /* 4 bytes */
        params: {
            playerID: number,
            bet: number
        };
        constructor() {
            super(Code.ROOM_PLUGIN);
            this.roomId = 0;
            this.params = {
                playerID: 0,
                bet: 0
            };
        }
    }
    export class GameActionMessage extends AbstractMessage {
        roomId: number; /* 4 bytes */
        params: {
            playerID: number,
            action: string,
        };
        constructor() {
            super(Code.ROOM_PLUGIN);
            this.roomId = 0;
            this.params = {
                playerID: 0,
                action: 'hit | stand | double | split'
            };
        }
    }
    export class InsuranceResponseMessage extends AbstractMessage {
        roomId: number; /* 4 bytes */
        params: {
            playerID: number,
            action: string,
        };
        constructor() {
            super(Code.ROOM_PLUGIN);
            this.roomId = 0;
            this.params = {
                playerID: 0,
                action: 'accept | decline'
            };
        }
    }
    export class UpdateBalanceMessage extends AbstractMessage {
        pluginName: string;
        params: {};
        constructor() {
            super(Code.ZONE_PLUGIN);
            this.pluginName = '';
            this.params = {
                action: 'update_balance',
                transaction: 'add',
                amount: 999
            };
        }
    }
}
namespace Responses {
    class AbstractResponse {
        type: number; /* Code.* */
        constructor() {
            this.type = 0;
        }
    }
    export class LoginResponse extends AbstractResponse {
        success: boolean; /* 1 bytes */
        errorCode: number; /* 4 bytes */
        username: string;
        zoneName: string;
        balance: number; /* 4 bytes */
        message: string;
        constructor() {
            super();
            this.success = false;
            this.errorCode = 0;
            this.username = '';
            this.zoneName = '';
            this.balance = 0;
            this.message = '';
        }
    }
    export class LogoutMessage extends AbstractResponse {
        success: boolean; /* 1 bytes */
        reasonId: number; /* 4 bytes */
        constructor() {
            super();
            this.success = false;
            this.reasonId = 0;
        }
    }
    export class GetRoomsResponse extends AbstractResponse {
        success: boolean; /* 1 bytes */
        roomId: number; /* 4 bytes */
        errorCode: number; /* 4 bytes */
        action: string;
        zoneName: string;
        rooms: RoomResponse[];
        constructor() {
            super();
            this.success = false;
            this.roomId = 0;
            this.errorCode = 0;
            this.action = '';
            this.zoneName = '';
            this.rooms = [];
        }
    }
    export class CreateRoomsResponse extends AbstractResponse {
        success: boolean; /* 1 bytes */
        roomId: number; /* 4 bytes */
        errorCode: number; /* 4 bytes */
        action: string;
        roomName: string;
        roomHasPassword: boolean; /* 1 bytes */
        roomPassword: string;
        constructor() {
            super();
            this.success = false;
            this.roomId = 0;
            this.errorCode = 0;
            this.action = '';
            this.roomName = '';
            this.roomHasPassword = false;
            this.roomPassword = '';
        }
    }
    export class JoinRoomResponse extends AbstractResponse {
        success: boolean; /* 1 bytes */
        errorCode: number; /* 4 bytes */
        roomId: number; /* 4 bytes */
        message: string;
        constructor() {
            super();
            this.success = false;
            this.errorCode = 0;
            this.roomId = 0;
            this.message = '';
        }
    }
    export class LeaveRoomResponse extends AbstractResponse {
        success: boolean; /* 1 bytes */
        reasonId: number; /* 4 bytes */
        roomId: number; /* 4 bytes */
        errorCode: number; /* 4 bytes */
        message: string;
        constructor() {
            super();
            this.success = false;
            this.reasonId = 0;
            this.roomId = 0;
            this.errorCode = 0;
            this.message = '';
        }
    }
    export class RoomResponse {
        id: number; /* 4 bytes */
        name: string;
        hasPassword: boolean;
        password: string;
        constructor() {
            this.id = 0;
            this.name = '';
            this.hasPassword = false;
            this.password = '';
        }
    }
    // export class SpinResponse extends AbstractResponse {
    //     success: boolean; /* 1 bytes */
    //     roomId: number; /* 4 bytes */
    //     errorCode: number; /* 4 bytes */
    //     action: string;
    //     zoneName: string;
    //     rooms: RoomResponse[];
    //     constructor() {
    //         super();
    //         this.success = false;
    //         this.roomId = 0;
    //         this.errorCode = 0;
    //         this.action = '';
    //         this.zoneName = '';
    //         this.rooms = [];
    //     }
    // }
    export class PhaseChange extends AbstractResponse {
        event: string;
        roomId: number; /* 4 bytes */
        errorCode: number; /* 4 bytes */
        phaseId: number | string;
        rooms: RoomResponse[];
        constructor() {
            super();
            this.event = 'phase-change';
            this.roomId = 0;
            this.errorCode = 0;
            this.phaseId = 0;
            this.rooms = [];
        }
    }
    export class TurnChange extends AbstractResponse {
        event: string;
        roomId: number; /* 4 bytes */
        errorCode: number; /* 4 bytes */
        playerId: number;
        rooms: RoomResponse[];
        constructor() {
            super();
            this.event = 'turn-change';
            this.roomId = 0;
            this.errorCode = 0;
            this.playerId = 0;
            this.rooms = [];
        }
    }
    export class BetResponse extends AbstractResponse {
        success: boolean; /* 1 bytes */
        roomId: number; /* 4 bytes */
        playerId: number; /* 4 bytes */
        event: string;
        errorCode: number; /* 4 bytes */
        rooms: RoomResponse[];
        constructor() {
            super();
            this.success = false;
            this.roomId = 0;
            this.playerId = 0;
            this.event = 'bet';
            this.errorCode = 0;
            this.rooms = [];
        }
    }
    export class DealCard extends AbstractResponse {
        event: string;
        roomId: number; /* 4 bytes */
        target: string;
        playerId?: number;   /* optional depend on whether target is 'dealer' or 'player'*/
        cardId?: number;     /* optional depend on playerId and who the reponse is sent too*/
        isFaceDown: boolean;
        errorCode: number; /* 4 bytes */
        rooms: RoomResponse[];
        constructor() {
            super();
            this.event = 'deal-card';
            this.roomId = 0;
            this.target = 'player | dealer';
            this.playerId = 0;
            this.cardId = -1;
            this.isFaceDown = true;
            this.errorCode = 0;
            this.rooms = [];
        }
    }
    export class RevealCard extends AbstractResponse {
        event: string;
        roomId: number; /* 4 bytes */
        target: string;
        playerId?: number;   /* optional depend on whether target is 'dealer' or 'player'*/
        cardId: number;
        errorCode: number; /* 4 bytes */
        rooms: RoomResponse[];
        constructor() {
            super();
            this.roomId = 0;
            this.event = 'reveal-card';
            this.target = 'player | dealer';
            this.playerId = 0;
            this.cardId = -1;
            this.errorCode = 0;
            this.rooms = [];
        }
    }
    export class ActionResponse extends AbstractResponse {
        success: boolean; /* 1 bytes */
        roomId: number; /* 4 bytes */
        playerId: number; /* 4 bytes */
        event: string;
        errorCode: number; /* 4 bytes */
        rooms: RoomResponse[];
        constructor() {
            super();
            this.success = false;
            this.roomId = 0;
            this.playerId = 0;
            this.event = 'hit | stand | double | split';
            this.errorCode = 0;
            this.rooms = [];
        }
    }
    export class InsuranceOffer extends AbstractResponse {
        roomId: number; /* 4 bytes */
        playerId: number; /* 4 bytes */
        event: string;
        errorCode: number; /* 4 bytes */
        rooms: RoomResponse[];
        constructor() {
            super();
            this.roomId = 0;
            this.playerId = 0;
            this.event = 'offer-insurance';
            this.rooms = [];
        }
    }
    export class InsuranceOfferResponse extends AbstractResponse {
        success: boolean; /* 1 bytes */
        roomId: number; /* 4 bytes */
        playerId: number; /* 4 bytes */
        event: string;
        errorCode: number; /* 4 bytes */
        rooms: RoomResponse[];
        constructor() {
            super();
            this.success = false;
            this.roomId = 0;
            this.playerId = 0;
            this.event = 'insurance-accept | insurance-decline';
            this.errorCode = 0;
            this.rooms = [];
        }
    }
    export class GameResult extends AbstractResponse {
        roomId: number; /* 4 bytes */
        playerId: number; /* 4 bytes */
        event: string;
        result: string;
        errorCode: number; /* 4 bytes */
        rooms: RoomResponse[];
        constructor() {
            super();
            this.roomId = 0;
            this.playerId = 0;
            this.event = 'game-result';
            this.result = 'win | lose | push | win-blackjack'
            this.rooms = [];
        }
    }
    export class BalanceUpdate extends AbstractResponse {   
        roomId: number; /* 4 bytes */
        playerId: number; /* 4 bytes */
        event: string;
        newBalance: number;
        constructor() {
            super();
            this.event = 'balance-update';
            this.roomId = 0;
            this.playerId = 0;
            this.newBalance = 0;
        }
    }
    export const TEMPLATES: number[][] = [
            [1, 1, 1, 1, 1],  // 0
            [0, 0, 0, 0, 0],  // 1
            [2, 2, 2, 2, 2],  // 2
            [0, 1, 2, 1, 0],  // 3
            [2, 1, 0, 1, 2],  // 4
            [2, 1, 0, 1, 0],  // 5
            [0, 1, 2, 1, 2],  // 6
            [2, 1, 1, 1, 2],  // 7
            [1, 0, 0, 0, 1],  // 8
            [0, 1, 1, 1, 0],  // 9
            [2, 1, 1, 1, 2],  // 10
            [0, 1, 2, 2, 1],  // 11
            [2, 1, 0, 0, 1],  // 12
            [1, 1, 0, 1, 1],  // 13
            [1, 1, 2, 1, 1],  // 14
            [0, 2, 0, 2, 0],  // 15
            [0, 1, 0, 1, 0],  // 16
            [1, 0, 1, 0, 1],  // 17
            [1, 1, 1, 1, 1],  // 18
            [0, 0, 0, 0, 0],  // 19
            [0, 0, 0, 0, 0],  // 20
            [1, 1, 1, 1, 1],  // 21
            [0, 0, 0, 0, 0],  // 22
            [2, 2, 2, 2, 2],  // 23
            [0, 0, 0, 0, 0],  // 24
            [2, 2, 2, 2, 2],  // 25
            [2, 2, 1, 1, 0],  // 26
            [0, 1, 2, 2, 2],  // 27
            [0, 0, 0, 0, 0],  // 28
            [0, 0, 0, 0, 0],  // 29
            [0, 1, 1, 2, 2],  // 30
            [2, 1, 1, 0, 0],  // 31
            [0, 1, 0, 1, 0],  // 32
            [2, 1, 2, 1, 2],  // 33
            [0, 1, 2, 1, 0],  // 34
            [2, 1, 0, 1, 2],  // 35
            [1, 1, 1, 1, 1],  // 36
            [1, 1, 1, 1, 1],  // 37
            [1, 1, 1, 1, 1],  // 38
            [1, 1, 0, 0, 1],  // 39
            [0, 0, 1, 1, 0],  // 40
            [0, 0, 1, 0, 0],  // 41
            [2, 2, 1, 2, 2],  // 42
            [0, 1, 0, 1, 0],  // 43
            [1, 0, 2, 0, 1],  // 44
            [2, 1, 0, 1, 2],  // 45
            [0, 1, 0, 0, 1],  // 46
            [1, 0, 0, 1, 0],  // 47
            [1, 1, 1, 1, 1],  // 48
            [0, 0, 0, 0, 0]   // 49
        ];

}