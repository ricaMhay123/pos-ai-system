import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  ProductWithStock,
  CreateProductDto,
  UpdateProductDto,
  PaginatedResult,
} from '@pos-ai/shared-types';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  // In-memory synchronized store initialized with Philippine FMCG products
  private inMemoryProducts: ProductWithStock[] = [
    {
      id: '40000000-0000-0000-0000-000000000001',
      categoryId: '30000000-0000-0000-0000-000000000001',
      categoryName: 'Rice & Carbs',
      sku: 'RIC-SIN-001',
      barcode: '480001660101',
      name: 'Sinandomeng Special Rice 5kg',
      description: 'Locally milled premium soft white grain rice',
      unitOfMeasure: 'sack',
      costPrice: 230.0,
      retailPrice: 285.0,
      taxRate: 0.0,
      reorderPoint: 20,
      reorderQuantity: 60,
      leadTimeDays: 2,
      stockOnHand: 12,
      stockReserved: 0,
      stockAvailable: 12,
      safetyStock: 15,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0000-000000000002',
      categoryId: '30000000-0000-0000-0000-000000000001',
      categoryName: 'Rice & Carbs',
      sku: 'RIC-JAS-002',
      barcode: '480001660102',
      name: 'Dinorado Fragrant Rice 5kg',
      description: 'Aromatic long-grain fragrant Philippine rice',
      unitOfMeasure: 'sack',
      costPrice: 280.0,
      retailPrice: 345.0,
      taxRate: 0.0,
      reorderPoint: 15,
      reorderQuantity: 50,
      leadTimeDays: 3,
      stockOnHand: 45,
      stockReserved: 0,
      stockAvailable: 45,
      safetyStock: 20,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0000-000000000003',
      categoryId: '30000000-0000-0000-0000-000000000001',
      categoryName: 'Rice & Carbs',
      sku: 'NOD-LKM-003',
      barcode: '480001660103',
      name: 'Lucky Me! Pancit Canton Kalamansi (Pack of 6)',
      description: 'Filipino favorite citrus stir-fried noodles bundle',
      unitOfMeasure: 'pack',
      costPrice: 62.0,
      retailPrice: 78.0,
      taxRate: 0.12,
      reorderPoint: 40,
      reorderQuantity: 120,
      leadTimeDays: 2,
      stockOnHand: 85,
      stockReserved: 0,
      stockAvailable: 85,
      safetyStock: 25,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0000-000000000004',
      categoryId: '30000000-0000-0000-0000-000000000002',
      categoryName: 'Canned Goods & Instant Meals',
      sku: 'CAN-TUN-004',
      barcode: '480001660201',
      name: 'Century Tuna Flakes in Oil 180g',
      description: 'Omega-3 rich premium yellowfin tuna flakes',
      unitOfMeasure: 'can',
      costPrice: 37.5,
      retailPrice: 46.75,
      taxRate: 0.12,
      reorderPoint: 30,
      reorderQuantity: 90,
      leadTimeDays: 3,
      stockOnHand: 18,
      stockReserved: 0,
      stockAvailable: 18,
      safetyStock: 25,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0000-000000000005',
      categoryId: '30000000-0000-0000-0000-000000000002',
      categoryName: 'Canned Goods & Instant Meals',
      sku: 'CAN-CRN-005',
      barcode: '480001660202',
      name: 'Purefoods Corned Beef 210g',
      description: 'Classic seasoned 100% pure savory beef',
      unitOfMeasure: 'can',
      costPrice: 79.0,
      retailPrice: 98.5,
      taxRate: 0.12,
      reorderPoint: 25,
      reorderQuantity: 75,
      leadTimeDays: 2,
      stockOnHand: 8,
      stockReserved: 0,
      stockAvailable: 8,
      safetyStock: 20,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0000-000000000007',
      categoryId: '30000000-0000-0000-0000-000000000003',
      categoryName: 'Beverages',
      sku: 'BEV-KOP-007',
      barcode: '480001660301',
      name: 'Kopiko Blanca 3-in-1 Coffee 30g x 10s',
      description: 'Creamy sweet instant white coffee bag',
      unitOfMeasure: 'bag',
      costPrice: 68.0,
      retailPrice: 85.0,
      taxRate: 0.12,
      reorderPoint: 30,
      reorderQuantity: 90,
      leadTimeDays: 2,
      stockOnHand: 75,
      stockReserved: 0,
      stockAvailable: 75,
      safetyStock: 30,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0000-000000000008',
      categoryId: '30000000-0000-0000-0000-000000000003',
      categoryName: 'Beverages',
      sku: 'BEV-SMB-008',
      barcode: '480001660302',
      name: 'San Miguel Pale Pilsen 330ml Can',
      description: 'Iconic Philippine golden lager beer',
      unitOfMeasure: 'can',
      costPrice: 45.0,
      retailPrice: 58.0,
      taxRate: 0.12,
      reorderPoint: 40,
      reorderQuantity: 120,
      leadTimeDays: 2,
      stockOnHand: 90,
      stockReserved: 0,
      stockAvailable: 90,
      safetyStock: 35,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0000-000000000010',
      categoryId: '30000000-0000-0000-0000-000000000004',
      categoryName: 'Snacks & Confectionery',
      sku: 'SNK-PIA-010',
      barcode: '480001660401',
      name: 'Piattos Cheese Flavored Potato Crisps 85g',
      description: 'Hexagonal crunchy cheese potato snack',
      unitOfMeasure: 'pack',
      costPrice: 30.5,
      retailPrice: 38.5,
      taxRate: 0.12,
      reorderPoint: 35,
      reorderQuantity: 100,
      leadTimeDays: 2,
      stockOnHand: 60,
      stockReserved: 0,
      stockAvailable: 60,
      safetyStock: 25,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0000-000000000012',
      categoryId: '30000000-0000-0000-0000-000000000005',
      categoryName: 'Personal Care & Household',
      sku: 'PCR-SFG-012',
      barcode: '480001660501',
      name: 'Safeguard Pure White Soap 130g',
      description: 'Classic 99.9% germ protection bar soap',
      unitOfMeasure: 'bar',
      costPrice: 38.0,
      retailPrice: 48.0,
      taxRate: 0.12,
      reorderPoint: 30,
      reorderQuantity: 90,
      leadTimeDays: 3,
      stockOnHand: 48,
      stockReserved: 0,
      stockAvailable: 48,
      safetyStock: 20,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  constructor(private readonly db: DatabaseService) {}

  /**
   * List paginated products with category and search filter
   */
  async findAll(
    page = 1,
    limit = 50,
    search?: string,
    categoryId?: string,
    storeId = '10000000-0000-0000-0000-000000000001',
  ): Promise<PaginatedResult<ProductWithStock>> {
    if (this.db.isDbConnected) {
      try {
        const offset = (page - 1) * limit;
        const queryParams: any[] = [storeId];
        let whereClauses = 'WHERE p.is_active = true';

        if (categoryId) {
          queryParams.push(categoryId);
          whereClauses += ` AND p.category_id = $${queryParams.length}`;
        }

        if (search && search.trim()) {
          queryParams.push(`%${search.trim().toLowerCase()}%`);
          whereClauses += ` AND (LOWER(p.name) LIKE $${queryParams.length} OR LOWER(p.sku) LIKE $${queryParams.length} OR p.barcode LIKE $${queryParams.length})`;
        }

        const countRes = await this.db.query<{ count: string }>(
          `SELECT COUNT(p.id) as count FROM products p ${whereClauses}`,
          queryParams.slice(1),
        );
        const total = parseInt(countRes[0]?.count || '0', 10);

        queryParams.push(limit, offset);
        const sql = `
          SELECT p.id, p.category_id as "categoryId", c.name as "categoryName", p.sku, p.barcode,
                 p.name, p.description, p.unit_of_measure as "unitOfMeasure",
                 p.cost_price::FLOAT as "costPrice", p.retail_price::FLOAT as "retailPrice",
                 p.tax_rate::FLOAT as "taxRate", p.reorder_point as "reorderPoint",
                 p.reorder_quantity as "reorderQuantity", p.lead_time_days as "leadTimeDays",
                 p.is_active as "isActive", p.created_at as "createdAt", p.updated_at as "updatedAt",
                 COALESCE(il.quantity_on_hand, 0) as "stockOnHand",
                 COALESCE(il.quantity_reserved, 0) as "stockReserved",
                 COALESCE(il.quantity_available, 0) as "stockAvailable",
                 COALESCE(il.safety_stock, 10) as "safetyStock"
          FROM products p
          LEFT JOIN categories c ON c.id = p.category_id
          LEFT JOIN inventory_levels il ON il.product_id = p.id AND il.store_id = $1
          ${whereClauses}
          ORDER BY p.name ASC
          LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
        `;

        const rows = await this.db.query<ProductWithStock>(sql, queryParams);
        return {
          items: rows,
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        };
      } catch (err: any) {
        this.logger.warn(`PostgreSQL findAll error: ${err.message}, falling back to memory store`);
      }
    }

    // Memory Fallback
    let filtered = this.inMemoryProducts.filter((p) => p.isActive);
    if (categoryId && categoryId !== 'all') {
      filtered = filtered.filter((p) => p.categoryId === categoryId || p.categoryName === categoryId);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.includes(q)),
      );
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const items = filtered.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find product by UUID
   */
  async findOne(id: string, storeId = '10000000-0000-0000-0000-000000000001'): Promise<ProductWithStock> {
    if (this.db.isDbConnected) {
      const rows = await this.db.query<ProductWithStock>(
        `SELECT p.id, p.category_id as "categoryId", c.name as "categoryName", p.sku, p.barcode,
                p.name, p.description, p.unit_of_measure as "unitOfMeasure",
                p.cost_price::FLOAT as "costPrice", p.retail_price::FLOAT as "retailPrice",
                p.tax_rate::FLOAT as "taxRate", p.reorder_point as "reorderPoint",
                p.reorder_quantity as "reorderQuantity", p.lead_time_days as "leadTimeDays",
                p.is_active as "isActive", p.created_at as "createdAt", p.updated_at as "updatedAt",
                COALESCE(il.quantity_on_hand, 0) as "stockOnHand",
                COALESCE(il.quantity_reserved, 0) as "stockReserved",
                COALESCE(il.quantity_available, 0) as "stockAvailable",
                COALESCE(il.safety_stock, 10) as "safetyStock"
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         LEFT JOIN inventory_levels il ON il.product_id = p.id AND il.store_id = $2
         WHERE p.id = $1`,
        [id, storeId],
      );
      if (rows && rows.length > 0) {
        return rows[0];
      }
    }

    const item = this.inMemoryProducts.find((p) => p.id === id);
    if (!item) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return item;
  }

  /**
   * Fast Barcode lookup (Philippine EAN-13)
   */
  async findByBarcode(
    barcode: string,
    storeId = '10000000-0000-0000-0000-000000000001',
  ): Promise<ProductWithStock> {
    const cleanBarcode = barcode.trim();
    if (this.db.isDbConnected) {
      const rows = await this.db.query<ProductWithStock>(
        `SELECT p.id, p.category_id as "categoryId", c.name as "categoryName", p.sku, p.barcode,
                p.name, p.description, p.unit_of_measure as "unitOfMeasure",
                p.cost_price::FLOAT as "costPrice", p.retail_price::FLOAT as "retailPrice",
                p.tax_rate::FLOAT as "taxRate", p.reorder_point as "reorderPoint",
                p.reorder_quantity as "reorderQuantity", p.lead_time_days as "leadTimeDays",
                p.is_active as "isActive", p.created_at as "createdAt", p.updated_at as "updatedAt",
                COALESCE(il.quantity_on_hand, 0) as "stockOnHand",
                COALESCE(il.quantity_reserved, 0) as "stockReserved",
                COALESCE(il.quantity_available, 0) as "stockAvailable",
                COALESCE(il.safety_stock, 10) as "safetyStock"
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         LEFT JOIN inventory_levels il ON il.product_id = p.id AND il.store_id = $2
         WHERE (p.barcode = $1 OR LOWER(p.sku) = LOWER($1)) AND p.is_active = true`,
        [cleanBarcode, storeId],
      );
      if (rows && rows.length > 0) {
        return rows[0];
      }
    }

    const found = this.inMemoryProducts.find(
      (p) =>
        (p.barcode === cleanBarcode || p.sku.toLowerCase() === cleanBarcode.toLowerCase()) &&
        p.isActive,
    );
    if (!found) {
      throw new NotFoundException(`Barcode "${cleanBarcode}" not found in active catalog`);
    }
    return found;
  }

  /**
   * Create new product and initialize stock level in store
   */
  async create(dto: CreateProductDto): Promise<ProductWithStock> {
    // Validate SKU uniqueness
    const skuLower = dto.sku.trim().toUpperCase();
    const existingSku = this.inMemoryProducts.find((p) => p.sku === skuLower);
    if (existingSku) {
      throw new ConflictException(`Product with SKU "${skuLower}" already exists`);
    }

    const storeId = dto.storeId || '10000000-0000-0000-0000-000000000001';
    const initialStock = dto.initialStock !== undefined ? dto.initialStock : 25;
    const taxRate = dto.taxRate !== undefined ? dto.taxRate : 0.12; // 12% PH VAT default

    let createdId = `40000000-0000-0000-0000-${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    if (this.db.isDbConnected) {
      try {
        const result = await this.db.transaction(async (client) => {
          // Check database duplicate SKU
          const dupCheck = await client.query('SELECT id FROM products WHERE sku = $1', [skuLower]);
          if (dupCheck.rows.length > 0) {
            throw new ConflictException(`SKU "${skuLower}" already registered in database`);
          }

          const insertRes = await client.query(
            `INSERT INTO products (
               sku, barcode, name, description, category_id, unit_of_measure,
               cost_price, retail_price, tax_rate, reorder_point, reorder_quantity, lead_time_days
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING id, created_at, updated_at`,
            [
              skuLower,
              dto.barcode || null,
              dto.name.trim(),
              dto.description || null,
              dto.categoryId || null,
              dto.unitOfMeasure || 'unit',
              dto.costPrice,
              dto.retailPrice,
              taxRate,
              dto.reorderPoint || 20,
              dto.reorderQuantity || 60,
              dto.leadTimeDays || 2,
            ],
          );

          const newId = insertRes.rows[0].id;

          // Initialize inventory level in store
          await client.query(
            `INSERT INTO inventory_levels (store_id, product_id, quantity_on_hand, safety_stock)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (store_id, product_id) DO UPDATE SET quantity_on_hand = $3`,
            [storeId, newId, initialStock, Math.floor((dto.reorderPoint || 20) / 2)],
          );

          return newId;
        });
        createdId = result;
      } catch (err: any) {
        if (err instanceof ConflictException) throw err;
        this.logger.warn(`PostgreSQL create product failed: ${err.message}, adding to memory`);
      }
    }

    const newProduct: ProductWithStock = {
      id: createdId,
      categoryId: dto.categoryId || null,
      categoryName: 'General',
      sku: skuLower,
      barcode: dto.barcode || null,
      name: dto.name.trim(),
      description: dto.description || '',
      unitOfMeasure: dto.unitOfMeasure || 'unit',
      costPrice: dto.costPrice,
      retailPrice: dto.retailPrice,
      taxRate,
      reorderPoint: dto.reorderPoint || 20,
      reorderQuantity: dto.reorderQuantity || 60,
      leadTimeDays: dto.leadTimeDays || 2,
      stockOnHand: initialStock,
      stockReserved: 0,
      stockAvailable: initialStock,
      safetyStock: Math.floor((dto.reorderPoint || 20) / 2),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.inMemoryProducts.unshift(newProduct);
    return newProduct;
  }

  /**
   * Update existing product
   */
  async update(id: string, dto: UpdateProductDto): Promise<ProductWithStock> {
    const existing = await this.findOne(id);

    if (this.db.isDbConnected) {
      await this.db.query(
        `UPDATE products
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             category_id = COALESCE($3, category_id),
             unit_of_measure = COALESCE($4, unit_of_measure),
             cost_price = COALESCE($5, cost_price),
             retail_price = COALESCE($6, retail_price),
             tax_rate = COALESCE($7, tax_rate),
             reorder_point = COALESCE($8, reorder_point),
             reorder_quantity = COALESCE($9, reorder_quantity),
             lead_time_days = COALESCE($10, lead_time_days),
             is_active = COALESCE($11, is_active),
             updated_at = NOW()
         WHERE id = $12`,
        [
          dto.name,
          dto.description,
          dto.categoryId,
          dto.unitOfMeasure,
          dto.costPrice,
          dto.retailPrice,
          dto.taxRate,
          dto.reorderPoint,
          dto.reorderQuantity,
          dto.leadTimeDays,
          dto.isActive,
          id,
        ],
      );
    }

    const updated: ProductWithStock = {
      ...existing,
      name: dto.name !== undefined ? dto.name : existing.name,
      description: dto.description !== undefined ? dto.description : existing.description,
      categoryId: dto.categoryId !== undefined ? dto.categoryId : existing.categoryId,
      unitOfMeasure: dto.unitOfMeasure !== undefined ? dto.unitOfMeasure : existing.unitOfMeasure,
      costPrice: dto.costPrice !== undefined ? dto.costPrice : existing.costPrice,
      retailPrice: dto.retailPrice !== undefined ? dto.retailPrice : existing.retailPrice,
      taxRate: dto.taxRate !== undefined ? dto.taxRate : existing.taxRate,
      reorderPoint: dto.reorderPoint !== undefined ? dto.reorderPoint : existing.reorderPoint,
      reorderQuantity: dto.reorderQuantity !== undefined ? dto.reorderQuantity : existing.reorderQuantity,
      leadTimeDays: dto.leadTimeDays !== undefined ? dto.leadTimeDays : existing.leadTimeDays,
      isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
      updatedAt: new Date().toISOString(),
    };

    const idx = this.inMemoryProducts.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.inMemoryProducts[idx] = updated;
    }

    return updated;
  }

  /**
   * Delete product (soft delete)
   */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(id);

    if (this.db.isDbConnected) {
      await this.db.query('UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1', [
        id,
      ]);
    }

    const idx = this.inMemoryProducts.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.inMemoryProducts[idx].isActive = false;
    }

    return { success: true, message: `Product ${id} marked as inactive` };
  }
}
