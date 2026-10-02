import app from './app';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { getRoomById } from './services/roomService';
import { joinRoom, leaveRoom, sendRoomComment } from './services/roomSocketService';

const port = Number(process.env.PORT) || 3000;

const server = createServer(app);

const wss = new WebSocketServer({
    server,
    path: '/ws'
});

wss.on('connection', (socket) => {
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
        leaveRoom(socket);
        console.log('Client disconnected');
    });

    socket.on('error', (error) => {
        console.error('websocket error:', error);
    });
});

server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
