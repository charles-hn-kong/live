import { ROOM_WS_URL } from "./config"

export const connectToRoom = (roomId: string): WebSocket => {
    const socket = new WebSocket(ROOM_WS_URL);
    socket.onopen = () => {
        socket.send(JSON.stringify({
            type: 'join',
            roomId
        }));
    }

    socket.onmessage = (event: MessageEvent) => {
        console.log('room message:', event.data);
    }

    socket.onerror = () => {
        console.log('room websocket connection failed');
    }

    return socket;
}

export const disconnectFromRoom = (socket: WebSocket) => {
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.close();
}