import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReplenishmentRecommendation } from '@pos-ai/shared-types';

@ApiTags('AI Recommendations')
@Controller('recommendations')
export class RecommendationsController {
  @Get()
  @ApiOperation({ summary: 'Get active AI replenishment recommendations (Philippine Supermarket Model)' })
  async getRecommendations(
    @Query('storeId') storeId: string,
    @Query('urgency') urgency?: string,
  ): Promise<ReplenishmentRecommendation[]> {
    return [
      {
        id: '60000000-0000-0000-0000-000000000001',
        forecastRunId: '50000000-0000-0000-0000-000000000001',
        storeId: storeId || '10000000-0000-0000-0000-000000000001',
        productId: '40000000-0000-0000-0000-000000000005',
        productName: 'Purefoods Corned Beef 210g',
        sku: 'CAN-CRN-005',
        currentStockOnHand: 8,
        forecastedDemand7d: 38.0,
        forecastedDemand14d: 75.0,
        recommendedOrderQuantity: 75,
        urgency: 'critical',
        confidenceScore: 0.978,
        predictedStockoutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        estimatedCost: 5925.0, // 75 cans * ₱79 cost
        reasoningSummary:
          'Imminent stockout: 8 cans left. High sales velocity before weekend rush. Supplier lead time is 2 days.',
        status: 'pending_review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '60000000-0000-0000-0000-000000000002',
        forecastRunId: '50000000-0000-0000-0000-000000000001',
        storeId: storeId || '10000000-0000-0000-0000-000000000001',
        productId: '40000000-0000-0000-0000-000000000001',
        productName: 'Sinandomeng Special Rice 5kg',
        sku: 'RIC-SIN-001',
        currentStockOnHand: 12,
        forecastedDemand7d: 26.0,
        forecastedDemand14d: 58.0,
        recommendedOrderQuantity: 60,
        urgency: 'high',
        confidenceScore: 0.941,
        predictedStockoutDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        estimatedCost: 13800.0, // 60 sacks * ₱230 cost
        reasoningSummary:
          'Inventory (12 sacks) breached safety buffer (15). Essential household staple with accelerating weekly demand.',
        status: 'pending_review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve AI recommendation and generate Purchase Order draft' })
  @ApiResponse({ status: 200, description: 'Recommendation approved' })
  async approveRecommendation(
    @Param('id') id: string,
    @Body() body: { approvedQuantity?: number; notes?: string },
  ) {
    return {
      id,
      status: 'approved',
      approvedQuantity: body.approvedQuantity || 75,
      decisionNotes: body.notes || 'Approved by BGC Store Manager',
      reviewedAt: new Date().toISOString(),
    };
  }
}
