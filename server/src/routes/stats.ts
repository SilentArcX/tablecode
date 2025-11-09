// routes/stats.ts
import { Router } from 'express';
import { getSystemUsage } from '../utils/monitoring';
import { timeStamp } from 'console';

const router = Router();

router.get('/', async (_req, res) => {
    try {
        const usage = await getSystemUsage();
        const stats = {
            cpu: usage.cpu,
            ram: usage.ram,
            timeStamp: new Date().toISOString(),
        };
        res.json(stats);
    } catch (err) {
        console.error('Failed to get system stats:', err);
        res.status(500).json({ error: 'Failed to get system stats' });
    }
});

export default router;