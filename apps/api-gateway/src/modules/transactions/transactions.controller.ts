import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type {
  TransactionHistoryQuery,
  TransactionHistoryResponse,
  TransactionHistoryItem,
} from '@pos-ai/shared-types';

@ApiTags('Transaction History')
@Controller('pos/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * GET /api/v1/pos/transactions
   * Search & filter past completed transactions.
   * Cashiers: view-only, recent 7-day window (enforced by service).
   * Managers: full historical data with export options.
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cashier', 'store_manager', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List transaction history with search, date range, and cashier name filtering',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search by Transaction Number or ID' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter from date (ISO)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter to date (ISO)' })
  @ApiQuery({ name: 'cashierName', required: false, description: 'Partial cashier name match' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort column: created_at, total_amount, transaction_number' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort direction: asc or desc' })
  @ApiResponse({ status: 200, description: 'Paginated list of transactions returned' })
  async getTransactionHistory(
    @Query() query: TransactionHistoryQuery,
    @Request() req: any,
  ): Promise<TransactionHistoryResponse> {
    const userRole = this.extractUserRole(req);
    return this.transactionsService.getTransactionHistory(query, userRole);
  }

  /**
   * GET /api/v1/pos/transactions/export
   * Export transaction history as CSV. Manager-only.
   */
  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('store_manager', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Export transaction history as CSV (Manager only)',
  })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  @ApiResponse({ status: 403, description: 'Cashiers are not authorized to export data' })
  async exportTransactions(
    @Query() query: TransactionHistoryQuery,
    @Request() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const userRole = this.extractUserRole(req);
    if (userRole === 'cashier') {
      throw new ForbiddenException('Cashiers are not authorized to export transaction data');
    }

    const csv = await this.transactionsService.exportTransactionsCsv(query);

    const filename = `meme-mart-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(HttpStatus.OK).send(csv);
  }

  /**
   * GET /api/v1/pos/transactions/:id/receipt
   * Retrieve full receipt for a specific transaction.
   * Available to both Cashiers (view-only / reprint) and Managers.
   */
  @Get(':id/receipt')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cashier', 'store_manager', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get full transaction receipt with itemized products, 12% VAT, and 21/7teen Mart branding',
  })
  @ApiResponse({ status: 200, description: 'Transaction receipt with line items and payment details' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransactionReceipt(
    @Param('id') id: string,
  ): Promise<TransactionHistoryItem> {
    return this.transactionsService.getTransactionReceipt(id);
  }

  /**
   * Extract user role from JWT payload.
   */
  private extractUserRole(req: any): string {
    if (req.user?.roles?.includes('admin') || req.user?.roles?.includes('system')) {
      return 'admin';
    }
    if (req.user?.roles?.includes('store_manager')) {
      return 'store_manager';
    }
    return 'cashier';
  }
}
