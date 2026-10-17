import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  ProductWithStock,
  CreateProductDto,
  UpdateProductDto,
  PaginatedResult,
} from '@pos-ai/shared-types';

@ApiTags('Catalog')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List catalog products with pagination and category search' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  async getProducts(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ): Promise<PaginatedResult<ProductWithStock>> {
    return this.productsService.findAll(Number(page), Number(limit), search, categoryId);
  }

  @Get('barcode/:barcode')
  @ApiOperation({ summary: 'High-speed barcode scanner lookup (Philippine EAN-13)' })
  @ApiResponse({ status: 200, description: 'Product matched' })
  @ApiResponse({ status: 404, description: 'Barcode not found' })
  async getByBarcode(@Param('barcode') barcode: string): Promise<ProductWithStock> {
    return this.productsService.findByBarcode(barcode);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve product by ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getById(@Param('id') id: string): Promise<ProductWithStock> {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'inventory_manager', 'store_manager')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new product with initial store inventory (Admin / Inventory Manager)' })
  @ApiResponse({ status: 201, description: 'Product created and inventory registered' })
  @ApiResponse({ status: 409, description: 'SKU or barcode conflict' })
  async createProduct(@Body() dto: CreateProductDto): Promise<ProductWithStock> {
    return this.productsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'inventory_manager', 'store_manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product details, pricing, and reorder point' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductWithStock> {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'inventory_manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete / deactivate product' })
  @ApiResponse({ status: 200, description: 'Product marked as inactive' })
  async deleteProduct(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
