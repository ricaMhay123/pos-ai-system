<?php
/**
 * POS AI - Phase 3.3: Manager Recommendation UI (dashboard.php)
 * Management Dashboard for Store Managers & Inventory Leads
 * Displays:
 * 1. Low stock warning alerts & stockout risks
 * 2. Recommended reorder quantities per item (ROP = Daily Avg Sales * Lead Time + Safety Stock)
 * 3. Forecasted revenue (7d, 14d, 30d) and top-selling products in Philippine Pesos (₱ / PHP)
 */

session_start();

// Role-Based Access Control (RBAC) Guard
if (!isset($_SESSION['user_role'])) {
    header('Location: index.php?error=unauthenticated');
    exit;
}

// Cashier accounts are strictly restricted to POS checkout (sales.php)
if ($_SESSION['user_role'] === 'cashier') {
    header('Location: sales.php?error=cashier_restricted');
    exit;
}

$currentUser = [
    'username' => $_SESSION['username'] ?? 'manager',
    'first_name' => $_SESSION['first_name'] ?? 'Store',
    'last_name' => $_SESSION['last_name'] ?? 'Manager',
    'role' => $_SESSION['user_role'] ?? 'store_manager'
];

$storeId = $_SESSION['store_id'] ?? ($_GET['storeId'] ?? '10000000-0000-0000-0000-000000000001');
$filterUrgency = $_GET['urgency'] ?? 'all';

// Query database using python bridge
function fetchDb($sql) {
    $envPath = addslashes(__DIR__ . DIRECTORY_SEPARATOR . '.env');
    $sqlB64 = base64_encode($sql);
    $pyCode = "
import os, json, base64
from dotenv import load_dotenv
import pg8000.native

load_dotenv('$envPath')
conn = pg8000.native.Connection(
    user=os.getenv('DATABASE_USER', 'postgres'),
    password=os.getenv('DATABASE_PASSWORD', 'postgres'),
    host=os.getenv('DATABASE_HOST', 'localhost'),
    port=int(os.getenv('DATABASE_PORT', '5432')),
    database=os.getenv('DATABASE_NAME', 'pos_db')
)
query_str = base64.b64decode('$sqlB64').decode('utf-8')
rows = conn.run(query_str)
cols = [c['name'] for c in conn.columns]
output = []
for r in rows:
    row_dict = {}
    for k, v in zip(cols, r):
        if hasattr(v, 'isoformat'):
            row_dict[k] = v.isoformat()
        elif hasattr(v, '__float__') and not isinstance(v, (int, float, bool)):
            row_dict[k] = float(v)
        else:
            row_dict[k] = str(v) if type(v).__name__ == 'UUID' else v
    output.append(row_dict)
conn.close()
print(json.dumps(output, default=str))
";
    $tempFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'pos_dash_' . uniqid() . '.py';
    file_put_contents($tempFile, $pyCode);
    $output = shell_exec("python " . escapeshellarg($tempFile) . " 2>&1");
    @unlink($tempFile);
    return json_decode($output, true) ?: [];
}

// 1. Fetch Summary Metrics
$aggSql = "
    SELECT 
        COUNT(*)::INT AS total_recommendations,
        COUNT(CASE WHEN ir.current_stock_on_hand <= ir.reorder_point OR ir.urgency IN ('critical', 'high') THEN 1 END)::INT AS low_stock_count,
        COUNT(CASE WHEN ir.urgency = 'critical' THEN 1 END)::INT AS critical_count,
        COUNT(CASE WHEN ir.urgency = 'high' THEN 1 END)::INT AS high_count,
        COUNT(CASE WHEN ir.urgency = 'medium' THEN 1 END)::INT AS medium_count,
        COUNT(CASE WHEN ir.urgency = 'low' THEN 1 END)::INT AS low_count,
        COALESCE(SUM(ir.recommended_order_quantity), 0)::INT AS total_recommended_units,
        ROUND(COALESCE(SUM(ir.estimated_cost), 0)::NUMERIC, 2)::FLOAT AS total_estimated_cost_php,
        ROUND(COALESCE(SUM(ir.forecasted_demand_30d * p.retail_price), 0)::NUMERIC, 2)::FLOAT AS total_forecasted_revenue_30d_php
    FROM inventory_recommendations ir
    LEFT JOIN products p ON p.id = ir.product_id
    WHERE ir.store_id = '$storeId';
";
$aggRows = fetchDb($aggSql);
$summary = $aggRows[0] ?? [
    'total_recommendations' => 0,
    'low_stock_count' => 0,
    'critical_count' => 0,
    'high_count' => 0,
    'medium_count' => 0,
    'low_count' => 0,
    'total_recommended_units' => 0,
    'total_estimated_cost_php' => 0.0,
    'total_forecasted_revenue_30d_php' => 0.0
];

// 2. Fetch Top 5 Forecasted Products
$topSql = "
    SELECT 
        ir.sku,
        ir.product_name,
        COALESCE(ir.category_name, 'General') AS category_name,
        ir.forecasted_demand_30d::FLOAT AS forecasted_demand_30d,
        p.retail_price::FLOAT AS retail_price_php,
        ROUND((ir.forecasted_demand_30d * p.retail_price)::NUMERIC, 2)::FLOAT AS forecasted_revenue_30d_php
    FROM inventory_recommendations ir
    JOIN products p ON p.id = ir.product_id
    WHERE ir.store_id = '$storeId'
    ORDER BY (ir.forecasted_demand_30d * p.retail_price) DESC
    LIMIT 5;
";
$topProducts = fetchDb($topSql);

// 3. Fetch Recommendations List
$whereFilter = "WHERE ir.store_id = '$storeId'";
if ($filterUrgency !== 'all') {
    $whereFilter .= " AND ir.urgency = '$filterUrgency'";
}

$recSql = "
    SELECT 
        ir.id,
        ir.sku,
        ir.product_name,
        COALESCE(ir.category_name, 'General') AS category_name,
        ir.current_stock_on_hand,
        ir.daily_avg_sales::FLOAT AS daily_avg_sales,
        ir.lead_time_days,
        ir.safety_stock,
        ir.reorder_point,
        ir.forecasted_demand_7d::FLOAT AS forecasted_demand_7d,
        ir.forecasted_demand_14d::FLOAT AS forecasted_demand_14d,
        ir.forecasted_demand_30d::FLOAT AS forecasted_demand_30d,
        ir.recommended_order_quantity,
        ir.urgency,
        ir.confidence_score::FLOAT AS confidence_score,
        TO_CHAR(ir.predicted_stockout_date, 'YYYY-MM-DD') AS predicted_stockout_date,
        ir.estimated_cost::FLOAT AS estimated_cost,
        ir.reasoning_summary,
        ir.status
    FROM inventory_recommendations ir
    $whereFilter
    ORDER BY 
        CASE ir.urgency
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
            ELSE 5
        END ASC,
        ir.estimated_cost DESC;
";
$recommendations = fetchDb($recSql);

function formatPHP($val) {
    return '₱' . number_format((float)$val, 2);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POS AI - Store Manager Inventory Recommendations</title>
    <!-- Tailwind CSS via CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white">

    <!-- Top Navigation Header -->
    <header class="h-16 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-6 flex items-center justify-between">
        <div class="flex items-center gap-4">
            <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                    AI
                </div>
                <div>
                    <h1 class="text-sm font-bold text-white leading-none">POS AI Inventory Manager</h1>
                    <span class="text-[11px] text-slate-400">Flagship BGC Terminal &bull; Philippine Retail Standards</span>
                </div>
            </div>
            <span class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Phase 3.3 Active
            </span>
        </div>

        <div class="flex items-center gap-3">
            <span class="text-xs text-slate-400">Currency: <strong class="text-white">PHP (₱)</strong></span>
            
            <a href="sales.php" class="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                POS Register
            </a>

            <a href="sales_history.php" class="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-semibold transition flex items-center gap-1.5">
                📜 Sales History
            </a>

            <a href="dashboard.php" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Refresh
            </a>

            <div class="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800">
                <div class="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-xs text-indigo-300 font-bold">
                    M
                </div>
                <div class="text-left">
                    <span class="text-xs font-semibold text-white block leading-tight"><?= htmlspecialchars($currentUser['first_name'] . ' ' . $currentUser['last_name']) ?></span>
                    <span class="text-[10px] text-indigo-400 font-mono block leading-none">@<?= htmlspecialchars($currentUser['username']) ?> &bull; Manager</span>
                </div>
            </div>

            <a href="logout.php" title="Sign Out" class="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                <span>Logout</span>
            </a>
        </div>
    </header>

    <!-- Main Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">

        <!-- Low Stock Warning Alerts (if any critical or high exist) -->
        <?php if ($summary['low_stock_count'] > 0): ?>
        <div class="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 backdrop-blur flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div class="flex items-center gap-3.5">
                <div class="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400 font-bold">
                    ⚠️
                </div>
                <div>
                    <h2 class="text-sm font-bold text-rose-300">
                        Low Stock Alert: <?= (int)$summary['low_stock_count'] ?> Products Require Immediate Restock
                    </h2>
                    <p class="text-xs text-rose-400/80 mt-0.5">
                        <?= (int)$summary['high_count'] ?> products have breached their calculated Reorder Point (ROP = Daily Avg Sales &times; Lead Time + Safety Stock). Immediate replenishment orders recommended.
                    </p>
                </div>
            </div>
            <a href="#recommendations-table" class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/20 shrink-0">
                Review Low Stock Items &darr;
            </a>
        </div>
        <?php endif; ?>

        <!-- KPI Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Low Stock Warnings -->
            <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
                <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock Warnings</div>
                <div class="text-3xl font-extrabold text-rose-400 mt-2 font-mono">
                    <?= (int)$summary['low_stock_count'] ?> <span class="text-sm font-normal text-slate-400">SKUs</span>
                </div>
                <div class="text-[11px] text-rose-400/90 mt-2 flex items-center gap-1 font-medium">
                    <span>Stock &lt; Calculated Reorder Point</span>
                </div>
                <div class="absolute -right-2 -bottom-2 w-16 h-16 bg-rose-500/5 rounded-full blur-xl pointer-events-none"></div>
            </div>

            <!-- 30-Day Forecasted Revenue -->
            <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
                <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">30-Day Forecasted Revenue</div>
                <div class="text-2xl font-extrabold text-emerald-400 mt-2 font-mono">
                    <?= formatPHP($summary['total_forecasted_revenue_30d_php']) ?>
                </div>
                <div class="text-[11px] text-emerald-400/90 mt-2 flex items-center gap-1 font-medium">
                    <span>Projected Philippine Retail Sales</span>
                </div>
                <div class="absolute -right-2 -bottom-2 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
            </div>

            <!-- Recommended Reorder Units -->
            <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
                <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Recommended Reorder</div>
                <div class="text-3xl font-extrabold text-indigo-400 mt-2 font-mono">
                    <?= number_format((int)$summary['total_recommended_units']) ?> <span class="text-sm font-normal text-slate-400">units</span>
                </div>
                <div class="text-[11px] text-slate-400 mt-2">
                    Across <?= (int)$summary['total_recommendations'] ?> catalog items
                </div>
                <div class="absolute -right-2 -bottom-2 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
            </div>

            <!-- Capital Allocation / Restock Cost -->
            <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
                <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Restock Capital</div>
                <div class="text-2xl font-extrabold text-amber-400 mt-2 font-mono">
                    <?= formatPHP($summary['total_estimated_cost_php']) ?>
                </div>
                <div class="text-[11px] text-slate-400 mt-2 font-medium">
                    At Supplier Cost in Philippine Pesos (₱)
                </div>
                <div class="absolute -right-2 -bottom-2 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
            </div>
        </div>

        <!-- Top-Selling Products by Forecasted Revenue -->
        <div class="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-sm font-bold text-white">Top-Selling Products by 30-Day Forecasted Revenue</h3>
                    <p class="text-xs text-slate-400 mt-0.5">High-velocity staple FMCG goods in Philippine Pesos (₱)</p>
                </div>
                <span class="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                    Highest Capital Drivers
                </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
                <?php foreach ($topProducts as $idx => $prod): ?>
                <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between text-[11px] text-slate-400">
                            <span class="font-mono text-indigo-400 font-semibold">#<?= $idx + 1 ?></span>
                            <span class="font-mono"><?= htmlspecialchars($prod['sku']) ?></span>
                        </div>
                        <h4 class="text-xs font-bold text-white mt-2 line-clamp-2 leading-tight">
                            <?= htmlspecialchars($prod['product_name']) ?>
                        </h4>
                        <span class="inline-block text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded mt-2">
                            <?= htmlspecialchars($prod['category_name']) ?>
                        </span>
                    </div>

                    <div class="mt-4 pt-3 border-t border-slate-800/60">
                        <div class="text-[11px] text-slate-400">30d Demand: <strong class="text-slate-200"><?= number_format($prod['forecasted_demand_30d']) ?> units</strong></div>
                        <div class="text-sm font-bold text-emerald-400 font-mono mt-1">
                            <?= formatPHP($prod['forecasted_revenue_30d_php']) ?>
                        </div>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- Inventory Replenishment Recommendations Table -->
        <div id="recommendations-table" class="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
            <div class="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 class="text-base font-bold text-white">Recommended Replenishment Orders</h3>
                    <p class="text-xs text-slate-400 mt-1">
                        Formulated via: <code class="text-indigo-400 font-mono">Reorder Point = Daily Avg Sales &times; Lead Time + Safety Stock</code>
                    </p>
                </div>

                <!-- Urgency Filters -->
                <div class="flex items-center gap-1.5 overflow-x-auto text-xs">
                    <a href="dashboard.php?urgency=all" class="px-3 py-1.5 rounded-lg <?= $filterUrgency === 'all' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300' ?> transition">
                        All (<?= (int)$summary['total_recommendations'] ?>)
                    </a>
                    <a href="dashboard.php?urgency=high" class="px-3 py-1.5 rounded-lg <?= $filterUrgency === 'high' ? 'bg-rose-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300' ?> transition">
                        High / Critical (<?= (int)$summary['high_count'] + (int)$summary['critical_count'] ?>)
                    </a>
                    <a href="dashboard.php?urgency=medium" class="px-3 py-1.5 rounded-lg <?= $filterUrgency === 'medium' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300' ?> transition">
                        Medium (<?= (int)$summary['medium_count'] ?>)
                    </a>
                    <a href="dashboard.php?urgency=low" class="px-3 py-1.5 rounded-lg <?= $filterUrgency === 'low' ? 'bg-slate-700 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300' ?> transition">
                        Low (<?= (int)$summary['low_count'] ?>)
                    </a>
                </div>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                    <thead class="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                            <th class="py-3.5 px-4 font-semibold">Product SKU & Name</th>
                            <th class="py-3.5 px-4 font-semibold text-center">Stock on Hand</th>
                            <th class="py-3.5 px-4 font-semibold text-center">Reorder Point (ROP)</th>
                            <th class="py-3.5 px-4 font-semibold text-center">Daily Velocity</th>
                            <th class="py-3.5 px-4 font-semibold text-center">7d / 14d / 30d Demand</th>
                            <th class="py-3.5 px-4 font-semibold text-center">Recommended Order</th>
                            <th class="py-3.5 px-4 font-semibold text-right">Est. Cost (PHP)</th>
                            <th class="py-3.5 px-4 font-semibold text-center">Urgency</th>
                            <th class="py-3.5 px-4 font-semibold">AI Recommendation Reasoning</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60">
                        <?php foreach ($recommendations as $rec): 
                            $isBreached = (int)$rec['current_stock_on_hand'] < (int)$rec['reorder_point'];
                        ?>
                        <tr class="hover:bg-slate-800/30 transition <?= $isBreached ? 'bg-rose-950/10' : '' ?>">
                            <td class="py-4 px-4 font-medium text-slate-200 max-w-xs">
                                <div class="font-bold text-white"><?= htmlspecialchars($rec['product_name']) ?></div>
                                <div class="flex items-center gap-2 mt-1">
                                    <span class="font-mono text-[11px] text-slate-400"><?= htmlspecialchars($rec['sku']) ?></span>
                                    <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400"><?= htmlspecialchars($rec['category_name']) ?></span>
                                </div>
                            </td>

                            <td class="py-4 px-4 text-center font-mono font-bold <?= $isBreached ? 'text-rose-400' : 'text-slate-300' ?>">
                                <?= (int)$rec['current_stock_on_hand'] ?>
                                <?php if ($isBreached): ?>
                                    <span class="block text-[9px] text-rose-500 uppercase font-semibold">Below ROP</span>
                                <?php endif; ?>
                            </td>

                            <td class="py-4 px-4 text-center font-mono">
                                <span class="px-2 py-1 rounded bg-slate-800 font-bold text-slate-200">
                                    <?= (int)$rec['reorder_point'] ?>
                                </span>
                                <span class="block text-[10px] text-slate-500 mt-1">
                                    LT: <?= (int)$rec['lead_time_days'] ?>d | SS: <?= (int)$rec['safety_stock'] ?>
                                </span>
                            </td>

                            <td class="py-4 px-4 text-center font-mono text-slate-300">
                                <?= number_format((float)$rec['daily_avg_sales'], 2) ?>/day
                            </td>

                            <td class="py-4 px-4 text-center text-slate-300 font-mono">
                                <span class="text-slate-200"><?= round($rec['forecasted_demand_7d']) ?></span>
                                <span class="text-slate-500">/</span>
                                <span class="text-slate-200"><?= round($rec['forecasted_demand_14d']) ?></span>
                                <span class="text-slate-500">/</span>
                                <span class="text-indigo-400 font-bold"><?= round($rec['forecasted_demand_30d']) ?></span>
                            </td>

                            <td class="py-4 px-4 text-center font-mono font-bold text-indigo-400">
                                <span class="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                    +<?= (int)$rec['recommended_order_quantity'] ?> units
                                </span>
                            </td>

                            <td class="py-4 px-4 text-right font-mono font-bold text-slate-200">
                                <?= formatPHP($rec['estimated_cost']) ?>
                            </td>

                            <td class="py-4 px-4 text-center">
                                <?php
                                $badgeClass = match($rec['urgency']) {
                                    'critical' => 'bg-rose-500/15 text-rose-400 border-rose-500/30',
                                    'high'     => 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                                    'medium'   => 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                                    default    => 'bg-slate-800 text-slate-400 border-slate-700'
                                };
                                ?>
                                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border <?= $badgeClass ?>">
                                    <?= htmlspecialchars($rec['urgency']) ?>
                                </span>
                            </td>

                            <td class="py-4 px-4 text-slate-400 text-[11px] max-w-sm leading-relaxed">
                                <?= htmlspecialchars($rec['reasoning_summary']) ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>

    </main>

    <!-- Footer -->
    <footer class="h-12 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between px-6 shrink-0">
        <div>POS AI Enterprise &bull; Philippine Retail & FMCG Standard</div>
        <div>Model Version: <strong>v1.4.0 (LightGBM Demand Regressor)</strong></div>
    </footer>

</body>
</html>
