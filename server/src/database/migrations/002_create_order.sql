-- 002_create_order.sql

-- 1. 주문 (Order)
-- 키오스크 ID, 전체 금액, 주문 번호 등을 관리
CREATE TABLE IF NOT EXISTS `Order` (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL COMMENT '주문 번호 (예: 20240501-001)',
    kiosk_id INT NOT NULL COMMENT '키오스크 식별 ID',
    total_price INT NOT NULL COMMENT '총 주문 금액',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_created_at (created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 2. 결제 (Payment)
-- 주문과 1:1 관계 (분할 결제 없을 시), 결제 상태 및 수단 저장
CREATE TABLE IF NOT EXISTS Payment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    payment_method VARCHAR(20) NOT NULL COMMENT 'CARD, CASH, ETC',
    amount INT NOT NULL,
    status ENUM('PENDING', 'PAID', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES `Order`(id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 3. 주문 상태 이력 (OrderStatusHistory)
-- 주문의 생명주기(수락 -> 조리 -> 완료 -> 취소) 로그 저장
CREATE TABLE IF NOT EXISTS OrderStatusHistory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    status ENUM('ACCEPTED', 'READY', 'COMPLETED', 'CANCELLED') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_order FOREIGN KEY (order_id) REFERENCES `Order`(id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 4. 주문 상품 (OrderItem)
-- 어떤 상품을 몇 개 시켰는지 저장 (가격 스냅샷 포함)
CREATE TABLE IF NOT EXISTS OrderItem (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price INT NOT NULL COMMENT '주문 시점의 상품 단가',
    CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES `Order`(id),
    CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES Product(id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 5. 주문 상품 옵션 (OrderItemOption)
-- 특정 주문 상품에 어떤 옵션이 붙었는지 저장 (가격 스냅샷 포함)
CREATE TABLE IF NOT EXISTS OrderItemOption (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_item_id BIGINT NOT NULL,
    option_id BIGINT NOT NULL,
    price INT NOT NULL COMMENT '주문 시점의 옵션 가격',
    CONSTRAINT fk_oio_order_item FOREIGN KEY (order_item_id) REFERENCES OrderItem(id),
    CONSTRAINT fk_oio_option FOREIGN KEY (option_id) REFERENCES `Option`(id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;