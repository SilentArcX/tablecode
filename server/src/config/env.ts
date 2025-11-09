// config/env.ts
import dotenv from 'dotenv';

// .env 파일의 환경 변수들을 process.env로 로드
dotenv.config();

// 환경 변수 로드
export const ENV = process.env.NODE_ENV || (() => {
    console.warn('⚠️ NODE_ENV not set, defaulting to "development".');
    return 'development';
})();

// 포트 번호 로드
export const PORT = Number(process.env.PORT) || (() => {
    console.warn('⚠️ PORT not set, defaulting to 3000.');
    return 3000;
})();

// 빈 문자열 제거 및 공백 제거
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);