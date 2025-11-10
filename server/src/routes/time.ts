// src/routes/time.ts
import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
	res.json({ serverTime: new Date().toISOString() });
});

export default router;