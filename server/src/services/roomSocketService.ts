import WebSocket from "ws";
import { randomUUID } from "node:crypto";

const roomConnection = new Map<WebSocket, string>();

const broadcastViewerCount = (roomId: string) => {
    let viewerCount = 0;
    for (const [socket, currentRoomId] of roomConnection) {
        if (currentRoomId === roomId && socket.readyState === WebSocket.OPEN) {
            viewerCount += 1;
        }
    }

    const message = JSON.stringify({
        type: 'viewerCount',
        roomId,
        viewerCount
    });

    for (const [socket, currentRoomId] of roomConnection) {
        if (currentRoomId === roomId && socket.readyState === WebSocket.OPEN) {
            socket.send(message);
        } 
    }
}

export const joinRoom = (socket: WebSocket, roomId: string) => {
    const previousRoomId = roomConnection.get(socket);
    roomConnection.set(socket, roomId);
    if (previousRoomId !== undefined && previousRoomId !== roomId) {
        broadcastViewerCount(previousRoomId);
    }
    broadcastViewerCount(roomId);
}

export const leaveRoom = (socket: WebSocket) => {
    const roomId = roomConnection.get(socket);
    roomConnection.delete(socket);
    if (roomId !== undefined) {
        broadcastViewerCount(roomId);
    }
}

export const sendRoomComment = (
    socket: WebSocket,
    nickname: string,
    content: string
) => {
    
    const roomId = roomConnection.get(socket);

    if (roomId === undefined) {
        socket.send(JSON.stringify({
            type: 'error',
            message: 'Join a room before commenting'
        }));
        return;
    }

    // 去掉首尾空白，再检查昵称和正文长度。
    const trimmedNickname = nickname.trim();
    const trimmedContent = content.trim();

    if (trimmedNickname.length === 0 ||
        trimmedNickname.length > 20 ||
        trimmedContent.length === 0 ||
        trimmedContent.length > 200) {
        socket.send(JSON.stringify({
            type: 'error',
            message: 'Nickname must be 1–20 characters; comment must be 1–200 characters'
        }));
        return;
    }

    const message = JSON.stringify({
        type: 'comment',
        roomId,
        comment: {
            // 仅作为评论的唯一 ID，不管理用户身份。
            id: randomUUID(),
            nickname: trimmedNickname,
            content: trimmedContent,
            createdAt: Date.now()
        }
    });

    for (const [client, currentRoomId] of roomConnection) {
        if (currentRoomId === roomId && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
};
