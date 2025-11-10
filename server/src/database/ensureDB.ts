// src/database/ensureDB.ts
import mysql from "mysql2/promise";

export async function ensureDB(): Promise<void> {
	const dbName = process.env.DB_NAME;
	if (!dbName) throw new Error("DB_NAME이 .env에 정의되어 있지 않습니다.");

	try {
		const connection = await mysql.createConnection({
			host: process.env.DB_HOST,
			port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
			user: process.env.DB_USER,
			password: process.env.DB_PASS
		});

		await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
		console.log(`✅ 데이터베이스 '${dbName}' 확인/생성 완료`);
		await connection.end();

	} catch (err) {
		console.error("DB 확인/생성 실패:", err);
		process.exit(1);
	}
}