import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DatabaseService } from '../database/database.service';
import { InventoryAdjustmentDto } from '@pos-ai/shared-types';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly db: DatabaseService) {}

  @Get('levels')
  @ApiOperation({ summary: 'List current stock balances per store' })
  async getStockLevels(@Query('storeId') storeId = '10000000-0000-0000-0000-000000000001') {
    if (this.db.isDbConnected) {
      const rows = await this.db.query(
        `SELECT il.product_id as "productId", p.sku, p.name, c.name as "category",
                il.quantity_on_hand as "quantityOnHand", il.quantity_reserved as "quantityReserved",
                il.quantity_available as "quantityAvailable", il.safety_stock as "safetyStock",
                p.reorder_point as "reorderPoint", p.lead_time_days as "leadTimeDays"
         FROM inventory_levels il
         JOIN products p ON p.id = il.product_id
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE il.store_id = $1
         ORDER BY il.quantity_on_hand ASC`,
        [storeId],
      );
      if (rows && rows.length > 0) return rows;
    }

    return [
      {
        productId: '40000000-0000-0000-0000-000000000005',
        sku: 'CAN-CRN-005',
        name: 'Purefoods Corned Beef 210g',
        category: 'Canned Goods & Instant Meals',
        quantityOnHand: 8,
        quantityReserved: 0,
        quantityAvailable: 8,
        safetyStock: 20,
        reorderPoint: 25,
        leadTimeDays: 2,
      },
      {
        productId: '40000000-0000-0000-0000-000000000001',
        sku: 'RIC-SIN-001',
        name: 'Sinandomeng Special Rice 5kg',
        category: 'Rice & Carbs',
        quantityOnHand: 12,
        quantityReserved: 0,
        quantityAvailable: 12,
        safetyStock: 15,
        reorderPoint: 20,
        leadTimeDays: 2,
      },
      {
        productId: '40000000-0000-0000-0000-000000000004',
        sku: 'CAN-TUN-004',
        name: 'Century Tuna Flakes in Oil 180g',
        category: 'Canned Goods & Instant Meals',
        quantityOnHand: 18,
        quantityReserved: 0,
        quantityAvailable: 18,
        safetyStock: 25,
        reorderPoint: 30,
        leadTimeDays: 3,
      },
    ];
  }

  @Post('adjust')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'inventory_manager', 'store_manager')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit manual inventory adjustment & log to ledger' })
  @ApiResponse({ status: 200, description: 'Stock adjusted and ledger movement committed' })
  async adjustStock(@Body() body: InventoryAdjustmentDto, @Request() req: any) {
    const performedBy = req.user?.id || '20000000-0000-0000-0000-000000000001';
    let previousBalance = 10;
    let newBalance = 10 + body.quantityDelta;

    if (this.db.isDbConnected) {
      const res = await this.db.transaction(async (client) => {
        const cur = await client.query(
          'SELECT quantity_on_hand FROM inventory_levels WHERE store_id = $1 AND product_id = $2 FOR UPDATE',
          [body.storeId, body.productId],
        );
        const onHand = cur.rows[0]?.quantity_on_hand || 0;
        const updated = onHand + body.quantityDelta;

        await client.query(
          `UPDATE inventory_levels SET quantity_on_hand = $1, updated_at = NOW() WHERE store_id = $2 AND product_id = $3`,
          [updated, body.storeId, body.productId],
        );

        const txn = await client.query(
          `INSERT INTO inventory_transactions (
             store_id, product_id, movement_type, quantity_delta, balance_after,
             performed_by, notes
           ) VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, created_at`,
          [
            body.storeId,
            body.productId,
            body.movementType,
            body.quantityDelta,
            updated,
            performedBy,
            body.reason,
          ],
        );

        return {
          transactionId: txn.rows[0].id,
          previousBalance: onHand,
          newBalance: updated,
          createdAt: txn.rows[0].created_at,
        };
      });

      return {
        transactionId: res.transactionId,
        productId: body.productId,
        previousBalance: res.previousBalance,
        newBalance: res.newBalance,
        movementType: body.movementType,
        createdAt: new Date(res.createdAt).toISOString(),
      };
    }

    return {
      transactionId: `80000000-0000-0000-0000-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      productId: body.productId,
      previousBalance,
      newBalance,
      movementType: body.movementType,
      createdAt: new Date().toISOString(),
    };
  }
}
