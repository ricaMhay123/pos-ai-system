import { Module } from '@nestjs/common';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    CatalogModule,
    CheckoutModule,
    InventoryModule,
    RecommendationsModule,
  ],
})
export class AppModule {}
