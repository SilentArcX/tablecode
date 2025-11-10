// src/index.ts
import express from 'express';
import cors from 'cors';
import { PORT, ALLOWED_ORIGINS } from './config/env';

//  Routes
import envRoutses from './routes/env';
import timeRoutes from './routes/time';

// Express 앱 생성
const app = express();

// CORS
app.use(cors({
	origin(origin, callback) {
		if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true);
		else {
			console.warn(`[CORS] Blocked origin: ${origin}`);
			callback(new Error('Not allowed by CORS'));
		}
	}
}));

app.use(express.json());

app.use('/env', envRoutses);
app.use('/time', timeRoutes);

// -------------------------------
// 서버 시작 함수
// -------------------------------
async function startServer() {
	try {
		app.listen(PORT, () => console.log(`→ http://localhost:${PORT}/env : 환경 정보 확인\n`));
	} catch (err) {
		console.error("서버 시작 실패:", err);
		process.exit(1);
	}
}

// 서버 실행
startServer();