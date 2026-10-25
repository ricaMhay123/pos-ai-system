import { IsNotEmpty, IsInt, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockAdjustmentType } from '@pos-ai/shared-types';

export class CreateStockAdjustmentInputDto {
  @ApiPropertyOptional({ description: 'Target Store ID' })
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiProperty({ description: 'Target Product UUID or ID' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiPropertyOptional({ description: 'Product SKU' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Product Name' })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiProperty({
    enum: ['physical_count', 'damage', 'spoilage', 'theft', 'restock_correction', 'return', 'other'],
    description: 'Category of inventory adjustment',
  })
  @IsNotEmpty()
  @IsIn(['physical_count', 'damage', 'spoilage', 'theft', 'restock_correction', 'return', 'other'])
  adjustmentType: StockAdjustmentType;

  @ApiProperty({
    description: 'Quantity delta (positive for found/surplus/restock, negative for damage/spoilage/shrinkage)',
    example: -5,
  })
  @IsNotEmpty()
  @IsInt()
  quantityDelta: number;

  @ApiPropertyOptional({ description: 'Business reason or audit observation' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'External audit reference, PO #, or incident number' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;
}
