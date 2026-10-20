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
} from 'lucide-react';
import { PosCheckoutShell } from './components/pos';
import { AuthLandingPage, type AuthUser } from './components/auth/AuthLandingPage';
import { formatPhp } from './utils/formatters';
import type {
  ProductWithStock,
  InventoryRecommendation,
  ManagerRecommendationSummary,
} from '@pos-ai/shared-types';

const INITIAL_PH_PRODUCTS: ProductWithStock[] = [
  {
    id: '40000000-0000-0000-0000-000000000001',
    categoryId: '30000000-0000-0000-0000-000000000001',
    categoryName: 'Rice & Carbs',
    sku: 'RIC-SIN-001',
    barcode: '480001660101',
    name: 'Sinandomeng Special Rice 5kg',
    description: 'Locally milled premium soft white grain rice',
    unitOfMeasure: 'sack',
    costPrice: 230.0,
    retailPrice: 285.0,
    taxRate: 0.0,
    reorderPoint: 23,
    reorderQuantity: 60,
    leadTimeDays: 2,
    stockOnHand: 12,
    stockReserved: 0,
    stockAvailable: 12,
    safetyStock: 15,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '40000000-0000-0000-0000-000000000002',
    categoryId: '30000000-0000-0000-0000-000000000001',
    categoryName: 'Rice & Carbs',
    sku: 'RIC-JAS-002',
    barcode: '480001660102',
    name: 'Dinorado Jasmine Rice 5kg',
    description: 'Fragrant sweet grain premium white rice',
    unitOfMeasure: 'sack',
    costPrice: 280.0,
    retailPrice: 345.0,
    taxRate: 0.0,
    reorderPoint: 20,
    reorderQuantity: 50,
    leadTimeDays: 3,
    stockOnHand: 34,
    stockReserved: 0,
    stockAvailable: 34,
    safetyStock: 12,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '40000000-0000-0000-0000-000000000003',
    categoryId: '30000000-0000-0000-0000-000000000002',
    categoryName: 'Canned Goods & Instant Meals',
    sku: 'CAN-TUN-004',
    barcode: '480001660204',
    name: 'Century Tuna Flakes in Oil 180g',
    description: 'Healthy tuna flakes packed in rich soybean oil',
    unitOfMeasure: 'can',
    costPrice: 37.5,
    retailPrice: 46.5,
    taxRate: 0.12,
    reorderPoint: 43,
    reorderQuantity: 120,
    leadTimeDays: 3,
    stockOnHand: 18,
    stockReserved: 0,
    stockAvailable: 18,
    safetyStock: 25,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '40000000-0000-0000-0000-000000000005',
    categoryId: '30000000-0000-0000-0000-000000000002',
    categoryName: 'Canned Goods & Instant Meals',
    sku: 'CAN-CRN-005',
    barcode: '480001660205',
    name: 'Purefoods Corned Beef 210g',
    description: '100% pure premium beef strands with rich flavor',
    unitOfMeasure: 'can',
    costPrice: 79.0,
    retailPrice: 97.5,
    taxRate: 0.12,
    reorderPoint: 30,
    reorderQuantity: 100,
    leadTimeDays: 2,
    stockOnHand: 8,
    stockReserved: 0,
    stockAvailable: 8,
    safetyStock: 20,
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

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<'pos' | 'ai'>('pos');
  const [products] = useState<ProductWithStock[]>(INITIAL_PH_PRODUCTS);
  const [recommendations, setRecommendations] = useState<InventoryRecommendation[]>(INITIAL_RECOMMENDATIONS);
  const [summary, setSummary] = useState<ManagerRecommendationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
          setActiveTab(user.role === 'cashier' ? 'pos' : 'ai');
        }}
      />
    );
  }

  // 2. Strict Cashier RBAC Restriction: Cashiers cannot access AI Management Dashboard
  if (currentUser.role === 'cashier' && activeTab === 'ai') {
    return (
      <PosCheckoutShell
        initialProducts={products}
        storeName={currentUser.storeName}
        terminalCode={currentUser.terminalCode}
        cashierName={currentUser.name}
        cashierRole="Cashier (EMP-CSH-01)"
        onToggleAiDashboard={undefined}
        onLockTerminal={() => setCurrentUser(null)}
        pendingRecommendationsCount={pendingCount}
      />
    );
  }

  if (activeTab === 'pos') {
    return (
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
        onToggleAiDashboard={
          currentUser.role === 'cashier' ? undefined : () => setActiveTab('ai')
        }
        onLockTerminal={() => setCurrentUser(null)}
        pendingRecommendationsCount={pendingCount}
      />
    );
  }

  // AI Replenishment Engine Dashboard View (Philippine Peso Localization)
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to POS Register</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">
                Manager Recommendation & Inventory Replenishment UI
              </h1>
              <span className="text-[11px] text-slate-400">
                Phase 3.3 Active • Philippine Retail Standard (PHP / ₱)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
            <div className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-[11px]">
              M
            </div>
            <div className="text-left">
              <span className="font-semibold text-white block text-xs">{currentUser.name}</span>
              <span className="text-[10px] text-slate-400 block leading-none">@{currentUser.username} • Manager</span>
            </div>
          </div>
          <button
            onClick={() => setCurrentUser(null)}
            title="Sign Out"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
          <a
            href="/dashboard.php"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>dashboard.php</span>
          </a>
          <button
            onClick={fetchLiveData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-400 text-xs font-semibold transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing...' : 'Refresh AI Pipeline'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Low Stock Warning Alert Banner */}
          {lowStockItems.length > 0 && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 backdrop-blur flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-rose-950/20">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                    <span>Low Stock Warning Alert</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                      {lowStockItems.length} SKUs Breached ROP
                    </span>
                  </h2>
                  <p className="text-xs text-rose-400/80 mt-0.5">
                    Critical replenishment needed. Current inventory on shelf has fallen below calculated Reorder Point (ROP = Daily Avg Sales &times; Lead Time + Safety Stock).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFilterUrgency('low_stock')}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/20 shrink-0 flex items-center gap-1.5"
              >
                <span>Filter Low Stock Items</span>
                <span className="text-[11px] font-mono">&rarr;</span>
              </button>
            </div>
          )}

          {/* KPI Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Low Stock Warnings */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Low Stock Warnings</div>
              <div className="text-3xl font-extrabold text-rose-400 mt-2 font-mono">
                {lowStockItems.length} <span className="text-sm font-normal text-slate-400">SKUs</span>
              </div>
              <div className="text-[11px] text-rose-400/90 mt-2 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                <span>Stock on hand &lt; Reorder Point</span>
              </div>
            </div>

            {/* 30-Day Forecasted Revenue */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">30-Day Forecasted Revenue</div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-2 font-mono">
                {formatPhp(totalForecastedRevenue30d)}
              </div>
              <div className="text-[11px] text-emerald-400/90 mt-2 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Projected Philippine Retail Sales</span>
              </div>
            </div>

            {/* Recommended Reorder Units */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Recommended Reorder</div>
              <div className="text-3xl font-extrabold text-indigo-400 mt-2 font-mono">
                +{totalReorderUnits.toLocaleString()} <span className="text-sm font-normal text-slate-400">units</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                <Package className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Across {recommendations.length} active SKUs</span>
              </div>
            </div>

            {/* Capital Allocation in PHP */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Restock Capital (PHP / ₱)</div>
              <div className="text-2xl font-extrabold text-amber-400 mt-2 font-mono">
                {formatPhp(totalRestockCapital)}
              </div>
              <div className="text-[11px] text-slate-400 mt-2 font-medium">
                Supplier restock budget required
              </div>
            </div>
          </div>

          {/* Top-Selling Products by Forecasted Revenue */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Top-Selling Products by 30-Day Forecasted Revenue</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    PHP / ₱ Standards
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">High-velocity staple FMCG goods in Philippine retail</p>
              </div>
              <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                Key Revenue Drivers
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {topProducts.map((prod, idx) => (
                <div
                  key={prod.sku}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span className="text-indigo-400 font-bold">#{idx + 1}</span>
                      <span>{prod.sku}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white mt-2 line-clamp-2 leading-tight">
                      {prod.productName}
                    </h4>
                    <span className="inline-block text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded mt-2">
                      {prod.categoryName}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/60">
                    <div className="text-[11px] text-slate-400">
                      30d Demand: <strong className="text-slate-200">{Math.round(prod.forecastedDemand30d)} units</strong>
                    </div>
                    <div className="text-sm font-bold text-emerald-400 font-mono mt-1">
                      {formatPhp(prod.forecastedRevenue30dPhp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations Table Section */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
            <div className="p-6 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">Inventory Recommendations & Reorder Points</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Formula applied: <code className="text-indigo-400 font-mono">ROP = Daily Avg Sales &times; Lead Time + Safety Stock</code>
                </p>
              </div>

              {/* Controls: Search & Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search SKU or Product..."
                    className="pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-52"
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setFilterUrgency('all')}
                    className={`px-3 py-1 rounded-md transition font-medium ${
                      filterUrgency === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({recommendations.length})
                  </button>
                  <button
                    onClick={() => setFilterUrgency('low_stock')}
                    className={`px-3 py-1 rounded-md transition font-medium ${
                      filterUrgency === 'low_stock' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Low Stock ({lowStockItems.length})
                  </button>
                  <button
                    onClick={() => setFilterUrgency('high')}
                    className={`px-3 py-1 rounded-md transition font-medium ${
                      filterUrgency === 'high' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    High
                  </button>
                  <button
                    onClick={() => setFilterUrgency('medium')}
                    className={`px-3 py-1 rounded-md transition font-medium ${
                      filterUrgency === 'medium' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => setFilterUrgency('low')}
                    className={`px-3 py-1 rounded-md transition font-medium ${
                      filterUrgency === 'low' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Low
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Product SKU & Name</th>
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
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRecommendations.map((rec) => {
                    const isBreached = rec.currentStockOnHand < rec.reorderPoint;
                    return (
                      <tr
                        key={rec.id}
                        className={`hover:bg-slate-800/30 transition ${isBreached ? 'bg-rose-950/10' : ''}`}
                      >
                        <td className="py-4 px-4 font-medium text-slate-200 max-w-xs">
                          <div className="font-bold text-white">{rec.productName}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-[11px] text-slate-400">{rec.sku}</span>
                            {rec.categoryName && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                {rec.categoryName}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center font-mono font-bold">
                          <span className={isBreached ? 'text-rose-400' : 'text-slate-200'}>
                            {rec.currentStockOnHand}
                          </span>
                          {isBreached && (
                            <span className="block text-[9px] text-rose-500 uppercase font-semibold">
                              Below ROP
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-center font-mono">
                          <span className="px-2 py-1 rounded bg-slate-800 font-bold text-slate-200">
                            {rec.reorderPoint}
                          </span>
                          <span className="block text-[10px] text-slate-500 mt-1">
                            LT: {rec.leadTimeDays}d | SS: {rec.safetyStock}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center font-mono text-slate-300">
                          {rec.dailyAvgSales ? Number(rec.dailyAvgSales).toFixed(2) : '3.50'}/day
                        </td>

                        <td className="py-4 px-4 text-center text-slate-300 font-mono">
                          <span className="text-slate-200">{Math.round(rec.forecastedDemand7d)}</span>
                          <span className="text-slate-500 mx-1">/</span>
                          <span className="text-slate-200">{Math.round(rec.forecastedDemand14d)}</span>
                          <span className="text-slate-500 mx-1">/</span>
                          <span className="text-indigo-400 font-bold">
                            {Math.round(rec.forecastedDemand30d || rec.forecastedDemand14d * 2.1)}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center font-mono font-bold text-indigo-400">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                            +{rec.recommendedOrderQuantity} units
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right font-mono font-bold text-slate-200">
                          {formatPhp(rec.estimatedCost)}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              rec.urgency === 'critical'
                                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                : rec.urgency === 'high'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : rec.urgency === 'medium'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {rec.urgency}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-slate-400 text-[11px] max-w-sm leading-relaxed">
                          {rec.reasoningSummary}
                        </td>

                        <td className="py-4 px-4 text-right">
                          {rec.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                            </span>
                          ) : (
                            <button
                              onClick={() => approveRecommendation(rec.id)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition shadow-sm"
                            >
                              Approve PO
                            </button>
                          )}
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

      {/* Footer */}
      <footer className="h-12 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between px-6 shrink-0 bg-slate-900/40">
        <div>POS AI Enterprise &bull; Philippine Retail & FMCG Standard</div>
        <div>Model Version: <strong>v1.4.0 (LightGBM Demand Forecaster)</strong></div>
      </footer>
    </div>
  );
}
