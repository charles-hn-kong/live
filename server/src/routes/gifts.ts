import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { gifts } from '../data/gifts';
import { getRoomById } from '../services/roomService';
import { broadcastRoomGift } from '../services/roomSocketService';
import type { GiftItem, RoomGift } from '../types/liveRoom';

type ErrorResponse = {
    mesasage: string
}

const router = Router();

router.get('/', (_req: Request, res: Response<GiftItem[]>) => {
    res.json(gifts);
});

router.post('/', (
    request: Request,
    res: Response
) => {
    const body: unknown = request.body;
    if (
        typeof body !== 'object' ||
        body === null ||
        !('roomId' in body) ||
        typeof body.roomId !== 'string' ||
        !('giftId' in body) ||
        typeof body.giftId !== 'string' ||
        !('nickname' in body) ||
        typeof body.nickname !== 'string'
    ) {
        res.status(400).json({
            message: 'Invalid gift request'
        });
        return
    }
    const nickname = body.nickname.trim();
    if (nickname.length === 0 || nickname.length > 20) {
        res.status(400).json({
            message: 'nickname must be 1-20 char'
        });
        return;
    }
    const room = getRoomById(body.roomId);
    if (!room) {
        res.status(400).json({
            message: 'room not found'
        });
        return;
    }
    const giftItem = gifts.find(item => item.id === body.giftId);
    if (!giftItem) {
        res.status(400).json({
            message: 'gift not found'
        });
        return;
    }
    const gift: RoomGift = {
        id: randomUUID(),
        nickname,
        giftId: giftItem.id,
        giftName: giftItem.name,
        giftIcon: giftItem.icon,
        createdAt: Date.now()
    }
    broadcastRoomGift(room.id, gift);
    res.status(201).json(gift);
});

export default router;