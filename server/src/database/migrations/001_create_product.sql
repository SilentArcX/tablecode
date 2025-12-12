--DROP TABLE IF EXISTS ProductOption;
--DROP TABLE IF EXISTS `Option`;
--DROP TABLE IF EXISTS Product;
--DROP TABLE IF EXISTS OptionGroup;
--DROP TABLE IF EXISTS Category;
-- 1. 카테고리 (Category)
CREATE TABLE IF NOT EXISTS Category (
	id BIGINT AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(100) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 2. 옵션 그룹 (OptionGroup)
CREATE TABLE IF NOT EXISTS OptionGroup (
	id BIGINT AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(100) NOT NULL,
	is_required BOOLEAN NOT NULL DEFAULT FALSE,
	is_multi_select BOOLEAN NOT NULL DEFAULT FALSE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 3. 상품 (Product)
CREATE TABLE IF NOT EXISTS Product (
	id BIGINT AUTO_INCREMENT PRIMARY KEY,
	category_id BIGINT NOT NULL,
	name VARCHAR(100) NOT NULL,
	price INT NOT NULL,
	status ENUM('ON_SALE', 'SOLD_OUT', 'OFF_MENU') NOT NULL DEFAULT 'ON_SALE',
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES Category(id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 4. 옵션 (Option) -> 예약어 충돌 방지를 위해 백틱(`) 사용
CREATE TABLE IF NOT EXISTS `Option` (
	id BIGINT AUTO_INCREMENT PRIMARY KEY,
	option_group_id BIGINT,
	name VARCHAR(100) NOT NULL,
	price INT NOT NULL,
	status ENUM('ON_SALE', 'SOLD_OUT', 'OFF_MENU') NOT NULL DEFAULT 'ON_SALE',
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_option_group FOREIGN KEY (option_group_id) REFERENCES OptionGroup(id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 5. 상품-옵션그룹 연결 (ProductOption)
CREATE TABLE IF NOT EXISTS ProductOption (
	product_id BIGINT NOT NULL,
	option_group_id BIGINT NOT NULL,
	PRIMARY KEY (product_id, option_group_id),
	CONSTRAINT fk_po_product FOREIGN KEY (product_id) REFERENCES Product(id),
	CONSTRAINT fk_po_option_group FOREIGN KEY (option_group_id) REFERENCES OptionGroup(id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;