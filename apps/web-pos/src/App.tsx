import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { PosCheckoutShell } from './components/pos';
import { formatPhp } from './utils/formatters';
import type { ProductWithStock, ReplenishmentRecommendation } from '@pos-ai/shared-types';

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
    taxRate: 0.0, // VAT-Exempt staple
    reorderPoint: 20,
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
    name: 'Dinorado Fragrant Rice 5kg',
    description: 'Aromatic long-grain fragrant Philippine rice',
    unitOfMeasure: 'sack',
    costPrice: 280.0,
    retailPrice: 345.0,
    taxRate: 0.0,
    reorderPoint: 15,
    reorderQuantity: 50,
    leadTimeDays: 3,
    stockOnHand: 45,
    stockReserved: 0,
    stockAvailable: 45,
    safetyStock: 20,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '40000000-0000-0000-0000-000000000003',
    categoryId: '30000000-0000-0000-0000-000000000001',
    categoryName: 'Rice & Carbs',
    sku: 'NOD-LKM-003',
    barcode: '480001660103',
    name: 'Lucky Me! Pancit Canton Kalamansi (Pack of 6)',
    description: 'Filipino favorite citrus stir-fried noodles bundle',
    unitOfMeasure: 'pack',
    costPrice: 62.0,
    retailPrice: 78.0,
    taxRate: 0.12,
    reorderPoint: 40,
    reorderQuantity: 120,
    leadTimeDays: 2,
    stockOnHand: 85,
    stockReserved: 0,
    stockAvailable: 85,
    safetyStock: 25,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '40000000-0000-0000-0000-000000000004',
    categoryId: '30000000-0000-0000-0000-000000000002',
    categoryName: 'Canned Goods & Instant Meals',
    sku: 'CAN-TUN-004',
    barcode: '480001660201',
    name: 'Century Tuna Flakes in Oil 180g',
    description: 'Omega-3 rich premium yellowfin tuna flakes',
    unitOfMeasure: 'can',
    costPrice: 37.5,
    retailPrice: 46.75,
    taxRate: 0.12,
    reorderPoint: 30,
    reorderQuantity: 90,
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
    barcode: '480001660202',
    name: 'Purefoods Corned Beef 210g',
    description: 'Classic seasoned 100% pure savory beef',
    unitOfMeasure: 'can',
    costPrice: 79.0,
    retailPrice: 98.5,
    taxRate: 0.12,
    reorderPoint: 25,
    reorderQuantity: 75,
    leadTimeDays: 2,
    stockOnHand: 8,
    stockReserved: 0,
    stockAvailable: 8,
    safetyStock: 20,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '40000000-0000-0000-0000-000000000006',
    categoryId: '30000000-0000-0000-0000-000000000002',
    categoryName: 'Canned Goods & Instant Meals',
    sku: 'CAN-SRD-006',
    barcode: '480001660203',
    name: 'Mega Sardines in Tomato Sauce with Chili 155g',
    description: 'Deep ocean sardines in spiced tomato sauce',
    unitOfMeasure: 'can',
    costPrice: 21.0,
    retailPrice: 27.5,
    taxRate: 0.12,
    reorderPoint: 50,
    reorderQuantity: 150,
    leadTimeDays: 2,
    stockOnHand: 110,
    stockReserved: 0,
    stockAvailable: 110,
    safetyStock: 30,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '40000000-0000-0000-0000-000000000007',
    categoryId: '30000000-0000-0000-0000-000000000003',
    categoryName: 'Beverages',
    sku: 'BEV-KOP-007',
    barcode: '480001660301',
    name: 'Kopiko Blanca 3-in-1 Coffee 30g x 10s',
    description: 'Creamy sweet instant white coffee bag',
    unitOfMeasure: 'bag',
    costPrice: 68.0,
    retailPrice: 85.0,
    taxRate: 0.12,
    reorderPoint: 30,
    reorderQuantity: 90,
    leadTimeDays: 2,
    stockOnHand: 75,
    stockReserved: 0,
    stockAvailable: 75,
    safetyStock: 30,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '40000000-0000-0000-0000-000000000008',
    categoryId: '30000000-0000-0000-0000-000000000003',
    categoryName: 'Beverages',
    sku: 'BEV-SMB-008',
    barcode: '480001660302',
    name: 'San Miguel Pale Pilsen 330ml Can',
    description: 'Iconic Philippine golden lager beer',
    unitOfMeasure: 'can',
    costPrice: 45.0,
    retailPrice: 58.0,
    taxRate: 0.12,
    reorderPoint: 40,
    reorderQuantity: 120,
    leadTimeDays: 2,
    stockOnHand: 90,
    stockReserved: 0,
    stockAvailable: 90,
    safetyStock: 35,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '40000000-0000-0000-0000-000000000010',
    categoryId: '30000000-0000-0000-0000-000000000004',
    categoryName: 'Snacks & Confectionery',
    sku: 'SNK-PIA-010',
    barcode: '480001660401',
    name: 'Piattos Cheese Flavored Potato Crisps 85g',
    description: 'Hexagonal crunchy cheese potato snack',
    unitOfMeasure: 'pack',
    costPrice: 30.5,
    retailPrice: 38.5,
    taxRate: 0.12,
    reorderPoint: 35,
    reorderQuantity: 100,
    leadTimeDays: 2,
    stockOnHand: 60,
    stockReserved: 0,
    stockAvailable: 60,
    safetyStock: 25,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '40000000-0000-0000-0000-000000000012',
    categoryId: '30000000-0000-0000-0000-000000000005',
    categoryName: 'Personal Care & Household',
    sku: 'PCR-SFG-012',
    barcode: '480001660501',
    name: 'Safeguard Pure White Soap 130g',
    description: 'Classic 99.9% germ protection bar soap',
    unitOfMeasure: 'bar',
    costPrice: 38.0,
    retailPrice: 48.0,
    taxRate: 0.12,
    reorderPoint: 30,
    reorderQuantity: 90,
    leadTimeDays: 3,
    stockOnHand: 48,
    stockReserved: 0,
    stockAvailable: 48,
    safetyStock: 20,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_PH_RECOMMENDATIONS: ReplenishmentRecommendation[] = [
  {
    id: '60000000-0000-0000-0000-000000000001',
    forecastRunId: '50000000-0000-0000-0000-000000000001',
    storeId: '10000000-0000-0000-0000-000000000001',
    productId: '40000000-0000-0000-0000-000000000005',
    productName: 'Purefoods Corned Beef 210g',
    sku: 'CAN-CRN-005',
    currentStockOnHand: 8,
    forecastedDemand7d: 38.0,
    forecastedDemand14d: 75.0,
    recommendedOrderQuantity: 75,
    urgency: 'critical',
    confidenceScore: 0.978,
    predictedStockoutDate: '2026-10-18',
    estimatedCost: 5925.0,
    reasoningSummary:
      'Imminent stockout: 8 cans left. High sales velocity before weekend rush. Supplier lead time is 2 days.',
    status: 'pending_review',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '60000000-0000-0000-0000-000000000002',
    forecastRunId: '50000000-0000-0000-0000-000000000001',
    storeId: '10000000-0000-0000-0000-000000000001',
    productId: '40000000-0000-0000-0000-000000000001',
    productName: 'Sinandomeng Special Rice 5kg',
    sku: 'RIC-SIN-001',
    currentStockOnHand: 12,
    forecastedDemand7d: 26.0,
    forecastedDemand14d: 58.0,
    recommendedOrderQuantity: 60,
    urgency: 'high',
    confidenceScore: 0.941,
    predictedStockoutDate: '2026-10-20',
    estimatedCost: 13800.0,
    reasoningSummary:
      'Inventory (12 sacks) breached safety buffer (15). Essential household staple with accelerating weekly demand.',
    status: 'pending_review',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'pos' | 'ai'>('pos');
  const [products] = useState<ProductWithStock[]>(INITIAL_PH_PRODUCTS);
  const [recommendations, setRecommendations] = useState<ReplenishmentRecommendation[]>(INITIAL_PH_RECOMMENDATIONS);

  const approveRecommendation = (id: string) => {
    setRecommendations((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, status: 'approved' } : rec)),
    );
  };

  const pendingCount = recommendations.filter((r) => r.status === 'pending_review').length;

  if (activeTab === 'pos') {
    return (
      <PosCheckoutShell
        initialProducts={products}
        storeName="Flagship BGC Terminal - Taguig"
        terminalCode="POS-BGC-01"
        cashierName="Juan Dela Cruz"
        onToggleAiDashboard={() => setActiveTab('ai')}
        pendingRecommendationsCount={pendingCount}
      />
    );
  }

  // AI Replenishment Engine Dashboard View (Philippine Peso Localization)
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
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
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h1 className="text-base font-bold text-white">AI Inventory Replenishment & Demand Forecasting</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              Philippine Supermarket Model • 14-Day Horizon
            </span>
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-400 text-xs font-semibold transition">
          <RefreshCw className="w-3.5 h-3.5" />
          Run Scheduled Batch Forecast
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* KPI Summary Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Imminent Stockouts</div>
              <div className="text-2xl font-bold text-rose-400 mt-1">2 Items</div>
              <div className="text-[11px] text-rose-500/90 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Within 48 hours
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Model Forecast Accuracy</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">94.2%</div>
              <div className="text-[11px] text-emerald-500/90 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> WAPE error: 0.058
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Pending Manager Approvals</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {pendingCount} Orders
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Ready for Purchase Order</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Capital Allocation (PHP)</div>
              <div className="text-2xl font-bold text-indigo-400 mt-1">
                {formatPhp(
                  recommendations.reduce((sum, r) => sum + r.estimatedCost, 0),
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Target replenishment value</div>
            </div>
          </div>

          {/* Recommendations Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-white">Active Reorder Recommendations</h3>
              <span className="text-xs text-slate-400">Values in Philippine Peso (PHP / ₱)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Product / SKU</th>
                    <th className="py-3 px-4">On Hand</th>
                    <th className="py-3 px-4">Forecast 7d / 14d</th>
                    <th className="py-3 px-4">Recommended Reorder</th>
                    <th className="py-3 px-4">Est. Cost (PHP)</th>
                    <th className="py-3 px-4">Urgency</th>
                    <th className="py-3 px-4">AI Reasoning</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recommendations.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-4 px-4 font-medium text-slate-200">
                        <div>{rec.productName}</div>
                        <div className="text-[10px] font-mono text-slate-500">{rec.sku}</div>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-slate-200">
                        {rec.currentStockOnHand}
                      </td>
                      <td className="py-4 px-4 text-slate-300">
                        {rec.forecastedDemand7d} / {rec.forecastedDemand14d} units
                      </td>
                      <td className="py-4 px-4 font-bold text-indigo-400 font-mono">
                        +{rec.recommendedOrderQuantity} units
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-slate-200">
                        {formatPhp(rec.estimatedCost)}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            rec.urgency === 'critical'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {rec.urgency}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400 max-w-xs leading-relaxed">
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
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition"
                          >
                            Approve PO
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
