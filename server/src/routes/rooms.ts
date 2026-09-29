import { Router, type Request, type Response } from 'express';
import { getRooms, getRoomById } from '../services/roomService';
import type { LiveRoom, LiveRoomSummary } from '../types/liveRoom';


type ErrorResponse = {
    message: string;
}

const router = Router();

router.get('/', (req: Request, res: Response<LiveRoom | LiveRoomSummary[] | ErrorResponse>) => {
    const id = typeof req.query.id === 'string' ? req.query.id : undefined;
    if (!id) {
        const rooms = getRooms();
        res.json(rooms);
        return;
    }

    const room = getRoomById(id);

    if (!room) {
        res.status(404).json({message: 'room not found'})
        return;
    }

    res.json(room);


});

export default router;