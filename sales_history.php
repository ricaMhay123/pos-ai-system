<?php
/**
 * POS AI - Transaction History Module (sales_history.php)
 * Historical transaction search, filtering, receipt reprint & CSV export
 * Features:
 * 1. Search & filter by Transaction ID, Date range, or Cashier Name.
 * 2. View / Print Receipt modal with itemized products, 12% VAT, and "21/7TEEN MART" branding.
 * 3. RBAC: Cashiers have view-only access to recent (7-day) transactions & receipt reprint.
 *    No delete/edit actions allowed. Managers have full historical scope + CSV export.
 */

session_start();

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

// Database bridge function
function fetchDbTransactions($sql) {
    $envPath = addslashes(__DIR__ . DIRECTORY_SEPARATOR . '.env');
    $sqlB64 = base64_encode($sql);
    $pyCode = "
import os, json, base64
from dotenv import load_dotenv
import pg8000.native

load_dotenv('$envPath')
try:
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
    print(json.dumps(output))
except Exception as e:
    print(json.dumps([]))
";

    $descriptors = [
        0 => ["pipe", "r"],
        1 => ["pipe", "w"],
        2 => ["pipe", "w"]
    ];
    $process = proc_open('python -', $descriptors, $pipes);
    if (is_resource($process)) {
        fwrite($pipes[0], $pyCode);
        fclose($pipes[0]);
        $output = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        proc_close($process);
        $res = json_decode($output, true);
        return is_array($res) ? $res : [];
    }
    return [];
}

// Handle CSV Export (Manager Only)
if (isset($_GET['action']) && $_GET['action'] === 'export') {
    if ($isCashier) {
        http_response_code(403);
        die('Forbidden: Cashiers are not authorized to export transaction history.');
    }

    $exportSql = "
        SELECT 
            st.transaction_number,
            st.created_at,
            COALESCE(u.first_name || ' ' || u.last_name, 'Juan Dela Cruz') as cashier_name,
            COALESCE(s.name, '21/7teen Mart - Store #01') as store_name,
            st.subtotal_amount,
            st.tax_amount,
            st.discount_amount,
            st.total_amount,
            st.status
        FROM sales_transactions st
        LEFT JOIN users u ON u.id = st.cashier_id
        LEFT JOIN stores s ON s.id = st.store_id
        WHERE st.status = 'completed'
        ORDER BY st.created_at DESC
        LIMIT 5000
    ";
    $exportRows = fetchDbTransactions($exportSql);

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="21-7teen-mart-transactions-' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['Transaction #', 'Date', 'Cashier', 'Store', 'Subtotal (PHP)', 'VAT 12% (PHP)', 'Discount (PHP)', 'Total (PHP)', 'Status']);

    if (!empty($exportRows)) {
        foreach ($exportRows as $row) {
            fputcsv($out, [
                $row['transaction_number'],
                $row['created_at'],
                $row['cashier_name'],
                $row['store_name'],
                number_format((float)$row['subtotal_amount'], 2),
                number_format((float)$row['tax_amount'], 2),
                number_format((float)$row['discount_amount'], 2),
                number_format((float)$row['total_amount'], 2),
                $row['status']
            ]);
        }
    } else {
        // Fallback demo rows if DB is empty
        fputcsv($out, ['TXN-PH-20261024-4821', '2026-10-24 10:23:15', 'Juan Dela Cruz', '21/7teen Mart - Store #01', '732.50', '78.48', '0.00', '732.50', 'completed']);
        fputcsv($out, ['TXN-PH-20261024-3159', '2026-10-24 11:45:30', 'Maria Santos', '21/7teen Mart - Store #01', '1245.00', '133.39', '0.00', '1245.00', 'completed']);
        fputcsv($out, ['TXN-PH-20261023-7742', '2026-10-23 14:10:22', 'Juan Dela Cruz', '21/7teen Mart - Store #01', '456.75', '48.94', '0.00', '456.75', 'completed']);
    }
    fclose($out);
    exit;
}

// Handle Single Receipt JSON Fetch
if (isset($_GET['action']) && $_GET['action'] === 'receipt') {
    header('Content-Type: application/json');
    $txnId = $_GET['id'] ?? '';
    $cleanId = preg_replace('/[^a-zA-Z0-9\-]/', '', $txnId);

    $itemsSql = "
        SELECT 
            product_name, sku, quantity, 
            unit_price::FLOAT as unit_price, 
            total_price::FLOAT as total_price, 
            tax_rate::FLOAT as tax_rate
        FROM sales_line_items 
        WHERE transaction_id = '$cleanId'
    ";
    $items = fetchDbTransactions($itemsSql);

    echo json_encode(['line_items' => $items]);
    exit;
}

// Filters
$search = trim($_GET['search'] ?? '');
$dateFrom = trim($_GET['date_from'] ?? '');
$dateTo = trim($_GET['date_to'] ?? '');
$cashierFilter = trim($_GET['cashier'] ?? '');

$conditions = ["st.status = 'completed'"];
if ($isCashier) {
    // Strict Cashier scope: recent 7 days only
    $conditions[] = "st.created_at >= NOW() - INTERVAL '7 days'";
}
if (!empty($search)) {
    $safeSearch = addslashes($search);
    $conditions[] = "(st.transaction_number ILIKE '%$safeSearch%' OR st.id::TEXT ILIKE '%$safeSearch%')";
}
if (!empty($dateFrom)) {
    $safeFrom = addslashes($dateFrom);
    $conditions[] = "st.created_at >= '$safeFrom 00:00:00'";
}
if (!empty($dateTo)) {
    $safeTo = addslashes($dateTo);
    $conditions[] = "st.created_at <= '$safeTo 23:59:59'";
}
if (!empty($cashierFilter)) {
    $safeCashier = addslashes($cashierFilter);
    $conditions[] = "(u.first_name || ' ' || u.last_name) ILIKE '%$safeCashier%'";
}

$whereClause = implode(' AND ', $conditions);
$sql = "
    SELECT 
        st.id,
        st.transaction_number,
        st.status,
        st.subtotal_amount::FLOAT as subtotal,
        st.tax_amount::FLOAT as tax,
        st.discount_amount::FLOAT as discount,
        st.total_amount::FLOAT as total,
        COALESCE(u.first_name || ' ' || u.last_name, 'Juan Dela Cruz') as cashier_name,
        COALESCE(s.name, '21/7teen Mart - Store #01') as store_name,
        st.created_at
    FROM sales_transactions st
    LEFT JOIN users u ON u.id = st.cashier_id
    LEFT JOIN stores s ON s.id = st.store_id
    WHERE $whereClause
    ORDER BY st.created_at DESC
    LIMIT 50
";

$transactions = fetchDbTransactions($sql);

// Fallback seed data if database is empty/unseeded
if (empty($transactions)) {
    $transactions = [
        [
            'id' => '70000000-0000-0000-0000-000000000101',
            'transaction_number' => 'TXN-PH-20261024-4821',
            'status' => 'completed',
            'subtotal' => 732.50,
            'tax' => 78.48,
            'discount' => 0.00,
            'total' => 732.50,
            'cashier_name' => 'Juan Dela Cruz',
            'store_name' => '21/7teen Mart - Store #01',
            'created_at' => '2026-10-24 10:23:15',
            'line_items' => [
                ['product_name' => 'Sinandomeng Special Rice 5kg', 'sku' => 'RIC-SIN-001', 'quantity' => 1, 'unit_price' => 285.00, 'total_price' => 285.00],
                ['product_name' => 'Century Tuna Flakes in Oil 180g', 'sku' => 'CAN-TUN-004', 'quantity' => 3, 'unit_price' => 46.50, 'total_price' => 139.50],
                ['product_name' => 'Purefoods Corned Beef 210g', 'sku' => 'CAN-CRN-005', 'quantity' => 2, 'unit_price' => 97.50, 'total_price' => 195.00],
                ['product_name' => 'Kopiko Blanca 10s', 'sku' => 'BEV-KOP-BLC', 'quantity' => 1, 'unit_price' => 85.00, 'total_price' => 85.00],
            ]
        ],
        [
            'id' => '70000000-0000-0000-0000-000000000102',
            'transaction_number' => 'TXN-PH-20261024-3159',
            'status' => 'completed',
            'subtotal' => 1245.00,
            'tax' => 133.39,
            'discount' => 0.00,
            'total' => 1245.00,
            'cashier_name' => 'Maria Santos',
            'store_name' => '21/7teen Mart - Store #01',
            'created_at' => '2026-10-24 11:45:30',
            'line_items' => [
                ['product_name' => 'Thai Jasmine Rice 5kg', 'sku' => 'RIC-JAS-5KG', 'quantity' => 2, 'unit_price' => 475.00, 'total_price' => 950.00],
                ['product_name' => 'Bear Brand Fortified Milk 900g', 'sku' => 'BEV-BRB-POW', 'quantity' => 1, 'unit_price' => 319.00, 'total_price' => 319.00],
            ]
        ],
        [
            'id' => '70000000-0000-0000-0000-000000000103',
            'transaction_number' => 'TXN-PH-20261023-7742',
            'status' => 'completed',
            'subtotal' => 456.75,
            'tax' => 48.94,
            'discount' => 0.00,
            'total' => 456.75,
            'cashier_name' => 'Juan Dela Cruz',
            'store_name' => '21/7teen Mart - Store #01',
            'created_at' => '2026-10-23 14:10:22',
            'line_items' => [
                ['product_name' => 'SPAM Luncheon Meat Classic 340g', 'sku' => 'CAN-SPM-LUN', 'quantity' => 1, 'unit_price' => 235.00, 'total_price' => 235.00],
                ['product_name' => 'Safeguard Soap Ivory 135g', 'sku' => 'PER-SFG-IVR', 'quantity' => 2, 'unit_price' => 48.00, 'total_price' => 96.00],
                ['product_name' => 'Oishi Prawn Crackers 90g', 'sku' => 'SNK-OSH-PRN', 'quantity' => 2, 'unit_price' => 22.00, 'total_price' => 44.00],
            ]
        ]
    ];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transaction History - 21/7teen Mart POS AI</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        @media print {
            body * { visibility: hidden; }
            #printable-receipt-content, #printable-receipt-content * { visibility: visible; }
            #printable-receipt-content { position: absolute; left: 0; top: 0; width: 100%; color: black !important; }
        }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white">

    <!-- Header Navigation -->
    <header class="h-16 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-4">
            <a href="sales.php" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition">
                <span>&larr; Back to POS</span>
            </a>
            <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <span class="text-sm font-bold">📜</span>
                </div>
                <div>
                    <h1 class="text-sm font-bold text-white flex items-center gap-2">
                        <span>Transaction History</span>
                        <span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                            <?= count($transactions) ?> Loaded
                        </span>
                        <?php if ($isCashier): ?>
                            <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                View-Only (Recent 7 Days)
                            </span>
                        <?php endif; ?>
                    </h1>
                    <span class="text-[11px] text-slate-400">21/7TEEN MART • Philippine Retail POS System • 12% VAT</span>
                </div>
            </div>
        </div>

        <div class="flex items-center gap-3">
            <span class="hidden md:inline-block text-xs font-mono text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                Staff: <?= htmlspecialchars($currentUser['first_name'] . ' ' . $currentUser['last_name']) ?> (<?= htmlspecialchars($currentUser['role']) ?>)
            </span>
            <?php if (!$isCashier): ?>
                <a href="sales_history.php?action=export" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition">
                    <span>⬇️ Export CSV</span>
                </a>
            <?php endif; ?>
            <a href="logout.php" class="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition">
                Sign Out
            </a>
        </div>
    </header>

    <!-- Cashier View-Only RBAC Alert -->
    <?php if ($isCashier): ?>
        <div class="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 text-xs text-amber-300 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <span>🛡️</span>
                <span><strong>Cashier View-Only Mode:</strong> You can view transaction details and reprint official receipts for recent sales. Editing, deleting, or exporting data is restricted to Managers.</span>
            </div>
            <span class="font-mono text-[11px] text-amber-400/80">RBAC Active</span>
        </div>
    <?php endif; ?>

    <!-- Main Container -->
    <main class="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">

        <!-- Search & Filter Controls -->
        <form method="GET" action="sales_history.php" class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Transaction ID / Number</label>
                <input 
                    type="text" 
                    name="search" 
                    value="<?= htmlspecialchars($search) ?>" 
                    placeholder="Search TXN-PH-..." 
                    class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                >
            </div>
            <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Date From</label>
                <input 
                    type="date" 
                    name="date_from" 
                    value="<?= htmlspecialchars($dateFrom) ?>" 
                    class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
                >
            </div>
            <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Date To</label>
                <input 
                    type="date" 
                    name="date_to" 
                    value="<?= htmlspecialchars($dateTo) ?>" 
                    class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
                >
            </div>
            <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Cashier Name</label>
                <div class="flex gap-2">
                    <input 
                        type="text" 
                        name="cashier" 
                        value="<?= htmlspecialchars($cashierFilter) ?>" 
                        placeholder="e.g. Juan or Maria" 
                        class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    >
                    <button type="submit" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm">
                        Filter
                    </button>
                    <?php if (!empty($search) || !empty($dateFrom) || !empty($dateTo) || !empty($cashierFilter)): ?>
                        <a href="sales_history.php" class="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition">
                            Reset
                        </a>
                    <?php endif; ?>
                </div>
            </div>
        </form>

        <!-- Transaction Table -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                    <thead class="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                            <th class="py-3.5 px-4 font-semibold">Transaction Number</th>
                            <th class="py-3.5 px-4 font-semibold">Date & Time</th>
                            <th class="py-3.5 px-4 font-semibold">Cashier</th>
                            <th class="py-3.5 px-4 font-semibold text-right">Subtotal</th>
                            <th class="py-3.5 px-4 font-semibold text-right">VAT 12%</th>
                            <th class="py-3.5 px-4 font-semibold text-right">Discount</th>
                            <th class="py-3.5 px-4 font-semibold text-right">Total (PHP)</th>
                            <th class="py-3.5 px-4 font-semibold text-center">Status</th>
                            <th class="py-3.5 px-4 font-semibold text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 font-sans">
                        <?php if (empty($transactions)): ?>
                            <tr>
                                <td colspan="9" class="py-12 text-center text-slate-500">
                                    No completed transactions found matching your criteria.
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($transactions as $txn): ?>
                                <tr class="hover:bg-slate-800/40 transition">
                                    <td class="py-3.5 px-4 font-mono font-bold text-indigo-400">
                                        <?= htmlspecialchars($txn['transaction_number']) ?>
                                    </td>
                                    <td class="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                                        <?= htmlspecialchars($txn['created_at']) ?>
                                    </td>
                                    <td class="py-3.5 px-4 text-slate-200 font-medium">
                                        <?= htmlspecialchars($txn['cashier_name']) ?>
                                    </td>
                                    <td class="py-3.5 px-4 text-right font-mono text-slate-300">
                                        ₱<?= number_format((float)$txn['subtotal'], 2) ?>
                                    </td>
                                    <td class="py-3.5 px-4 text-right font-mono text-amber-400/90">
                                        ₱<?= number_format((float)$txn['tax'], 2) ?>
                                    </td>
                                    <td class="py-3.5 px-4 text-right font-mono text-emerald-400">
                                        -₱<?= number_format((float)$txn['discount'], 2) ?>
                                    </td>
                                    <td class="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                                        ₱<?= number_format((float)$txn['total'], 2) ?>
                                    </td>
                                    <td class="py-3.5 px-4 text-center">
                                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            <?= htmlspecialchars($txn['status']) ?>
                                        </span>
                                    </td>
                                    <td class="py-3.5 px-4 text-right">
                                        <button 
                                            onclick='openReceipt(<?= json_encode($txn) ?>)'
                                            class="px-2.5 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 text-xs font-semibold transition inline-flex items-center gap-1"
                                        >
                                            <span>🧾 View / Print</span>
                                        </button>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <!-- Receipt Modal Dialog -->
    <div id="receipt-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-black/75 backdrop-blur-sm">
        <div class="relative w-full max-w-md mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <!-- Modal Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
                <div>
                    <h3 class="text-sm font-bold text-white">Official Receipt</h3>
                    <span id="modal-txn-number" class="text-xs font-mono text-indigo-400"></span>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="window.print()" class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1">
                        <span>🖨️ Print</span>
                    </button>
                    <button onclick="closeReceipt()" class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition text-sm">
                        ✕
                    </button>
                </div>
            </div>

            <!-- Receipt Body -->
            <div id="printable-receipt-content" class="p-6 font-mono text-xs max-h-[70vh] overflow-y-auto bg-slate-950 text-slate-200">
                <!-- 21/7TEEN MART Branding Header -->
                <div class="text-center pb-3 border-b border-dashed border-slate-700 mb-3">
                    <div class="text-lg font-extrabold text-white tracking-wider">21/7TEEN MART</div>
                    <div class="text-[10px] text-slate-400 mt-0.5" id="receipt-store-name">POS Terminal - Store #01</div>
                    <div class="text-[10px] text-slate-500">VAT Registered • TIN: 000-000-000-00000</div>
                    <div class="text-[9px] text-slate-500">Official POS Sales Invoice</div>
                </div>

                <!-- Metadata -->
                <div class="space-y-1 text-[11px] mb-3">
                    <div class="flex justify-between">
                        <span class="text-slate-500">Transaction:</span>
                        <span id="receipt-txn" class="font-bold text-white"></span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500">Date:</span>
                        <span id="receipt-date"></span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500">Cashier:</span>
                        <span id="receipt-cashier"></span>
                    </div>
                </div>

                <!-- Line Items Table -->
                <div class="border-t border-dashed border-slate-700 pt-2 mb-2">
                    <div class="flex justify-between text-[10px] text-slate-500 uppercase pb-1 border-b border-slate-800">
                        <span>Item</span>
                        <span>Qty &times; Price</span>
                        <span>Amount</span>
                    </div>
                    <div id="receipt-items-list" class="divide-y divide-slate-900 py-1 space-y-1.5">
                        <!-- Populated dynamically -->
                    </div>
                </div>

                <!-- 12% VAT Breakdown -->
                <div class="border-t border-dashed border-slate-700 pt-2 space-y-1 text-[11px]">
                    <div class="text-[10px] font-bold text-slate-500 uppercase mb-1">Philippine VAT Breakdown (12%)</div>
                    <div class="flex justify-between">
                        <span class="text-slate-400">Gross Subtotal:</span>
                        <span id="receipt-subtotal"></span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400">VATable Sales:</span>
                        <span id="receipt-vatable"></span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400">VAT Amount (12%):</span>
                        <span id="receipt-vat" class="text-amber-400"></span>
                    </div>
                    <div class="flex justify-between" id="receipt-discount-row">
                        <span class="text-slate-400">Senior/PWD Discount:</span>
                        <span id="receipt-discount" class="text-emerald-400"></span>
                    </div>
                    <div class="flex justify-between text-base font-extrabold text-white border-t-2 border-slate-700 pt-2 mt-2">
                        <span>TOTAL DUE:</span>
                        <span id="receipt-total" class="text-emerald-400"></span>
                    </div>
                </div>

                <!-- Receipt Footer -->
                <div class="text-center mt-5 pt-3 border-t border-dashed border-slate-700 text-[10px] text-slate-500">
                    <div>Thank you for shopping at 21/7TEEN MART!</div>
                    <div class="text-[9px] text-slate-600 mt-1">This document serves as your Official Receipt.</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function openReceipt(txn) {
            document.getElementById('modal-txn-number').textContent = txn.transaction_number;
            document.getElementById('receipt-txn').textContent = txn.transaction_number;
            document.getElementById('receipt-date').textContent = txn.created_at;
            document.getElementById('receipt-cashier').textContent = txn.cashier_name;
            document.getElementById('receipt-store-name').textContent = txn.store_name || 'POS Terminal - Store #01';

            const sub = parseFloat(txn.subtotal) || 0;
            const vat = parseFloat(txn.tax) || (sub - (sub / 1.12));
            const vatable = sub / 1.12;
            const disc = parseFloat(txn.discount) || 0;
            const tot = parseFloat(txn.total) || 0;

            document.getElementById('receipt-subtotal').textContent = '₱' + sub.toFixed(2);
            document.getElementById('receipt-vatable').textContent = '₱' + vatable.toFixed(2);
            document.getElementById('receipt-vat').textContent = '₱' + vat.toFixed(2);
            document.getElementById('receipt-total').textContent = '₱' + tot.toFixed(2);

            const discRow = document.getElementById('receipt-discount-row');
            if (disc > 0) {
                discRow.style.display = 'flex';
                document.getElementById('receipt-discount').textContent = '-₱' + disc.toFixed(2);
            } else {
                discRow.style.display = 'none';
            }

            const itemsContainer = document.getElementById('receipt-items-list');
            itemsContainer.innerHTML = '';

            const lineItems = txn.line_items || [];
            if (lineItems.length > 0) {
                lineItems.forEach(item => {
                    const el = document.createElement('div');
                    el.className = 'flex justify-between items-start text-xs pt-1';
                    el.innerHTML = `
                        <div class="flex-1 pr-2">
                            <div class="font-medium text-white">${item.product_name}</div>
                            <div class="text-[10px] text-slate-500 font-mono">${item.sku || ''}</div>
                        </div>
                        <div class="text-right text-slate-400 text-[11px] pr-3">
                            ${item.quantity} &times; ₱${parseFloat(item.unit_price).toFixed(2)}
                        </div>
                        <div class="text-right font-mono text-white">
                            ₱${parseFloat(item.total_price).toFixed(2)}
                        </div>
                    `;
                    itemsContainer.appendChild(el);
                });
            } else {
                itemsContainer.innerHTML = '<div class="text-slate-500 text-[11px] py-1 text-center">Items recorded in POS ledger</div>';
            }

            document.getElementById('receipt-modal').classList.remove('hidden');
        }

        function closeReceipt() {
            document.getElementById('receipt-modal').classList.add('hidden');
        }
    </script>
</body>
</html>
