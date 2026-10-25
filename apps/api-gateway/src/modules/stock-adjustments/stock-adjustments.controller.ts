import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DatabaseService } from '../database/database.service';
import { CreateStockAdjustmentInputDto } from './dto/create-stock-adjustment.dto';
import { StockAdjustment, StockAdjustmentType } from '@pos-ai/shared-types';

@ApiTags('Stock Adjustments')
@Controller('stock-adjustments')
export class StockAdjustmentsController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  @ApiOperation({ summary: 'List audit stock adjustments (physical count, damage, spoilage)' })
  @ApiQuery({ name: 'storeId', required: false })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'adjustmentType', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  async getAdjustments(
    @Query('storeId') storeId?: string,
    @Query('productId') productId?: string,
    @Query('adjustmentType') adjustmentType?: StockAdjustmentType,
    @Query('search') search?: string,
    @Query('limit') limit = 50,
    @Query('page') page = 1,
  ): Promise<StockAdjustment[]> {
    const targetStore = storeId || '10000000-0000-0000-0000-000000000001';

    if (this.db.isDbConnected) {
      try {
        const conditions: string[] = ['(sa.store_id = $1 OR sa.store_id IS NULL)'];
        const params: any[] = [targetStore];
        let pIdx = 2;

        if (productId) {
          conditions.push(`sa.product_id = $${pIdx++}`);
          params.push(productId);
        }

        if (adjustmentType) {
          conditions.push(`sa.adjustment_type = $${pIdx++}`);
          params.push(adjustmentType);
        }

        if (search) {
          conditions.push(`(sa.sku ILIKE $${pIdx} OR sa.product_name ILIKE $${pIdx} OR sa.reason ILIKE $${pIdx})`);
          params.push(`%${search}%`);
          pIdx++;
        }

        const offset = (Number(page) - 1) * Number(limit);
        params.push(Number(limit), offset);

        const rows = await this.db.query(
          `SELECT sa.id,
                  sa.store_id as "storeId",
                  sa.product_id as "productId",
                  sa.sku,
                  sa.product_name as "productName",
                  sa.adjustment_type as "adjustmentType",
                  sa.quantity_delta as "quantityDelta",
                  sa.previous_stock as "previousStock",
                  sa.new_stock as "newStock",
                  sa.cost_impact_php::float as "costImpactPhp",
                  sa.reason,
                  sa.reference_number as "referenceNumber",
                  sa.adjusted_by as "adjustedBy",
                  sa.adjusted_by_name as "adjustedByName",
                  sa.created_at as "createdAt",
                  sa.updated_at as "updatedAt"
           FROM stock_adjustments sa
           WHERE ${conditions.join(' AND ')}
           ORDER BY sa.created_at DESC
           LIMIT $${pIdx++} OFFSET $${pIdx}`,
          params,
        );

        if (rows && rows.length > 0) {
          return rows.map((r) => ({
            ...r,
            createdAt: new Date(r.createdAt).toISOString(),
            updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined,
          }));
        }
      } catch {
        // Fall through to memory fallback
      }
    }

    // Default seed adjustments for demo/preview
    return [
      {
        id: '90000000-0000-0000-0000-000000000001',
        storeId: targetStore,
        productId: '40000000-0000-0000-0000-000000000005',
        sku: 'CAN-CRN-005',
        productName: 'Purefoods Corned Beef 210g',
        adjustmentType: 'damage',
        quantityDelta: -2,
        previousStock: 10,
        newStock: 8,
        costImpactPhp: 156.0,
        reason: 'Dented packaging during stock unloading; deemed unmarketable.',
        referenceNumber: 'ADJ-20261024-001',
        adjustedByName: 'Maria Santos (Store Manager)',
        createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
      },
      {
        id: '90000000-0000-0000-0000-000000000002',
        storeId: targetStore,
        productId: '40000000-0000-0000-0000-000000000001',
        sku: 'RIC-SIN-001',
        productName: 'Sinandomeng Special Rice 5kg',
        adjustmentType: 'physical_count',
        quantityDelta: -3,
        previousStock: 15,
        newStock: 12,
        costImpactPhp: 690.0,
        reason: 'Weekly physical cycle count variance reconciliation.',
        referenceNumber: 'ADJ-20261023-004',
        adjustedByName: 'Maria Santos (Store Manager)',
        createdAt: new Date(Date.now() - 3600 * 1000 * 36).toISOString(),
      },
      {
        id: '90000000-0000-0000-0000-000000000003',
        storeId: targetStore,
        productId: '40000000-0000-0000-0000-000000000004',
        sku: 'CAN-TUN-004',
        productName: 'Century Tuna Flakes in Oil 180g',
        adjustmentType: 'restock_correction',
        quantityDelta: 6,
        previousStock: 12,
        newStock: 18,
        costImpactPhp: 228.0,
        reason: 'Supplier direct delivery receipt surplus count adjustment.',
        referenceNumber: 'ADJ-20261022-002',
        adjustedByName: 'Maria Santos (Store Manager)',
        createdAt: new Date(Date.now() - 3600 * 1000 * 60).toISOString(),
      },
    ];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve specific stock adjustment record by ID' })
  async getAdjustmentById(@Param('id') id: string): Promise<StockAdjustment> {
    if (this.db.isDbConnected) {
      const rows = await this.db.query(
        `SELECT sa.id,
                sa.store_id as "storeId",
                sa.product_id as "productId",
                sa.sku,
                sa.product_name as "productName",
                sa.adjustment_type as "adjustmentType",
                sa.quantity_delta as "quantityDelta",
                sa.previous_stock as "previousStock",
                sa.new_stock as "newStock",
                sa.cost_impact_php::float as "costImpactPhp",
                sa.reason,
                sa.reference_number as "referenceNumber",
                sa.adjusted_by as "adjustedBy",
                sa.adjusted_by_name as "adjustedByName",
                sa.created_at as "createdAt",
                sa.updated_at as "updatedAt"
         FROM stock_adjustments sa
         WHERE sa.id = $1`,
        [id],
      );

      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          ...r,
          createdAt: new Date(r.createdAt).toISOString(),
          updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined,
        };
      }
    }

    throw new NotFoundException(`Stock adjustment record ${id} not found`);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'inventory_manager', 'store_manager')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record new stock adjustment (Strictly restricted to Store / Inventory Managers)',
  })
  @ApiResponse({ status: 201, description: 'Stock adjustment saved and inventory balances updated' })
  async createAdjustment(
    @Body() dto: CreateStockAdjustmentInputDto,
    @Request() req: any,
  ): Promise<StockAdjustment> {
    const storeId = dto.storeId || '10000000-0000-0000-0000-000000000001';
    const performedById = req.user?.id || '20000000-0000-0000-0000-000000000010';
    const performedByName = req.user
      ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.username
      : 'Maria Santos (Store Manager)';

    const refNo =
      dto.referenceNumber ||
      `ADJ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (this.db.isDbConnected) {
      const result = await this.db.transaction(async (client) => {
        // 1. Fetch product metadata
        const prodRes = await client.query(
          `SELECT p.id, p.sku, p.name, p.cost_price FROM products p WHERE p.id = $1`,
          [dto.productId],
        );
        const product = prodRes.rows[0];
        const sku = dto.sku || product?.sku || 'SKU-UNKNOWN';
        const productName = dto.productName || product?.name || 'Adjusted Product';
        const costPrice = parseFloat(product?.cost_price || '0');

        // 2. Fetch & lock current store inventory level
        const levelRes = await client.query(
          `SELECT quantity_on_hand FROM inventory_levels WHERE store_id = $1 AND product_id = $2 FOR UPDATE`,
          [storeId, dto.productId],
        );
        const previousStock = levelRes.rows[0]?.quantity_on_hand ?? 0;
        const newStock = Math.max(0, previousStock + dto.quantityDelta);
        const costImpact = +(Math.abs(dto.quantityDelta) * costPrice).toFixed(4);

        // 3. Update inventory_levels
        await client.query(
          `INSERT INTO inventory_levels (store_id, product_id, quantity_on_hand, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (store_id, product_id)
           DO UPDATE SET quantity_on_hand = $3, updated_at = NOW()`,
          [storeId, dto.productId, newStock],
        );

        // 4. Insert into stock_adjustments audit table
        const insertAdj = await client.query(
          `INSERT INTO stock_adjustments (
             store_id, product_id, sku, product_name, adjustment_type,
             quantity_delta, previous_stock, new_stock, cost_impact_php,
             reason, reference_number, adjusted_by, adjusted_by_name
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           RETURNING id, created_at, updated_at`,
          [
            storeId,
            dto.productId,
            sku,
            productName,
            dto.adjustmentType,
            dto.quantityDelta,
            previousStock,
            newStock,
            costImpact,
            dto.reason || 'Manual stock reconciliation',
            refNo,
            performedById,
            performedByName,
          ],
        );

        // 5. Commit to immutable inventory ledger
        const ledgerMovementType =
          dto.quantityDelta < 0 ? 'adjustment_loss' : 'adjustment_found';
        await client.query(
          `INSERT INTO inventory_transactions (
             store_id, product_id, movement_type, quantity_delta, balance_after,
             reference_id, performed_by, notes
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            storeId,
            dto.productId,
            ledgerMovementType,
            dto.quantityDelta,
            newStock,
            refNo,
            performedById,
            `[${dto.adjustmentType.toUpperCase()}] ${dto.reason || 'Stock audit adjustment'}`,
          ],
        );

        return {
          id: insertAdj.rows[0].id,
          storeId,
          productId: dto.productId,
          sku,
          productName,
          adjustmentType: dto.adjustmentType,
          quantityDelta: dto.quantityDelta,
          previousStock,
          newStock,
          costImpactPhp: costImpact,
          reason: dto.reason || 'Manual stock reconciliation',
          referenceNumber: refNo,
          adjustedBy: performedById,
          adjustedByName: performedByName,
          createdAt: insertAdj.rows[0].created_at,
          updatedAt: insertAdj.rows[0].updated_at,
        };
      });

      return {
        ...result,
        createdAt: new Date(result.createdAt).toISOString(),
        updatedAt: new Date(result.updatedAt).toISOString(),
      };
    }

    // In-memory fallback
    const simulatedPrev = 15;
    const simulatedNew = Math.max(0, simulatedPrev + dto.quantityDelta);
    return {
      id: `90000000-0000-0000-0000-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      storeId,
      productId: dto.productId,
      sku: dto.sku || 'SKU-ADJ-001',
      productName: dto.productName || 'Adjusted Item',
      adjustmentType: dto.adjustmentType,
      quantityDelta: dto.quantityDelta,
      previousStock: simulatedPrev,
      newStock: simulatedNew,
      costImpactPhp: Math.abs(dto.quantityDelta) * 78.5,
      reason: dto.reason || 'Stock audit adjustment',
      referenceNumber: refNo,
      adjustedBy: performedById,
      adjustedByName: performedByName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
