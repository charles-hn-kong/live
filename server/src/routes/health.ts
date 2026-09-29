import { Router } from 'express';
import type { Request, Response } from 'express';

type HealthResponse = {
    status: 'ok';
}

const router = Router();

router.get('/health', (_reg: Request, res: Response<HealthResponse>) => {
    return res.json({status: 'ok'});
});

export default router;