import app from './app';
import { createServer } from 'node:http';
import WebSocket, { WebSocketServer } from 'ws';
import { getRoomById } from './services/roomService';
import { joinRoom, leaveRoom, sendRoomComment, sendRoomLike } from './services/roomSocketService';

const port = Number(process.env.PORT) || 3000;

const server = createServer(app);

const aliveSockets = new Set<WebSocket>();

const wss = new WebSocketServer({
    server,
    path: '/ws'
});

const heartbeatTimer = setInterval(() => {
    for (const socket of wss.clients) {
        if (socket.readyState !== WebSocket.OPEN) {
            continue;
        }
        if (!aliveSockets.has(socket)) {
            socket.terminate();
            continue;
        }
        aliveSockets.delete(socket);
        socket.ping();
    }
}, 5000);

wss.on('connection', (socket) => {

    aliveSockets.add(socket);

    socket.on('pong', () => {
        aliveSockets.add(socket);
    });

    console.log('webSocket client connected');

    socket.send(JSON.stringify({
        type: 'connected',
        message: 'webSocket connected'
    }));

    socket.on('message', (data) => {
        let message: unknown;
        try {
            message = JSON.parse(data.toString());
        } catch (error) {
            socket.send(JSON.stringify({
                type: 'error',
                message: 'Invalid JSON'
            }));
            return;
        }
        if (typeof message !== 'object' || 
            message === null ||
            !('type' in message)) {
            socket.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message'
            }));
            return;
        }

        if (message.type === 'ping') {
            socket.send(JSON.stringify({
                type: 'pong'
            }))
            return;
        }

        if (message.type === 'comment') {
            if (!('nickname' in message) ||
                typeof message.nickname !== 'string' ||
                !('content' in message) ||
                typeof message.content !== 'string') {
                socket.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid comment message'
                }));
                return;
            }

            sendRoomComment(socket, message.nickname, message.content);
            return;
        }

        if (message.type === 'like') {
            if (!('count' in message) || typeof message.count !== 'number') {
                socket.send(JSON.stringify({
                    type: 'error',
                    message: 'invalid like message'
                }));
                return;
            }
            sendRoomLike(socket, message.count);
            return;
        }

        if (message.type !== 'join' ||
            !('roomId' in message) ||
            typeof message.roomId !== 'string') {
            socket.send(JSON.stringify({
                type: 'error',
                message: 'Invalid join message'
            }));
            return;
        }

        const room = getRoomById(message.roomId);
        if (!room) {
            socket.send(JSON.stringify({
                type: 'error',
                message: 'room not found'
            }));
            return;
        }
        joinRoom(socket, room.id);
        socket.send(JSON.stringify({
            type: 'joined',
            roomId: room.id
        }));
        console.log('client joined room:', room.id);
    });

    socket.on('close', () => {
        aliveSockets.delete(socket);
        leaveRoom(socket);
        console.log('Client disconnected');
    });

    socket.on('error', (error) => {
        console.error('websocket error:', error);
    });
});

wss.on('close', () => {
    clearInterval(heartbeatTimer);
    aliveSockets.clear();
});

server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
