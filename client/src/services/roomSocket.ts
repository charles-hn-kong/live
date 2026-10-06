import { ROOM_WS_URL } from "./config"
import type { RoomComment, RoomGift } from "../types/liveRoom";

type ViewerCountHandle = (viewerCount: number | null) => void;
type CommentHandler = (comment: RoomComment) => void;
type LikeCountHandler = (likeCount: number | null) => void;
type GiftHandler = (gift: RoomGift) => void;

export const connectToRoom = (
    roomId: string,
    onViewerCount: ViewerCountHandle,
    onComment: CommentHandler,
    onLikeCount: LikeCountHandler,
    onGift: GiftHandler
): WebSocket => {
    const socket = new WebSocket(ROOM_WS_URL);
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

        if (message.type === 'error') {
            console.log('room server error:', message);
            return
        }

        if (!('roomId' in message) || message.roomId !== roomId) {
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
        onViewerCount(null);
        onLikeCount(null);
    }

    return socket;
}

export const disconnectFromRoom = (socket: WebSocket) => {
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
