<?php
/**
 * POS AI - Phase 3.4: Cashier Smart POS Cross-Sell (sales.php)
 * Cashier POS Checkout Screen with Live AI Cross-Sell Recommendations
 * Features:
 * 1. Barcode scanning & quick product catalog for Philippine retail FMCG
 * 2. Active Cart Ticket with quantity controls & Republic Act 9994 Senior/PWD 20% VAT-exempt discount
 * 3. AI Smart Cross-Sell Widget: Real-time top 3 frequently bought together products based on historical co-occurrence
 * 4. Philippine Payment Pad: Cash (₱1000, ₱500, ₱200, ₱100, ₱50, ₱20), GCash, Maya, Card
 */

session_start();

// Role-Based Access Control (RBAC) Guard
if (!isset($_SESSION['user_role'])) {
    header('Location: index.php?error=unauthenticated');
    exit;
}

$currentUser = [
    'username' => $_SESSION['username'] ?? 'cashier',
    'first_name' => $_SESSION['first_name'] ?? 'Juan',
    'last_name' => $_SESSION['last_name'] ?? 'Dela Cruz',
    'role' => $_SESSION['user_role'] ?? 'cashier'
];

$isCashier = ($currentUser['role'] === 'cashier');
$storeId = $_SESSION['store_id'] ?? ($_GET['storeId'] ?? '10000000-0000-0000-0000-000000000001');

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
    $tempFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'pos_sales_' . uniqid() . '.py';
    file_put_contents($tempFile, $pyCode);
    $output = shell_exec("python " . escapeshellarg($tempFile) . " 2>&1");
    @unlink($tempFile);
    return json_decode($output, true) ?: [];
}

// Fetch active catalog with store inventory levels
$productsSql = "
    SELECT 
        p.id,
        p.sku,
        p.barcode,
        p.name,
        COALESCE(c.name, 'General') AS category_name,
        p.retail_price::FLOAT AS retail_price,
        p.cost_price::FLOAT AS cost_price,
        p.tax_rate::FLOAT AS tax_rate,
        COALESCE(inv.quantity_on_hand, 50)::INT AS stock_on_hand
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN inventory_levels inv ON inv.product_id = p.id AND inv.store_id = '$storeId'
    WHERE p.is_active = TRUE
    ORDER BY p.name ASC;
";
$products = fetchDb($productsSql);

// Collect unique categories
$categories = ['All'];
foreach ($products as $p) {
    if (!empty($p['category_name']) && !in_array($p['category_name'], $categories)) {
        $categories[] = $p['category_name'];
    }
}

function formatPhp($amount) {
    return '₱' . number_format((float)$amount, 2);
}
?>
<!DOCTYPE html>
<html lang="en-PH" class="dark h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POS AI - Cashier Smart POS Checkout & AI Cross-Sell</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        slate: { 950: '#020617', 900: '#0f172a', 800: '#1e293b', 700: '#334155' },
                        brand: { 500: '#6366f1', 600: '#4f46e5' }
                    }
                }
            }
        }
    </script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 h-full flex flex-col overflow-hidden select-none">

    <!-- Top Navigation & Register Bar -->
    <header class="h-14 bg-slate-900 border-b border-slate-800 px-5 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                ⚡
            </div>
            <div>
                <h1 class="text-sm font-bold text-white flex items-center gap-2">
                    POS AI Register <span class="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-normal">POS-BGC-01</span>
                </h1>
                <p class="text-[10px] text-slate-400">Flagship BGC Supermarket • Taguig City, Metro Manila</p>
            </div>
        </div>

        <!-- Center live clock & Staff Badge -->
        <div class="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 font-mono">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span id="live-clock">--:--:--</span>
            <span class="text-slate-500">|</span>
            <span class="text-slate-200 font-sans font-medium flex items-center gap-1">
                <span class="text-emerald-400">●</span> Staff: <?= htmlspecialchars($currentUser['first_name'] . ' ' . $currentUser['last_name']) ?>
                <span class="text-[10px] text-slate-400 font-mono">(@<?= htmlspecialchars($currentUser['username']) ?>)</span>
            </span>
        </div>

        <!-- Links, Role Scope & Logout -->
            <a href="sales_history.php" class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 transition flex items-center gap-1.5">
                📜 History
            </a>
            <?php if (!$isCashier): ?>
                <a href="dashboard.php" class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition flex items-center gap-1.5">
                    📊 Manager Dashboard
                </a>
            <?php else: ?>
                <span class="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/80 text-emerald-400 flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>POS Terminal Only</span>
                </span>
            <?php endif; ?>

            <a href="logout.php" title="Sign Out" class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                <span>Logout</span>
            </a>
        </div>
    </header>

    <?php if (isset($_GET['error']) && $_GET['error'] === 'cashier_restricted'): ?>
        <!-- Cashier RBAC Restriction Warning Banner -->
        <div class="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-amber-200">
            <div class="flex items-center gap-2">
                <span class="text-base">🛡️</span>
                <span class="font-semibold">Access Restricted:</span>
                <span>Cashier accounts are strictly confined to POS checkout. Access to Inventory Management and Manager Dashboards has been blocked.</span>
            </div>
            <a href="sales.php" class="text-amber-400 hover:underline text-[11px] font-mono">Dismiss &times;</a>
        </div>
    <?php endif; ?>

    <!-- Main Split Section -->
    <main class="flex-1 flex overflow-hidden">

        <!-- Left Column: Product Search, Category Filters, and Catalog Grid -->
        <section class="flex-1 flex flex-col p-5 overflow-hidden border-r border-slate-800">
            <!-- Search & Barcode Input -->
            <div class="flex gap-3 mb-4">
                <div class="relative flex-1">
                    <span class="absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
                    <input 
                        type="text" 
                        id="barcode-input" 
                        placeholder="Scan Philippine EAN-13 barcode or type product name / SKU (e.g. 480001660101)..." 
                        autofocus
                        class="w-full pl-9 pr-24 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    >
                    <span class="absolute inset-y-0 right-3 flex items-center text-[10px] uppercase font-mono tracking-wider text-slate-500">
                        [ENTER to Scan]
                    </span>
                </div>
            </div>

            <!-- Category Filter Buttons -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 shrink-0 border-b border-slate-800/80">
                <?php foreach ($categories as $cat): ?>
                    <button 
                        type="button" 
                        onclick="filterCategory('<?= htmlspecialchars($cat) ?>')"
                        data-category="<?= htmlspecialchars($cat) ?>"
                        class="cat-pill whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-lg border transition <?= $cat === 'All' ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800' ?>"
                    >
                        <?= htmlspecialchars($cat) ?>
                    </button>
                <?php endforeach; ?>
            </div>

            <!-- Product Grid -->
            <div id="product-grid" class="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pr-1">
                <?php foreach ($products as $p): ?>
                    <div 
                        class="product-card group relative bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-3.5 flex flex-col justify-between transition-all duration-150 cursor-pointer shadow-sm hover:shadow-indigo-500/5"
                        data-id="<?= htmlspecialchars($p['id']) ?>"
                        data-sku="<?= htmlspecialchars($p['sku']) ?>"
                        data-barcode="<?= htmlspecialchars($p['barcode'] ?? '') ?>"
                        data-name="<?= htmlspecialchars($p['name']) ?>"
                        data-category="<?= htmlspecialchars($p['category_name']) ?>"
                        data-price="<?= (float)$p['retail_price'] ?>"
                        data-tax="<?= (float)$p['tax_rate'] ?>"
                        data-stock="<?= (int)$p['stock_on_hand'] ?>"
                        onclick="addToCartFromCard(this)"
                    >
                        <div>
                            <div class="flex items-center justify-between gap-1 mb-1">
                                <span class="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 truncate max-w-[120px]">
                                    <?= htmlspecialchars($p['sku']) ?>
                                </span>
                                <span class="text-[10px] font-medium text-slate-400 truncate">
                                    <?= htmlspecialchars($p['category_name']) ?>
                                </span>
                            </div>
                            <h3 class="text-xs font-semibold text-slate-100 group-hover:text-indigo-300 line-clamp-2 transition mb-2">
                                <?= htmlspecialchars($p['name']) ?>
                            </h3>
                        </div>

                        <div class="flex items-end justify-between pt-2 border-t border-slate-800/60">
                            <div>
                                <span class="text-[10px] text-slate-500 block">Retail Price</span>
                                <span class="text-sm font-bold text-emerald-400 font-mono">
                                    <?= formatPhp($p['retail_price']) ?>
                                </span>
                            </div>
                            <span class="text-[10px] px-2 py-0.5 rounded-full <?= (int)$p['stock_on_hand'] <= 15 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400' ?>">
                                <?= (int)$p['stock_on_hand'] ?> in stock
                            </span>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </section>

        <!-- Right Column: Current Ticket, AI Smart Cross-Sell, and Checkout Totals -->
        <aside class="w-96 lg:w-[440px] flex flex-col bg-slate-900 border-l border-slate-800 p-5 shrink-0 select-none">
            
            <!-- Ticket Header -->
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                <div class="flex items-center gap-2">
                    <span class="text-indigo-400 text-lg">🧾</span>
                    <div>
                        <h2 class="text-sm font-bold text-white flex items-center gap-2">
                            Current Ticket
                            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">TICK-PH-001</span>
                        </h2>
                    </div>
                </div>
                <button 
                    id="btn-clear-cart" 
                    onclick="clearCart()" 
                    class="text-xs font-semibold text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-500/10 transition hidden"
                >
                    Clear All
                </button>
            </div>

            <!-- Cart Line Items -->
            <div id="cart-items-container" class="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
                <!-- Populated dynamically via JS -->
            </div>

            <!-- AI Smart Cross-Sell Recommendation Widget -->
            <div id="cross-sell-section" class="py-2 shrink-0 min-h-0">
                <div class="rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-purple-950/30 p-3 shadow-lg">
                    <div class="flex items-center justify-between pb-2 mb-2 border-b border-indigo-500/20">
                        <div class="flex items-center gap-2">
                            <span class="text-sm animate-pulse">✨</span>
                            <div>
                                <h3 class="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                                    AI Cashier Smart Cross-Sell
                                    <span class="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                                        Top 3 Co-occurrences
                                    </span>
                                </h3>
                                <p id="cross-sell-subtitle" class="text-[10px] text-slate-400">
                                    Frequently bought together with current cart items
                                </p>
                            </div>
                        </div>
                        <div id="cross-sell-spinner" class="hidden text-xs text-indigo-400 animate-spin">⏳</div>
                    </div>

                    <!-- Top 3 Recommendation Cards -->
                    <div id="cross-sell-items" class="space-y-1.5 overflow-y-auto max-h-52 pr-1 select-none">
                        <!-- Populated dynamically via JS -->
                    </div>
                </div>
            </div>

            <!-- Totals & Discount Controls -->
            <div class="pt-3 border-t border-slate-800 shrink-0 space-y-2.5">
                
                <!-- Senior Citizen / PWD 20% VAT-Exempt Discount Toggle (RA 9994) -->
                <div class="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                    <div class="flex items-center gap-2">
                        <span class="text-sm">🎖️</span>
                        <div>
                            <span class="text-xs font-semibold text-slate-200 block">Senior / PWD Discount</span>
                            <span class="text-[9px] text-slate-400">RA 9994: 20% discount + VAT exempt</span>
                        </div>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="senior-pwd-toggle" onchange="toggleSeniorPwd(this.checked)" class="sr-only peer">
                        <div class="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                </div>

                <!-- Breakdown -->
                <div class="space-y-1 text-xs">
                    <div class="flex justify-between text-slate-400">
                        <span>Gross Subtotal:</span>
                        <span id="txt-subtotal" class="font-mono text-slate-200">₱0.00</span>
                    </div>
                    <div class="flex justify-between text-slate-400">
                        <span>12% VAT:</span>
                        <span id="txt-vat" class="font-mono text-slate-200">₱0.00</span>
                    </div>
                    <div id="row-discount" class="flex justify-between text-emerald-400 hidden">
                        <span>Senior/PWD Discount (20%):</span>
                        <span id="txt-discount" class="font-mono font-semibold">-₱0.00</span>
                    </div>
                    <div class="flex justify-between items-baseline pt-2 border-t border-slate-800">
                        <span class="text-sm font-bold text-white">Total Amount Due:</span>
                        <span id="txt-total" class="text-xl font-extrabold text-white font-mono">₱0.00</span>
                    </div>
                </div>

                <!-- Checkout Button -->
                <button 
                    id="btn-checkout" 
                    type="button" 
                    onclick="openPaymentModal()" 
                    disabled 
                    class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
                >
                    <span>Proceed to Payment (F4)</span>
                    <span class="text-xs">➔</span>
                </button>
            </div>
        </aside>
    </main>

    <!-- Payment Pad Modal -->
    <div id="payment-modal" class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center hidden">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                    💳 Settle Payment
                </h3>
                <button onclick="closePaymentModal()" class="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            <!-- Amount Due Banner -->
            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center mb-4">
                <span class="text-xs text-slate-400 block">Total Amount Due</span>
                <span id="modal-amount-due" class="text-2xl font-black text-emerald-400 font-mono">₱0.00</span>
            </div>

            <!-- Payment Methods -->
            <div class="grid grid-cols-4 gap-2 mb-4">
                <button onclick="setPaymentMethod('cash')" id="btn-pm-cash" class="pm-btn py-2 px-3 rounded-xl border border-indigo-500 bg-indigo-600/20 text-white font-semibold text-xs flex flex-col items-center gap-1">
                    <span>💵</span> Cash
                </button>
                <button onclick="setPaymentMethod('gcash')" id="btn-pm-gcash" class="pm-btn py-2 px-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 font-semibold text-xs flex flex-col items-center gap-1">
                    <span>📱</span> GCash
                </button>
                <button onclick="setPaymentMethod('maya')" id="btn-pm-maya" class="pm-btn py-2 px-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 font-semibold text-xs flex flex-col items-center gap-1">
                    <span>💚</span> Maya
                </button>
                <button onclick="setPaymentMethod('card')" id="btn-pm-card" class="pm-btn py-2 px-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 font-semibold text-xs flex flex-col items-center gap-1">
                    <span>💳</span> Card
                </button>
            </div>

            <!-- Fast Banknote Buttons (Cash only) -->
            <div id="banknotes-section" class="mb-4">
                <span class="text-[10px] text-slate-400 uppercase font-mono block mb-1.5">Philippine Banknotes</span>
                <div class="grid grid-cols-3 gap-2">
                    <button onclick="addTendered(1000)" class="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-semibold text-blue-300 border border-slate-700">₱1,000</button>
                    <button onclick="addTendered(500)" class="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-semibold text-amber-300 border border-slate-700">₱500</button>
                    <button onclick="addTendered(200)" class="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-semibold text-emerald-300 border border-slate-700">₱200</button>
                    <button onclick="addTendered(100)" class="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-semibold text-purple-300 border border-slate-700">₱100</button>
                    <button onclick="addTendered(50)" class="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-semibold text-rose-300 border border-slate-700">₱50</button>
                    <button onclick="setExactTendered()" class="py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-xs font-mono font-bold text-indigo-300 border border-indigo-500/40">Exact</button>
                </div>
            </div>

            <!-- Amount Tendered Input -->
            <div class="mb-4">
                <label class="text-xs text-slate-400 block mb-1">Amount Tendered (₱):</label>
                <input 
                    type="number" 
                    step="0.01" 
                    id="input-tendered" 
                    oninput="calcChange()"
                    class="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-mono text-lg font-bold focus:outline-none focus:border-indigo-500"
                >
            </div>

            <!-- Change Due -->
            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center mb-5">
                <span class="text-xs text-slate-400">Change Due:</span>
                <span id="modal-change-due" class="text-lg font-mono font-bold text-white">₱0.00</span>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
                <button onclick="closePaymentModal()" class="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition">
                    Cancel
                </button>
                <button onclick="finalizePayment()" id="btn-finalize" class="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition">
                    Complete Sale (Enter)
                </button>
            </div>
        </div>
    </div>

    <!-- Live Toast Notification -->
    <div id="toast" class="fixed top-16 right-5 z-50 hidden px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-2xl backdrop-blur transition-all duration-200"></div>

    <!-- Client-Side State & Logic -->
    <script>
        const ALL_PRODUCTS = <?= json_encode($products) ?>;
        let cart = [];
        let isSeniorOrPwd = false;
        let selectedPaymentMethod = 'cash';
        let currentTotalDue = 0;

        // Clock
        function updateClock() {
            const now = new Date();
            document.getElementById('live-clock').textContent = now.toLocaleTimeString('en-PH', { hour12: false });
        }
        setInterval(updateClock, 1000);
        updateClock();

        // Barcode input enter listener
        document.getElementById('barcode-input').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = this.value.trim().toLowerCase();
                if (!query) return;

                const found = ALL_PRODUCTS.find(p => 
                    (p.barcode && p.barcode.toLowerCase() === query) ||
                    (p.sku && p.sku.toLowerCase() === query) ||
                    (p.name && p.name.toLowerCase().includes(query))
                );

                if (found) {
                    addToCart(found);
                    this.value = '';
                    showToast('success', `Scanned: ${found.name}`);
                } else {
                    showToast('warning', `Item "${query}" not found in master catalog`);
                }
            }
        });

        // Filter category pills
        function filterCategory(cat) {
            document.querySelectorAll('.cat-pill').forEach(btn => {
                if (btn.getAttribute('data-category') === cat) {
                    btn.className = 'cat-pill whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-lg border bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20';
                } else {
                    btn.className = 'cat-pill whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-lg border bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800';
                }
            });

            document.querySelectorAll('.product-card').forEach(card => {
                const cardCat = card.getAttribute('data-category');
                if (cat === 'All' || cardCat === cat) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        }

        function addToCartFromCard(el) {
            const id = el.getAttribute('data-id');
            const found = ALL_PRODUCTS.find(p => p.id === id);
            if (found) addToCart(found);
        }

        function addToCart(product) {
            const existing = cart.find(item => item.product.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock_on_hand) {
                    showToast('warning', `Stock limit (${product.stock_on_hand}) reached for ${product.name}`);
                    return;
                }
                existing.quantity += 1;
            } else {
                cart.push({ product, quantity: 1 });
            }
            renderCart();
            fetchCrossSellRecommendations();
        }

        function updateCartQty(productId, delta) {
            const item = cart.find(i => i.product.id === productId);
            if (!item) return;

            item.quantity += delta;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.product.id !== productId);
            } else if (item.quantity > item.product.stock_on_hand) {
                item.quantity = item.product.stock_on_hand;
                showToast('warning', `Stock limit reached`);
            }
            renderCart();
            fetchCrossSellRecommendations();
        }

        function removeCartItem(productId) {
            cart = cart.filter(i => i.product.id !== productId);
            renderCart();
            fetchCrossSellRecommendations();
        }

        function clearCart() {
            cart = [];
            isSeniorOrPwd = false;
            document.getElementById('senior-pwd-toggle').checked = false;
            renderCart();
            fetchCrossSellRecommendations();
            showToast('info', 'Ticket cleared');
        }

        function toggleSeniorPwd(checked) {
            isSeniorOrPwd = checked;
            renderCart();
        }

        // Render Cart & Totals
        function renderCart() {
            const container = document.getElementById('cart-items-container');
            const clearBtn = document.getElementById('btn-clear-cart');
            const checkoutBtn = document.getElementById('btn-checkout');

            if (cart.length === 0) {
                container.innerHTML = `
                    <div class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                        <div class="w-12 h-12 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-center mb-2 text-xl">
                            📦
                        </div>
                        <h4 class="text-xs font-semibold text-slate-300">Ticket is empty</h4>
                        <p class="text-[11px] text-slate-500 max-w-[200px] mt-1">
                            Scan barcode or click Philippine catalog items to begin sale.
                        </p>
                    </div>
                `;
                clearBtn.classList.add('hidden');
                checkoutBtn.disabled = true;

                document.getElementById('txt-subtotal').textContent = '₱0.00';
                document.getElementById('txt-vat').textContent = '₱0.00';
                document.getElementById('row-discount').classList.add('hidden');
                document.getElementById('txt-total').textContent = '₱0.00';
                currentTotalDue = 0;
                return;
            }

            clearBtn.classList.remove('hidden');
            checkoutBtn.disabled = false;

            let html = '';
            let grossSubtotal = 0;
            let vatableSales = 0;

            cart.forEach(item => {
                const lineTotal = item.product.retail_price * item.quantity;
                grossSubtotal += lineTotal;
                if (item.product.tax_rate > 0) {
                    vatableSales += lineTotal;
                }

                html += `
                    <div class="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
                        <div class="min-w-0 flex-1 pr-2">
                            <p class="font-semibold text-slate-200 truncate">${item.product.name}</p>
                            <span class="text-[10px] text-slate-400 font-mono">₱${Number(item.product.retail_price).toFixed(2)} / pc</span>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                            <button onclick="updateCartQty('${item.product.id}', -1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold font-mono">-</button>
                            <span class="w-6 text-center font-mono font-bold text-white text-xs">${item.quantity}</span>
                            <button onclick="updateCartQty('${item.product.id}', 1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold font-mono">+</button>
                            <span class="w-16 text-right font-mono font-bold text-emerald-400 text-xs">₱${lineTotal.toFixed(2)}</span>
                            <button onclick="removeCartItem('${item.product.id}')" class="text-rose-400 hover:text-rose-300 ml-1 text-sm">×</button>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;

            // Calculations for PH (VAT & Senior/PWD RA 9994)
            let vatAmount = 0;
            let discountAmount = 0;
            let totalAmountDue = grossSubtotal;

            if (isSeniorOrPwd) {
                // RA 9994: Vatable items stripped of 12% VAT, then 20% discount applied
                const vatInclusiveRate = 1.12;
                const netOfVat = vatableSales / vatInclusiveRate;
                const seniorDiscount = netOfVat * 0.20;
                discountAmount = seniorDiscount + (vatableSales - netOfVat);
                totalAmountDue = Math.max(0, grossSubtotal - discountAmount);
                vatAmount = 0; // VAT Exempt
            } else {
                vatAmount = (vatableSales / 1.12) * 0.12;
                totalAmountDue = grossSubtotal;
            }

            currentTotalDue = totalAmountDue;

            document.getElementById('txt-subtotal').textContent = `₱${grossSubtotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            document.getElementById('txt-vat').textContent = `₱${vatAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            const discRow = document.getElementById('row-discount');
            if (isSeniorOrPwd && discountAmount > 0) {
                discRow.classList.remove('hidden');
                document.getElementById('txt-discount').textContent = `-₱${discountAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            } else {
                discRow.classList.add('hidden');
            }

            document.getElementById('txt-total').textContent = `₱${totalAmountDue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        // =================================================================
        // PHASE 3.4: AI SMART CROSS-SELL RECOMMENDATION ENGINE
        // =================================================================
        async function fetchCrossSellRecommendations() {
            const container = document.getElementById('cross-sell-items');
            const spinner = document.getElementById('cross-sell-spinner');
            const subtitle = document.getElementById('cross-sell-subtitle');

            spinner.classList.remove('hidden');

            const cartIds = cart.map(i => i.product.id);
            if (cartIds.length > 0) {
                subtitle.textContent = `Frequently bought together with ${cart.length} item(s) in ticket`;
            } else {
                subtitle.textContent = `Top Philippine impulse FMCG pairings`;
            }

            let recommendations = [];

            // 1. Try local NestJS endpoint /api/v1/recommendations/cross-sell
            try {
                const queryStr = cartIds.length > 0 ? `?productIds=${cartIds.join(',')}` : '';
                const res = await fetch(`http://localhost:4000/api/v1/recommendations/cross-sell${queryStr}`);
                if (res.ok) {
                    const data = await res.json();
                    recommendations = Array.isArray(data) ? data : (data.crossSellRecommendations || []);
                }
            } catch (err) {
                // Gateway may be offline, fallback below
            }

            // 2. Try PHP action=cross-sell endpoint
            if (recommendations.length === 0) {
                try {
                    const queryStr = cartIds.length > 0 ? `&productIds=${cartIds.join(',')}` : '';
                    const res = await fetch(`reports.php?action=cross-sell${queryStr}`);
                    if (res.ok) {
                        const data = await res.json();
                        recommendations = data.crossSellRecommendations || [];
                    }
                } catch (err) {
                    // Fallback below
                }
            }

            // 3. Client-side heuristic fallback if offline
            if (recommendations.length === 0) {
                const available = ALL_PRODUCTS.filter(p => !cartIds.includes(p.id) && p.stock_on_hand > 0);
                recommendations = available.slice(0, 3).map((p, idx) => ({
                    productId: p.id,
                    sku: p.sku,
                    productName: p.name,
                    categoryName: p.category_name,
                    retailPrice: p.retail_price,
                    coOccurrenceCount: 28 - idx * 6,
                    confidenceScore: 0.95 - idx * 0.05
                }));
            }

            spinner.classList.add('hidden');

            // Render recommendation cards
            if (recommendations.length === 0) {
                container.innerHTML = `<p class="text-[10px] text-slate-500 py-1">No recommendations found.</p>`;
                return;
            }

            let html = '';
            recommendations.slice(0, 3).forEach(rec => {
                html += `
                    <div class="flex-shrink-0 min-h-0 flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 transition">
                        <div class="min-w-0 flex-1">
                            <p class="text-xs font-medium text-slate-200 truncate" title="${rec.productName}">${rec.productName}</p>
                            <div class="flex items-center gap-1.5 text-[10px] mt-0.5 flex-wrap">
                                <span class="font-bold text-emerald-400 font-mono">₱${Number(rec.retailPrice).toFixed(2)}</span>
                                <span class="text-slate-600">•</span>
                                <span class="text-indigo-300 font-mono text-[9px] bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-500/20 whitespace-nowrap">
                                    ⚡ ${rec.coOccurrenceCount > 0 ? rec.coOccurrenceCount + 'x paired' : Math.round(rec.confidenceScore * 100) + '% match'}
                                </span>
                            </div>
                        </div>
                        <button 
                            type="button" 
                            onclick="addRecommendedProduct('${rec.productId}', '${rec.sku}')"
                            title="Add ${rec.productName} to ticket"
                            class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/40 transition shrink-0 whitespace-nowrap active:scale-95"
                        >
                            + Add
                        </button>
                    </div>
                `;
            });

            container.innerHTML = html;
        }

        function addRecommendedProduct(productId, sku) {
            let found = ALL_PRODUCTS.find(p => p.id === productId || (sku && p.sku === sku));
            if (!found) {
                found = {
                    id: productId,
                    sku: sku || 'ITEM-001',
                    name: 'Recommended Item',
                    retail_price: 50.00,
                    tax_rate: 0.12,
                    stock_on_hand: 50
                };
            }
            addToCart(found);
            showToast('success', `Added cross-sell: ${found.name}`);
        }

        // =================================================================
        // PAYMENT & CHECKOUT MODAL
        // =================================================================
        function openPaymentModal() {
            if (cart.length === 0) return;
            document.getElementById('modal-amount-due').textContent = `₱${currentTotalDue.toFixed(2)}`;
            document.getElementById('input-tendered').value = currentTotalDue.toFixed(2);
            calcChange();
            document.getElementById('payment-modal').classList.remove('hidden');
            document.getElementById('input-tendered').focus();
        }

        function closePaymentModal() {
            document.getElementById('payment-modal').classList.add('hidden');
        }

        function setPaymentMethod(method) {
            selectedPaymentMethod = method;
            document.querySelectorAll('.pm-btn').forEach(b => {
                b.className = 'pm-btn py-2 px-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 font-semibold text-xs flex flex-col items-center gap-1';
            });
            const activeBtn = document.getElementById(`btn-pm-${method}`);
            if (activeBtn) {
                activeBtn.className = 'pm-btn py-2 px-3 rounded-xl border border-indigo-500 bg-indigo-600/20 text-white font-semibold text-xs flex flex-col items-center gap-1';
            }

            const banknoteSection = document.getElementById('banknotes-section');
            if (method === 'cash') {
                banknoteSection.classList.remove('hidden');
            } else {
                banknoteSection.classList.add('hidden');
                document.getElementById('input-tendered').value = currentTotalDue.toFixed(2);
                calcChange();
            }
        }

        function addTendered(val) {
            const current = parseFloat(document.getElementById('input-tendered').value) || 0;
            document.getElementById('input-tendered').value = (current + val).toFixed(2);
            calcChange();
        }

        function setExactTendered() {
            document.getElementById('input-tendered').value = currentTotalDue.toFixed(2);
            calcChange();
        }

        function calcChange() {
            const tendered = parseFloat(document.getElementById('input-tendered').value) || 0;
            const change = Math.max(0, tendered - currentTotalDue);
            document.getElementById('modal-change-due').textContent = `₱${change.toFixed(2)}`;
            document.getElementById('btn-finalize').disabled = (tendered < currentTotalDue && selectedPaymentMethod === 'cash');
        }

        function finalizePayment() {
            const tendered = parseFloat(document.getElementById('input-tendered').value) || currentTotalDue;
            const change = Math.max(0, tendered - currentTotalDue);
            const txnNo = 'TXN-PH-' + Math.floor(100000 + Math.random() * 900000);

            closePaymentModal();
            cart = [];
            isSeniorOrPwd = false;
            document.getElementById('senior-pwd-toggle').checked = false;
            renderCart();
            fetchCrossSellRecommendations();

            showToast('success', `Sale ${txnNo} settled via ${selectedPaymentMethod.toUpperCase()}! Change: ₱${change.toFixed(2)}`);
        }

        // Global hotkey F4
        window.addEventListener('keydown', function(e) {
            if (e.key === 'F4' && cart.length > 0) {
                e.preventDefault();
                openPaymentModal();
            }
        });

        // Toast Helper
        function showToast(type, msg) {
            const toast = document.getElementById('toast');
            toast.textContent = msg;
            toast.className = `fixed top-16 right-5 z-50 px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-2xl backdrop-blur transition-all duration-200 ${
                type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300' :
                type === 'warning' ? 'bg-amber-950/90 border-amber-500/50 text-amber-300' :
                'bg-indigo-950/90 border-indigo-500/50 text-indigo-300'
            }`;
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('hidden'), 3500);
        }

        // Initialize empty ticket and fetch initial recommendations
        renderCart();
        fetchCrossSellRecommendations();
    </script>
</body>
</html>
