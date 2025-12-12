// src/routes/order.ts
import { Router } from 'express';
import { ResultSetHeader } from 'mysql2';
import { db } from '../database/db';

const router = Router();

// --- [Interfaces] 요청 데이터 구조 정의 ---

interface OrderItemOptionRequest {
    option_id: number;
    price: number;
}

interface OrderItemRequest {
    product_id: number;
    quantity: number;
    price: number;
    options: OrderItemOptionRequest[];
}

interface CreateOrderRequest {
    kiosk_id: number;
    total_price: number;
    payment_method: string;
    items: OrderItemRequest[];
}

// --- [Routes] API 라우트 정의 ---

/**
 * 1. 주문 생성 (POST /order)
 * - 트랜잭션을 사용하여 주문, 결제, 상품, 옵션 정보를 일괄 저장합니다.
 */
router.post('/', async (req, res) => {
    const conn = await db.getConnection();

    try {
        const { kiosk_id, total_price, payment_method, items }: CreateOrderRequest = req.body;

        await conn.beginTransaction();

        // (1) 주문 번호 생성 (YYYYMMDD-Timestamp)
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const orderNumber = `${datePart}-${Date.now().toString().slice(-6)}`;

        // (2) Order 테이블 저장
        const [orderResult] = await conn.query<ResultSetHeader>(
            'INSERT INTO `Order` (order_number, kiosk_id, total_price) VALUES (?, ?, ?)',
            [orderNumber, kiosk_id, total_price]
        );
        const orderId = orderResult.insertId;

        // (3) Payment 테이블 저장 (결제 완료 'PAID'로 가정)
        await conn.query(
            'INSERT INTO Payment (order_id, payment_method, amount, status) VALUES (?, ?, ?, ?)',
            [orderId, payment_method, total_price, 'PAID']
        );

        // (4) OrderStatusHistory 테이블 저장 (초기 상태 'ACCEPTED')
        await conn.query(
            'INSERT INTO OrderStatusHistory (order_id, status) VALUES (?, ?)',
            [orderId, 'ACCEPTED']
        );

        // (5) 상품 및 옵션 저장
        for (const item of items) {
            const [itemResult] = await conn.query<ResultSetHeader>(
                'INSERT INTO OrderItem (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.price]
            );
            const orderItemId = itemResult.insertId;

            if (item.options && item.options.length > 0) {
                for (const option of item.options) {
                    await conn.query(
                        'INSERT INTO OrderItemOption (order_item_id, option_id, price) VALUES (?, ?, ?)',
                        [orderItemId, option.option_id, option.price]
                    );
                }
            }
        }

        await conn.commit();
        console.log(`Order created: ${orderId} (${orderNumber})`);
        
        res.status(201).json({ 
            message: 'Order created successfully',
            orderId: orderId,
            orderNumber: orderNumber
        });

    } catch (error) {
        await conn.rollback();
        console.error('Order creation error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    } finally {
        conn.release();
    }
});

/**
 * 2. 주문 목록 조회 (GET /order)
 * - 최근 주문 50개를 조회합니다. (POS 메인 화면용)
 */
router.get('/', async (req, res) => {
    try {
        // [수정 포인트] 서브쿼리를 사용하여 OrderStatusHistory에서 가장 최신(DESC LIMIT 1) 상태를 가져옴
        const [orders] = await db.query(
            `SELECT 
                o.id, 
                o.order_number, 
                o.total_price, 
                o.created_at,
                p.status as payment_status,
                (SELECT status FROM OrderStatusHistory WHERE order_id = o.id ORDER BY id DESC LIMIT 1) as current_status
             FROM \`Order\` o
             LEFT JOIN Payment p ON o.id = p.order_id
             ORDER BY o.created_at DESC 
             LIMIT 50`
        );
        res.json(orders);
    } catch (error) {
        console.error('Order list fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch order list' });
    }
});

/**
 * 3. 주문 상세 조회 (GET /order/:orderId)
 * - 특정 주문의 상품, 옵션 내역을 포함한 상세 정보를 조회합니다. (영수증용)
 */
router.get('/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;

        // (1) 주문 헤더 정보 조회
        const [orders] = await db.query<any[]>(
            `SELECT 
                o.*, 
                p.payment_method, 
                p.status as payment_status,
                (SELECT status FROM OrderStatusHistory WHERE order_id = o.id ORDER BY id DESC LIMIT 1) as current_status
             FROM \`Order\` o
             LEFT JOIN Payment p ON o.id = p.order_id
             WHERE o.id = ?`,
            [orderId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const order = orders[0];

        // (2) 주문 상품 및 옵션 조회 (Flattened Data)
        const [rows] = await db.query<any[]>(
            `SELECT 
                oi.id as item_id,
                oi.quantity,
                oi.price as item_price,
                p.name as product_name,
                oio.id as item_option_id,
                oio.price as option_price,
                opt.name as option_name
             FROM OrderItem oi
             JOIN Product p ON oi.product_id = p.id
             LEFT JOIN OrderItemOption oio ON oi.id = oio.order_item_id
             LEFT JOIN \`Option\` opt ON oio.option_id = opt.id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        // (3) 데이터 구조화 (Flat -> Nested)
        const itemsMap = new Map();

        rows.forEach(row => {
            if (!itemsMap.has(row.item_id)) {
                itemsMap.set(row.item_id, {
                    itemId: row.item_id,
                    productName: row.product_name,
                    quantity: row.quantity,
                    itemPrice: row.item_price,
                    options: []
                });
            }

            if (row.item_option_id) {
                const item = itemsMap.get(row.item_id);
                item.options.push({
                    optionName: row.option_name,
                    optionPrice: row.option_price
                });
            }
        });

        // (4) 최종 응답
        const result = {
            orderId: order.id,
            orderNumber: order.order_number,
            totalPrice: order.total_price,
            paymentMethod: order.payment_method,
            paymentStatus: order.payment_status,
            currentStatus: order.current_status || 'ACCEPTED', // 없으면 기본값
            orderedAt: order.created_at,
            items: Array.from(itemsMap.values())
        };

        res.json(result);

    } catch (error) {
        console.error('Order detail fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch order detail' });
    }
});

/**
 * 4. 주문 상태 변경 (PATCH /order/:orderId/status)
 * - 주문의 진행 상태(접수, 준비중, 완료 등)를 변경하고 이력을 남깁니다.
 * - Body 예시: { "status": "READY" }
 */
router.patch('/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        // 상태값 유효성 검사
        const ALLOWED_STATUSES = ['ACCEPTED', 'READY', 'COMPLETED', 'CANCELLED'];
        
        if (!status || !ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({ 
                error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` 
            });
        }

        // 상태 이력 추가 (History 테이블에 INSERT)
        await db.query<ResultSetHeader>(
            'INSERT INTO OrderStatusHistory (order_id, status) VALUES (?, ?)',
            [orderId, status]
        );

        console.log(`Order ${orderId} status updated to: ${status}`);

        res.json({ 
            message: 'Order status updated successfully',
            currentStatus: status 
        });

    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

export default router;