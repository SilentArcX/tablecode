// src/index.ts
import express from 'express';
import cors from 'cors';
import { PORT, ALLOWED_ORIGINS } from './config/env';

//  Routes
import envRoutses from './routes/env';
import timeRoutes from './routes/time';
import menuRoutes from './routes/menu';
import orderRoutes from './routes/order';

// DB
import { ensureDB } from "./database/ensureDB";
import { initMenuTable } from './database/initMenu';
import { seedMenuData } from './database/seedMenu';

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
app.use('/menu', menuRoutes);
app.use('/order', orderRoutes);

// -------------------------------
// 서버 시작 함수
// -------------------------------
async function startServer() {
	try {
		// DB 초기화
		await ensureDB();
		await initMenuTable();
		await seedMenuData();
		// 서버 시작
		app.listen(PORT, () => console.log(`→ http://localhost:${PORT}/menu\n`));
	} catch (err) {
		console.error("서버 시작 실패:", err);
		process.exit(1);
	}
}

// 서버 실행
startServer();