// src/routes/menu.ts
import { Router } from 'express';
import { RowDataPacket } from 'mysql2';
import { db } from '../database/db';

const router = Router();

interface Category extends RowDataPacket {
	id: number;
	name: string;
}

interface Product extends RowDataPacket {
	id: number;
	category_id: number;
	name: string;
	price: number;
	status: string;
}

interface OptionGroup extends RowDataPacket {
	id: number;
	name: string;
	is_required: boolean;
	is_multi_select: boolean;
}

interface Option extends RowDataPacket {
	id: number;
	option_group_id: number;
	name: string;
	price: number;
	status: string;
}

// 카테고리 목록 조회
router.get('/categories', async (_req, res) => {
	try {
		const [categories] = await db.query<Category[]>(
			'SELECT * FROM Category ORDER BY id'
		);
		res.json(categories);
	} catch (error) {
		console.error('Categories fetch error:', error);
		res.status(500).json({ error: 'Failed to fetch categories' });
	}
});

// 전체 메뉴 조회 (카테고리 필터링 가능)
// GET /menu → 전체
// GET /menu?categoryId=1 → 특정 카테고리만
router.get('/', async (req, res) => {
	try {
		const { categoryId } = req.query;

		const [categories] = await db.query<Category[]>(
			categoryId 
				? 'SELECT * FROM Category WHERE id = ? ORDER BY id'
				: 'SELECT * FROM Category ORDER BY id',
			categoryId ? [categoryId] : []
		);

		const [products] = await db.query<Product[]>(
			categoryId
				? `SELECT id, category_id, name, price, status 
				   FROM Product 
				   WHERE status = 'ON_SALE' AND category_id = ?
				   ORDER BY id`
				: `SELECT id, category_id, name, price, status 
				   FROM Product 
				   WHERE status = 'ON_SALE' 
				   ORDER BY category_id, id`,
			categoryId ? [categoryId] : []
		);

		const menuData = categories.map(category => ({
			categoryId: category.id,
			categoryName: category.name,
			products: products.filter(p => p.category_id === category.id)
		}));

		res.json(menuData);
	} catch (error) {
		console.error('Menu fetch error:', error);
		res.status(500).json({ error: 'Failed to fetch menu' });
	}
});

// 특정 상품 상세 조회 (옵션 포함)
router.get('/:productId', async (req, res) => {
	try {
		const { productId } = req.params;

		const [products] = await db.query<Product[]>(
			`SELECT * FROM Product WHERE id = ? AND status = 'ON_SALE'`,
			[productId]
		);

		if (products.length === 0) {
			return res.status(404).json({ error: 'Product not found' });
		}

		const product = products[0];

		const [optionData] = await db.query<(OptionGroup & Option)[]>(
			`SELECT 
				og.id as option_group_id,
				og.name as option_group_name,
				og.is_required,
				og.is_multi_select,
				o.id as option_id,
				o.name as option_name,
				o.price as option_price,
				o.status as option_status
			FROM ProductOption po
			JOIN OptionGroup og ON po.option_group_id = og.id
			LEFT JOIN \`Option\` o ON og.id = o.option_group_id
			WHERE po.product_id = ? AND (o.status = 'ON_SALE' OR o.status IS NULL)
			ORDER BY og.id, o.id`,
			[productId]
		);

		const optionGroups = optionData.reduce((acc, row) => {
			const groupId = row.option_group_id;
			
			if (!acc[groupId]) {
				acc[groupId] = {
					optionGroupId: row.option_group_id,
					optionGroupName: row.option_group_name,
					isRequired: row.is_required,
					isMultiSelect: row.is_multi_select,
					options: []
				};
			}

			if (row.option_id) {
				acc[groupId].options.push({
					optionId: row.option_id,
					optionName: row.option_name,
					optionPrice: row.option_price
				});
			}

			return acc;
		}, {} as any);

		res.json({
			product: {
				id: product.id,
				name: product.name,
				price: product.price,
				categoryId: product.category_id
			},
			optionGroups: Object.values(optionGroups)
		});
	} catch (error) {
		console.error('Product detail fetch error:', error);
		res.status(500).json({ error: 'Failed to fetch product detail' });
	}
});

export default router;