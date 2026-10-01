import WebSocket from "ws";

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