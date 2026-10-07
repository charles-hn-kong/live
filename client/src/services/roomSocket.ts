import { ROOM_WS_URL } from "./config"
import type { RoomComment, RoomGift } from "../types/liveRoom";

type ViewerCountHandle = (viewerCount: number | null) => void;
type CommentHandler = (comment: RoomComment) => void;
type LikeCountHandler = (likeCount: number | null) => void;
type GiftHandler = (gift: RoomGift) => void;
type SocketHandler = (socket: WebSocket) => void;
type RoomHeartbeat = {
    timer: number;
    startedAt: number;
    joined: boolean;
    waitingForPong: boolean;
    lastPingAt: number;
    onViewerCount: ViewerCountHandle;
    onLikeCount: LikeCountHandler;
    onClose: SocketHandler;
}
const ROOM_JOIN_TIME = 15000;
const HEARTBEAT_INTERVAL = 15000;
const HEARTBEAT_TIMEOUT = 10000;

const roomHeartbeats = new WeakMap<WebSocket, RoomHeartbeat>();


const stopRoomHeartbeat = (socket: WebSocket) => {
    const heartbeat = roomHeartbeats.get(socket);
    if (!heartbeat) {
        return;
    }
    window.clearInterval(heartbeat.timer);
    roomHeartbeats.delete(socket);
}

const failRoomConnection = (socket: WebSocket, reason: string) => {
    const heartbeat = roomHeartbeats.get(socket);
    if (!heartbeat) {
        return;
    }
    console.warn(reason);
    disconnectFromRoom(socket);
    heartbeat.onViewerCount(null);
    heartbeat.onLikeCount(null);
    heartbeat.onClose(socket);
}

const checkRoomConnection = (socket: WebSocket) => {
    const heartbeat = roomHeartbeats.get(socket);
    if (!heartbeat) {
        return;
    }
    if (socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
        stopRoomHeartbeat(socket);
        return;
    }

    const now = performance.now();

    if (!heartbeat.joined) {
        if (now - heartbeat.startedAt >= ROOM_JOIN_TIME) {
            failRoomConnection(socket, 'room join timeout');
        }
        return;
    }

    if (heartbeat.waitingForPong) {
        if (now - heartbeat.lastPingAt >= HEARTBEAT_TIMEOUT) {
            failRoomConnection(socket, 'heartbeat timeout');
        }
        return;
    }

    if (now - heartbeat.lastPingAt < HEARTBEAT_INTERVAL) {
        return;
    }

    heartbeat.lastPingAt = now;
    heartbeat.waitingForPong = true;

    try {
        socket.send(JSON.stringify({ type: 'ping' }));
    } catch (error) {
        failRoomConnection(socket, 'heartbeat send failed');
    }
}

const startRoomHeartbeat = (
    socket: WebSocket,
    onViewerCount: ViewerCountHandle,
    onLikeCount: LikeCountHandler,
    onClose: SocketHandler
) => {
    stopRoomHeartbeat(socket);

    const startedAt = performance.now();
    const timer = window.setInterval(checkRoomConnection, 1000, socket);

    roomHeartbeats.set(socket, {
        timer,
        startedAt,
        joined: false,
        waitingForPong: false,
        lastPingAt: startedAt,
        onViewerCount,
        onLikeCount,
        onClose
    });
}

export const connectToRoom = (
    roomId: string,
    onViewerCount: ViewerCountHandle,
    onComment: CommentHandler,
    onLikeCount: LikeCountHandler,
    onGift: GiftHandler,
    onJoined: SocketHandler,
    onclose: SocketHandler
): WebSocket => {
    const socket = new WebSocket(ROOM_WS_URL);
    startRoomHeartbeat(socket, onViewerCount, onLikeCount, onclose);

    socket.onopen = () => {
        socket.send(JSON.stringify({
            type: 'join',
            roomId
        }));
    }

    socket.onmessage = (event: MessageEvent) => {
        console.log('room message:', event.data);
        let message: unknown;
        try {
            message = JSON.parse(event.data);
        } catch (error) {
            console.error('Invalid room message json');
            return
        }

        if (typeof message !== 'object' ||
            message === null ||
            !('type' in message)
        ) {
            return;
        }

        if (message.type === 'pong') {
            const heartbeat = roomHeartbeats.get(socket);
            if (heartbeat) {
                heartbeat.waitingForPong = false;
            }
            return;
        }

        if (message.type === 'error') {
            console.log('room server error:', message);
            return
        }

        if (!('roomId' in message) || message.roomId !== roomId) {
            return;
        }

        if (message.type === 'joined') {
            const heartbeat = roomHeartbeats.get(socket);
            if (heartbeat) {
                heartbeat.joined = true;
                heartbeat.waitingForPong = false;
                heartbeat.lastPingAt = performance.now();
            }
            onJoined(socket);
            return;
        }

        if (message.type === 'gift' && 'gift' in message) {
            const gift = message.gift as RoomGift;
            if (
                typeof gift !== 'object' ||
                gift === null ||
                !('id' in gift) ||
                typeof gift.id !== 'string' ||
                !('nickname' in gift) ||
                typeof gift.nickname !== 'string' ||
                !('giftId' in gift) ||
                typeof gift.giftId !== 'string' ||
                !('giftName' in gift) ||
                typeof gift.giftName !== 'string' ||
                !('giftIcon' in gift) ||
                typeof gift.giftIcon !== 'string' ||
                !('createdAt' in gift) ||
                typeof gift.createdAt !== 'number' ||
                !Number.isFinite(gift.createdAt)
            ) {
                return;
            }
            onGift(gift);
        }

        if (message.type === 'viewerCount') {
            if ('viewerCount' in message &&
                typeof message.viewerCount === 'number' &&
                Number.isSafeInteger(message.viewerCount) &&
                message.viewerCount >= 0
            ) {
                onViewerCount(message.viewerCount);
                return;
            }
        }

        if (message.type === 'comment' && 'comment' in message) {
            const comment = message.comment;
            if (typeof comment !== 'object' ||
                comment === null ||
                !('id' in comment) ||
                typeof comment.id !== 'string' ||
                !('nickname' in comment) ||
                typeof comment.nickname !== 'string' ||
                !('content' in comment) ||
                typeof comment.content !== 'string' ||
                !('createdAt' in comment) ||
                typeof comment.createdAt !== 'number' ||
                !Number.isFinite(comment.createdAt)
            ) {
                return;
            }

            onComment(JSON.parse(JSON.stringify(comment)));
        }

        if (message.type === 'likeCount') {
            if (
                'likeCount' in message &&
                typeof message.likeCount === 'number' &&
                Number.isSafeInteger(message.likeCount) &&
                message.likeCount >= 0
            ) {
                onLikeCount(message.likeCount);
            }
            return;
        }

    }


    socket.onerror = () => {
        onViewerCount(null);
        onLikeCount(null);
        console.log('room websocket connection failed');
    }

    socket.onclose = () => {
        stopRoomHeartbeat(socket);
        onViewerCount(null);
        onLikeCount(null);
        onclose(socket);
    }

    return socket;
}

export const disconnectFromRoom = (socket: WebSocket) => {
    stopRoomHeartbeat(socket);
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null
    socket.close();
}

export const sendRoomComment = (
    socket: WebSocket,
    nickname: string,
    content: string
): void => {
    if (socket.readyState !== WebSocket.OPEN) {
        throw new Error('Not ready. Try again.');
    }

    const trimmedNickname = nickname.trim();
    const trimmedContent = content.trim();

    if (
        trimmedNickname.length === 0 ||
        trimmedNickname.length > 20
    ) {
        throw new Error('Name needs 1-20 chars.');
    }

    if (
        trimmedContent.length === 0 ||
        trimmedContent.length > 200
    ) {
        throw new Error('Comment needs 1-200 chars.');
    }

    socket.send(JSON.stringify({
        type: 'comment',
        nickname: trimmedNickname,
        content: trimmedContent
    }));
};

export const sendRoomLike = (
    socket: WebSocket,
    count: number
) => {
    if (socket.readyState !== WebSocket.OPEN) {
        throw new Error('socket fail, try agin');
        return
    }
    if (
        !Number.isSafeInteger(count) ||
        count < 1 ||
        count > 100
    ) {
        throw new Error('like must be between 1 and 100');
        return;
    }

    socket.send(JSON.stringify({
        type: 'like',
        count
    }));
}
