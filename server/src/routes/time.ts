import { Router, type Request, Response } from 'express';

type TimeResponse = {
    serverTime: number;
}

const router = Router();

router.get('/', (_req: Request, res: Response<TimeResponse>) => {
    res.set('Cache-Control', 'no-store');
    res.json({
        serverTime: Date.now()
    });
});

export default router;
