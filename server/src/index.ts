// index.ts

// 외부 라이브러리 임포트
import express from 'express';
import cors from 'cors';

// 내부 모듈 임포트
import { ENV, PORT, ALLOWED_ORIGINS } from './config/env';
import statsRoutes from './routes/stats';

// Express 앱 생성
const app = express();

// CORS 설정: 허용된 origin만 통과, 그 외는 경고
app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// JSON 파싱
app.use(express.json());

// 환경 정보 확인용 라우트
app.get('/env', (_req, res) => {
  res.json({
    environment: ENV || 'No environment info',
    port: PORT || 'No port info',
    allowedOrigins: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : 'No allowed origins'
  });
});

// -------------------------------
// 서버 시작 함수
// -------------------------------
async function startServer() {
  try {
    app.use('/stats', statsRoutes);

    app.listen(PORT, async () => {
      const url = `http://localhost:${PORT}`;
      console.log(`\n${ENV} Server running on port ${PORT}`);
      console.log(`→ ${url}/stats`);

      console.log(`\nAllowed Origins:`);
      ALLOWED_ORIGINS.forEach(origin => console.log(`   - ${origin}`));
      console.log('');
    });

  } catch (err) {
    console.error("서버 시작 실패:", err);
    process.exit(1);
  }
}

// 서버 실행
startServer();