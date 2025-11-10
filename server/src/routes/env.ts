// src/routes/env.ts
import { Router } from 'express';
import { ENV, PORT, ALLOWED_ORIGINS } from '../config/env';

const router = Router();

router.get('/', (_req, res) => {
	res.json({
		environment: ENV || 'No environment info',
		port: PORT || 'No port info',
		allowedOrigins: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : 'No allowed origins'
	});
});

export default router;