import { db } from "./db";
import fs from "fs";
import path from "path";

export async function initMenuTable() {
	try {
		const sqlFilePath = path.join(__dirname, "migrations", "001_create_menu.sql");
		const sql = fs.readFileSync(sqlFilePath, "utf-8");

		await db.query(sql);
		console.log("menu 테이블 초기화 완료");

		// 샘플 데이터 삽입
		const sampleMenus = [
			{ name: "아메리카노", price: 3000 },
			{ name: "카페라떼", price: 3500 },
			{ name: "샌드위치", price: 5000 }
		];

		for (const item of sampleMenus) {
			await db.query("INSERT INTO menu (name, price) VALUES (?, ?)", [item.name, item.price]);
			console.log(`샘플 메뉴 추가: ${item.name} (${item.price}원)`);
		}

		console.log("샘플 데이터 추가 완료");
	} catch (err) {
		console.error("menu 초기화 실패:", err);
		process.exit(1);
	}
}