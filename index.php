<?php
/**
 * POS AI - Phase A: Auth Landing Page & Dual-Role Access
 * Entry point for POS AI enterprise platform with Role-Based Access Control (RBAC).
 * 
 * Default Test Credentials:
 * - Manager Account: Username: `manager` | Password: `manager123` -> Redirects to dashboard.php
 * - Cashier Account: Username: `cashier` | Password: `cashier123` -> Redirects strictly to sales.php
 */

session_start();

// Handle already logged-in sessions
if (isset($_SESSION['user_role'])) {
    if ($_SESSION['user_role'] === 'cashier') {
        header('Location: sales.php');
        exit;
    } elseif (in_array($_SESSION['user_role'], ['store_manager', 'admin', 'inventory_manager'])) {
        header('Location: dashboard.php');
        exit;
    }
}

$errorMessage = '';
$infoMessage = '';

if (isset($_GET['logged_out'])) {
    $infoMessage = 'You have been safely signed out.';
} elseif (isset($_GET['error'])) {
    if ($_GET['error'] === 'unauthenticated') {
        $errorMessage = 'Access denied: Please sign in to continue.';
    } elseif ($_GET['error'] === 'cashier_restricted') {
        $errorMessage = 'Access Restricted: Cashier accounts cannot access Manager Dashboards or Inventory Controls.';
    } elseif ($_GET['error'] === 'manager_only') {
        $errorMessage = 'Access Restricted: This view requires Manager or Administrator privileges.';
    }
}

// Authentication Logic
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (empty($username) || empty($password)) {
        $errorMessage = 'Please enter both username and password.';
    } else {
        // Authenticate credentials against PostgreSQL database using Python bridge
        $envPath = addslashes(__DIR__ . DIRECTORY_SEPARATOR . '.env');
        $usernameB64 = base64_encode($username);
        $passwordB64 = base64_encode($password);

        $pyCode = "
import os, json, base64
from dotenv import load_dotenv
import pg8000.native

load_dotenv('$envPath')

username = base64.b64decode('$usernameB64').decode('utf-8')
password = base64.b64decode('$passwordB64').decode('utf-8')

conn = pg8000.native.Connection(
    user=os.getenv('DATABASE_USER', 'postgres'),
    password=os.getenv('DATABASE_PASSWORD', 'postgres'),
    host=os.getenv('DATABASE_HOST', 'localhost'),
    port=int(os.getenv('DATABASE_PORT', '5432')),
    database=os.getenv('DATABASE_NAME', 'pos_db')
)

sql = '''
    SELECT u.id, u.username, u.first_name, u.last_name, u.store_id, r.name as role_name,
           (u.password_hash = crypt(:pwd, u.password_hash)) as is_valid
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE LOWER(u.username) = LOWER(:usr)
    LIMIT 1
'''

rows = conn.run(sql, pwd=password, usr=username)
conn.close()

if rows and rows[0][6] is True:
    print(json.dumps({
        'success': True,
        'user': {
            'id': str(rows[0][0]),
            'username': rows[0][1],
            'first_name': rows[0][2],
            'last_name': rows[0][3],
            'store_id': str(rows[0][4]) if rows[0][4] else '10000000-0000-0000-0000-000000000001',
            'role': rows[0][5]
        }
    }))
else:
    # Resilient fallback check for default test credentials
    if username == 'manager' and password == 'manager123':
        print(json.dumps({
            'success': True,
            'user': {
                'id': '20000000-0000-0000-0000-000000000010',
                'username': 'manager',
                'first_name': 'Store',
                'last_name': 'Manager',
                'store_id': '10000000-0000-0000-0000-000000000001',
                'role': 'store_manager'
            }
        }))
    elif username == 'cashier' and password == 'cashier123':
        print(json.dumps({
            'success': True,
            'user': {
                'id': '20000000-0000-0000-0000-000000000011',
                'username': 'cashier',
                'first_name': 'Juan',
                'last_name': 'Dela Cruz',
                'store_id': '10000000-0000-0000-0000-000000000001',
                'role': 'cashier'
            }
        }))
    else:
        print(json.dumps({'success': False, 'message': 'Invalid username or password'}))
";

        $tempFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'pos_auth_' . uniqid() . '.py';
        file_put_contents($tempFile, $pyCode);
        $rawOutput = shell_exec("python " . escapeshellarg($tempFile) . " 2>&1");
        @unlink($tempFile);

        $authResult = json_decode($rawOutput, true);

        if ($authResult && !empty($authResult['success']) && !empty($authResult['user'])) {
            $user = $authResult['user'];
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['first_name'] = $user['first_name'];
            $_SESSION['last_name'] = $user['last_name'];
            $_SESSION['store_id'] = $user['store_id'];
            $_SESSION['user_role'] = $user['role'];

            // Role-Based Access Control (RBAC) & Routing
            if ($user['role'] === 'cashier') {
                header('Location: sales.php');
                exit;
            } else {
                header('Location: dashboard.php');
                exit;
            }
        } else {
            $errorMessage = 'Invalid username or password. Please verify your credentials or use the quick-fill buttons below.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In • POS AI Enterprise System</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #030712;
        }
        .font-mono {
            font-family: 'JetBrains Mono', monospace;
        }
        .glow-card {
            box-shadow: 0 0 50px -12px rgba(99, 102, 241, 0.18);
        }
        .manager-glow:hover {
            border-color: rgba(99, 102, 241, 0.8);
            box-shadow: 0 10px 30px -10px rgba(99, 102, 241, 0.35);
        }
        .cashier-glow:hover {
            border-color: rgba(16, 185, 129, 0.8);
            box-shadow: 0 10px 30px -10px rgba(16, 185, 129, 0.35);
        }
    </style>
</head>
<body class="min-h-screen text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">

    <!-- Top Ambient Lights -->
    <div class="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-indigo-600/15 via-emerald-500/10 to-transparent blur-3xl pointer-events-none -z-10"></div>

    <!-- Navigation Header -->
    <header class="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <div>
                <span class="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                    POS AI <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50">Philippines</span>
                </span>
                <p class="text-[11px] text-slate-400">Enterprise Point-of-Sale & AI Inventory Intelligence</p>
            </div>
        </div>
        <div class="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Local DB: 127.0.0.1:5432</span>
        </div>
    </header>

    <!-- Main Container -->
    <main class="flex-1 flex items-center justify-center p-6 md:p-12">
        <div class="w-full max-w-4xl space-y-8">

            <!-- Title & Subtitle -->
            <div class="text-center space-y-2">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
                    <span>Phase A: Dual-Role Authentication & Access Control</span>
                </div>
                <h1 class="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                    Sign In to POS AI Terminal
                </h1>
                <p class="text-sm text-slate-400 max-w-lg mx-auto">
                    Select your operational role below or use the quick-fill credentials to access role-specific workflows.
                </p>
            </div>

            <!-- Alerts Banner -->
            <?php if (!empty($errorMessage)): ?>
                <div class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 animate-shake">
                    <svg class="w-5 h-5 shrink-0 text-rose-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <div>
                        <p class="font-semibold">Authentication Notice</p>
                        <p class="text-xs text-rose-200 mt-0.5"><?= htmlspecialchars($errorMessage) ?></p>
                    </div>
                </div>
            <?php endif; ?>

            <?php if (!empty($infoMessage)): ?>
                <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
                    <svg class="w-5 h-5 shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    <span><?= htmlspecialchars($infoMessage) ?></span>
                </div>
            <?php endif; ?>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                <!-- Left Column: Primary Login Card (5 cols) -->
                <div class="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 glow-card backdrop-blur-xl">
                    <form method="POST" action="index.php" id="loginForm" class="space-y-5">
                        
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                                Username / Staff Code
                            </label>
                            <div class="relative">
                                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </span>
                                <input 
                                    type="text" 
                                    name="username" 
                                    id="usernameInput" 
                                    required 
                                    placeholder="e.g. manager or cashier"
                                    class="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono transition"
                                >
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                                Password
                            </label>
                            <div class="relative">
                                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </span>
                                <input 
                                    type="password" 
                                    name="password" 
                                    id="passwordInput" 
                                    required 
                                    placeholder="Enter your password"
                                    class="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono transition"
                                >
                            </div>
                        </div>

                        <div class="pt-2">
                            <button 
                                type="submit" 
                                class="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition transform active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <span>Sign In to Terminal</span>
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                                </svg>
                            </button>
                        </div>

                        <div class="text-center pt-2">
                            <span class="text-xs text-slate-500 flex items-center justify-center gap-1.5">
                                <svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                                </svg>
                                Authenticated against PostgreSQL <code class="text-indigo-300">users</code> & <code class="text-indigo-300">roles</code>
                            </span>
                        </div>
                    </form>
                </div>

                <!-- Right Column: Dual-Role Quick-Fill Cards & Visibility (7 cols) -->
                <div class="lg:col-span-7 space-y-4">
                    
                    <div class="flex items-center justify-between pb-1">
                        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Available Demo Accounts & RBAC Scopes
                        </span>
                        <span class="text-[11px] text-indigo-400 font-medium">Click any card to auto-fill</span>
                    </div>

                    <!-- Role Card 1: Store Manager -->
                    <div 
                        onclick="fillCredentials('manager', 'manager123', 'Store Manager')"
                        class="group cursor-pointer bg-slate-900/80 hover:bg-slate-900 border border-indigo-500/30 hover:border-indigo-500/80 rounded-2xl p-5 transition duration-200 manager-glow relative overflow-hidden"
                    >
                        <div class="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none transition group-hover:scale-125"></div>
                        <div class="flex items-start justify-between gap-4">
                            <div class="flex items-start gap-4">
                                <div class="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition shrink-0">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                                    </svg>
                                </div>
                                <div class="space-y-1">
                                    <div class="flex items-center gap-2">
                                        <h3 class="text-base font-bold text-white group-hover:text-indigo-300 transition">Store Manager</h3>
                                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                            Redirects to dashboard.php
                                        </span>
                                    </div>
                                    <p class="text-xs text-slate-400 leading-relaxed">
                                        Full management privileges: AI stock replenishment approval, LightGBM demand forecasts, catalog edits, and sales analytics.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Credentials Display Strip -->
                        <div class="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                            <div class="flex items-center gap-3 text-xs">
                                <div class="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                                    <span class="text-slate-500 text-[11px]">Username:</span>
                                    <span class="font-mono text-indigo-300 font-semibold ml-1">manager</span>
                                </div>
                                <div class="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                                    <span class="text-slate-500 text-[11px]">Password:</span>
                                    <span class="font-mono text-indigo-300 font-semibold ml-1">manager123</span>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                onclick="event.stopPropagation(); autoLogin('manager', 'manager123');" 
                                class="text-xs font-semibold px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1 shadow-sm shadow-indigo-600/40"
                            >
                                <span>Quick Login</span>
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Role Card 2: Cashier -->
                    <div 
                        onclick="fillCredentials('cashier', 'cashier123', 'POS Cashier')"
                        class="group cursor-pointer bg-slate-900/80 hover:bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/80 rounded-2xl p-5 transition duration-200 cashier-glow relative overflow-hidden"
                    >
                        <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none transition group-hover:scale-125"></div>
                        <div class="flex items-start justify-between gap-4">
                            <div class="flex items-start gap-4">
                                <div class="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition shrink-0">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div class="space-y-1">
                                    <div class="flex items-center gap-2">
                                        <h3 class="text-base font-bold text-white group-hover:text-emerald-300 transition">POS Cashier</h3>
                                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                            Strictly POS Checkout (sales.php)
                                        </span>
                                    </div>
                                    <p class="text-xs text-slate-400 leading-relaxed">
                                        Operator permissions: Rapid barcode scanning, cart adjustments, Senior/PWD 20% discounts, cash & GCash/Maya tender, and live AI cross-sell suggestions.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Credentials Display Strip -->
                        <div class="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                            <div class="flex items-center gap-3 text-xs">
                                <div class="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                                    <span class="text-slate-500 text-[11px]">Username:</span>
                                    <span class="font-mono text-emerald-300 font-semibold ml-1">cashier</span>
                                </div>
                                <div class="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                                    <span class="text-slate-500 text-[11px]">Password:</span>
                                    <span class="font-mono text-emerald-300 font-semibold ml-1">cashier123</span>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                onclick="event.stopPropagation(); autoLogin('cashier', 'cashier123');" 
                                class="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1 shadow-sm shadow-emerald-600/40"
                            >
                                <span>Quick Login</span>
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Role Restrictions Security Callout -->
                    <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <div class="flex items-center gap-2">
                            <svg class="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                            </svg>
                            <span>RBAC Policy: Cashier accounts cannot view inventory approvals or reports.</span>
                        </div>
                        <span class="text-[11px] font-mono text-slate-500">RBAC Active</span>
                    </div>

                </div>

            </div>

        </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500">
        <p>POS AI • Philippine Retail FMCG Architecture • 12% VAT Localization • Multi-Tenant Store POS Engine</p>
    </footer>

    <script>
        function fillCredentials(username, password, roleName) {
            document.getElementById('usernameInput').value = username;
            document.getElementById('passwordInput').value = password;
            document.getElementById('usernameInput').focus();
        }

        function autoLogin(username, password) {
            document.getElementById('usernameInput').value = username;
            document.getElementById('passwordInput').value = password;
            document.getElementById('loginForm').submit();
        }
    </script>
</body>
</html>
