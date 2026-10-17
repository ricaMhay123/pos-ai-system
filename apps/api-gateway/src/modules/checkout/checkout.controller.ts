import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CheckoutRequestDto, CheckoutResponseDto } from '@pos-ai/shared-types';

@ApiTags('POS Checkout')
@Controller('pos')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cashier', 'store_manager', 'admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Process POS checkout sale (ACID DB transaction, stock ledger deduction, Philippine VAT)',
  })
  @ApiResponse({ status: 201, description: 'Sale completed and committed to database transaction' })
  @ApiResponse({ status: 409, description: 'Insufficient stock on line items or duplicate key' })
  async processCheckout(
    @Body() payload: CheckoutRequestDto,
    @Request() req: any,
  ): Promise<CheckoutResponseDto> {
    const cashierId = req.user?.id || '20000000-0000-0000-0000-000000000003';
    return this.checkoutService.processCheckout(payload, cashierId);
  }

  @Get('transactions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cashier', 'store_manager', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve sales transaction receipt and line items by ID' })
  @ApiResponse({ status: 200, description: 'Transaction receipt returned' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransaction(@Param('id') id: string) {
    return this.checkoutService.getTransactionById(id);
  }
}
