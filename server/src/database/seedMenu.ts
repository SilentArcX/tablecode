// src/database/seedMenu.ts
import { db } from "./db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

interface CountResult extends RowDataPacket {
    count: number;
}

export async function seedMenuData() {
    try {
        // 1. 이미 데이터가 있는지 확인
        const [categoryCount] = await db.query<CountResult[]>(
            'SELECT COUNT(*) as count FROM Category'
        );

        if (categoryCount[0].count > 0) {
            console.log('ℹ️  이미 초기 데이터가 존재합니다. 스킵합니다.');
            return;
        }

        console.log('🌱 초기 데이터 삽입 시작...');

        // [1] 카테고리 생성
        const [catResult] = await db.query<ResultSetHeader>(`
            INSERT INTO Category (name) VALUES ('커피'), ('음료')
        `);
        const coffeeId = catResult.insertId; // '커피'의 ID
        const drinkId = coffeeId + 1;        // '음료'의 ID

        console.log('  ✓ 카테고리 생성 완료');

        // [2] 옵션 그룹 생성
        // 온도 옵션 그룹 (아메리카노, 라떼용)
        const [tempGroupResult] = await db.query<ResultSetHeader>(`
            INSERT INTO OptionGroup (name, is_required, is_multi_select) 
            VALUES ('온도', true, false)
        `);
        const tempGroupId = tempGroupResult.insertId;

        // 샷 추가 옵션 그룹 (모든 메뉴용)
        const [shotGroupResult] = await db.query<ResultSetHeader>(`
            INSERT INTO OptionGroup (name, is_required, is_multi_select) 
            VALUES ('샷 추가', false, false)
        `);
        const shotGroupId = shotGroupResult.insertId;

        console.log('  ✓ 옵션 그룹 생성 완료');

        // [3] 상품 생성
        // 아메리카노
        const [americanoResult] = await db.query<ResultSetHeader>(`
            INSERT INTO Product (category_id, name, price, status)
            VALUES (?, '아메리카노', 2000, 'ON_SALE')
        `, [coffeeId]);
        const americanoId = americanoResult.insertId;

        // 아이스티
        const [icedTeaResult] = await db.query<ResultSetHeader>(`
            INSERT INTO Product (category_id, name, price, status)
            VALUES (?, '아이스티', 2500, 'ON_SALE')
        `, [drinkId]);
        const icedTeaId = icedTeaResult.insertId;

        // 라떼
        const [latteResult] = await db.query<ResultSetHeader>(`
            INSERT INTO Product (category_id, name, price, status)
            VALUES (?, '라떼', 3000, 'ON_SALE')
        `, [coffeeId]);
        const latteId = latteResult.insertId;

        console.log('  ✓ 상품 생성 완료');

        // [4] 옵션 생성
        // 온도 옵션
        await db.query(`
            INSERT INTO \`Option\` (option_group_id, name, price, status)
            VALUES 
            (?, 'HOT', 0, 'ON_SALE'),
            (?, 'ICE', 0, 'ON_SALE')
        `, [tempGroupId, tempGroupId]);

        // 샷 추가 옵션
        await db.query(`
            INSERT INTO \`Option\` (option_group_id, name, price, status)
            VALUES 
            (?, '샷 추가 안함', 0, 'ON_SALE'),
            (?, '샷 추가 (+500원)', 500, 'ON_SALE')
        `, [shotGroupId, shotGroupId]);

        console.log('  ✓ 옵션 생성 완료');

        // [5] 상품-옵션 그룹 연결
        // 아메리카노: 온도 + 샷 추가
        await db.query(`
            INSERT INTO ProductOption (product_id, option_group_id)
            VALUES 
            (?, ?),
            (?, ?)
        `, [americanoId, tempGroupId, americanoId, shotGroupId]);

        // 아이스티: 샷 추가만
        await db.query(`
            INSERT INTO ProductOption (product_id, option_group_id)
            VALUES (?, ?)
        `, [icedTeaId, shotGroupId]);

        // 라떼: 온도 + 샷 추가
        await db.query(`
            INSERT INTO ProductOption (product_id, option_group_id)
            VALUES 
            (?, ?),
            (?, ?)
        `, [latteId, tempGroupId, latteId, shotGroupId]);

        console.log('  ✓ 상품-옵션 연결 완료');
        console.log('✅ 초기 데이터 삽입 완료!');
        console.log('   - 아메리카노: 온도 선택 + 샷 추가');
        console.log('   - 아이스티: 샷 추가만');
        console.log('   - 라떼: 온도 선택 + 샷 추가');

    } catch (err) {
        console.error("❌ 초기 데이터 삽입 실패:", err);
        throw err;
    }
}