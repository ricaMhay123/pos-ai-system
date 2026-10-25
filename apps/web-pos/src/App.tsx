import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
  Search,
  ShieldAlert,
  Package,
  Layers,
  Check,
  X,
  ExternalLink,
  LogOut,
  SlidersHorizontal,
} from 'lucide-react';
import { PosCheckoutShell, StockAdjustmentModal } from './components/pos';
import { AuthLandingPage, type AuthUser } from './components/auth/AuthLandingPage';
import { formatPhp } from './utils/formatters';
import type {
  ProductWithStock,
  InventoryRecommendation,
  ManagerRecommendationSummary,
  StockAdjustment,
} from '@pos-ai/shared-types';

const INITIAL_PH_PRODUCTS: ProductWithStock[] = [
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
    taxRate: 0.0, // Standard VAT-exempt raw agricultural staple per BIR
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
    taxRate: 0.0, // Standard VAT-exempt raw agricultural staple per BIR
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

const INITIAL_RECOMMENDATIONS: InventoryRecommendation[] = [
  {
    id: '60000000-0000-0000-0000-000000000001',
    storeId: '10000000-0000-0000-0000-000000000001',
    productId: '40000000-0000-0000-0000-000000000001',
    productName: 'Sinandomeng Special Rice 5kg',
    sku: 'RIC-SIN-001',
    categoryName: 'Rice & Carbs',
    currentStockOnHand: 12,
    dailyAvgSales: 3.53,
    leadTimeDays: 2,
    safetyStock: 15,
    reorderPoint: 23,
    forecastedDemand7d: 26.84,
    forecastedDemand14d: 53.56,
    forecastedDemand30d: 105.86,
    recommendedOrderQuantity: 109,
    urgency: 'high',
    confidenceScore: 0.941,
    predictedStockoutDate: '2026-10-21',
    estimatedCost: 25070.0,
    reasoningSummary:
      'Reorder Point Breached: Stock (12) has dropped below ROP (23). Projected 7-day demand is 27 units with 2-day supplier lead time.',
    status: 'pending_review',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '60000000-0000-0000-0000-000000000002',
    storeId: '10000000-0000-0000-0000-000000000001',
    productId: '40000000-0000-0000-0000-000000000005',
    productName: 'Purefoods Corned Beef 210g',
    sku: 'CAN-CRN-005',
    categoryName: 'Canned Goods & Instant Meals',
    currentStockOnHand: 8,
    dailyAvgSales: 4.74,
    leadTimeDays: 2,
    safetyStock: 20,
    reorderPoint: 30,
    forecastedDemand7d: 31.94,
    forecastedDemand14d: 66.84,
    forecastedDemand30d: 142.07,
    recommendedOrderQuantity: 155,
    urgency: 'high',
    confidenceScore: 0.965,
    predictedStockoutDate: '2026-10-20',
    estimatedCost: 12245.0,
    reasoningSummary:
      'Imminent Stockout Risk: Only 8 cans left on shelf. Expected 7-day demand is 32 units, breaching supplier lead time buffer.',
    status: 'pending_review',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '60000000-0000-0000-0000-000000000003',
    storeId: '10000000-0000-0000-0000-000000000001',
    productId: '40000000-0000-0000-0000-000000000003',
    productName: 'Century Tuna Flakes in Oil 180g',
    sku: 'CAN-TUN-004',
    categoryName: 'Canned Goods & Instant Meals',
    currentStockOnHand: 18,
    dailyAvgSales: 5.72,
    leadTimeDays: 3,
    safetyStock: 25,
    reorderPoint: 43,
    forecastedDemand7d: 37.29,
    forecastedDemand14d: 68.57,
    forecastedDemand30d: 171.46,
    recommendedOrderQuantity: 179,
    urgency: 'high',
    confidenceScore: 0.952,
    predictedStockoutDate: '2026-10-21',
    estimatedCost: 6712.5,
    reasoningSummary:
      'Reorder Point Breached: Current stock (18) well below target ROP (43). High turnover Philippine supermarket staple.',
    status: 'pending_review',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '60000000-0000-0000-0000-000000000004',
    storeId: '10000000-0000-0000-0000-000000000001',
    productId: '40000000-0000-0000-0000-000000000022',
    productName: 'Thai Jasmine Rice 5kg',
    sku: 'RIC-JAS-5KG',
    categoryName: 'Rice & Carbs',
    currentStockOnHand: 46,
    dailyAvgSales: 4.93,
    leadTimeDays: 4,
    safetyStock: 6,
    reorderPoint: 26,
    forecastedDemand7d: 33.36,
    forecastedDemand14d: 74.51,
    forecastedDemand30d: 147.81,
    recommendedOrderQuantity: 108,
    urgency: 'low',
    confidenceScore: 0.885,
    predictedStockoutDate: '2026-10-27',
    estimatedCost: 41040.0,
    reasoningSummary:
      'Inventory level (46) is adequate for current 30-day forecast horizon. Top revenue generator.',
    status: 'pending_review',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const isDashboardPath = (): boolean => {
  if (typeof window === 'undefined') return false;
  const p = window.location.pathname.toLowerCase();
  return p === '/dashboard' || p === '/dashboard.php';
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<'pos' | 'ai'>(() =>
    isDashboardPath() ? 'ai' : 'pos',
  );
  const [rbacNotice, setRbacNotice] = useState<string | null>(null);

  const navigateToTab = (tab: 'pos' | 'ai') => {
    if (tab === 'ai') {
      if (currentUser?.role === 'cashier') {
        setRbacNotice(
          'Access Restricted: Cashier accounts are strictly confined to POS checkout and cannot access the Manager Dashboard.',
        );
        setActiveTab('pos');
        if (isDashboardPath()) {
          window.history.replaceState(null, '', '/');
        }
        return;
      }
      setActiveTab('ai');
      window.history.pushState(null, '', '/dashboard');
    } else {
      setActiveTab('pos');
      if (isDashboardPath()) {
        window.history.pushState(null, '', '/');
      }
    }
  };
  const [products, setProducts] = useState<ProductWithStock[]>(INITIAL_PH_PRODUCTS);
  const [recommendations, setRecommendations] = useState<InventoryRecommendation[]>(INITIAL_RECOMMENDATIONS);
  const [summary, setSummary] = useState<ManagerRecommendationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedAdjustmentProductId, setSelectedAdjustmentProductId] = useState<string | undefined>(undefined);

  const handleAdjustmentSuccess = (adj: StockAdjustment) => {
    setProducts((prev) =>
      prev?.map((p) => {
        if (p?.id === adj?.productId || p?.sku === adj?.sku) {
          const updatedStock = adj?.newStock ?? ((p?.stockOnHand ?? 0) + (adj?.quantityDelta ?? 0));
          return {
            ...p,
            stockOnHand: updatedStock,
            stockAvailable: Math.max(0, updatedStock - (p?.stockReserved ?? 0)),
            lastAdjustedAt: adj?.createdAt,
            lastAdjustmentType: adj?.adjustmentType,
          };
        }
        return p;
      }),
    );

    setRecommendations((prev) =>
      prev?.map((r) => {
        if (r?.productId === adj?.productId || r?.sku === adj?.sku) {
          const updatedStock = adj?.newStock ?? ((r?.currentStockOnHand ?? 0) + (adj?.quantityDelta ?? 0));
          return {
            ...r,
            currentStockOnHand: updatedStock,
            urgency: updatedStock <= (r?.reorderPoint ?? 0) ? 'critical' : r?.urgency,
          };
        }
        return r;
      }),
    );

    setRbacNotice(
      `Stock Adjustment Recorded: ${adj?.productName || adj?.sku} was adjusted (${adj?.quantityDelta > 0 ? '+' : ''}${adj?.quantityDelta} units). Ref: ${adj?.referenceNumber || 'N/A'}`
    );
    setTimeout(() => setRbacNotice(null), 4500);
  };

  // Fetch live recommendations & summary from API Gateway
  const fetchLiveData = async () => {
    setIsLoading(true);
    try {
      const recRes = await fetch('http://localhost:4000/api/v1/recommendations');
      if (recRes.ok) {
        const data = await recRes.json();
        if (Array.isArray(data) && data.length > 0) {
          setRecommendations(data);
        }
      }

      const sumRes = await fetch('http://localhost:4000/api/v1/recommendations/summary');
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData);
      }
    } catch {
      // Fallback to local computed metrics if gateway is starting up
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
  }, []);

  // Sync state with browser navigation (popstate: back/forward buttons)
  useEffect(() => {
    const handleLocationChange = () => {
      const isDash = isDashboardPath();
      if (currentUser) {
        if (currentUser.role === 'cashier') {
          setActiveTab('pos');
          if (isDash) {
            window.history.replaceState(null, '', '/');
            setRbacNotice(
              'Access Restricted: Cashier accounts are strictly confined to POS checkout and cannot access the Manager Dashboard.',
            );
          }
        } else {
          setActiveTab(isDash ? 'ai' : 'pos');
        }
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [currentUser]);

  // Strict Cashier RBAC check when currentUser or activeTab changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'cashier') {
        if (isDashboardPath() || activeTab === 'ai') {
          setActiveTab('pos');
          window.history.replaceState(null, '', '/');
          setRbacNotice(
            'Access Restricted: Cashier accounts are strictly confined to POS checkout and cannot access the Manager Dashboard.',
          );
        }
      } else if (currentUser.role === 'store_manager' || currentUser.role === 'admin') {
        if (isDashboardPath() && activeTab !== 'ai') {
          setActiveTab('ai');
        }
      }
    }
  }, [currentUser, activeTab]);

  const approveRecommendation = async (id: string) => {
    try {
      await fetch(`http://localhost:4000/api/v1/recommendations/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Approved from POS Manager UI' }),
      });
    } catch {}

    setRecommendations((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, status: 'approved' } : rec)),
    );
  };

  const pendingCount = recommendations.filter((r) => r.status === 'pending_review').length;
  const lowStockItems = recommendations.filter(
    (r) => r.currentStockOnHand < r.reorderPoint || r.urgency === 'critical' || r.urgency === 'high',
  );

  // Filtered recommendations list
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.categoryName && item.categoryName.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterUrgency === 'low_stock') {
        return item.currentStockOnHand < item.reorderPoint || item.urgency === 'high' || item.urgency === 'critical';
      }
      if (filterUrgency !== 'all') {
        return item.urgency === filterUrgency;
      }
      return true;
    });
  }, [recommendations, searchQuery, filterUrgency]);

  // Derived KPI calculations
  const totalForecastedRevenue30d = summary?.totalForecastedRevenue30dPhp ?? 682540.0;
  const totalRestockCapital = recommendations.reduce((sum, r) => sum + r.estimatedCost, 0);
  const totalReorderUnits = recommendations.reduce((sum, r) => sum + r.recommendedOrderQuantity, 0);

  // Top 5 selling forecasted products
  const topProducts = summary?.topSellingForecastedProducts?.length
    ? summary.topSellingForecastedProducts
    : [
        {
          sku: 'RIC-JAS-5KG',
          productName: 'Thai Jasmine Rice 5kg',
          categoryName: 'Rice & Carbs',
          forecastedDemand30d: 148,
          retailPricePhp: 475.0,
          forecastedRevenue30dPhp: 70300.0,
        },
        {
          sku: 'RIC-DIN-5KG',
          productName: 'Dinorado Fragrant Rice 5kg',
          categoryName: 'Rice & Carbs',
          forecastedDemand30d: 125,
          retailPricePhp: 360.0,
          forecastedRevenue30dPhp: 45000.0,
        },
        {
          sku: 'BEV-BRB-POW',
          productName: 'Bear Brand Fortified Milk 900g',
          categoryName: 'Beverages',
          forecastedDemand30d: 135,
          retailPricePhp: 319.0,
          forecastedRevenue30dPhp: 43065.0,
        },
        {
          sku: 'CAN-SPM-LUN',
          productName: 'SPAM Luncheon Meat Classic 340g',
          categoryName: 'Canned Goods',
          forecastedDemand30d: 131,
          retailPricePhp: 235.0,
          forecastedRevenue30dPhp: 30785.0,
        },
        {
          sku: 'RIC-SIN-001',
          productName: 'Sinandomeng Special Rice 5kg',
          categoryName: 'Rice & Carbs',
          forecastedDemand30d: 106,
          retailPricePhp: 285.0,
          forecastedRevenue30dPhp: 30210.0,
        },
      ];

  // 1. Dual-Role Auth Landing Page Guard
  if (!currentUser) {
    return (
      <AuthLandingPage
        onLogin={(user) => {
          setCurrentUser(user);
          if (user.role === 'cashier') {
            setActiveTab('pos');
            if (isDashboardPath()) {
              window.history.replaceState(null, '', '/');
              setRbacNotice(
                'Access Restricted: Cashier accounts are strictly confined to POS checkout and cannot access the Manager Dashboard.',
              );
            }
          } else {
            setActiveTab('ai');
            window.history.replaceState(null, '', '/dashboard');
          }
        }}
      />
    );
  }

  // 2. Strict Cashier RBAC Restriction: Cashiers cannot access AI Management Dashboard
  if (currentUser.role === 'cashier' && activeTab === 'ai') {
    return (
      <div className="relative h-screen">
        {rbacNotice && (
          <div
            className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-xl backdrop-blur animate-in fade-in duration-200"
            style={{
              backgroundColor: 'var(--at-accent)',
              borderColor: 'var(--at-accent-light)',
              color: 'var(--at-text-on-accent)',
            }}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" style={{ color: 'var(--at-primary)' }} />
            <span>{rbacNotice}</span>
            <button
              onClick={() => setRbacNotice(null)}
              className="ml-2 transition"
              style={{ color: 'var(--at-primary)' }}
            >
              &times;
            </button>
          </div>
        )}
        <PosCheckoutShell
          initialProducts={products}
          storeName={currentUser.storeName}
          terminalCode={currentUser.terminalCode}
          cashierName={currentUser.name}
          cashierRole="Cashier (EMP-CSH-01)"
          userRole={currentUser.role}
          onToggleAiDashboard={undefined}
          onLockTerminal={() => setCurrentUser(null)}
          pendingRecommendationsCount={pendingCount}
        />
      </div>
    );
  }

  if (activeTab === 'pos') {
    return (
      <div className="relative h-screen">
        {rbacNotice && (
          <div
            className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-xl backdrop-blur animate-in fade-in duration-200"
            style={{
              backgroundColor: 'var(--at-accent)',
              borderColor: 'var(--at-accent-light)',
              color: 'var(--at-text-on-accent)',
            }}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" style={{ color: 'var(--at-primary)' }} />
            <span>{rbacNotice}</span>
            <button
              onClick={() => setRbacNotice(null)}
              className="ml-2 transition"
              style={{ color: 'var(--at-primary)' }}
            >
              &times;
            </button>
          </div>
        )}
        <PosCheckoutShell
          initialProducts={products}
          storeName={currentUser.storeName}
          terminalCode={currentUser.terminalCode}
          cashierName={currentUser.name}
          cashierRole={
            currentUser.role === 'cashier'
              ? 'Cashier (EMP-CSH-01)'
              : 'Store Manager (EMP-MGR-01)'
          }
          userRole={currentUser.role}
          onToggleAiDashboard={
            currentUser.role === 'cashier' ? undefined : () => navigateToTab('ai')
          }
          onLockTerminal={() => setCurrentUser(null)}
          pendingRecommendationsCount={pendingCount}
        />
      </div>
    );
  }

  // AI Replenishment Engine Dashboard View (Philippine Peso Localization)
  return (
    <div
      className="flex flex-col h-screen overflow-hidden font-sans"
      style={{ backgroundColor: 'var(--at-neutral)', color: 'var(--at-text-on-neutral)' }}
    >
      {/* ── Manager Dashboard Header – Accent dark bg, Neutral text ──────── */}
      <header
        className="h-16 border-b backdrop-blur-md px-6 flex items-center justify-between shrink-0"
        style={{
          backgroundColor: 'var(--at-accent)',
          borderColor: 'var(--at-accent-light)',
          color: 'var(--at-text-on-accent)',
        }}
      >
        <div className="flex items-center gap-4">
          {/* Back to POS button */}
          <button
            onClick={() => navigateToTab('pos')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition active:scale-95"
            style={{
              backgroundColor: 'var(--at-accent-muted)',
              borderColor: 'var(--at-accent-light)',
              color: 'var(--at-neutral)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--at-accent-light)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--at-accent-muted)';
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to POS Register</span>
          </button>

          {/* Brand mark */}
          <div className="flex items-center gap-2.5">
            {/* Logo badge: Primary amber bg → CRITICAL: Accent dark text */}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shadow-lg"
              style={{ backgroundColor: 'var(--at-primary)', color: 'var(--at-text-on-primary)' }}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1
                className="text-sm font-bold leading-tight"
                style={{ color: 'var(--at-neutral)' }}
              >
                Manager Recommendation &amp; Inventory Replenishment UI
              </h1>
              <span className="text-[11px]" style={{ color: 'var(--at-neutral-muted)' }}>
                Phase 3.3 Active • Philippine Retail Standard (PHP / ₱)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Manager user chip */}
          <div
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs"
            style={{
              backgroundColor: 'var(--at-accent-muted)',
              borderColor: 'var(--at-accent-light)',
              color: 'var(--at-neutral)',
            }}
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px]"
              style={{ backgroundColor: 'var(--at-accent-light)', color: 'var(--at-primary)' }}
            >
              M
            </div>
            <div className="text-left">
              <span className="font-semibold block text-xs" style={{ color: 'var(--at-neutral)' }}>
                {currentUser.name}
              </span>
              <span className="text-[10px] block leading-none" style={{ color: 'var(--at-neutral-muted)' }}>
                @{currentUser.username} • Manager
              </span>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={() => setCurrentUser(null)}
            title="Sign Out"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition active:scale-95"
            style={{
              backgroundColor: 'rgba(184,84,63,0.15)',
              borderColor: 'rgba(184,84,63,0.35)',
              color: 'var(--at-neutral)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(184,84,63,0.28)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(184,84,63,0.15)';
            }}
          >
            <LogOut className="w-3.5 h-3.5" style={{ color: 'var(--at-secondary)' }} />
            <span>Sign Out</span>
          </button>

          {/* Audit / Adjust Stock Button */}
          <button
            onClick={() => {
              setSelectedAdjustmentProductId(undefined);
              setIsAdjustmentModalOpen(true);
            }}
            title="Perform manual stock adjustment / inventory audit"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition active:scale-95"
            style={{
              backgroundColor: 'var(--at-accent-muted)',
              borderColor: 'var(--at-accent-light)',
              color: 'var(--at-neutral)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--at-accent-light)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--at-accent-muted)';
            }}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: 'var(--at-primary)' }} />
            <span>Audit / Adjust Stock</span>
          </button>

          {/* Refresh AI Pipeline */}
          <button
            onClick={fetchLiveData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition disabled:opacity-50"
            style={{
              backgroundColor: 'var(--at-accent-muted)',
              borderColor: 'var(--at-accent-light)',
              color: 'var(--at-primary)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading)
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--at-accent-light)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--at-accent-muted)';
            }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing...' : 'Refresh AI Pipeline'}
          </button>
        </div>
      </header>

      {/* ── Main Content Area ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* ── Low Stock Warning Alert Banner ─────────────────────────────
               Secondary (#B8543F) bg → Neutral (#F8EBD9) text (WCAG AA ✅) */}
          {lowStockItems.length > 0 && (
            <div
              className="rounded-2xl border p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg"
              style={{
                backgroundColor: 'rgba(184,84,63,0.10)',
                borderColor: 'rgba(184,84,63,0.30)',
              }}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: 'rgba(184,84,63,0.18)',
                    borderColor: 'rgba(184,84,63,0.35)',
                    color: 'var(--at-secondary)',
                  }}
                >
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    className="text-sm font-bold flex items-center gap-2"
                    style={{ color: 'var(--at-secondary)' }}
                  >
                    <span>Low Stock Warning Alert</span>
                    {/* Badge: Secondary bg → Neutral text (WCAG AA ✅) */}
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-mono border"
                      style={{
                        backgroundColor: 'var(--at-secondary)',
                        color: 'var(--at-text-on-secondary)',
                        borderColor: 'rgba(184,84,63,0.50)',
                      }}
                    >
                      {lowStockItems.length} SKUs Breached ROP
                    </span>
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--at-secondary)' }}>
                    Critical replenishment needed. Current inventory on shelf has fallen below calculated Reorder Point (ROP = Daily Avg Sales &times; Lead Time + Safety Stock).
                  </p>
                </div>
              </div>
              {/* Filter button: Secondary bg → Neutral text (WCAG AA ✅) */}
              <button
                onClick={() => setFilterUrgency('low_stock')}
                className="px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shrink-0 flex items-center gap-1.5 active:scale-95"
                style={{
                  backgroundColor: 'var(--at-secondary)',
                  color: 'var(--at-text-on-secondary)',
                  boxShadow: '0 4px 14px -2px rgba(184,84,63,0.35)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                }}
              >
                <span>Filter Low Stock Items</span>
                <span className="text-[11px] font-mono">&rarr;</span>
              </button>
            </div>
          )}

          {/* ── KPI Summary Grid ───────────────────────────────────────────
               All cards: Accent (#3D2545) bg → Neutral (#F8EBD9) text (WCAG AA ✅)
               Value accents use Primary amber → keep backgrounds dark for legibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Low Stock Warnings — Secondary rust accent */}
            <div
              className="p-5 rounded-2xl border shadow-sm relative overflow-hidden"
              style={{ backgroundColor: 'var(--at-accent)', borderColor: 'var(--at-accent-light)' }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--at-neutral-muted)' }}
              >
                Low Stock Warnings
              </div>
              <div className="text-3xl font-extrabold mt-2 font-mono" style={{ color: 'var(--at-secondary)' }}>
                {lowStockItems.length}{' '}
                <span className="text-sm font-normal" style={{ color: 'var(--at-neutral-muted)' }}>SKUs</span>
              </div>
              <div
                className="text-[11px] mt-2 flex items-center gap-1 font-medium"
                style={{ color: 'var(--at-secondary)' }}
              >
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Stock on hand &lt; Reorder Point</span>
              </div>
            </div>

            {/* 30-Day Forecasted Revenue — Primary amber value */}
            <div
              className="p-5 rounded-2xl border shadow-sm relative overflow-hidden"
              style={{ backgroundColor: 'var(--at-accent)', borderColor: 'var(--at-accent-light)' }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--at-neutral-muted)' }}
              >
                30-Day Forecasted Revenue
              </div>
              {/* Primary (#E39A4B) used as text color on dark Accent bg — safe (text not bg) */}
              <div className="text-2xl font-extrabold mt-2 font-mono" style={{ color: 'var(--at-primary)' }}>
                {formatPhp(totalForecastedRevenue30d)}
              </div>
              <div
                className="text-[11px] mt-2 flex items-center gap-1 font-medium"
                style={{ color: 'var(--at-primary-muted)' }}
              >
                <TrendingUp className="w-3 h-3 shrink-0" />
                <span>Projected Philippine Retail Sales</span>
              </div>
            </div>

            {/* Recommended Reorder Units — Neutral text */}
            <div
              className="p-5 rounded-2xl border shadow-sm relative overflow-hidden"
              style={{ backgroundColor: 'var(--at-accent)', borderColor: 'var(--at-accent-light)' }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--at-neutral-muted)' }}
              >
                Total Recommended Reorder
              </div>
              <div
                className="text-3xl font-extrabold mt-2 font-mono"
                style={{ color: 'var(--at-neutral)' }}
              >
                +{totalReorderUnits.toLocaleString()}{' '}
                <span className="text-sm font-normal" style={{ color: 'var(--at-neutral-muted)' }}>units</span>
              </div>
              <div
                className="text-[11px] mt-2 flex items-center gap-1"
                style={{ color: 'var(--at-neutral-muted)' }}
              >
                <Package className="w-3 h-3 shrink-0" />
                <span>Across {recommendations.length} active SKUs</span>
              </div>
            </div>

            {/* Capital Allocation (PHP) — Primary amber value */}
            <div
              className="p-5 rounded-2xl border shadow-sm relative overflow-hidden"
              style={{ backgroundColor: 'var(--at-accent)', borderColor: 'var(--at-accent-light)' }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--at-neutral-muted)' }}
              >
                Restock Capital (PHP / ₱)
              </div>
              <div className="text-2xl font-extrabold mt-2 font-mono" style={{ color: 'var(--at-primary)' }}>
                {formatPhp(totalRestockCapital)}
              </div>
              <div
                className="text-[11px] mt-2 font-medium"
                style={{ color: 'var(--at-neutral-muted)' }}
              >
                Supplier restock budget required
              </div>
            </div>
          </div>

          {/* ── Top-Selling Products Panel ─────────────────────────────────
               Panel: Accent dark bg → Neutral text
               Cards: Accent-muted bg → Neutral text, Primary amber highlights */}
          <div
            className="rounded-2xl border p-6 space-y-4"
            style={{ backgroundColor: 'var(--at-accent)', borderColor: 'var(--at-accent-light)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3
                  className="text-sm font-bold flex items-center gap-2"
                  style={{ color: 'var(--at-neutral)' }}
                >
                  <span>Top-Selling Products by 30-Day Forecasted Revenue</span>
                  {/* Badge: Primary bg → CRITICAL: Accent dark text */}
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-mono border"
                    style={{
                      backgroundColor: 'var(--at-primary)',
                      color: 'var(--at-text-on-primary)',
                      borderColor: 'var(--at-primary-muted)',
                    }}
                  >
                    PHP / ₱ Standards
                  </span>
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--at-neutral-muted)' }}>
                  High-velocity staple FMCG goods in Philippine retail
                </p>
              </div>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-lg border"
                style={{
                  backgroundColor: 'rgba(227,154,75,0.12)',
                  borderColor: 'rgba(227,154,75,0.30)',
                  color: 'var(--at-primary)',
                }}
              >
                Key Revenue Drivers
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {topProducts.map((prod, idx) => (
                <div
                  key={prod.sku}
                  className="p-4 rounded-xl border transition flex flex-col justify-between"
                  style={{
                    backgroundColor: 'var(--at-accent-muted)',
                    borderColor: 'var(--at-accent-light)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--at-primary)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--at-accent-light)';
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      {/* Rank number in Primary amber (text, not bg) */}
                      <span className="font-bold" style={{ color: 'var(--at-primary)' }}>#{idx + 1}</span>
                      <span style={{ color: 'var(--at-neutral-muted)' }}>{prod.sku}</span>
                    </div>
                    <h4
                      className="text-xs font-bold mt-2 line-clamp-2 leading-tight"
                      style={{ color: 'var(--at-neutral)' }}
                    >
                      {prod.productName}
                    </h4>
                    <span
                      className="inline-block text-[10px] px-2 py-0.5 rounded mt-2 border"
                      style={{
                        backgroundColor: 'var(--at-accent)',
                        borderColor: 'var(--at-accent-light)',
                        color: 'var(--at-neutral-muted)',
                      }}
                    >
                      {prod.categoryName}
                    </span>
                  </div>

                  <div
                    className="mt-4 pt-3 border-t"
                    style={{ borderColor: 'rgba(90,56,104,0.40)' }}
                  >
                    <div className="text-[11px]" style={{ color: 'var(--at-neutral-muted)' }}>
                      30d Demand:{' '}
                      <strong style={{ color: 'var(--at-neutral)' }}>
                        {Math.round(prod.forecastedDemand30d)} units
                      </strong>
                    </div>
                    {/* Primary amber as text color on dark Accent card — safe */}
                    <div
                      className="text-sm font-bold font-mono mt-1"
                      style={{ color: 'var(--at-primary)' }}
                    >
                      {formatPhp(prod.forecastedRevenue30dPhp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations Table Section */}
          <div
            className="rounded-2xl border overflow-hidden shadow-xl"
            style={{
              backgroundColor: 'var(--at-accent)',
              borderColor: 'var(--at-accent-light)',
            }}
          >
            <div
              className="p-6 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              style={{ borderColor: 'rgba(90,56,104,0.40)' }}
            >
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--at-neutral)' }}>
                  Inventory Recommendations &amp; Reorder Points
                </h3>
                <p className="text-xs mt-1" style={{ color: 'var(--at-neutral-muted)' }}>
                  Formula applied:{' '}
                  <code className="font-mono font-semibold" style={{ color: 'var(--at-primary)' }}>
                    ROP = Daily Avg Sales &times; Lead Time + Safety Stock
                  </code>
                </p>
              </div>

              {/* Controls: Search & Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Input */}
                <div className="relative">
                  <Search
                    className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--at-neutral-muted)' }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search SKU or Product..."
                    className="pl-9 pr-3 py-1.5 rounded-lg border text-xs placeholder:text-stone-400 focus:outline-none w-full sm:w-52 transition"
                    style={{
                      backgroundColor: 'var(--at-accent-muted)',
                      borderColor: 'var(--at-accent-light)',
                      color: 'var(--at-neutral)',
                    }}
                  />
                </div>

                {/* Filter Tabs */}
                <div
                  className="flex items-center gap-1 p-1 rounded-lg border text-xs"
                  style={{
                    backgroundColor: 'var(--at-accent-muted)',
                    borderColor: 'var(--at-accent-light)',
                  }}
                >
                  <button
                    onClick={() => setFilterUrgency('all')}
                    className="px-3 py-1 rounded-md transition font-medium text-xs"
                    style={
                      filterUrgency === 'all'
                        ? {
                            backgroundColor: 'var(--at-primary)',
                            color: 'var(--at-text-on-primary)',
                            fontWeight: 700,
                          }
                        : {
                            color: 'var(--at-neutral-muted)',
                          }
                    }
                  >
                    All ({recommendations.length})
                  </button>
                  <button
                    onClick={() => setFilterUrgency('low_stock')}
                    className="px-3 py-1 rounded-md transition font-medium text-xs"
                    style={
                      filterUrgency === 'low_stock'
                        ? {
                            backgroundColor: 'var(--at-secondary)',
                            color: 'var(--at-text-on-secondary)',
                            fontWeight: 700,
                          }
                        : {
                            color: 'var(--at-neutral-muted)',
                          }
                    }
                  >
                    Low Stock ({lowStockItems.length})
                  </button>
                  <button
                    onClick={() => setFilterUrgency('high')}
                    className="px-3 py-1 rounded-md transition font-medium text-xs"
                    style={
                      filterUrgency === 'high'
                        ? {
                            backgroundColor: 'var(--at-secondary)',
                            color: 'var(--at-text-on-secondary)',
                            fontWeight: 700,
                          }
                        : {
                            color: 'var(--at-neutral-muted)',
                          }
                    }
                  >
                    High
                  </button>
                  <button
                    onClick={() => setFilterUrgency('medium')}
                    className="px-3 py-1 rounded-md transition font-medium text-xs"
                    style={
                      filterUrgency === 'medium'
                        ? {
                            backgroundColor: 'var(--at-primary)',
                            color: 'var(--at-text-on-primary)',
                            fontWeight: 700,
                          }
                        : {
                            color: 'var(--at-neutral-muted)',
                          }
                    }
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => setFilterUrgency('low')}
                    className="px-3 py-1 rounded-md transition font-medium text-xs"
                    style={
                      filterUrgency === 'low'
                        ? {
                            backgroundColor: 'var(--at-accent-light)',
                            color: 'var(--at-neutral)',
                            fontWeight: 700,
                          }
                        : {
                            color: 'var(--at-neutral-muted)',
                          }
                    }
                  >
                    Low
                  </button>
                </div>
              </div>
            </div>

            {/* ── Table ─────────────────────────────────────────────────────
                 Header: Accent-muted bg, Neutral-muted uppercase text
                 Rows: Accent bg, Neutral text
                 Urgency badges: strict contrast pairing enforced */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className="uppercase text-[10px] tracking-wider border-b"
                  style={{
                    backgroundColor: 'var(--at-accent-muted)',
                    color: 'var(--at-neutral-muted)',
                    borderColor: 'var(--at-accent-light)',
                  }}
                >
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Product SKU &amp; Name</th>
                    <th className="py-3.5 px-4 font-semibold text-center">On Hand</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Reorder Point (ROP)</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Daily Sales Velocity</th>
                    <th className="py-3.5 px-4 font-semibold text-center">7d / 14d / 30d Demand</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Recommended Reorder</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Est. Cost (PHP)</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Urgency</th>
                    <th className="py-3.5 px-4 font-semibold">AI Recommendation Reasoning</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody style={{ borderColor: 'rgba(90,56,104,0.30)' }}>
                  {filteredRecommendations.map((rec) => {
                    const isBreached = rec.currentStockOnHand < rec.reorderPoint;
                    return (
                      <tr
                        key={rec.id}
                        className="transition"
                        style={{
                          backgroundColor: isBreached
                            ? 'rgba(184,84,63,0.06)'
                            : 'transparent',
                          borderBottom: '1px solid rgba(90,56,104,0.25)',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                            isBreached ? 'rgba(184,84,63,0.12)' : 'rgba(61,37,69,0.25)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                            isBreached ? 'rgba(184,84,63,0.06)' : 'transparent';
                        }}
                      >
                        {/* Product Name & SKU */}
                        <td className="py-4 px-4 font-medium max-w-xs">
                          <div
                            className="font-bold"
                            style={{ color: 'var(--at-neutral)' }}
                          >
                            {rec.productName}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="font-mono text-[11px]"
                              style={{ color: 'var(--at-neutral-muted)' }}
                            >
                              {rec.sku}
                            </span>
                            {rec.categoryName && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded border"
                                style={{
                                  backgroundColor: 'var(--at-accent-muted)',
                                  color: 'var(--at-neutral-muted)',
                                  borderColor: 'var(--at-accent-light)',
                                }}
                              >
                                {rec.categoryName}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* On Hand */}
                        <td className="py-4 px-4 text-center font-mono font-bold">
                          <span
                            style={{ color: isBreached ? 'var(--at-secondary)' : 'var(--at-neutral)' }}
                          >
                            {rec.currentStockOnHand}
                          </span>
                          {isBreached && (
                            <span
                              className="block text-[9px] uppercase font-semibold"
                              style={{ color: 'var(--at-secondary)' }}
                            >
                              Below ROP
                            </span>
                          )}
                        </td>

                        {/* ROP */}
                        <td className="py-4 px-4 text-center font-mono">
                          <span
                            className="px-2 py-1 rounded font-bold"
                            style={{
                              backgroundColor: 'var(--at-accent-muted)',
                              color: 'var(--at-neutral)',
                            }}
                          >
                            {rec.reorderPoint}
                          </span>
                          <span
                            className="block text-[10px] mt-1"
                            style={{ color: 'var(--at-neutral-muted)' }}
                          >
                            LT: {rec.leadTimeDays}d | SS: {rec.safetyStock}
                          </span>
                        </td>

                        {/* Daily Avg Sales */}
                        <td
                          className="py-4 px-4 text-center font-mono"
                          style={{ color: 'var(--at-neutral)' }}
                        >
                          {rec.dailyAvgSales ? Number(rec.dailyAvgSales).toFixed(2) : '3.50'}/day
                        </td>

                        {/* 7d / 14d / 30d Demand */}
                        <td className="py-4 px-4 text-center font-mono">
                          <span style={{ color: 'var(--at-neutral)' }}>{Math.round(rec.forecastedDemand7d)}</span>
                          <span style={{ color: 'var(--at-neutral-muted)' }} className="mx-1">/</span>
                          <span style={{ color: 'var(--at-neutral)' }}>{Math.round(rec.forecastedDemand14d)}</span>
                          <span style={{ color: 'var(--at-neutral-muted)' }} className="mx-1">/</span>
                          {/* 30d in Primary amber (text on dark bg — safe) */}
                          <span className="font-bold" style={{ color: 'var(--at-primary)' }}>
                            {Math.round(rec.forecastedDemand30d || rec.forecastedDemand14d * 2.1)}
                          </span>
                        </td>

                        {/* Recommended Order Qty – Primary amber bg → CRITICAL: Accent dark text */}
                        <td className="py-4 px-4 text-center font-mono font-bold">
                          <span
                            className="px-2.5 py-1 rounded-lg border"
                            style={{
                              backgroundColor: 'var(--at-primary)',
                              color: 'var(--at-text-on-primary)',  /* #3D2545 — WCAG AA ✅ */
                              borderColor: 'var(--at-primary-muted)',
                            }}
                          >
                            +{rec.recommendedOrderQuantity} units
                          </span>
                        </td>

                        {/* Est. Cost */}
                        <td
                          className="py-4 px-4 text-right font-mono font-bold"
                          style={{ color: 'var(--at-neutral)' }}
                        >
                          {formatPhp(rec.estimatedCost)}
                        </td>

                        {/* Urgency Badge */}
                        <td className="py-4 px-4 text-center">
                          <span
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                            style={
                              rec.urgency === 'critical' || rec.urgency === 'high'
                                ? {
                                    /* Secondary rust bg → Neutral text (WCAG AA ✅ 4.9:1) */
                                    backgroundColor: 'rgba(184,84,63,0.18)',
                                    color: 'var(--at-secondary)',
                                    borderColor: 'rgba(184,84,63,0.35)',
                                  }
                                : rec.urgency === 'medium'
                                ? {
                                    /* Primary amber bg → CRITICAL: Accent dark text (WCAG AA ✅ 4.6:1) */
                                    backgroundColor: 'rgba(227,154,75,0.18)',
                                    color: 'var(--at-primary-dark)',
                                    borderColor: 'rgba(227,154,75,0.35)',
                                  }
                                : {
                                    /* Low: subtle Accent light */
                                    backgroundColor: 'rgba(61,37,69,0.12)',
                                    color: 'var(--at-accent-light)',
                                    borderColor: 'rgba(90,56,104,0.30)',
                                  }
                            }
                          >
                            {rec.urgency}
                          </span>
                        </td>

                        {/* Reasoning Summary */}
                        <td
                          className="py-4 px-4 text-[11px] max-w-sm leading-relaxed"
                          style={{ color: 'var(--at-neutral-muted)' }}
                        >
                          {rec.reasoningSummary}
                        </td>

                        {/* Action – Approve PO & Stock Audit buttons */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedAdjustmentProductId(rec?.productId);
                                setIsAdjustmentModalOpen(true);
                              }}
                              title={`Adjust stock for ${rec?.productName ?? rec?.sku}`}
                              className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition flex items-center gap-1 active:scale-95"
                              style={{
                                backgroundColor: 'var(--at-accent-muted)',
                                borderColor: 'var(--at-accent-light)',
                                color: 'var(--at-neutral-muted)',
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.color = 'var(--at-neutral)';
                                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--at-primary)';
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.color = 'var(--at-neutral-muted)';
                                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--at-accent-light)';
                              }}
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: 'var(--at-primary)' }} />
                              <span className="hidden sm:inline">Adjust</span>
                            </button>

                            {rec?.status === 'approved' ? (
                              <span
                                className="inline-flex items-center gap-1 font-semibold text-xs whitespace-nowrap"
                                style={{ color: 'var(--at-primary)' }}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                              </span>
                            ) : (
                              /* Secondary rust bg → Neutral text (WCAG AA ✅) */
                              <button
                                onClick={() => approveRecommendation(rec?.id)}
                                className="px-3 py-1.5 rounded-lg font-medium text-xs transition shadow-sm active:scale-95 whitespace-nowrap"
                                style={{
                                  backgroundColor: 'var(--at-secondary)',
                                  color: 'var(--at-text-on-secondary)',
                                }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.opacity = '0.88';
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                                }}
                              >
                                Approve PO
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          </div>

          </div>

        </div>
      </main>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        products={products}
        initialProductId={selectedAdjustmentProductId}
        onAdjustmentSuccess={handleAdjustmentSuccess}
      />

      {/* Footer – Accent dark bg, Neutral-muted text (WCAG compliant) */}
      <footer
        className="h-12 border-t text-xs flex items-center justify-between px-6 shrink-0"
        style={{
          backgroundColor: 'var(--at-accent)',
          borderColor: 'var(--at-accent-light)',
          color: 'var(--at-neutral-muted)',
        }}
      >
        <div>POS AI Enterprise &bull; Philippine Retail &amp; FMCG Standard</div>
        <div>
          Model Version:{' '}
          <strong style={{ color: 'var(--at-neutral)' }}>v1.4.0 (LightGBM Demand Forecaster)</strong>
        </div>
      </footer>
    </div>
  );
}
