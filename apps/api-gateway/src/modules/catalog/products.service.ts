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
    // ── RICE & STAPLES ────────────────────────────────────────────────────────
    {
      id: '40000000-0000-0000-0000-000000000001',
      categoryId: '30000000-0000-0000-0000-000000000001',
      categoryName: 'Rice & Staples',
      sku: 'RIC-SIN-001',
      barcode: '480000000001',
      name: 'Sinandomeng Special Rice 5kg',
      description: 'Locally milled premium Sinandomeng special white rice 5kg',
      unitOfMeasure: 'sack',
      costPrice: 240.0,
      retailPrice: 285.0,
      taxRate: 0.0,
      reorderPoint: 15,
      reorderQuantity: 40,
      leadTimeDays: 2,
      stockOnHand: 35,
      stockReserved: 0,
      stockAvailable: 35,
      safetyStock: 10,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0000-000000000002',
      categoryId: '30000000-0000-0000-0000-000000000001',
      categoryName: 'Rice & Staples',
      sku: 'RIC-JAS-002',
      barcode: '480000000002',
      name: 'Dinorado Jasmine Rice 5kg',
      description: 'Fragrant Dinorado jasmine aromatic soft rice 5kg',
      unitOfMeasure: 'sack',
      costPrice: 310.0,
      retailPrice: 380.0,
      taxRate: 0.0,
      reorderPoint: 10,
      reorderQuantity: 30,
      leadTimeDays: 3,
      stockOnHand: 20,
      stockReserved: 0,
      stockAvailable: 20,
      safetyStock: 8,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0001-000000000003',
      categoryId: '30000000-0000-0000-0000-000000000001',
      categoryName: 'Rice & Staples',
      sku: 'BRD-GAR-003',
      barcode: '480000000003',
      name: 'Gardenia Classic White Bread 600g',
      description: 'Freshly baked soft classic white sliced bread 600g',
      unitOfMeasure: 'loaf',
      costPrice: 62.0,
      retailPrice: 78.0,
      taxRate: 0.12,
      reorderPoint: 8,
      reorderQuantity: 20,
      leadTimeDays: 1,
      stockOnHand: 15,
      stockReserved: 0,
      stockAvailable: 15,
      safetyStock: 5,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },

    // ── CANNED GOODS ──────────────────────────────────────────────────────────
    {
      id: '40000000-0000-0000-0000-000000000004',
      categoryId: '30000000-0000-0000-0000-000000000002',
      categoryName: 'Canned Goods',
      sku: 'CAN-TUN-004',
      barcode: '480000000004',
      name: 'Century Tuna Flakes in Oil 180g',
      description: 'Healthy tuna flakes packed in rich soybean oil 180g',
      unitOfMeasure: 'can',
      costPrice: 31.5,
      retailPrice: 37.5,
      taxRate: 0.12,
      reorderPoint: 25,
      reorderQuantity: 60,
      leadTimeDays: 3,
      stockOnHand: 50,
      stockReserved: 0,
      stockAvailable: 50,
      safetyStock: 15,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0000-000000000005',
      categoryId: '30000000-0000-0000-0000-000000000002',
      categoryName: 'Canned Goods',
      sku: 'CAN-CRN-005',
      barcode: '480000000005',
      name: 'Purefoods Corned Beef 210g',
      description: 'Premium 100% pure seasoned cattle beef strands 210g',
      unitOfMeasure: 'can',
      costPrice: 82.0,
      retailPrice: 98.0,
      taxRate: 0.12,
      reorderPoint: 20,
      reorderQuantity: 50,
      leadTimeDays: 2,
      stockOnHand: 40,
      stockReserved: 0,
      stockAvailable: 40,
      safetyStock: 12,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0001-000000000006',
      categoryId: '30000000-0000-0000-0000-000000000002',
      categoryName: 'Canned Goods',
      sku: 'CAN-CDO-006',
      barcode: '480000000006',
      name: 'CDO Karne Norte 150g',
      description: 'Delicious guisado-style Filipino corned beef 150g',
      unitOfMeasure: 'can',
      costPrice: 21.0,
      retailPrice: 26.5,
      taxRate: 0.12,
      reorderPoint: 30,
      reorderQuantity: 75,
      leadTimeDays: 2,
      stockOnHand: 60,
      stockReserved: 0,
      stockAvailable: 60,
      safetyStock: 18,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0001-000000000007',
      categoryId: '30000000-0000-0000-0000-000000000002',
      categoryName: 'Canned Goods',
      sku: 'CAN-MEG-007',
      barcode: '480000000007',
      name: 'Mega Sardines in Tomato Sauce 155g',
      description: 'Fresh ocean catch sardines in rich tomato sauce 155g',
      unitOfMeasure: 'can',
      costPrice: 17.5,
      retailPrice: 22.0,
      taxRate: 0.12,
      reorderPoint: 35,
      reorderQuantity: 100,
      leadTimeDays: 2,
      stockOnHand: 75,
      stockReserved: 0,
      stockAvailable: 75,
      safetyStock: 20,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },

    // ── INSTANT FOODS ─────────────────────────────────────────────────────────
    {
      id: '40000000-0000-0000-0001-000000000008',
      categoryId: '30000000-0000-0000-0000-000000000006',
      categoryName: 'Instant Foods',
      sku: 'INS-LKM-008',
      barcode: '480000000008',
      name: 'Lucky Me! Pancit Canton Extra Hot 80g',
      description: 'Spicy stir-fried instant noodles with chili seasoning 80g',
      unitOfMeasure: 'pack',
      costPrice: 11.0,
      retailPrice: 14.5,
      taxRate: 0.12,
      reorderPoint: 50,
      reorderQuantity: 150,
      leadTimeDays: 2,
      stockOnHand: 120,
      stockReserved: 0,
      stockAvailable: 120,
      safetyStock: 30,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0001-000000000009',
      categoryId: '30000000-0000-0000-0000-000000000006',
      categoryName: 'Instant Foods',
      sku: 'INS-LKM-009',
      barcode: '480000000009',
      name: 'Lucky Me! Instant Noodle Beef 55g',
      description: 'Comforting beef soup instant mami noodle soup 55g',
      unitOfMeasure: 'pack',
      costPrice: 9.0,
      retailPrice: 12.0,
      taxRate: 0.12,
      reorderPoint: 40,
      reorderQuantity: 120,
      leadTimeDays: 2,
      stockOnHand: 100,
      stockReserved: 0,
      stockAvailable: 100,
      safetyStock: 25,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0001-000000000010',
      categoryId: '30000000-0000-0000-0000-000000000006',
      categoryName: 'Instant Foods',
      sku: 'INS-NIS-010',
      barcode: '480000000010',
      name: 'Nissin Cup Noodles Seafood 40g',
      description: 'Savory seafood broth with crab sticks and vegetables 40g',
      unitOfMeasure: 'cup',
      costPrice: 22.0,
      retailPrice: 28.0,
      taxRate: 0.12,
      reorderPoint: 20,
      reorderQuantity: 60,
      leadTimeDays: 2,
      stockOnHand: 45,
      stockReserved: 0,
      stockAvailable: 45,
      safetyStock: 12,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },

    // ── BEVERAGES & COFFEE ────────────────────────────────────────────────────
    {
      id: '40000000-0000-0000-0001-000000000011',
      categoryId: '30000000-0000-0000-0000-000000000003',
      categoryName: 'Beverages & Coffee',
      sku: 'BEV-NES-011',
      barcode: '480000000011',
      name: 'Nescafe 3-in-1 Original 28g Sachet',
      description: 'Perfect blend of robusta coffee, creamer, and sugar 28g',
      unitOfMeasure: 'sachet',
      costPrice: 7.0,
      retailPrice: 9.5,
      taxRate: 0.12,
      reorderPoint: 80,
      reorderQuantity: 250,
      leadTimeDays: 2,
      stockOnHand: 200,
      stockReserved: 0,
      stockAvailable: 200,
      safetyStock: 50,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0001-000000000012',
      categoryId: '30000000-0000-0000-0000-000000000003',
      categoryName: 'Beverages & Coffee',
      sku: 'BEV-KOP-012',
      barcode: '480000000012',
      name: 'Kopiko Blanca Coffee 30g Sachet',
      description: 'Smooth and velvety instant creamy white coffee 30g',
      unitOfMeasure: 'sachet',
      costPrice: 7.5,
      retailPrice: 10.0,
      taxRate: 0.12,
      reorderPoint: 75,
      reorderQuantity: 220,
      leadTimeDays: 2,
      stockOnHand: 180,
      stockReserved: 0,
      stockAvailable: 180,
      safetyStock: 45,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0001-000000000013',
      categoryId: '30000000-0000-0000-0000-000000000003',
      categoryName: 'Beverages & Coffee',
      sku: 'BEV-COK-013',
      barcode: '480000000013',
      name: 'Coca-Cola Original 1.5L',
      description: 'Refreshing classic sparkling carbonated cola 1.5L bottle',
      unitOfMeasure: 'bottle',
      costPrice: 58.0,
      retailPrice: 72.0,
      taxRate: 0.12,
      reorderPoint: 15,
      reorderQuantity: 40,
      leadTimeDays: 2,
      stockOnHand: 30,
      stockReserved: 0,
      stockAvailable: 30,
      safetyStock: 10,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0001-000000000014',
      categoryId: '30000000-0000-0000-0000-000000000003',
      categoryName: 'Beverages & Coffee',
      sku: 'BEV-SML-014',
      barcode: '480000000014',
      name: 'San Mig Light Can 330ml',
      description: 'Low calorie crisp and refreshing pale lager beer 330ml',
      unitOfMeasure: 'can',
      costPrice: 48.0,
      retailPrice: 62.0,
      taxRate: 0.12,
      reorderPoint: 25,
      reorderQuantity: 60,
      leadTimeDays: 2,
      stockOnHand: 50,
      stockReserved: 0,
      stockAvailable: 50,
      safetyStock: 15,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0001-000000000015',
      categoryId: '30000000-0000-0000-0000-000000000003',
      categoryName: 'Beverages & Coffee',
      sku: 'BEV-ABS-015',
      barcode: '480000000015',
      name: 'Absolute Pure Distilled Water 1L',
      description: 'Pure and safe certified distilled drinking water 1L',
      unitOfMeasure: 'bottle',
      costPrice: 20.0,
      retailPrice: 26.0,
      taxRate: 0.12,
      reorderPoint: 30,
      reorderQuantity: 90,
      leadTimeDays: 2,
      stockOnHand: 80,
      stockReserved: 0,
      stockAvailable: 80,
      safetyStock: 20,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },

    // ── SNACKS ────────────────────────────────────────────────────────────────
    {
      id: '40000000-0000-0000-0001-000000000016',
      categoryId: '30000000-0000-0000-0000-000000000004',
      categoryName: 'Snacks',
      sku: 'SNK-OIS-016',
      barcode: '480000000016',
      name: 'Oishi Prawn Crackers 60g',
      description: 'Crispy classic shrimp flavored snack crackers 60g',
      unitOfMeasure: 'pack',
      costPrice: 14.0,
      retailPrice: 18.5,
      taxRate: 0.12,
      reorderPoint: 40,
      reorderQuantity: 100,
      leadTimeDays: 2,
      stockOnHand: 90,
      stockReserved: 0,
      stockAvailable: 90,
      safetyStock: 25,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0001-000000000017',
      categoryId: '30000000-0000-0000-0000-000000000004',
      categoryName: 'Snacks',
      sku: 'SNK-PIA-017',
      barcode: '480000000017',
      name: 'Piattos Cheese 85g',
      description: 'Hexagonal crunchy potato crisps in rich cheddar cheese 85g',
      unitOfMeasure: 'pack',
      costPrice: 28.0,
      retailPrice: 36.0,
      taxRate: 0.12,
      reorderPoint: 30,
      reorderQuantity: 80,
      leadTimeDays: 2,
      stockOnHand: 65,
      stockReserved: 0,
      stockAvailable: 65,
      safetyStock: 18,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0001-000000000018',
      categoryId: '30000000-0000-0000-0000-000000000004',
      categoryName: 'Snacks',
      sku: 'SNK-NOV-018',
      barcode: '480000000018',
      name: 'Nova Country Cheddar 78g',
      description: 'Healthy multigrain chips in savory country cheddar 78g',
      unitOfMeasure: 'pack',
      costPrice: 27.5,
      retailPrice: 35.0,
      taxRate: 0.12,
      reorderPoint: 25,
      reorderQuantity: 70,
      leadTimeDays: 2,
      stockOnHand: 55,
      stockReserved: 0,
      stockAvailable: 55,
      safetyStock: 15,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },

    // ── PERSONAL CARE & HOUSEHOLD ─────────────────────────────────────────────
    {
      id: '40000000-0000-0000-0001-000000000019',
      categoryId: '30000000-0000-0000-0000-000000000005',
      categoryName: 'Personal Care & Household',
      sku: 'PC-SAF-019',
      barcode: '480000000019',
      name: 'Safeguard Pure White Soap 130g',
      description: 'Germicidal antibacterial family white bar soap 130g',
      unitOfMeasure: 'bar',
      costPrice: 42.0,
      retailPrice: 52.0,
      taxRate: 0.12,
      reorderPoint: 20,
      reorderQuantity: 50,
      leadTimeDays: 3,
      stockOnHand: 40,
      stockReserved: 0,
      stockAvailable: 40,
      safetyStock: 12,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '40000000-0000-0000-0001-000000000020',
      categoryId: '30000000-0000-0000-0000-000000000005',
      categoryName: 'Personal Care & Household',
      sku: 'HH-SRF-020',
      barcode: '480000000020',
      name: 'Surf Powder Detergent Rose Fresh 1kg',
      description: 'Active clean laundry powder with fresh rose fragrance 1kg',
      unitOfMeasure: 'pack',
      costPrice: 115.0,
      retailPrice: 145.0,
      taxRate: 0.12,
      reorderPoint: 12,
      reorderQuantity: 35,
      leadTimeDays: 2,
      stockOnHand: 25,
      stockReserved: 0,
      stockAvailable: 25,
      safetyStock: 8,
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
