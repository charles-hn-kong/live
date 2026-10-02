import { ROOM_WS_URL } from "./config"
import type { RoomComment } from "../types/liveRoom";

type ViewerCountHandle = (viewerCount: number | null) => void;
type CommentHandler = (comment: RoomComment) => void;

export const connectToRoom = (roomId: string, onViewerCount: ViewerCountHandle, onComment: CommentHandler): WebSocket => {
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
        
    }
    

    socket.onerror = () => {
        onViewerCount(null);
        console.log('room websocket connection failed');
    }

    socket.onclose = () => {
        onViewerCount(null);
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
        throw new Error('连接尚未就绪，请稍后再试');
    }

    const trimmedNickname = nickname.trim();
    const trimmedContent = content.trim();

    if (
        trimmedNickname.length === 0 ||
        trimmedNickname.length > 20
    ) {
        throw new Error('昵称需要填写 1～20 个字符');
    }

    if (
        trimmedContent.length === 0 ||
        trimmedContent.length > 200
    ) {
        throw new Error('评论需要填写 1～200 个字符');
    }

    socket.send(JSON.stringify({
        type: 'comment',
        nickname: trimmedNickname,
        content: trimmedContent
    }));
};