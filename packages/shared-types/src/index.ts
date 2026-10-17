// =====================================================================
// POS AI - Enterprise Shared Type Definitions & Contracts
// =====================================================================

// --- Identity & Access Control ---
export type UserRole = 'cashier' | 'inventory_manager' | 'store_manager' | 'admin' | 'system';

export interface UserProfile {
  id: string;
  storeId?: string | null;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeCode?: string;
  roles: UserRole[];
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserProfile;
}

export interface LoginDto {
  username: string;
  password: string;
}

// --- Store & Multi-Location ---
export interface Store {
  id: string;
  code: string;
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

// --- Product Catalog ---
export interface Category {
  id: string;
  parentId?: string | null;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  categoryId?: string | null;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string;
  unitOfMeasure: string;
  costPrice: number;
  retailPrice: number;
  taxRate: number;
  reorderPoint: number;
  reorderQuantity: number;
  leadTimeDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithStock extends Product {
  categoryName?: string;
  stockOnHand: number;
  stockReserved: number;
  stockAvailable: number;
  safetyStock: number;
}

export interface CreateProductDto {
  categoryId?: string | null;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string;
  unitOfMeasure?: string;
  costPrice: number;
  retailPrice: number;
  taxRate?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  leadTimeDays?: number;
  initialStock?: number;
  storeId?: string;
}

export interface UpdateProductDto {
  categoryId?: string | null;
  name?: string;
  description?: string;
  unitOfMeasure?: string;
  costPrice?: number;
  retailPrice?: number;
  taxRate?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  leadTimeDays?: number;
  isActive?: boolean;
}

// --- Inventory & Ledger ---
export type InventoryMovementType = 
  | 'sale' 
  | 'purchase_receipt' 
  | 'return_restock' 
  | 'adjustment_loss' 
  | 'adjustment_found' 
  | 'transfer_in' 
  | 'transfer_out';

export interface InventoryLevel {
  id: string;
  storeId: string;
  productId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  safetyStock: number;
  maxStockCapacity?: number;
  lastCountedAt?: string | null;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  storeId: string;
  productId: string;
  movementType: InventoryMovementType;
  quantityDelta: number;
  balanceAfter: number;
  referenceId?: string;
  performedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface InventoryAdjustmentDto {
  storeId: string;
  productId: string;
  movementType: 'adjustment_loss' | 'adjustment_found' | 'return_restock' | 'purchase_receipt';
  quantityDelta: number;
  reason: string;
}

// --- POS Transactions & Checkout ---
export type TransactionStatus = 'pending' | 'completed' | 'voided' | 'refunded' | 'partially_refunded';
export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'digital_wallet' | 'gift_card' | 'split';
export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';

export interface CheckoutLineItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
}

export interface PaymentInput {
  method: PaymentMethod;
  amount: number;
  gatewayReference?: string;
  lastFour?: string;
}

export interface CheckoutRequestDto {
  storeId: string;
  idempotencyKey?: string;
  items: CheckoutLineItemInput[];
  payments: PaymentInput[];
  metadata?: Record<string, unknown>;
}

export interface SalesLineItem {
  id: string;
  transactionId: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  taxRate: number;
  discountAmount: number;
  totalPrice: number;
}

export interface PaymentRecord {
  id: string;
  transactionId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  gatewayReference?: string;
  lastFour?: string;
  createdAt: string;
}

export interface SalesTransaction {
  id: string;
  storeId: string;
  cashierId: string;
  transactionNumber: string;
  status: TransactionStatus;
  subtotalAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  idempotencyKey?: string;
  items?: SalesLineItem[];
  payments?: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutResponseDto {
  transactionId: string;
  transactionNumber: string;
  status: TransactionStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  changeDue: number;
  createdAt: string;
}

// --- AI Replenishment Engine ---
export type RecommendationUrgency = 'low' | 'medium' | 'high' | 'critical';
export type RecommendationStatus = 'pending_review' | 'approved' | 'auto_ordered' | 'dismissed' | 'fulfilled';

export interface ReplenishmentRecommendation {
  id: string;
  forecastRunId?: string;
  storeId: string;
  productId: string;
  productName: string;
  sku: string;
  currentStockOnHand: number;
  forecastedDemand7d: number;
  forecastedDemand14d: number;
  recommendedOrderQuantity: number;
  urgency: RecommendationUrgency;
  confidenceScore: number;
  predictedStockoutDate?: string;
  estimatedCost: number;
  reasoningSummary?: string;
  status: RecommendationStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  decisionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ForecastRun {
  id: string;
  storeId?: string;
  modelName: string;
  modelVersion: string;
  runType: string;
  forecastHorizonDays: number;
  itemsProcessed: number;
  runStatus: 'in_progress' | 'completed' | 'failed';
  executionTimeMs?: number;
  metrics?: {
    wape?: number;
    rmse?: number;
    mae?: number;
    [key: string]: unknown;
  };
  createdAt: string;
}

// --- Generic API Response Wrappers ---
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
