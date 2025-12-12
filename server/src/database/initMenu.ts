// src/database/initMenu.ts
import { db } from "./db";
import fs from "fs";
import path from "path";

export async function initMenuTable() {
    const sqlFiles = ["001_create_product.sql", "002_create_order.sql"];
    
    // 현재 실행되는 파일의 위치를 찍어봅니다.
    console.log("📂 현재 실행 경로(__dirname):", __dirname);
    console.log("🚀 DB 테이블 점검 시작...");

    try {
        for (const fileName of sqlFiles) {
            const sqlFilePath = path.join(__dirname, "migrations", fileName);
            
            if (!fs.existsSync(sqlFilePath)) {
                // ... (파일 없음 처리) ...
                continue;
            }

            const sql = fs.readFileSync(sqlFilePath, "utf-8");
            
            // [수정된 로직]
            // 1. 주석 제거 (-- ... 및 /* ... */)
            // 2. 세미콜론(;)으로 분리
            const queries = sql
                .replace(/--.*$/gm, '')       // 한 줄 주석(--) 제거
                .replace(/\/\*[\s\S]*?\*\//g, '') // 여러 줄 주석(/* */) 제거
                .split(';')
                .map(q => q.trim())
                .filter(q => q.length > 0);   // 공백만 남은 쿼리 제거

            console.log(`⚙️ ${fileName}: 실행할 쿼리 ${queries.length}개 발견`);

            for (const query of queries) {
                await db.query(query);
            }
            
            console.log(`✅ 실행 완료: ${fileName}`);
        }
        
        console.log("🎉 모든 테이블 초기화 완료!");

    } catch (err) {
        console.error("❌ 치명적 에러 발생:", err);
        process.exit(1); 
    }
}